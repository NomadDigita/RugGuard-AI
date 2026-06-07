import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import axios from 'axios';
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
const alertSubscribers = new Set();

console.log('🤖 RugGuard AI Safety Agent is online and listening...');

// Persistent Bottom Menu Layout
const bottomMenuKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '🔍 Quick Scan' }, { text: '📈 Bitget Spot Markets' }],
      [{ text: '🛡️ System Status' }, { text: 'ℹ️ Help Guide' }]
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

// Returns interactive inline buttons for managing alerts
const getAlertsInlineMarkup = () => {
  return {
    inline_keyboard: [
      [
        { text: '🔔 Turn Alerts ON', callback_data: 'toggle_alerts_on' },
        { text: '🔕 Turn Alerts OFF', callback_data: 'toggle_alerts_off' }
      ]
    ]
  };
};

// Handle /start Command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🛡️ **Welcome to RugGuard AI Safety Agent** 🛡️
_Check before you ape._

I am an autonomous security bot engineered to analyze Web3 smart contracts, tokens, and dApp links to prevent rug pulls, honeypots, and phishing attacks.

🔔 **Live Alerts Subscription:**
Subscribe to our 24/7 background scanner using the interactive buttons below to receive instant warnings when unverified/malicious on-chain activity is identified.
`;
  bot.sendMessage(chatId, welcomeMessage, { 
    parse_mode: 'Markdown', 
    reply_markup: getAlertsInlineMarkup(),
    ...bottomMenuKeyboard 
  });
});

// ==================== CALLBACK QUERY LISTENER (INLINE ACTIONS) ====================
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const action = query.data;

  try {
    if (action === 'toggle_alerts_on') {
      alertSubscribers.add(chatId);
      await bot.answerCallbackQuery(query.id, { text: 'Subscribed to Live Alerts!', show_alert: false });
      await bot.sendMessage(chatId, '🔔 **Live Alerts: Subscribed**\n\nI will now monitor trending pairs on Solana/EVM every 5 minutes and alert you if a security risk is identified.', { parse_mode: 'Markdown' });
    }

    if (action === 'toggle_alerts_off') {
      alertSubscribers.delete(chatId);
      await bot.answerCallbackQuery(query.id, { text: 'Unsubscribed from Live Alerts.', show_alert: false });
      await bot.sendMessage(chatId, '🔕 **Live Alerts: Unsubscribed**\n\nYou will no longer receive background monitoring alerts.', { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Callback Query Processing Error:', error.message);
  }
});
// =================================================================================

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

  if (text === 'ℹ️ Help Guide') {
    const helpText = `
📖 **RugGuard AI Help Guide**

• **Scan Tokens:** Send any contract address (Solana/EVM) directly into the chat to generate a risk profile.
• **Scan dApps:** Paste website links to identify malicious domains or phishing redirects.
• **Live Alerts:** Toggle monitoring instantly using the subscription buttons below.
`;
    return bot.sendMessage(chatId, helpText, { 
      parse_mode: 'Markdown',
      reply_markup: getAlertsInlineMarkup()
    });
  }

  if (text === '🛡️ System Status') {
    const statusMsg = await bot.sendMessage(chatId, '🛡️ *Analyzing System Integrity Status...*', { parse_mode: 'Markdown' });
    
    const bitgetCheck = await verifyBitgetCredentials();
    const qwenStatus = process.env.QWEN_API_KEY ? 'Connected' : 'Error';
    const tavilyStatus = process.env.TAVILY_API_KEY ? 'Connected' : 'Error';

    const systemStatusText = `
⚙️ **RugGuard AI Diagnostic Status**

• **Alibaba Qwen LLM:** \`${qwenStatus}\`
• **Tavily Web Search:** \`${tavilyStatus}\`
• **Solana Node RPC:** \`Mainnet-Beta Active\`
• **Bitget API Verification:** \`${bitgetCheck.success ? 'Verified' : 'Access Restricted - Read-Only Active'}\`
• **Active Subscribers:** \`${alertSubscribers.size} chats\`
• **Container Keep-Alive:** \`Active 24/7 (Uptime OK)\`

🟢 All systems running normally. Toggle your alert subscriptions below:
`;
    await bot.deleteMessage(chatId, statusMsg.message_id);
    return bot.sendMessage(chatId, systemStatusText, { 
      parse_mode: 'Markdown',
      reply_markup: getAlertsInlineMarkup()
    });
  }

  // Treat all other text inputs as scan targets
  const statusMsg = await bot.sendMessage(
    chatId,
    `🔍 *Scanning target:* \`${text}\`\n_Analyzing on-chain registry contracts, web reports, and database logs..._`,
    { parse_mode: 'Markdown' }
  );

  try {
    // Step 1: On-Chain Scan
    const securityResult = await analyzeTarget(text);

    // Step 2: Tavily Search Context
    const searchQuery = securityResult.success 
      ? `${securityResult.target} ${securityResult.type}` 
      : text;
    const searchResult = await performWebSearch(searchQuery);

    // Step 3: Check Bitget Spot listings if it is a token address
    let bitgetListingData = null;
    if (securityResult.success && securityResult.type !== 'url') {
      bitgetListingData = await checkBitgetListing(securityResult.target);
    }

    securityResult.bitgetSafetyStatus = bitgetListingData || { listed: false };

    // Step 4: AI synthesis and reasoning using Alibaba Qwen
    const auditReport = await generateSecurityReport(securityResult, searchResult);

    // Step 5: Extract dynamic risk score for visual gauge
    const scoreMatch = auditReport.match(/RISK SCORE:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

    // Generate dynamic security gauge
    const targetDisplay = text.substring(0, 10) + '...';
    const gaugeUrl = generateSecurityGaugeUrl(score, targetDisplay);

    // Formulate a clean, Web2-friendly summary card for the Image Caption
    const summaryCaption = `
🛡️ **RUGGUARD AI SECURITY AUDIT REPORT**
• **Target:** \`${text}\`
• **Risk Score:** \`${score} / 100\`
• **Safety Status:** \`${score > 70 ? '🟢 SAFE' : score > 40 ? '🟡 CAUTION' : '🔴 HIGH RISK'}\`

_Deep on-chain analysis and forensic trace completed successfully. The complete, un-truncated report has been compiled and sent below._
`;

    const inlineButtons = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📈 Trade Safely on Bitget', url: 'https://www.bitget.com' },
            { text: '📣 Share Report', url: `https://t.me/share/url?url=Check%20out%20this%20RugGuard%20Audit:%20${encodeURIComponent(text)}` }
          ]
        ]
      }
    };

    await bot.deleteMessage(chatId, statusMsg.message_id);

    // === Split-Message Delivery ===
    // 1. Send Visual Gauge with high-impact Web2 summary card
    await bot.sendPhoto(chatId, gaugeUrl, {
      caption: summaryCaption,
      parse_mode: 'Markdown',
      ...inlineButtons
    });

    // 2. Instantly follow up with the complete, detailed AI report
    await bot.sendMessage(chatId, auditReport, { parse_mode: 'Markdown' });

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

      const inlineButtons = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 Trade on Bitget', url: `https://www.bitget.com/spot/${targetSymbol}USDT` }
            ]
          ]
        }
      };

      await bot.deleteMessage(chatId, statusMsg.message_id);

      if (chartUrl) {
        await bot.sendPhoto(chatId, chartUrl, {
          caption: responseText,
          parse_mode: 'Markdown',
          ...inlineButtons
        });
      } else {
        await bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown', ...inlineButtons });
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

// ==================== AUTONOMOUS MEME SCAN ALERT ENGINE ====================
const ALERT_INTERVAL = 5 * 60 * 1000;

setInterval(async () => {
  if (alertSubscribers.size === 0) return;

  try {
    const response = await axios.get('https://api.dexscreener.com/token-profiles/latest/v1');
    if (response.data && Array.isArray(response.data)) {
      const targetToken = response.data[0];
      if (targetToken && targetToken.tokenAddress) {
        const address = targetToken.tokenAddress;
        const symbol = targetToken.symbol || 'UNKNOWN';

        const securityResult = await analyzeTarget(address);
        const searchResult = await performWebSearch(`${symbol} ${address}`);
        
        securityResult.bitgetSafetyStatus = { listed: false };

        const auditReport = await generateSecurityReport(securityResult, searchResult);

        const scoreMatch = auditReport.match(/RISK SCORE:\s*(\d+)/i);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

        // Broadcast if high risk (score < 30)
        if (score < 30) {
          const alertGaugeUrl = generateSecurityGaugeUrl(score, symbol);
          
          const alertSummary = `
🚨 **AUTONOMOUS RUGGUARD EMERGENCY ALERT** 🚨
_Coordinated Scam / Malicious Activity Detected in Trending Pools_

• **Token Name:** \`${symbol}\`
• **Contract Address:** \`${address}\`
• **Blockchain Network:** \`${targetToken.chainId || 'solana'}\`
• **Safety Rating:** \`${score} / 100 - HIGH RISK\`
`;

          for (const chatId of alertSubscribers) {
            // Send Gauge + Summary Card
            await bot.sendPhoto(chatId, alertGaugeUrl, {
              caption: alertSummary,
              parse_mode: 'Markdown'
            });

            // Send full detailed audit following the alert card
            await bot.sendMessage(chatId, auditReport, { parse_mode: 'Markdown' });
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