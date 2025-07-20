const nodemailer = require('nodemailer');
require('dotenv').config({ path: './config.env' });

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendContactNotification(contactData) {
    try {
      const { token, email, message, timestamp } = contactData;
      
      const formattedDate = new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });

      // Check if email credentials are properly configured
      if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_character_app_password_here') {
        console.log(`⚠️  Email notification skipped for token #${token} - Gmail credentials not configured`);
        console.log('📧 To enable email notifications:');
        console.log('   1. Enable 2-Factor Authentication on your Gmail account');
        console.log('   2. Generate an App Password in Google Account settings');
        console.log('   3. Update EMAIL_PASS in backend/config.env');
        return { message: 'Email skipped - credentials not configured' };
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to yourself
        subject: `New Contact Form Submission - Token #${token}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px; border-bottom: 2px solid #cba135; padding-bottom: 10px;">
                📧 New Contact Form Submission
              </h2>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #cba135; margin-top: 0;">Submission Details</h3>
                <p><strong>Token Number:</strong> <span style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">#${token}</span></p>
                <p><strong>Timestamp:</strong> ${formattedDate}</p>
                <p><strong>From Email:</strong> <a href="mailto:${email}" style="color: #007bff;">${email}</a></p>
              </div>
              
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404; margin-top: 0;">📝 Message Content</h3>
                <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6;">
                  <p style="margin: 0; line-height: 1.6; color: #333;">${message.replace(/\n/g, '<br>')}</p>
                </div>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p style="color: #6c757d; font-size: 14px; margin-bottom: 10px;">
                  <strong>Quick Actions:</strong>
                </p>
                <a href="mailto:${email}?subject=Re: Your Contact Form Submission #${token}" 
                   style="background-color: #cba135; color: #000000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
                  📧 Reply to ${email.split('@')[0]}
                </a>
                <span style="color: #6c757d; font-size: 12px;">
                  Click to open your email client with a pre-filled response
                </span>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 6px;">
                <p style="margin: 0; color: #6c757d; font-size: 12px;">
                  This is an automated notification from your MUN Website contact form. 
                  The submission has been stored in your database with token #${token}.
                </p>
              </div>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email notification sent successfully for token #${token}`);
      return result;
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      // Check if email credentials are properly configured
      if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_character_app_password_here') {
        console.log('⚠️  Email service: Gmail credentials not configured');
        console.log('📧 Contact form submissions will be stored in database but no emails will be sent');
        console.log('🔧 To enable email notifications, update EMAIL_PASS in backend/config.env');
        return false;
      }
      
      await this.transporter.verify();
      console.log('✅ Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService(); 