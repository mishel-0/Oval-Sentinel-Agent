// Initialize Lucide icons
lucide.createIcons();

const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const refreshBtn = document.getElementById('refreshBtn');

// UI Elements for Status
const httpStatus = document.getElementById('httpStatus');
const latencyValue = document.getElementById('latencyValue');
const telegramStatus = document.getElementById('telegramStatus');

// Add a message to the chat UI
function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    let icon = role === 'agent' ? 'cpu' : 'user';
    
    // Parse simple markdown (bold)
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

    msgDiv.innerHTML = `
        <div class="avatar"><i data-lucide="${icon}"></i></div>
        <div class="bubble">${formattedText}</div>
    `;
    
    chatWindow.appendChild(msgDiv);
    lucide.createIcons();
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Send message to Backend API
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';
    
    // Add loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = `message agent`;
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = `
        <div class="avatar"><i data-lucide="loader" class="pulse"></i></div>
        <div class="bubble">...</div>
    `;
    chatWindow.appendChild(loadingDiv);
    lucide.createIcons();
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        
        const data = await response.json();
        document.getElementById(loadingId).remove();
        appendMessage('agent', data.reply);
        
        // If the user asked for a report/status, refresh the sidebar metrics automatically
        if (text.toLowerCase().includes('status') || text.toLowerCase().includes('report')) {
            fetchStatus();
        }

    } catch (error) {
        document.getElementById(loadingId).remove();
        appendMessage('agent', '❌ Connection to the backend server failed.');
    }
}

// Fetch live metrics from Backend API
async function fetchStatus() {
    httpStatus.className = 'metric-value status-indicator loading';
    httpStatus.textContent = 'Checking...';
    latencyValue.textContent = '-- ms';
    
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        if (data.status === 200) {
            httpStatus.className = 'metric-value status-indicator online';
            httpStatus.textContent = 'Online (200 OK)';
        } else {
            httpStatus.className = 'metric-value status-indicator offline';
            httpStatus.textContent = `Error (${data.status})`;
        }
        
        latencyValue.textContent = `${data.responseTime} ms`;
        
        // Fetch Telegram Status
        try {
            const tgRes = await fetch('/api/bot-status');
            const tgData = await tgRes.json();
            if (tgData.active) {
                telegramStatus.className = 'metric-value status-indicator online';
                telegramStatus.textContent = 'Connected';
            } else {
                telegramStatus.className = 'metric-value status-indicator offline';
                if (tgData.tokenLength === 0) {
                    telegramStatus.textContent = 'Token Missing (Len: 0)';
                } else {
                    telegramStatus.textContent = `Error (Token: ${tgData.tokenPreview} L:${tgData.tokenLength})`;
                }
            }
        } catch (e) {
            telegramStatus.className = 'metric-value status-indicator offline';
            telegramStatus.textContent = 'API Error';
        }

    } catch (error) {
        httpStatus.className = 'metric-value status-indicator offline';
        httpStatus.textContent = 'Agent Offline';
    }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
refreshBtn.addEventListener('click', fetchStatus);

// Initial Load
fetchStatus();
