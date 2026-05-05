const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const express = require('express');
const path = require('path');
require('dotenv').config();

const { checkSiteHealth } = require('./monitor');
const { analyzeSiteHealth, chatWithAgent } = require('./ai');

// --- TELEGRAM BOT SETUP ---
const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;
let reportChatId = null;

if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    console.error("⚠️ WARNING: Telegram Bot Token is missing. The Telegram bot feature will be disabled, but the Web Dashboard will continue to run.");
} else {
    try {
        bot = new TelegramBot(token, { polling: true });
        console.log("🤖 Oval Sentinel Telegram Bot is starting up...");
    } catch (err) {
        console.error("⚠️ WARNING: Failed to start Telegram Bot:", err.message);
    }
}

if (bot) {
    async function safeSend(chatId, text) {
        try {
            await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        } catch (error) {
            // Fallback to plain text if Telegram rejects the Markdown formatting
            await bot.sendMessage(chatId, text);
        }
    }

    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        reportChatId = chatId;
        bot.sendMessage(chatId, "👋 Welcome! I am Oval Sentinel, your autonomous debugging agent for Oval Palace.\n\nI am now monitoring https://www.ovalpalaceresort.com 24/7.\n\nCommands:\n/status - Instant health check\n/report - Generate an AI debug report");
    });

    bot.onText(/\/status/, async (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, "⏳ Pinging servers...");
        const metrics = await checkSiteHealth();
        let response = `📊 **Live Status**\nURL: ${metrics.url}\nStatus: ${metrics.status}\nLatency: ${metrics.responseTime}ms`;
        if (metrics.error) response += `\n❌ Error: ${metrics.error}`;
        safeSend(chatId, response);
    });

    bot.onText(/\/report/, async (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, "🧠 Fetching metrics and generating AI report...");
        const metrics = await checkSiteHealth();
        const aiReport = await analyzeSiteHealth(metrics);
        safeSend(chatId, `📋 **AI Debug Report**\n\n${aiReport}`);
    });

    cron.schedule('0 10 * * *', async () => {
        if (!reportChatId) return;
        const metrics = await checkSiteHealth();
        const aiReport = await analyzeSiteHealth(metrics);
        safeSend(reportChatId, `🔔 **Automated Daily Report**\n\n${aiReport}`);
    });

    // For any other text message on Telegram, send it to the AI for chat
    bot.on('message', async (msg) => {
        if (msg.text && !msg.text.startsWith('/')) {
            const chatId = msg.chat.id;
            bot.sendChatAction(chatId, 'typing');
            const metrics = await checkSiteHealth();
            const aiReply = await chatWithAgent(msg.text, metrics);
            safeSend(chatId, aiReply);
        }
    });
}


// --- EXPRESS WEB SERVER & API SETUP ---
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Route: Get Live Metrics
app.get('/api/status', async (req, res) => {
    const metrics = await checkSiteHealth();
    res.json(metrics);
});

// API Route: Chat with AI Agent
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) return res.status(400).json({ error: "Message is required." });

    const metrics = await checkSiteHealth();
    const reply = await chatWithAgent(userMessage, metrics);
    
    res.json({ reply });
});

app.listen(PORT, () => {
    console.log(`🌐 Web Dashboard & API listening on port ${PORT}`);
});
