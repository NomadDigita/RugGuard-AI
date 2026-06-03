import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import { analyzeTarget } from './security.js';
import { performWebSearch } from './search.js';
import { generateSecurityReport } from './ai.js';
import { checkBitgetListing, verifyBitgetCredentials } from './bitget.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Fatal Error: TELEGRAM_BOT_TOKEN is missing from .env file.');
  process.exit(1);
}

// Initialize Telegram Bot in Polling Mode
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 RugGuard AI Safety Agent is online and listening...');

// Check and output API status check upon boot
verifyBitgetCredentials().then(result => {
  if (result.success) {
    console.log('✅ Bitget API Connection: Verified & Active.');
  } else {
    console.warn(`⚠️ Bitget API Setup Warning: ${result.reason}`);
  }
});

// ==================== RENDER ALIVE ENGINE ====================

const PORT = process.env.PORT || 8080;

// Create a simple HTTP health check server for Render
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('RugGuard AI is running and active.');
});

server.listen(PORT, () => {
  console.log(`📡 Health Check Server running on port ${PORT}`);
});

// Self-ping loop (triggers every 10 minutes)
const pingInterval = 10 * 60 * 1000; // 10 minutes
setInterval(() => {
  const selfUrl = process.env.RENDER_EXTERNAL_URL;
  if (selfUrl) {
    https.get(selfUrl, (res) => {
      console.log(`🔄 Self-ping sent to ${selfUrl} - Status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error(`⚠️ Self-ping failed: ${err.message}`);
    });
  } else {
    console.log('ℹ️ Self-ping skipped: RENDER_EXTERNAL_URL is not configured in environment.');
  }
}, pingInterval);

// =============================================================

// Handle /start Command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🛡️ **Welcome to RugGuard AI Safety Agent** 🛡️
_Check before you ape._

I am an autonomous security bot engineered to analyze Web3 smart contracts, tokens, and dApp links to prevent rug pulls, honeypots, and phishing attacks.

📥 **How to use:**
Simply send me:
• A **Solana contract address** (mint)
• An **Ethereum/EVM contract address**
• A **website URL / dApp link**

📊 **Market Check:**
Use \`/market <symbol>\` (e.g., \`/market SOL\` or \`/market BTC\`) to fetch live pricing and safety listings directly on Bitget.

_Powered by Alibaba Qwen, Tavily, and Bitget AI Team._
`;
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
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

// Handle incoming query messages (scans)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  // Skip command structures
  if (!text || text.startsWith('/')) return;

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

    // Append Bitget safety context directly to the security data structure
    securityResult.bitgetSafetyStatus = bitgetListingData || { listed: false };

    // Step 4: AI synthesis and reasoning using Alibaba Qwen
    const auditReport = await generateSecurityReport(securityResult, searchResult);

    // Step 5: Send final response to the user
    await bot.deleteMessage(chatId, statusMsg.message_id);
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