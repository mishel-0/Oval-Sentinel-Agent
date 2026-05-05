const axios = require('axios');
require('dotenv').config();

async function chatWithAgent(message, metrics = null) {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE') {
        return "⚠️ OpenRouter API Key is missing. I cannot process this request. Please add OPENROUTER_API_KEY to your Railway variables.";
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

    // Array of active free models on OpenRouter
    const fallbackModels = [
        'google/gemma-4-31b-it:free',
        'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        'poolside/laguna-m.1:free',
        'meta-llama/llama-3.2-3b-instruct:free'
    ];

    let lastError = null;

    for (const model of fallbackModels) {
        try {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: model,
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

            const content = response.data.choices[0].message.content;
            if (!content) throw new Error("Model returned empty response payload");
            return content;
        } catch (error) {
            console.error(`[AI Engine] Model ${model} failed:`, error.response?.data?.error?.message || error.message);
            lastError = error;
            // Continue to the next model in the fallback array
        }
    }

    // If ALL models fail, return the final error
    const errObj = lastError.response?.data?.error;
    const msg = errObj ? errObj.message : lastError.message;
    return `❌ AI Core Offline: All free models are currently rate-limited upstream. Last error: ${msg}`;
}

// Backwards compatibility for the original Telegram /report command
async function analyzeSiteHealth(metrics) {
    return await chatWithAgent("Please generate a short, professional debugging report based on the current site metrics.", metrics);
}

module.exports = { analyzeSiteHealth, chatWithAgent };
