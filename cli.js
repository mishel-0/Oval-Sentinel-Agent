#!/usr/bin/env node
require('dotenv').config();
const readline = require('readline');
const { chatWithAgent } = require('./ai');
const { checkSiteHealth } = require('./monitor');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// ANSI Colors for Terminal
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const reset = '\x1b[0m';
const bold = '\x1b[1m';

console.log(`${cyan}${bold}===========================================${reset}`);
console.log(`${cyan}${bold}   OVAL SENTINEL - LOCAL CLI CONSOLE   ${reset}`);
console.log(`${cyan}${bold}===========================================${reset}`);
console.log(`${yellow}Initializing diagnostic systems...${reset}`);

async function startCli() {
    try {
        const metrics = await checkSiteHealth();
        if (metrics.error) {
            console.log(`${red}Target Offline: ${metrics.url} (${metrics.error})${reset}\n`);
        } else {
            console.log(`${green}System Online. Target: ${metrics.url} [HTTP ${metrics.status}]${reset}\n`);
        }
    } catch (e) {
        console.log(`${red}Failed to run initial diagnostic: ${e.message}${reset}\n`);
    }

    console.log(`Type your command. (Type ${yellow}'exit'${reset} or ${yellow}'quit'${reset} to close)\n`);

    const askQuestion = () => {
        rl.question(`${cyan}You >${reset} `, async (input) => {
            const cmd = input.trim();
            if (cmd.toLowerCase() === 'exit' || cmd.toLowerCase() === 'quit') {
                console.log(`${yellow}Shutting down Sentinel CLI... Goodbye.${reset}`);
                rl.close();
                process.exit(0);
            }

            if (!cmd) {
                askQuestion();
                return;
            }

            process.stdout.write(`${yellow}Sentinel is thinking...${reset}\r`);
            
            try {
                // Fetch fresh metrics for context
                const currentMetrics = await checkSiteHealth();
                const reply = await chatWithAgent(cmd, currentMetrics);
                
                // Clear the "thinking" line
                process.stdout.write('\x1b[2K\r');
                console.log(`${green}${bold}Sentinel:${reset}\n${reply}\n`);
            } catch (err) {
                process.stdout.write('\x1b[2K\r');
                console.log(`${red}Sentinel Error:${reset} ${err.message}\n`);
            }
            
            askQuestion();
        });
    };

    askQuestion();
}

startCli();
