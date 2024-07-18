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
// console.log('Initialization Vector:', iv.toString('hex'));
// const iv = Buffer.from('b0015b0e66ebfa2903f5fbdbb64f4683', 'hex');

// Secret key for encryption and decryption
const secretKey = crypto.randomBytes(32); // Generates a 32-byte (256-bit) key and converts it to a hex string
// console.log(secretKey).toString('hex');
// const secretKey = 'f89d00967cb05af952bcc92e6d978c0406cebffe418a4fc09460ebe3bf0b4b9f';
const serverURL = 'https://email-verification-server.vercel.app';


const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'market.monitor.b@gmail.com',
        pass: 'gjyp qrsq osit grvk',
    },
});


app.get('/', (req, res) => {
    res.send('<h1>Email Verification - server</h1>');
});

app.get('/api', (req, res) => {
    res.send('<h1>Email Verification - api</h1>');
});

app.post('/api/register', (req, res) => {
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
                        background-color: #739fee;
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
                    <p><a class="btn" href="${serverURL}/api/verify?token=${tokenIv}" target="_blank">Verify Email</a></p>
                    <p style="font-size: smaller;"><em>${serverURL}/api/verify?token=${tokenIv}</em></p>
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

app.get('/api/verify', (req, res) => {
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
            //res.redirect(`https://email-verification-client.vercel.app/verification-success.html`);
            res.send(`
                <html>
                  <head>
                    <style>
                      body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                      }
                      .container {
                        text-align: center;
                        background-color: white;
                        padding: 2em;
                        border-radius: 10px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                      }
                      h1 {
                        color: #4CAF50;
                      }
                      p {
                        font-size: 1.2em;
                      }
                      a {
                        display: inline-block;
                        margin-top: 1em;
                        padding: 0.5em 1em;
                        color: white;
                        background-color: #4CAF50;
                        text-decoration: none;
                        border-radius: 5px;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <h1>Your account was succesfully verified!</h1>
                      <p>Thank you for register to our website!</p>
                      <a href="https://email-verification-client.vercel.app/">Login Now</a>
                    </div>
                  </body>
                </html>
              `);
        } else {
            res.status(400).send('<h1>Invalid token</h1>');
        }
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).send('<h1>Page not exist!</h1>');
    }

});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
