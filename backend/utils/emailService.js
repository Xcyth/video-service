const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const generatePassword = (firstName, lastName) => {
  // Create a base string using first name and last name
  const baseString = `${firstName}${lastName}`.toLowerCase();
  
  // Generate a random number between 100 and 999
  const randomNum = Math.floor(Math.random() * 900 + 100);
  
  // Generate a random special character
  const specialChars = '!@#$%^&*';
  const randomSpecialChar = specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Generate a random string
  const randomString = crypto.randomBytes(3).toString('hex');
  
  // Take first 3 characters from the base string
  const baseSubstring = baseString.slice(0, 3);
  
  // Combine all parts and shuffle
  const parts = [baseSubstring, randomNum.toString(), randomSpecialChar, randomString];
  const shuffled = parts.sort(() => Math.random() - 0.5).join('');
  
  return shuffled;
};

const sendPasswordEmail = async (email, firstName, password) => {
  try {
    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log('SMTP Connection verified');
    } catch (verifyError) {
      console.error('SMTP Connection Error:', verifyError);
      return false;
    }

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: 'Your Account Login Credentials',
      html: `
        <h1>Welcome to ${process.env.SMTP_FROM_NAME}, ${firstName}!</h1>
        <p>Your account has been created successfully. Here are your login credentials:</p>
        <p><strong>Login Instructions:</strong></p>
        <ul>
          <li>Use your <strong>First Name</strong>: ${firstName}</li>
          <li>Use this <strong>Password</strong>: ${password}</li>
        </ul>
        <p><strong>Important:</strong> This password is unique to your account. Even if someone else has the same first name, 
        they cannot access your account without your specific password.</p>
        <p>Please keep this password safe and change it after your first login.</p>
        <p>Best regards,<br>${process.env.SMTP_FROM_NAME}</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', {
      messageId: info.messageId,
      response: info.response
    });
    
    return true;
  } catch (error) {
    console.error('Email sending failed:', {
      error: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    return false;
  }
};

module.exports = {
  generatePassword,
  sendPasswordEmail
}; 