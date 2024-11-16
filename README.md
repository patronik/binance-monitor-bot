
# Binance Price Monitoring Bot

This is a Node.js script that monitors BTC prices using the Binance API, analyzes price data over specified intervals, and calculates statistics such as minimum, maximum, and average prices.

## Features

- Monitors real-time BTC prices during a configurable time frame.
- Calculates minimum and maximum prices for 5-minute intervals.
- Calculates overall average minimum and maximum prices.
- Logs analysis results to the console and saves them to a JSON file.

## Prerequisites

- Ubuntu machine
- Node.js (version 18 or later)
- npm (Node Package Manager)
- Binance API key and secret

## Installation

### 1. Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js and npm
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Clone or Create the Script
If using GitHub:
```bash
git clone <repository_url>
cd <repository_directory>
```

If you have a local copy, create a directory and move the script:
```bash
mkdir ~/binance-bot
cd ~/binance-bot
```

### 4. Install Dependencies
```bash
npm init -y
npm install node-binance-api
```

### 5. Configure the Script
Edit `bot.js` to include your Binance API key and secret:
```javascript
const config = {
  apiKey: '<YOUR_API_KEY>',
  apiSecret: '<YOUR_API_SECRET>',
};
```

### 6. Run the Script
```bash
node bot.js
```

### 7. Run in Background (Optional)
Install `pm2` for background execution:
```bash
sudo npm install -g pm2
pm2 start bot.js --name "binance-bot"
pm2 save
pm2 startup
```

## Output
- Real-time price logs in the console.
- Analysis results including min, max, and average prices in the console.
- Results saved to `price_analysis.json`.

## Configuration
Modify the `config` object in the script to change:
- Monitoring duration
- Time frame intervals

## Troubleshooting
- Ensure Node.js and npm are installed (`node -v`, `npm -v`).
- Verify API credentials for Binance.
- Use `pm2 logs binance-bot` to debug background issues.

## License
This project is licensed under the MIT License.
