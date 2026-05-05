const axios = require('axios');

// Using the provided DeepSeek API key natively
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

async function chatWithAgent(message, metrics = null) {
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'YOUR_DEEPSEEK_API_KEY_HERE') {
        return "⚠️ DeepSeek API Key is missing. I cannot process this request.";
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

    try {
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: 'deepseek-reasoner', // The ultimate high-reasoning model
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0].message.content;
        if (!content) throw new Error("Model returned empty response payload");
        return content;

    } catch (error) {
        console.error(`[AI Engine] DeepSeek API failed:`, error.response?.data?.error?.message || error.message);
        const errObj = error.response?.data?.error;
        const msg = errObj ? errObj.message : error.message || "Unknown error";
        return `❌ AI Core Offline: DeepSeek API failure. Last error: ${msg}`;
    }
}

// Backwards compatibility for the original Telegram /report command
async function analyzeSiteHealth(metrics) {
    return await chatWithAgent("Please generate a short, professional debugging report based on the current site metrics.", metrics);
}

module.exports = { analyzeSiteHealth, chatWithAgent };
