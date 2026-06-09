# RugGuard AI — AI-Powered Web3 Safety Agent

> "Check before you ape."

RugGuard AI is an autonomous, on-chain security agent and forensic tracing system packaged as an interactive Telegram Bot. Built for the Bitget AI Base Camp Hackathon S1, it provides instant contract audits, developer genesis funding tracking, Sybil scam cluster identification, cabal ring centralization checks, and live Bitget Spot market utility integrations.

---

## ⚙️ Core Architecture & Features

### 1. Multi-Chain Smart Contract Audit Router
*   Dynamically parses input strings (Web URLs, EVM addresses, Solana mint addresses).
*   Automatically routes queries to official GoPlus chain IDs (Ethereum, BSC, Base, Solana) to perform live on-chain security analysis (mintability, freeze authority, honeypot tests).

### 2. Developer On-Chain Genesis Forensics
*   Queries the live blockchain RPC (leveraging custom Helius Mainnet integration) to extract the transaction history of the creator's wallet.
*   Traces back to identify the **Genesis Funding Source**—discovering which wallet originally funded the creator's address.

### 3. Sybil Scam Cluster Detector (Fingerprinting)
*   Scans whether the developer's genesis funding wallet has sent seed funds to other active wallets on-chain.
*   Maps and displays a **"Sybil Scam Cluster"** to expose coordinated scam rings launched by the same entity, even if they use different addresses and names.

### 4. Cabal Ring & Insider Centralization Signal
*   Performs automated behavioral analysis on the token's top holders array.
*   Calculates a **Cabal Centralization Index** to identify if the supply has been secretly pre-distributed to alt-wallets for a coordinated developer dump.

### 5. Bitget Institutional Safety & Fee-Savings Card
*   If the token is vetted and listed on Bitget, the bot dynamically calculates the **Bitget Institutional Advantage**.
*   Shows a visual fee-savings card, proving the financial benefit of trading on Bitget’s zero-MEV, zero-exploit custodial platform compared to decentralized routers (Uniswap, Raydium).

### 6. Dynamic Graphic Assets
*   **Safety Gauge Dials:** Renders custom dark-themed radial progress dials showing the calculated risk score (0-100) using the QuickChart API.
*   **Bitget Live Candlestick Charts:** Fetches 12-hour candlestick klines directly from Bitget's public v2 REST endpoints and plots custom branded line charts.

### 7. Autonomous Meme Scan Alert Engine
*   Includes a background scanner running every 5 minutes that pulls trending token profiles across multiple chains.
*   Performs audits in the background and broadcasts high-confidence emergency alerts (Risk Score < 15) to subscribed users.
*   Includes **subscribers.json** local file system persistence to preserve subscription lists across container reboots on Render.

---

## 🛠️ Tech Stack

*   **Runtime:** Node.js (ES Modules configuration)
*   **Reasoning Engine:** Alibaba Qwen-Plus (Model Studio Gateway)
*   **Search Context:** Tavily Search Advanced API
*   **On-Chain Metadata:** GoPlus Security API
*   **Market Data:** Bitget Spot Market REST APIs
*   **Blockchain Node Access:** Solana JSON-RPC (Mainnet-Beta) via Helius API Key
*   **Visualization:** QuickChart.io (Chart.js canvas generator)
*   **Bot Framework:** node-telegram-bot-api

---

## 📥 Local Installation & Setup

### 1. Clone and Initialize

    # Clone the repository
    git clone https://github.com/Ismmusbaudeen/RugGuard-AI.git
    cd RugGuard-AI

    # Install production dependencies
    npm install

### 2. Configure Environment Variables

Create a .env file in the root directory:

    # Alibaba Qwen Configuration (Singapore International Node)
    QWEN_API_KEY=your_qwen_api_key_here
    QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1

    # Tavily Search API
    TAVILY_API_KEY=your_tavily_key_here

    # Telegram Bot configuration
    TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

    # Bitget API configurations (Required for administrative validation tests)
    BITGET_API_KEY=your_bitget_api_key
    BITGET_SECRET_KEY=your_bitget_secret_key
    BITGET_PASSPHRASE=your_bitget_passphrase

    # Solana Custom RPC Endpoint (Helius/Quicknode) to bypass rate limits
    SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_key_here

    # Render Deployment Parameter (Required for Self-Pinging Keep-Alive)
    RENDER_EXTERNAL_URL=https://your-service-name.onrender.com

### 3. Run the Bot

    npm start

---

## ☁️ Deploying on Render (24/7 Hosting)

To host the RugGuard AI bot on Render using the free tier without the instance sleeping:

1. Create a new **Web Service** on Render and connect your GitHub repository.
2. Set the deployment properties:
    *   **Runtime:** Node
    *   **Build Command:** npm install
    *   **Start Command:** npm start
    *   **Region:** Select Frankfurt or Singapore (crucial to avoid US IP bans on Bitget's endpoints).
3. Go to the Environment tab on Render and paste all your .env key-value pairs. Make sure to define your active Render URL as RENDER_EXTERNAL_URL.
4. To ensure the bot never sleeps, register a free keep-alive cron job on **cron-job.org** to ping your RENDER_EXTERNAL_URL every 10 minutes.

---

## 🎮 Interface & Navigation Guide

RugGuard AI features a highly polished user experience modeled after premium algorithmic trading bots:

*   **Persistent Navigation Keyboard:** The bottom menu contains quick-action buttons for rapid navigation (🔍 Quick Scan, 📈 Bitget Spot Markets, 🛡️ System Status, ℹ️ Help Guide).
*   **Unified Alert Toggles:** Users can subscribe/unsubscribe to the 24/7 autonomous scanning channel directly from the persistent bottom keyboard.
*   **Fail-Safe Chunk Delivery:** If Qwen's on-chain analysis exceeds the 4,096-character limit, RugGuard splits and delivers the audit report cleanly across multiple messages without dropping critical data.