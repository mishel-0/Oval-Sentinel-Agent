const axios = require('axios');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function chatWithAgent(message, metrics = null) {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE') {
        return "⚠️ OpenRouter API Key is missing. I cannot process this request.";
    }

    let systemPrompt = `
You are the autonomous AI Agent for "Oval Palace Resort". Your name is Oval Sentinel.
Your job is to assist developers, monitor site performance, and answer questions.
Be professional, concise, and use a slightly technical "SRE / Jarvis" persona.
    `;

    if (metrics) {
        systemPrompt += `
Current live metrics for the server:
- Status Code: ${metrics.status}
- Load Time: ${metrics.responseTime}ms
If the user asks about health, report these metrics. If response time is high (>1000ms), warn them.
        `;
    }

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.5-flash:free',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://ovalpalaceresort.com',
                'X-Title': 'Oval Sentinel Agent'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("OpenRouter API Error:", error.response?.data || error.message);
        return "❌ Error communicating with OpenRouter API. Please check your API key.";
    }
}

// Backwards compatibility for the original Telegram /report command
async function analyzeSiteHealth(metrics) {
    return await chatWithAgent("Please generate a short, professional debugging report based on the current site metrics.", metrics);
}

module.exports = { analyzeSiteHealth, chatWithAgent };
