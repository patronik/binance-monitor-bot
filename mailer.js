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
    startTime, 
    endTime, 
    avgMinPrice, 
    avgMaxPrice, 
    avgAvgPrice, 
    avgPriceDiff, 
    avgVolatility
  ) => {
        // Mail options
        const mailOptions = {
            from: `Binance monitor <${process.env.CONTACT_EMAIL_ADDRESS}>`, 
            to: process.env.CONTACT_EMAIL_ADDRESS, 
            subject: `Binance monitor: Avg Volatility: ${avgVolatility.toFixed(2)}%. Duration: ${((endTime - startTime) / 1000 / 60).toFixed(2)} minutes. Interval: ${(process.env.FRAME_INTERVAL || 5)} minutes.`,
            text: `Monitoring for symbol ${process.env.SYMBOL} started at ${startTime.toLocaleTimeString((process.env.LOCALE || 'en-US'))} and completed at ${endTime.toLocaleTimeString((process.env.LOCALE || 'en-US'))} with the following results:          
Avg PriceDiff: ${avgPriceDiff.toFixed(2)}%.
Avg MinPrice: ${avgMinPrice.toFixed(2)}%.
Avg MaxPrice: ${avgMaxPrice.toFixed(2)}%.
Avg AvgPrice: ${avgAvgPrice.toFixed(2)}%.
`
        };
        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email sending error:", error);              
            } else {
              console.log("Email sent:", info.response);            
            }                    
        });
  };

  export default sendEmail;