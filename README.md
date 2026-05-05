# 🤖 Oval Sentinel AI Agent

An autonomous 24/7 AI-powered debugging and monitoring agent built specifically for **Oval Palace Resort**. 

This bot acts as a proactive site reliability engineer (SRE). It continuously monitors the production environment, gathers performance metrics, and uses advanced Large Language Models via OpenRouter to generate intelligent, human-readable health reports directly in Telegram.

## 🚀 Key Features

- **24/7 Uptime & Latency Monitoring**: Automatically pings the production site to ensure maximum availability and detects latency spikes caused by heavy assets or network issues.
- **AI-Powered Diagnostics**: Integrates with OpenRouter (Gemini / Llama) to analyze raw network metrics and translate them into actionable debugging advice for developers.
- **Automated Telegram Reporting**: Delivers a daily health summary directly to your designated Telegram chat via cron jobs.
- **On-Demand Commands**:
  - `/status` - Instantly trigger a live ping and latency test.
  - `/report` - Force an immediate AI analysis of current site performance.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Bot Framework**: `node-telegram-bot-api`
- **Network Requests**: `axios`
- **Task Scheduling**: `node-cron`
- **AI Engine**: OpenRouter API

## 📦 Deployment (Railway)

This repository is optimized for one-click deployment on [Railway.app](https://railway.app/). 

**Required Environment Variables**:
- \`TELEGRAM_BOT_TOKEN\`: Your bot token from @BotFather.
- \`OPENROUTER_API_KEY\`: Your OpenRouter API key for LLM analysis.
- \`TARGET_URL\`: The production URL to monitor (e.g., \`https://www.ovalpalaceresort.com\`).

---
*Built for Nalakath Holdings to ensure a flawless digital experience.*
