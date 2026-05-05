const axios = require('axios');
require('dotenv').config();

const TARGET_URL = process.env.TARGET_URL || 'https://www.ovalpalaceresort.com';

async function checkSiteHealth() {
    const startTime = Date.now();
    try {
        const response = await axios.get(TARGET_URL, {
            headers: { 'Cache-Control': 'no-cache' },
            timeout: 10000 // 10 second timeout
        });
        const endTime = Date.now();
        
        // Deep Debugging & Vulnerability Analysis
        const headers = response.headers;
        const securityReport = {
            hasHSTS: !!headers['strict-transport-security'],
            hasXFrameOptions: !!headers['x-frame-options'],
            hasCSP: !!headers['content-security-policy'],
            isHttps: TARGET_URL.startsWith('https://')
        };
        
        // Measure Payload Size in KB
        const payloadSizeKB = response.data ? (Buffer.byteLength(response.data, 'utf8') / 1024).toFixed(2) : 0;

        let vulnerabilityWarnings = [];
        if (!securityReport.hasHSTS) vulnerabilityWarnings.push("Missing HSTS (Strict-Transport-Security)");
        if (!securityReport.hasXFrameOptions) vulnerabilityWarnings.push("Missing X-Frame-Options (Clickjacking vulnerability)");
        if (!securityReport.hasCSP) vulnerabilityWarnings.push("Missing Content-Security-Policy (XSS vulnerability)");
        if (payloadSizeKB > 2000) vulnerabilityWarnings.push(`Heavy HTML Payload (${payloadSizeKB}KB) - Optimize immediately`);

        return {
            status: response.status,
            responseTime: endTime - startTime,
            url: TARGET_URL,
            payloadSizeKB: payloadSizeKB,
            vulnerabilities: vulnerabilityWarnings.length > 0 ? vulnerabilityWarnings : ["No severe vulnerabilities detected"],
            error: null
        };
    } catch (error) {
        return {
            status: error.response ? error.response.status : 'Network Error',
            responseTime: Date.now() - startTime,
            url: TARGET_URL,
            vulnerabilities: ["Failed to scan site"],
            error: error.message
        };
    }
}

module.exports = { checkSiteHealth };
