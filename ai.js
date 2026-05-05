const axios = require('axios');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function analyzeSiteHealth(metrics) {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE') {
        return "⚠️ OpenRouter API Key is missing. I cannot generate an AI report. Please add it to your .env file in Railway.";
    }

    const prompt = `
You are the autonomous AI Agent for "Oval Palace Resort". Your job is to analyze site performance metrics and provide a short, professional, and actionable debugging report to the developers.

Here are the latest metrics:
- Status Code: ${metrics.status}
- Load Time: ${metrics.responseTime}ms
- Checks Performed: HTTPS Reachability, Server Response Time

Write a 2-3 sentence report on the site's health. If the response time is over 1000ms, suggest checking asset sizes (like images) or server regions. If status is not 200, raise an alert. Use emojis.
    `;

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.5-flash:free',
            messages: [{ role: 'user', content: prompt }]
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

module.exports = { analyzeSiteHealth };
