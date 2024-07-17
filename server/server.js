const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Simulate a database
const users = {};

// Generate a random initialization vector
// const iv = crypto.randomBytes(16).toString('hex');
// console.log('Initialization Vector:', iv);
const iv = Buffer.from('b0015b0e66ebfa2903f5fbdbb64f4683', 'hex');

// Secret key for encryption and decryption
// const secretKey = crypto.randomBytes(32).toString('hex'); // Generates a 32-byte (256-bit) key and converts it to a hex string
// console.log(secretKey);
const secretKey = 'f89d00967cb05af952bcc92e6d978c0406cebffe418a4fc09460ebe3bf0b4b9f';
const serverURL = 'https://email-verification-server.vercel.app';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'market.monitor.b@gmail.com',
        pass: 'vhvs csdv fmul pgbe',
    },
});


app.get('/', (req, res) => {
    res.send('<h1>Email Verification - server</h1>');
});


app.post('/register', (req, res) => {
    const { email, password } = req.body;

    if (users[email]) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Store user in "database"
    users[email] = { email, password };

    // Create an encrypted token
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    let token = cipher.update(email, 'utf8', 'hex');
    token += cipher.final('hex');
    const tokenIv = iv.toString('hex') + ':' + token; // Include IV with token

    // Send email
    const mailOptions = {
        from: 'email-verification@gmail.com',
        to: email,
        subject: 'Welcome!',
        html: `
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #ffffff;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #333333;
                    }
                    p {
                        color: #666666;
                    }
                    .btn {
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #007bff;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 5px;
                    }
                    .btn:hover {
                        background-color: #0056b3;
                    }
                </style>
            </head>
    
            <body>
                <div class="container">
                    <h1>Welcome to Email Verification</h1>
                    <p>Please click the following link to complete your registration:</p>
                    <p><a class="btn" href="${serverURL}/verify?token=${tokenIv}" target="_blank">Verify Email</a></p>
                    <p><em>${serverURL}/verify?token=${tokenIv}</em></p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <p>Thank you!</p>
                </div>                
            </body>
            </html>
        `
    };
    
    

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: 'Error sending email' });
        }
        res.json({ message: 'Registration successful, please check your email to complete the registration' });
    });
});

app.get('/verify', (req, res) => {
    try{
        const { token } = req.query;
        const [ivHex, encryptedToken] = token.split(':');
        const ivBuffer = Buffer.from(ivHex, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), ivBuffer);
        let decryptedEmail = decipher.update(encryptedToken, 'hex', 'utf8');
        decryptedEmail += decipher.final('utf8');
        if (users[decryptedEmail].verified) {
            res.send('<h1>You already verified!</h1>');
        }
        else if (users[decryptedEmail]) {
            // Update user status to "verified"
            users[decryptedEmail].verified = true;
            res.send('<h1>Successfully Registered!</h1>');
        } else {
            res.status(400).send('<h1>Invalid token</h1>');
        }
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).send('<h1>Page not exist!</h1></h1>');
    }

});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
