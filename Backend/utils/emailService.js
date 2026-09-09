const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Email templates
const emailTemplates = {
  verification: (name, otp) => ({
    subject: 'Verify your email - Utsavo',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Utsavo</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #d97706;
            margin-bottom: 10px;
          }
          .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
          }
          .otp {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            margin: 10px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #d97706;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✨ Utsavo</div>
            <h2>Welcome to Your Wedding Planning Journey!</h2>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>Thank you for signing up with Utsavo! To get started with your wedding planning, please verify your email address using the OTP below:</p>
          
          <div class="otp-box">
            <p>Your verification code is:</p>
            <div class="otp">${otp}</div>
            <p>This code will expire in 10 minutes</p>
          </div>
          
          <p>If you didn't create an account with us, please ignore this email.</p>
          
          <div class="footer">
            <p>Need help? Contact us at support@utsavo.com</p>
            <p>© 2024 Utsavo. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  welcome: (name) => ({
    subject: 'Welcome to Utsavo - Start Your Wedding Planning Journey!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Utsavo</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #d97706;
            margin-bottom: 10px;
          }
          .feature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
          }
          .feature {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }
          .feature-icon {
            font-size: 24px;
            margin-bottom: 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #d97706;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✨ Utsavo</div>
            <h1>Welcome to Your Dream Wedding!</h1>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>Congratulations! 🎉 Your email has been verified and you're now ready to embark on an incredible wedding planning journey with Utsavo.</p>
          
          <h3>What can you do with Utsavo?</h3>
          
          <div class="feature-grid">
            <div class="feature">
              <div class="feature-icon">👰</div>
              <h4>Find Vendors</h4>
              <p>Connect with 40+ verified wedding vendors</p>
            </div>
            <div class="feature">
              <div class="feature-icon">📋</div>
              <h4>Planning Tools</h4>
              <p>Budget planner, checklist & timeline</p>
            </div>
            <div class="feature">
              <div class="feature-icon">👨‍👩‍👧‍👦</div>
              <h4>Family Collaboration</h4>
              <p>Coordinate with family members</p>
            </div>
            <div class="feature">
              <div class="feature-icon">💡</div>
              <h4>Inspiration</h4>
              <p>Get ideas from real weddings</p>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/dashboard" class="button">
              Start Planning Now →
            </a>
          </div>
          
          <p>Need help getting started? Check out our <a href="#">planning guide</a> or contact our support team.</p>
          
          <div class="footer">
            <p>Happy Planning! 💐</p>
            <p>© 2024 Utsavo. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordReset: (name, resetToken) => ({
    subject: 'Reset Your Password - Utsavo',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Utsavo</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #d97706;
            margin-bottom: 10px;
          }
          .warning-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #dc2626;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✨ Utsavo</div>
            <h2>Password Reset Request</h2>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>We received a request to reset your password for your Utsavo account. If you didn't make this request, you can safely ignore this email.</p>
          
          <div class="warning-box">
            <strong>⚠️ Security Notice:</strong> This password reset link will expire in 1 hour for your security.
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}" class="button">
              Reset My Password
            </a>
          </div>
          
          <p>Alternatively, you can copy and paste this token into the password reset form:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all;">
            ${resetToken}
          </div>
          
          <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
          
          <div class="footer">
            <p>© 2024 Utsavo. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async (to, emailTemplate) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: to,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Specific email functions
const sendVerificationEmail = async (email, name, otp) => {
  const template = emailTemplates.verification(name, otp);
  return sendEmail(email, template);
};

const sendWelcomeEmail = async (email, name) => {
  const template = emailTemplates.welcome(name);
  return sendEmail(email, template);
};

const sendPasswordResetEmail = async (email, name, resetToken) => {
  const template = emailTemplates.passwordReset(name, resetToken);
  return sendEmail(email, template);
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    await transporter.verify();
    console.log('Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  testEmailConfiguration,
  emailTemplates
};
