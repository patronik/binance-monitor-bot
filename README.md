
# Binance Price Monitoring Bot

This is a Node.js script that monitors BTC prices using the Binance API, analyzes price data over specified intervals, and calculates statistics such as minimum, maximum, and average prices.

## Features

- Monitors real-time BTC prices during a configurable time frame.
- Calculates minimum and maximum prices for 5-minute intervals.
- Calculates overall average minimum and maximum prices.
- Logs analysis results to the console and saves them to a JSON file.
- Notifies with collected results by email.

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

### 4. Install Dependencies
```bash
npm init -y
npm install node-binance-api
```

### 5. Configure the Environment
Create a `.env` file in the project directory and add the following configuration:

```plaintext
BINANCE_API_KEY=YOUR_KEY                # Your Binance API key
BINANCE_API_SECRET=YOUR_SECRET          # Your Binance API secret
SYMBOL=BTCUSDT                          # Cryptocurrency pair to monitor
DEBUG=true                              # Enable or disable debug logs
LOCALE='en-US'                          # Locale used for date and time output
CONTACT_EMAIL_ADDRESS=homepage.admin@gmail.com # Email address for notifications (if implemented)
CONTACT_EMAIL_PASSWORD='password'       # Email password for notifications (if implemented)
```

### 6. Configure main script
Edit `main.js` to include your Binance API key and secret:
```javascript
const config = {
  apiKey: '<YOUR_API_KEY>',
  apiSecret: '<YOUR_API_SECRET>',
};
```

### 7. Configure mailer script
Edit `mailer.js` to include your gmail SMTP credentials:
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: '<YOUR_CONTACT_EMAIL_ADDRESS>', 
      pass: '<YOUR_CONTACT_EMAIL_PASSWORD'   
  }
  });
```

### 8. Run the Script
```bash
node main.js
```

## Output
- Real-time price logs in the console.
- Analysis results including min, max, and average prices in the console.

## Configuration
Modify the `config` object in the script to change:
- Monitoring duration
- Time frame intervals

## Troubleshooting
- Ensure Node.js and npm are installed (`node -v`, `npm -v`).
- Verify API credentials for Binance.

## License
This project is licensed under the MIT License.
