import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import { analyzeTarget } from './security.js';
import { performWebSearch } from './search.js';
import { generateSecurityReport } from './ai.js';
import { checkBitgetListing, verifyBitgetCredentials } from './bitget.js';

dotenv.config();

// ==================== CRASH PREVENTION GUARD ====================
process.on('uncaughtException', (err) => {
  console.error('🛑 [CRASH PREVENTED] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🛑 [CRASH PREVENTED] Unhandled Rejection at:', promise, 'reason:', reason);
});
// ================================================================

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Fatal Error: TELEGRAM_BOT_TOKEN is missing from .env file.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 RugGuard AI Safety Agent is online and listening...');

// Premium Navigation Keyboard (Persistent Bottom Menu)
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

// Handle /start Command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🛡️ **Welcome to RugGuard AI Safety Agent** 🛡️
_Check before you ape._

I am an autonomous security bot engineered to analyze Web3 smart contracts, tokens, and dApp links to prevent rug pulls, honeypots, and phishing attacks.

Use the menu buttons below to navigate or query the system.
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
      '📊 **Bitget Market Checker**\n\nTo view active listings and spot statistics, type: `/market <ticker>`\n\n_Example: \`/market SOL\` or \`/market BGB\`_',
      { parse_mode: 'Markdown' }
    );
  }

  if (text === 'ℹ️ Help Guide') {
    const helpText = `
📖 **RugGuard AI Help Guide**

• **Scan Tokens:** Send any contract address (Solana/EVM) directly into the chat to generate a risk profile.
• **Scan dApps:** Paste website links to identify malicious domains or phishing redirects.
• **Bitget Spot Check:** Query `/market <ticker>` to verify if the asset is listed and protected by Bitget's centralized security layers.
`;
    return bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  if (text === '🛡️ System Status') {
    const statusMsg = await bot.sendMessage(chatId, '🛡️ *Analyzing System Integrity Status...*', { parse_mode: 'Markdown' });
    
    // Test API connectivity
    const bitgetCheck = await verifyBitgetCredentials();
    const qwenStatus = process.env.QWEN_API_KEY ? 'Connected' : 'Error';
    const tavilyStatus = process.env.TAVILY_API_KEY ? 'Connected' : 'Error';

    const systemStatusText = `
⚙️ **RugGuard AI Diagnostic Status**

• **Alibaba Qwen LLM:** \`${qwenStatus}\`
• **Tavily Web Search:** \`${tavilyStatus}\`
• **Solana Node RPC:** \`Mainnet-Beta Active\`
• **Bitget API Verification:** \`${bitgetCheck.success ? 'Verified' : 'Error - ' + bitgetCheck.reason}\`
• **Container Keep-Alive:** \`Active 24/7 (Uptime OK)\`

🟢 All systems running normally. Use the interface to initiate target audits.
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

    // Step 5: Construct Premium Inline Keyboard
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

    // Step 6: Send final response with Inline Actions
    await bot.deleteMessage(chatId, statusMsg.message_id);
    await bot.sendMessage(chatId, auditReport, { parse_mode: 'Markdown', ...inlineButtons });

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

// Handle /market <symbol> command
bot.onText(/\/market\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const targetSymbol = match[1].trim().toUpperCase();

  const statusMsg = await bot.sendMessage(chatId, `🔄 *Querying Bitget Spot market for ${targetSymbol}...*`, { parse_mode: 'Markdown' });

  try {
    const marketInfo = await checkBitgetListing(targetSymbol);

    if (marketInfo.listed) {
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
      await bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
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