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
const iv = crypto.randomBytes(16);

// Secret key for encryption and decryption
// const secretKey = crypto.randomBytes(32).toString('hex'); // Generates a 32-byte (256-bit) key and converts it to a hex string
// console.log(secretKey);
const secretKey = 'f89d00967cb05af952bcc92e6d978c0406cebffe418a4fc09460ebe3bf0b4b9f';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'market.monitor.b@gmail.com',
        pass: 'vhvs csdv fmul pgbe',
    },
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
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Welcome!',
        text: `Please click the following link to complete your registration: http://localhost:3000/verify?token=${tokenIv}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: 'Error sending email' });
        }
        res.json({ message: 'Registration successful, please check your email to complete the registration' });
    });
});

app.get('/verify', (req, res) => {
    const { token } = req.query;
    const [ivHex, encryptedToken] = token.split(':');
    const ivBuffer = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), ivBuffer);
    let decryptedEmail = decipher.update(encryptedToken, 'hex', 'utf8');
    decryptedEmail += decipher.final('utf8');

    if (users[decryptedEmail].verified){
        res.send('<h1>You already verified!</h1>');
    }
    else if (users[decryptedEmail]) {
        // Update user status to "verified"
        users[decryptedEmail].verified = true;
        res.send('<h1>Successfully Registered!</h1>');
    } else {
        res.status(400).send('<h1>Invalid token</h1>');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});