import nodemailer from 'nodemailer';

if (
    process.env.CONTACT_EMAIL_ADDRESS == undefined || 
    process.env.CONTACT_EMAIL_PASSWORD == undefined
  ) {
      throw new Error('Email configuration is missing.');
  }
  
  // Configure Nodemailer transport (example using Gmail SMTP)
  const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.CONTACT_EMAIL_ADDRESS, 
      pass: process.env.CONTACT_EMAIL_PASSWORD    
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
            from: `Binance monitor <${process.env.CONTACT_EMAIL_ADDRESS}>`, 
            to: process.env.CONTACT_EMAIL_ADDRESS, 
            subject: `Cng: ${changeSign}${priceChange.toFixed(2)}%. Avg Vol.: ${avgVolatility.toFixed(2)}%. Dur.: ${(duration / 60 / 1000)} mins. Int.: ${(interval / 60 / 1000)} mins.`,
            text: `Monitoring for symbol ${symbol} started at ${startTime.toLocaleTimeString((process.env.LOCALE || 'en-US'))} and completed at ${endTime.toLocaleTimeString((process.env.LOCALE || 'en-US'))} with the following results:          
Opening Price: $${openingPrice.toFixed(2)}.
-----------------------------------------
Frame Avg MinPrice: $${avgMinPrice.toFixed(2)}.
Frame Avg MaxPrice: $${avgMaxPrice.toFixed(2)}.
Frame Avg AvgPrice: $${avgAvgPrice.toFixed(2)}.
Frame Avg PriceDiff: $${avgPriceDiff.toFixed(2)}.
-----------------------------------------
Closing Price: $${closingPrice.toFixed(2)}.`
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