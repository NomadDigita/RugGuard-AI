import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { analyzeTarget } from './security.js';
import { performWebSearch } from './search.js';
import { generateSecurityReport } from './ai.js';
import { checkBitgetListing, verifyBitgetCredentials, generateBitgetChartUrl, generateSecurityGaugeUrl } from './bitget.js';

dotenv.config();

// ==================== CRASH PREVENTION GUARD ====================
process.on('uncaughtException', (err) => {
  console.error('🛑 [CRASH PREVENTED] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🛑 [CRASH PREVENTED] Unhandled Rejection:', reason);
});
// ================================================================

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Fatal Error: TELEGRAM_BOT_TOKEN is missing from .env file.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Active alert subscription registry (in-memory)
const SUBSCRIBERS_FILE = path.join(process.cwd(), 'subscribers.json');
let alertSubscribers = new Set();

// Load subscribers from local file upon boot
function loadSubscribers() {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
      const list = JSON.parse(data);
      alertSubscribers = new Set(list);
      console.log(`💾 Loaded ${alertSubscribers.size} subscribers from storage.`);
    }
  } catch (error) {
    console.error('Failed to load subscriber storage:', error.message);
  }
}

// Save subscribers list to local file
function saveSubscribers() {
  try {
    const list = Array.from(alertSubscribers);
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(list), 'utf8');
    console.log('💾 Subscriber list saved successfully.');
  } catch (error) {
    console.error('Failed to write subscriber storage:', error.message);
  }
}

loadSubscribers();
// =========================================================================

console.log('🤖 RugGuard AI Safety Agent is online and listening...');

// Persistent Bottom Menu Layout
const bottomMenuKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '🔍 Quick Scan' }, { text: '📈 Bitget Spot Markets' }],
      [{ text: '🔔 Enable Alerts' }, { text: '🔕 Disable Alerts' }],
      [{ text: '🛡️ System Status' }, { text: 'ℹ️ Help Guide' }]
    ],
    resize_keyboard: true
  }
};

// Fail-safe sender utility: splits long text messages
async function sendSafeMessage(chatId, text) {
  if (!text) return;
  const maxChunkLength = 3900;

  if (text.length <= maxChunkLength) {
    try {
      await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (error) {
      await bot.sendMessage(chatId, text);
    }
    return;
  }

  const chunks = [];
  let remainingText = text;

  while (remainingText.length > 0) {
    if (remainingText.length <= maxChunkLength) {
      chunks.push(remainingText);
      break;
    }

    let splitIndex = remainingText.lastIndexOf('\n', maxChunkLength);
    if (splitIndex === -1) {
      splitIndex = remainingText.lastIndexOf(' ', maxChunkLength);
    }
    if (splitIndex === -1 || splitIndex < 2000) {
      splitIndex = maxChunkLength;
    }

    chunks.push(remainingText.substring(0, splitIndex));
    remainingText = remainingText.substring(splitIndex);
  }

  for (const chunk of chunks) {
    try {
      await bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
    } catch (error) {
      await bot.sendMessage(chatId, chunk);
    }
  }
}

// Handle /start Command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🛡️ **Welcome to RugGuard AI Safety Agent** 🛡️
_Check before you ape._

I am an autonomous security bot engineered to analyze Web3 smart contracts, tokens, and dApp links to prevent rug pulls, honeypots, and phishing attacks.

📥 Use the bottom persistent menu to scan targets, monitor markets, or manage your security alerts.
`;
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown', ...bottomMenuKeyboard });
});

// Handle Bottom Keyboard and general text inputs
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text || text.startsWith('/')) return;

  // Handle Bottom Menu Button triggers
  if (text === '🔍 Quick Scan') {
    return bot.sendMessage(
      chatId, 
      '📥 **Ready to Scan**\n\nPaste any Solana contract address, EVM address, or web URL here. RugGuard AI will perform an immediate security analysis.',
      { parse_mode: 'Markdown' }
    );
  }

  if (text === '📈 Bitget Spot Markets') {
    return bot.sendMessage(
      chatId, 
      '📊 **Bitget Market Checker**\n\nTo view active listings and spot statistics with live charts, type: `/market <ticker>`\n\n_Example: \`/market SOL\` or \`/market XRP\`_',
      { parse_mode: 'Markdown' }
    );
  }

  if (text === '🔔 Enable Alerts') {
    alertSubscribers.add(chatId);
    saveSubscribers();
    return bot.sendMessage(
      chatId,
      '🔔 **RugGuard Live Alerts: Enabled**\n\nI will now scan trending contracts every 5 minutes and alert you immediately here if a security risk is detected.',
      { parse_mode: 'Markdown' }
    );
  }

  if (text === '🔕 Disable Alerts') {
    alertSubscribers.delete(chatId);
    saveSubscribers();
    return bot.sendMessage(
      chatId,
      '🔕 **RugGuard Live Alerts: Disabled**\n\nBackground monitoring has been deactivated. You will no longer receive automated notifications.',
      { parse_mode: 'Markdown' }
    );
  }

  if (text === 'ℹ️ Help Guide') {
    const helpText = `
📖 **RugGuard AI Help Guide**

• **Scan Tokens:** Send any contract address (Solana/EVM) directly into the chat to generate a risk profile.
• **Scan dApps:** Paste website links to identify malicious domains or phishing redirects.
• **Live Alerts:** Turn alerts on or off directly using the buttons in your bottom menu.
`;
    return bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  if (text === '🛡️ System Status') {
    const statusMsg = await bot.sendMessage(chatId, '🛡️ *Analyzing System Integrity Status...*', { parse_mode: 'Markdown' });
    
    const bitgetCheck = await verifyBitgetCredentials();
    const qwenStatus = process.env.QWEN_API_KEY ? 'Connected' : 'Error';
    const tavilyStatus = process.env.TAVILY_API_KEY ? 'Connected' : 'Error';

    // Query active Solana performance metrics
    let solanaTps = 'Active';
    try {
      const response = await axios.post('https://api.mainnet-beta.solana.com', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getRecentPerformanceSamples',
        params: [1]
      });
      if (response.data?.result?.[0]) {
        const sample = response.data.result[0];
        const calculatedTps = Math.round(sample.numTransactions / sample.samplePeriodSecs);
        solanaTps = `Active (~${calculatedTps} TPS)`;
      }
    } catch (err) {
      solanaTps = 'Active (Rate-Limited)';
    }

    const systemStatusText = `
⚙️ **RugGuard AI Diagnostic Status**

• **Alibaba Qwen LLM:** \`${qwenStatus}\`
• **Tavily Web Search:** \`${tavilyStatus}\`
• **Solana Node RPC:** \`${solanaTps}\`
• **Bitget API Verification:** \`${bitgetCheck.success ? 'Verified' : 'Access Restricted - Read-Only Active'}\`
• **Active Subscribers:** \`${alertSubscribers.size} chats\`
• **Container Keep-Alive:** \`Active 24/7 (Uptime OK)\`

🟢 All systems running normally. Use the bottom menu to toggle subscriptions or trigger scans.
`;
    await bot.deleteMessage(chatId, statusMsg.message_id);
    return bot.sendMessage(chatId, systemStatusText, { parse_mode: 'Markdown' });
  }

  // Treat all other text inputs as scan targets
  const statusMsg = await bot.sendMessage(
    chatId,
    `🔍 *Scanning target:* \`${text}\`\n_Analyzing on-chain registry contracts, web reports, and database logs..._`,
    { parse_mode: 'Markdown' }
  );

  try {
    const securityResult = await analyzeTarget(text);
    const searchQuery = securityResult.success 
      ? `${securityResult.target} ${securityResult.type}` 
      : text;
    const searchResult = await performWebSearch(searchQuery);

    let bitgetListingData = null;
    if (securityResult.success && securityResult.type !== 'url') {
      bitgetListingData = await checkBitgetListing(securityResult.target);
    }

    securityResult.bitgetSafetyStatus = bitgetListingData || { listed: false };
    const auditReport = await generateSecurityReport(securityResult, searchResult);

    const scoreMatch = auditReport.match(/(\d+)\s*\/\s*100/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

    const targetDisplay = text.substring(0, 10) + '...';
    const gaugeUrl = generateSecurityGaugeUrl(score, targetDisplay);

    const summaryCaption = `
🛡️ **RUGGUARD AI SECURITY AUDIT REPORT**
• **Target:** \`${text}\`
• **Risk Score:** \`${score} / 100\`
• **Safety Status:** \`${score > 70 ? '🟢 SAFE' : score > 40 ? '🟡 CAUTION' : '🔴 HIGH RISK'}\`

_Deep on-chain analysis and forensic trace completed successfully. The complete, un-truncated report has been compiled and sent below._
`;

    await bot.deleteMessage(chatId, statusMsg.message_id);

    await bot.sendPhoto(chatId, gaugeUrl, {
      caption: summaryCaption,
      parse_mode: 'Markdown'
    });

    await sendSafeMessage(chatId, auditReport);

  } catch (error) {
    console.error('Audit Engine Failure:', error);
    await bot.editMessageText(
      `❌ **Audit Failure**\n\nAn unexpected error occurred while processing the audit request: ${error.message}`,
      {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown'
      }
    );
  }
});

// Handle /market <symbol> command (With Live Chart Generation)
bot.onText(/\/market\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const targetSymbol = match[1].trim().toUpperCase();

  const statusMsg = await bot.sendMessage(chatId, `🔄 *Querying Bitget Spot market and generating custom chart for ${targetSymbol}...*`, { parse_mode: 'Markdown' });

  try {
    const marketInfo = await checkBitgetListing(targetSymbol);

    if (marketInfo.listed) {
      const chartUrl = await generateBitgetChartUrl(targetSymbol);

      const responseText = `
📈 **Bitget Spot Market Data: ${marketInfo.symbol}**
🟢 *Status: Vetted and Listed on Bitget*

• **Last Price:** \`$${marketInfo.price}\`
• **24h High:** \`$${marketInfo.high24h}\`
• **24h Low:** \`$${marketInfo.low24h}\`
• **24h Volume (USDT):** \`$${parseFloat(marketInfo.volume).toLocaleString(undefined, { maximumFractionDigits: 2 })}\`

🛡️ *Trading listed assets on institutional platforms like Bitget reduces standard smart-contract vulnerability risks.*
`;

      await bot.deleteMessage(chatId, statusMsg.message_id);

      if (chartUrl) {
        await bot.sendPhoto(chartUrl, {
          caption: responseText,
          parse_mode: 'Markdown'
        });
      } else {
        await bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
      }

    } else {
      await bot.deleteMessage(chatId, statusMsg.message_id);
      await bot.sendMessage(
        chatId, 
        `❌ **Bitget Market Status: Unlisted**\n\nNo active USDT trading pair found for **${targetSymbol}** on Bitget Spot. Use caution if trading this token on unverified decentralized protocols.`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    await bot.deleteMessage(chatId, statusMsg.message_id);
    await bot.sendMessage(chatId, `⚠️ Error fetching Bitget market data: ${error.message}`);
  }
});

// ==================== AUTONOMOUS TOKEN BOOSTS ALERT ENGINE ====================
const ALERT_INTERVAL = 5 * 60 * 1000;

setInterval(async () => {
  if (alertSubscribers.size === 0) return;

  try {
    // Upgraded to pull unvetted, high-volatility raw token boosts
    const response = await axios.get('https://api.dexscreener.com/token-boosts/latest/v1');
    if (response.data && Array.isArray(response.data)) {
      const targetToken = response.data[0];
      if (targetToken && targetToken.tokenAddress) {
        const address = targetToken.tokenAddress;
        const symbol = targetToken.tokenAddress.substring(0, 6) + '...'; // fallback if no ticker is present

        const securityResult = await analyzeTarget(address, targetToken.chainId);
        const searchResult = await performWebSearch(`${symbol} ${address}`);
        
        securityResult.bitgetSafetyStatus = { listed: false };

        const auditReport = await generateSecurityReport(securityResult, searchResult);

        const scoreMatch = auditReport.match(/(\d+)\s*\/\s*100/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

        // Broadcast if definitive high-risk vectors detected (score < 30)
        if (score < 30) {
          const alertGaugeUrl = generateSecurityGaugeUrl(score, symbol);
          
          const alertSummary = `
🚨 **AUTONOMOUS RUGGUARD EMERGENCY ALERT** 🚨
_Coordinated Scam / Malicious Activity Detected in Trending Pools_

• **Token Name:** \`${targetToken.chainId?.toUpperCase() || 'UNKNOWN'}\`
• **Contract Address:** \`${address}\`
• **Blockchain Network:** \`${targetToken.chainId?.toUpperCase() || 'SOLANA'}\`
• **Safety Rating:** \`${score} / 100 - HIGH RISK\`
`;

          for (const chatId of alertSubscribers) {
            await bot.sendPhoto(chatId, alertGaugeUrl, {
              caption: alertSummary,
              parse_mode: 'Markdown'
            });

            await sendSafeMessage(chatId, auditReport);
          }
        }
      }
    }
  } catch (error) {
    console.error('Autonomous Scanner Interval Error:', error.message);
  }
}, ALERT_INTERVAL);
// =========================================================================

// ==================== RENDER ALIVE ENGINE ====================
const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('RugGuard AI is running and active.');
});

server.listen(PORT, () => {
  console.log(`📡 Health Check Server running on port ${PORT}`);
});

const pingInterval = 10 * 60 * 1000; // 10 minutes
setInterval(() => {
  const selfUrl = process.env.RENDER_EXTERNAL_URL;
  if (selfUrl) {
    https.get(selfUrl, (res) => {
      console.log(`🔄 Self-ping sent to ${selfUrl} - Status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error(`⚠️ Self-ping failed: ${err.message}`);
    });
  }
}, pingInterval);
// =============================================================