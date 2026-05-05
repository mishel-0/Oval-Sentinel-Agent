const axios = require('axios');
require('dotenv').config();

async function chatWithAgent(message, metrics = null) {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE') {
        return "⚠️ OpenRouter API Key is missing. I cannot process this request. Please add OPENROUTER_API_KEY to your Railway variables.";
    }

    let systemPrompt = `
You are the autonomous AI Agent for "Oval Palace Resort". Your name is Oval Sentinel.
Your job is to assist developers, monitor site performance, perform deep vulnerability debugging, and answer ALL questions with high reasoning.
Be professional, concise, and use an advanced "Cybersecurity / SRE / Jarvis" persona.
Always respond to every message, even if it's just "hi".
    `;

    if (metrics) {
        systemPrompt += `
Current live diagnostic metrics for the server:
- Status Code: ${metrics.status}
- Load Time: ${metrics.responseTime}ms
- HTML Payload Size: ${metrics.payloadSizeKB || 0} KB

SECURITY & VULNERABILITY REPORT:
${metrics.vulnerabilities ? metrics.vulnerabilities.map(v => "- " + v).join('\n') : "No scan data"}

If the user asks about health, debugging, or vulnerabilities, analyze these metrics with high reasoning. Propose immediate fixes for any detected vulnerabilities.
        `;
    }

    // Array of the BEST free reasoning models on OpenRouter
    const fallbackModels = [
        'nousresearch/hermes-3-llama-3.1-405b:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'openai/gpt-oss-120b:free',
        'google/gemma-4-31b-it:free',
        'nvidia/nemotron-3-super-120b-a12b:free'
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
            // Silently fail over to the next backup model
            lastError = error;
            // Continue to the next model in the fallback array
        }
    }

    // If ALL models fail, return the final error
    const errObj = lastError?.response?.data?.error;
    const msg = errObj ? errObj.message : lastError?.message || "Unknown error";
    
    // Specifically handle the OpenRouter Daily Limit error
    if (msg.includes("free-models-per-day") || msg.includes("Rate limit exceeded")) {
        return `❌ **SYSTEM HALTED: OPENROUTER DAILY LIMIT REACHED** ❌\n\nYour API Key has hit the maximum allowed free requests for today.\n\n*To fix this instantly:* Go to [openrouter.ai/settings/integrations](https://openrouter.ai/settings/integrations) and add a minimal credit balance (even just $5). This instantly unlocks 1,000 free requests per day.`;
    }

    return `❌ AI Core Offline: All free models are currently rate-limited upstream. Last error: ${msg}`;
}

// Backwards compatibility for the original Telegram /report command
async function analyzeSiteHealth(metrics) {
    return await chatWithAgent("Please generate a short, professional debugging report based on the current site metrics.", metrics);
}

module.exports = { analyzeSiteHealth, chatWithAgent };
