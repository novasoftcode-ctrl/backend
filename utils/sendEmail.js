const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Transporter configuration (Placeholder - needs real SMTP creds)
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: process.env.SMTP_PORT || 2525,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: `"PrismZone Support" <noreply@prismzone.com>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.email}`);
    } catch (err) {
        console.error(`Error sending email: ${err.message}`);
    }
};

module.exports = sendEmail;
