const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Configure the transporter to use Brevo's SMTP server
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        auth: {
            user: process.env.BREVO_SMTP_USER,
            pass: process.env.BREVO_SMTP_PASS,
        },
    });

    // 2. Define the email details
    const mailOptions = {
        from: `TaskFlow <${process.env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
    };

    // 3. Send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
        console.error(`Error sending email to ${options.to}:`, error);
    }
};

module.exports = sendEmail;