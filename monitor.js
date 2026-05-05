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
        
        return {
            status: response.status,
            responseTime: endTime - startTime,
            url: TARGET_URL,
            error: null
        };
    } catch (error) {
        return {
            status: error.response ? error.response.status : 'Network Error',
            responseTime: Date.now() - startTime,
            url: TARGET_URL,
            error: error.message
        };
    }
}

module.exports = { checkSiteHealth };
