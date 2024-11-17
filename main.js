import 'dotenv/config'
import Binance from 'node-binance-api';
import fs from 'fs';

// Configuration
const config = {
  apiKey: process.env.BINANCE_API_KEY, // Replace with your Binance API key
  apiSecret: process.env.BINANCE_API_SECRET, // Replace with your Binance API secret
  symbol: process.env.SYMBOL, // Pair to monitor
  monitoringDuration: 60000 * process.env.TOTAL_DURATION, // Monitoring time in milliseconds (default: 15 minutes)
  interval: process.env.FRAME_INTERVAL * 60 * 1000, // Time frame interval in milliseconds (default: 5 minutes)
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
  console.log(`Monitoring ${config.symbol} prices for ${config.monitoringDuration / 1000 / 60} minutes...`);

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
    console.log('Monitoring complete.');
    analyzePrices();
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
    let intervalCount = 0; // Count of intervals for averaging   
    let totalFrames = Math.floor(priceData.length / (config.interval / 1000)); // Count of frames 

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
        
      const framePrices = [];
      while (
        i < priceData.length 
        && (
            priceData[i].timestamp >= frameStart 
            && priceData[i].timestamp <= frameEnd
          )
      ) {
        framePrices.push(priceData[i]);
        if (isDebug()) {
          console.log("Last collected item index: %d", i);
        }
        i++;
      }
  
      if (framePrices.length > 0) {
        const minPrice = Math.min(...framePrices.map((p) => p.price));
        const maxPrice = Math.max(...framePrices.map((p) => p.price));
  
        minMaxData.push({
          frameStart: frameStart.toISOString(),
          frameEnd: frameEnd.toISOString(),
          minPrice,
          maxPrice,
        });

        if (isDebug()) {
          console.log(
            "Frame %d data", 
            currentFrame, 
            JSON.stringify(
              {
                frameStart: frameStart.toISOString(),
                frameEnd: frameEnd.toISOString(),
                minPrice,
                maxPrice,
              }, 
              null, 
              4
            )
          );
        }
  
        // Accumulate min and max prices for average calculation
        totalMinPrices += minPrice;
        totalMaxPrices += maxPrice;
        intervalCount++;
      }

      if (currentFrame == totalFrames) {
        break;
      }
    }
  
    // Calculate average min and max prices
    const avgMinPrice = totalMinPrices / intervalCount;
    const avgMaxPrice = totalMaxPrices / intervalCount;
  
    // Log results
    console.log('Price analysis complete. Results:');
    minMaxData.forEach((data) => {
      console.log(
        `Time Frame: ${data.frameStart} to ${data.frameEnd} | Min Price: $${data.minPrice} | Max Price: $${data.maxPrice}`
      );
    });
  
    console.log('\nOverall Averages:');
    console.log(`Average Min Price: $${avgMinPrice.toFixed(2)}`);
    console.log(`Average Max Price: $${avgMaxPrice.toFixed(2)}`);
    console.log(`Average Price Diff: $${(avgMaxPrice.toFixed(2) - avgMinPrice.toFixed(2)).toFixed(2)}`);
  
    // Save results to file (optional)
    fs.writeFileSync('price_analysis.json', JSON.stringify(minMaxData, null, 2));
    console.log('Results saved to price_analysis.json');
  };

// Start the bot
monitorPrices();
