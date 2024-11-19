import 'dotenv/config'
import Binance from 'node-binance-api';
import sendEmail from './mailer.js';

if (
  process.env.BINANCE_API_KEY == undefined || 
  process.env.BINANCE_API_SECRET == undefined
) {
    throw new Error('Binance API configuration is missing.');
}

// Read command-line arguments
const args = process.argv.slice(2);
const durationArg = args.find((arg) => arg.startsWith('--duration='));
const intervalArg = args.find((arg) => arg.startsWith('--interval='));

const duration = durationArg ? parseInt(durationArg.split('=')[1], 10) * 60 * 1000 : 15 * 60 * 1000; // Default: 15 minutes
const interval = intervalArg ? parseInt(intervalArg.split('=')[1], 10) * 60 * 1000 : 5 * 60 * 1000; // Default: 5 minutes

// Configuration
const config = {
  apiKey: process.env.BINANCE_API_KEY, // Replace with your Binance API key
  apiSecret: process.env.BINANCE_API_SECRET, // Replace with your Binance API secret
  symbol: process.env.SYMBOL || 'BTCUSDT', // Pair to monitor
  monitoringDuration: duration,
  interval: interval
};

const binance = new Binance().options({
  APIKEY: config.apiKey,
  APISECRET: config.apiSecret,
});

let priceData = []; // To store prices with timestamps

const isDebug = () => {
  return process.env.DEBUG == 'true';
};

// Monitor prices
const monitorPrices = async () => {
  const monitoringStartTime = new Date(); // Capture monitoring start time
  console.log(`Monitoring ${config.symbol} prices for ${config.monitoringDuration / 1000 / 60} minutes...`);
  console.log(`Monitoring started at: ${monitoringStartTime.toLocaleTimeString((process.env.LOCALE || 'en-US'))}`);

  const priceHandler = async () => {
    try {
      const ticker = await binance.prices(config.symbol);
      const price = parseFloat(ticker[config.symbol]);
      const timestamp = new Date();
      priceData.push({ timestamp, price });
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  const intervalId = setInterval(priceHandler, 1000); // Fetch prices every second

  setTimeout(() => {
    clearInterval(intervalId);
    const monitoringEndTime = new Date(); // Capture monitoring end time
    console.log('\nMonitoring complete.');
    console.log(`Monitoring ended at: ${monitoringEndTime.toLocaleTimeString((process.env.LOCALE || 'en-US'))}`);
    console.log(`Total monitoring duration: ${Math.round((monitoringEndTime - monitoringStartTime) / 1000 / 60)} mins.`);

    let openingPrice = priceData[0].price;
    let closingPrice = priceData[priceData.length - 1].price;
    console.log('\nOpening price: %s', openingPrice.toFixed(2));
    console.log('Closing price: %s', closingPrice.toFixed(2));
    
    let priceDiff = (closingPrice - openingPrice);
    let priceChange = Math.abs(priceDiff) / openingPrice;
    console.log('Change: %s%s\%\n', (closingPrice > openingPrice ? '+' : '-'), priceChange.toFixed(4));
  
    let {
      avgMinPrice, 
      avgMaxPrice, 
      avgAvgPrice, 
      avgPriceDiff, 
      avgVolatility,
    } = analyzePrices();  

    let notifyByEmail = true;
    
    // Check notification price change treshold 
    const notifyCngThdArg = args.find((arg) => arg.startsWith('--notifyCngThd='));
    if (notifyCngThdArg) {
      let notifyCngThd = parseFloat(notifyCngThdArg.split('=')[1]);
      if (priceChange < notifyCngThd) {
        notifyByEmail = false;
      }
    }
    
    // Check notification price volatility treshold 
    const notifyVolThdArg = args.find((arg) => arg.startsWith('--notifyVolThd='));
    if (notifyVolThdArg) {
      let notifyVolThd = parseFloat(notifyVolThd.split('=')[1]);
      if (avgVolatility < notifyVolThd) {
        notifyByEmail = false;
      }
    }
    
    if (notifyByEmail) {
      // Send results by email
      sendEmail(
        monitoringStartTime, 
        monitoringEndTime, 
        openingPrice,
        closingPrice,
        priceChange,
        avgMinPrice, 
        avgMaxPrice, 
        avgAvgPrice, 
        avgPriceDiff, 
        avgVolatility,
        duration,
        interval
      );  
    }    
  }, config.monitoringDuration);
};

// Analyze prices
const analyzePrices = () => {
  if (priceData.length === 0) {
    console.log('No price data collected.');
    return;
  }

  console.log('Analyzing price data...');
  const minMaxData = [];
  const startTime = priceData[0].timestamp;

  let totalMinPrices = 0; // Sum of all min prices
  let totalMaxPrices = 0; // Sum of all max prices
  let totalAvgPrices = 0; // Sum of all avg prices
  let intervalCount = 0; // Count of intervals for averaging   
  let totalFrames = Math.floor(priceData.length / (config.interval / 1000)); // Count of frames 
  let skippedCount = 0;

  if (isDebug()) {
    console.log('Collected items: ', JSON.stringify(priceData, null, 4));
    console.log("Total items: %d", priceData.length);
    console.log("Total frame indexes: %d", totalFrames);  
  }
  
  for (let i = 0; i < priceData.length;) {
    if (isDebug()) {
      console.log("Current item index: %d", i); 
    }
    const currentFrame = Math.floor(i / (config.interval / 1000));
    if (isDebug()) {
      console.log("Current frame index: %d", currentFrame);
    }

    const frameStart = new Date(startTime.getTime() + currentFrame * config.interval);
    const frameEnd = new Date(frameStart.getTime() + config.interval);
    const framePriceItems = [];

    if (priceData[i] !== undefined) {
      if (
        (priceData[i].timestamp < frameStart) // Timestamp lower than first frame start time
        || (priceData[i].timestamp > frameEnd) // Timestamp bigger than last frame end time
      ) {
        if (isDebug()) {
          console.log("Skipping item: %d", i);
          console.log("Current frame: %d", currentFrame);
          console.log("Frame start: %d", frameStart);
          console.log("Frame end: %d", frameEnd);
          console.log("Item: %s", JSON.stringify(priceData[i], null, 4));
        }
        i++; // skip item
        skippedCount++;
        continue;
      } else {
        while (
          i < priceData.length 
          && (
              priceData[i].timestamp >= frameStart 
              && priceData[i].timestamp <= frameEnd
            )
        ) {
          framePriceItems.push(priceData[i]);
          if (isDebug()) {
            console.log("Last collected item index: %d", i);
          }
          i++;
        }  
      }  
    }
    
    if (framePriceItems.length > 0) {
      const framePrices = framePriceItems.map((p) => p.price);
      const minPrice = Math.min(...framePrices);
      const maxPrice = Math.max(...framePrices);
      const avgPrice = framePrices.reduce((a, b) => a + b, 0) / framePrices.length;

      minMaxData.push({
        frameStart: frameStart.toLocaleTimeString((process.env.LOCALE || 'en-US')),
        frameEnd: frameEnd.toLocaleTimeString((process.env.LOCALE || 'en-US')),
        minPrice,
        maxPrice,
        avgPrice,
      });

      if (isDebug()) {
        console.log(
          "Frame %d data", 
          currentFrame, 
          JSON.stringify(
            {
              frameStart: frameStart.toLocaleTimeString((process.env.LOCALE || 'en-US')),
              frameEnd: frameEnd.toLocaleTimeString((process.env.LOCALE || 'en-US')),
              minPrice,
              maxPrice,
              avgPrice,
            }, 
            null, 
            4
          )
        );
      }

      // Accumulate min and max prices for average calculation
      totalMinPrices += minPrice;
      totalMaxPrices += maxPrice;
      totalAvgPrices += avgPrice;
      intervalCount++;
    }
  }

  // Calculate average min and max prices
  const avgMinPrice = totalMinPrices / intervalCount;
  const avgMaxPrice = totalMaxPrices / intervalCount;
  const avgAvgPrice = totalAvgPrices / intervalCount; 
  const avgPriceDiff = avgMaxPrice.toFixed(2) - avgMinPrice.toFixed(2);
  const avgVolatility = (avgPriceDiff / avgAvgPrice * 100);

  // Log results
  console.log('Price analysis complete. Results:');
  minMaxData.forEach((data) => {
    console.log(
      `Time Frame: ${data.frameStart} to ${data.frameEnd} | Min Price: $${data.minPrice.toFixed(2)} | Max Price: $${data.maxPrice.toFixed(2)} | Avg Price: $${data.avgPrice.toFixed(2)}`
    );
  });

  console.log('\nOverall Averages:');
  console.log(`Average Min Price: $${avgMinPrice.toFixed(2)}`);
  console.log(`Average Max Price: $${avgMaxPrice.toFixed(2)}`);
  console.log(`Average Avg Price: $${avgAvgPrice.toFixed(2)}`);
  console.log(`Average Price Diff: $${avgPriceDiff.toFixed(2)}`);
  console.log(`Average Volatility: ${avgVolatility.toFixed(2)}%`);  

  console.log(`\nSkipped Count: ${skippedCount}`);

  return {
    avgMinPrice, 
    avgMaxPrice, 
    avgAvgPrice, 
    avgPriceDiff, 
    avgVolatility,
  };
};

// Start the bot
monitorPrices();
