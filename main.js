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
      const framePrices = [];

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
            framePrices.push(priceData[i]);
            if (isDebug()) {
              console.log("Last collected item index: %d", i);
            }
            i++;
          }  
        }  
      }
      
      if (framePrices.length > 0) {
        const framePrices = framePrices.map((p) => p.price);
        const minPrice = Math.min(...framePrices);
        const maxPrice = Math.max(...framePrices);
        const avgPrice = framePrices.reduce((a, b) => a + b, 0) / framePrices.length;
  
        minMaxData.push({
          frameStart: frameStart.toISOString(),
          frameEnd: frameEnd.toISOString(),
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
                frameStart: frameStart.toISOString(),
                frameEnd: frameEnd.toISOString(),
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
    const averagePriceDiff = avgMaxPrice.toFixed(2) - avgMinPrice.toFixed(2);
    const averageVolatility = (averagePriceDiff / avgAvgPrice).toFixed(2) * 100;
  
    // Log results
    console.log('Price analysis complete. Results:');
    console.log(`Skipped Count: ${skippedCount}`);
    minMaxData.forEach((data) => {
      console.log(
        `Time Frame: ${data.frameStart} to ${data.frameEnd} 
        | Min Price: $${data.minPrice} 
        | Max Price: $${data.maxPrice} 
        | Avg Price: $${data.avgPrice}`
      );
    });

    console.log('\nOverall Averages:');
    console.log(`Average Min Price: $${avgMinPrice.toFixed(2)}`);
    console.log(`Average Max Price: $${avgMaxPrice.toFixed(2)}`);
    console.log(`Average Avg Price: $${avgAvgPrice.toFixed(2)}`);
    console.log(`Average Price Diff: $${averagePriceDiff.toFixed(2)}`);
    console.log(`Average Volatility: ${averageVolatility.toFixed(2)}%`);  
  };

// Start the bot
monitorPrices();
