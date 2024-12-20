import nodemailer from 'nodemailer';

if (
    process.env.SENDER_EMAIL_ADDRESS == undefined || 
    process.env.SENDER_EMAIL_PASSWORD == undefined ||
    process.env.PRICE_UP_RECEIVER_EMAIL_ADDRESS == undefined || 
    process.env.PRICE_DOWN_RECEIVER_EMAIL_ADDRESS == undefined
  ) {
      throw new Error('Email configuration is missing.');
  }
  
  // Configure Nodemailer transport (example using Gmail SMTP)
  const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.SENDER_EMAIL_ADDRESS, 
      pass: process.env.SENDER_EMAIL_PASSWORD    
  }
  });


const sendEmail = (
    symbol,
    startTime, 
    endTime, 
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
  ) => {
        let changeSign;
        if (closingPrice > openingPrice) {
            changeSign = '+';
        } else {
            changeSign = '-';
        }
        // Mail options
        const mailOptions = {
            from: `Binance monitor <${process.env.SENDER_EMAIL_ADDRESS}>`, 
            to: (closingPrice > openingPrice) ? process.env.PRICE_UP_RECEIVER_EMAIL_ADDRESS : process.env.PRICE_DOWN_RECEIVER_EMAIL_ADDRESS, 
            subject: `${symbol} C: ${changeSign}${priceChange.toFixed(2)}%. AV: ${avgVolatility.toFixed(2)}%. D/I: ${(duration / 60 / 1000)}/${(interval / 60 / 1000)} m.`,
            text: `Monitoring started at ${startTime.toLocaleTimeString((process.env.LOCALE || 'en-US'))} and completed at ${endTime.toLocaleTimeString((process.env.LOCALE || 'en-US'))} with the following results:          
Opening Price: $${openingPrice.toFixed(4)}.
-----------------------------------------
Frame Avg MinPrice: $${avgMinPrice.toFixed(4)}.
Frame Avg MaxPrice: $${avgMaxPrice.toFixed(4)}.
Frame Avg AvgPrice: $${avgAvgPrice.toFixed(4)}.
Frame Avg PriceDiff: $${avgPriceDiff.toFixed(4)}.
-----------------------------------------
Closing Price: $${closingPrice.toFixed(4)}.`
        };
        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email sending error:", error);              
            } else {
              console.log("Email sent.");            
            }                    
        });
  };

  export default sendEmail;