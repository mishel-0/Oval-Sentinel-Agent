const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
require('dotenv').config();

const { checkSiteHealth } = require('./monitor');
const { analyzeSiteHealth } = require('./ai');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    console.error("FATAL: Telegram Bot Token is missing in .env");
    process.exit(1);
}

// Polling mode for Telegram
const bot = new TelegramBot(token, { polling: true });

// We need to keep track of a default chat ID to send automated reports to.
// The easiest way is to wait for the user to message the bot first, and save that ID.
let reportChatId = null;

console.log("🤖 Oval Sentinel Agent is starting up...");

// Greet user and set default chat ID
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    reportChatId = chatId; // Set this chat as the receiver of automated reports
    bot.sendMessage(chatId, "👋 Welcome! I am Oval Sentinel, your autonomous debugging agent for Oval Palace.\n\nI am now monitoring https://www.ovalpalaceresort.com 24/7.\n\nCommands:\n/status - Instant health check\n/report - Generate an AI debug report");
});

// Command: /status
bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "⏳ Pinging servers...");
    
    const metrics = await checkSiteHealth();
    let response = `📊 **Live Status**\nURL: ${metrics.url}\nStatus: ${metrics.status}\nLatency: ${metrics.responseTime}ms`;
    
    if (metrics.error) {
        response += `\n❌ Error: ${metrics.error}`;
    }
    
    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

// Command: /report
bot.onText(/\/report/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🧠 Fetching metrics and generating AI report...");
    
    const metrics = await checkSiteHealth();
    const aiReport = await analyzeSiteHealth(metrics);
    
    bot.sendMessage(chatId, `📋 **AI Debug Report**\n\n${aiReport}`, { parse_mode: 'Markdown' });
});

// Automated Daily Check (Runs every day at 10 AM Server Time)
cron.schedule('0 10 * * *', async () => {
    if (!reportChatId) {
        console.log("Skipping daily report - no chat ID registered yet.");
        return;
    }
    
    console.log("Running scheduled daily report...");
    const metrics = await checkSiteHealth();
    const aiReport = await analyzeSiteHealth(metrics);
    
    bot.sendMessage(reportChatId, `🔔 **Automated Daily Report**\n\n${aiReport}`, { parse_mode: 'Markdown' });
});

console.log("✅ Oval Sentinel Agent is online and polling.");
