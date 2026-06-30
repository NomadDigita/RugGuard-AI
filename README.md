<div align="center">

<!-- Auto-playing typing text effect -->
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=600&size=20&duration=3000&pause=1000&color=00FF7F&center=true&vCenter=true&width=600&lines=INITIALIZING+RUGGUARD+SECURE+PROTOCOL...;RUNNING+GENESIS+FORENSICS...;DECRYPTING+SYBIL+SCAM+CLUSTERS...;WELCOME+TO+RUGGUARD+AI." alt="Typing SVG" />
</a>

<!-- Main Banner -->
<img width="1402" height="1122" alt="RugGuard AI Main Dashboard" src="https://github.com/user-attachments/assets/b0ce07ca-1d94-4187-a573-80056efa2a84" />

<br><br>

# 🛡️ RUGGUARD AI
> **Autonomous AI-Powered Web3 Safety Agent, Cryptographic Forensic Tracing System & Telegram Bot**

<br>

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)
![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)
![Alibaba Cloud](https://img.shields.io/badge/Alibaba_Cloud-FF6A00?style=for-the-badge&logo=alibabacloud&logoColor=white)
![Bitget](https://img.shields.io/badge/Bitget-00F0FF?style=for-the-badge&logo=bitcoin&logoColor=black)

</div>

---

<br>

## 🏛️ <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=5000&color=00E5FF&vCenter=true&width=800&lines=System+Architecture+%26+On-Chain+Data+Flow" alt="System Architecture" />

RugGuard AI is an on-chain threat detection bot and forensic transaction analyzer built to streamline risk assessments for decentralized tokens. Designed for the **Bitget AI Base Camp Hackathon S1**, the application operates as an automated Telegram-native security utility. It traces transaction origins, checks contract vulnerabilities, maps Sybil developer rings, and surfaces trading metrics directly from Bitget Spot public APIs.

```text
                                 ┌───────────────────┐
                                 │ Telegram Interface│
                                 └─────────┬_________┘
                                           │
                                           ▼
                            ┌──────────────────────────────┐
                            │ RugGuard Node.js Application │
                            └──────────────┬───────────────┘
                                           │
         ┌─────────────────────────────────┴────────────────────────────────┐
         ▼                                                                  ▼
┌────────────────────────────────┐                                 ┌────────────────────────────────┐
│      Forensic Scan Thread      │                                 │      Market & Chart Thread     │
│ • RPC Genesis Tracker (Helius) │                                 │ • Bitget Spot REST API V2      │
│ • GoPlus Security Audit API    │                                 │ • QuickChart Canvas Engine     │
│ • Downstream Sybil Investigator│                                 │ • Tavily Web Search Fallback   │
└────────────────────────────────┘                                 └────────────────────────────────┘
```

---

<br>

## ⚙️ <img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=600&size=26&pause=5000&color=B026FF&vCenter=true&width=600&lines=Core+Functional+Modules" alt="Core Modules" />

### <img src="https://readme-typing-svg.demolab.com?font=Space+Mono&weight=600&size=18&pause=4000&color=FFD700&vCenter=true&width=500&lines=1.+Multi-Chain+Smart+Contract+Router" alt="Multi-Chain Router" />
Parses input parameters (URLs, EVM contract addresses, Solana mint keys) to identify the target blockchain. The utility routes inquiries to GoPlus endpoints (Ethereum, BNB Chain, Base, Solana) to evaluate high-risk properties:
*   **Mint Checks:** Identifies unauthorized supply expansion flags.
*   **Freezing Analysis:** Flags contract structures holding the capability to freeze balances.
*   **Honeypot Identification:** Checks for sell-restriction parameters.

### <img src="https://readme-typing-svg.demolab.com?font=Space+Mono&weight=600&size=18&pause=4000&color=FF1493&vCenter=true&width=500&lines=2.+Developer+On-Chain+Genesis+Forensics" alt="Genesis Forensics" />
Leverages dedicated Solana RPC nodes (via Helius Mainnet integration) to look up the transaction history of the deployer address. It trace-backs through early-stage transaction ledgers to isolate the **Genesis Funding Source**—discovering the upstream address that originally financed the creator.

### <img src="https://readme-typing-svg.demolab.com?font=Space+Mono&weight=600&size=18&pause=4000&color=1E90FF&vCenter=true&width=500&lines=3.+Sybil+Scam+Cluster+Detector" alt="Sybil Detector" />
Analyzes downstream transactions out of the primary genesis funding wallet. By evaluating transaction targets, the parser maps out coordinate funding structures (the "Sybil Scam Cluster"), highlighting related addresses deployed by the same funding entity.

### <img src="https://readme-typing-svg.demolab.com?font=Space+Mono&weight=600&size=18&pause=4000&color=E0E0E0&vCenter=true&width=500&lines=4.+Cabal+Ring+%26+Insider+Centralization" alt="Cabal Ring" />
Iterates through the top holder registries returned from on-chain queries to assess concentration patterns. It evaluates distribution thresholds and computes a **Cabal Centralization Index** designed to flag structural asset hoarding across secondary accounts.

### <img src="https://readme-typing-svg.demolab.com?font=Space+Mono&weight=600&size=18&pause=4000&color=39FF14&vCenter=true&width=500&lines=5.+Bitget+Safety+%26+Fee-Savings+Integration" alt="Bitget Savings" />
When a scanned asset is identified in Bitget's listed markets, the integration computes comparison indexes outlining institutional custodial benefits:
*   **Fee Structure Comparisons:** Highlights the fee differentials between Bitget Spot executions and standard DEX transactions.
*   **MEV Risk Mitigation:** Notes differences in MEV sandwich exploits and front-running exposures when shifting volume to custodial processing environments.

### <img src="https://readme-typing-svg.demolab.com?font=Space+Mono&weight=600&size=18&pause=4000&color=00FFFF&vCenter=true&width=500&lines=6.+Dynamic+Visualization+Assets" alt="Visualization Engine" />
Uses rendering helper APIs to translate risk outputs and market performance data into clear dashboard-ready formats:
*   **Safety Gauge Dials:** Outputs custom visual charts representing risk evaluations (0–100 scale) using the QuickChart engine.
*   **Bitget Live Candlestick Charts:** Queries 12-hour candlestick profiles from the public Bitget Spot V2 endpoints, returning formatted charting visualizations to the client.

### <img src="https://readme-typing-svg.demolab.com?font=Space+Mono&weight=600&size=18&pause=4000&color=FFA500&vCenter=true&width=500&lines=7.+Autonomous+Scan+Alert+Engine" alt="Alert Engine" />
Runs a 5-minute polling loop parsing active trending tokens on supported platforms. High-risk targets (calculated risk score under the safe threshold) trigger a notification output to subscribed channel feeds. List settings are saved via a server-side JSON file (`subscribers.json`) to retain subscriber registries over runtime restarts.

---

<br>

## 🛡️ <img src="https://readme-typing-svg.demolab.com?font=Bitcount+Ink&weight=600&size=24&pause=5000&color=FF3333&vCenter=true&width=800&lines=Forensic+Execution+Pipeline" alt="Forensic Pipeline" />

Before an asset security evaluation is compiled and sent to the Telegram client interface, it proceeds through an ordered 4-phase parsing pipeline:

```text
[Input String] ➔ [Step 1: Chain Routing] ➔ [Step 2: RPC Genesis Trace] ➔ [Step 3: GoPlus Registry Check] ➔ [Step 4: AI Analysis & Chart Render]
```

1.  **Ingestion & Parsing:** Evaluates whether the string is a standard wallet address, coin name, or URL structure, routing to Solana or compatible EVM workflows.
2.  **RPC Ledger Tracing:** Queries ledger histories on Solana via the Helius gateway API to parse creation details and identify funding parents.
3.  **Vulnerability Scans:** Queries third-party databases (GoPlus, etc.) to flag explicit vulnerabilities such as honeypot parameters, fee modifications, or mint authority options.
4.  **Inference Integration & Output Generation:** Formats compiled JSON outputs for Qwen-Plus, combining findings into a brief narrative alongside generated charting representations.

---

<br>

## 📂 <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=5000&color=FFA500&vCenter=true&width=400&lines=Directory+Structure" alt="Directory Structure" />

```text
rugguard-ai/
├── .env                              # Active configuration keys (git-ignored)
├── .gitignore                        # Git target ignore arrays
├── package.json                      # Build targets, metadata, and dependencies
├── subscribers.json                  # Persistent subscriber listings
├── index.js                          # Process Entrypoint & Telegram Loop Orchestrator
├── src/
│   ├── api/
│   │   ├── bitget.js                 # Spot V2 API client and charting connectors
│   │   ├── goplus.js                 # Multi-chain token diagnostic APIs
│   │   └── helius.js                 # Solana RPC forensic tracing client
│   ├── core/
│   │   ├── engine.js                 # Risk score assessment logic
│   │   ├── forensics.js              # Sybil and Genesis transaction tracking engines
│   │   └── scanner.js                # Five-minute scanning worker
│   ├── utils/
│   │   ├── ai.js                     # Qwen-Plus interface helper
│   │   ├── charts.js                 # QuickChart configuration parameters
│   │   └── helpers.js                # General error handling and text formatting tools
│   └── bot/
│       ├── handlers.js               # Telegram command listeners
│       └── keyboards.js              # Custom system navigation menus
```

---

<br>

## 🔐 <img src="https://readme-typing-svg.demolab.com?font=Share+Tech+Mono&weight=600&size=24&pause=5000&color=FFFF00&vCenter=true&width=600&lines=Environment+Configuration+Map" alt="Environment Configuration" />

Below is the required registry of environment configurations for running the RugGuard AI bot:

| Config Key | Context Location | Usage | Required? | Fallback Mode |
| :--- | :--- | :--- | :--- | :--- |
| `QWEN_API_KEY` | Server-side | Interacts with Alibaba Cloud DashScope interface. | **Yes** | AI-driven insights will fail to load. |
| `QWEN_BASE_URL` | Server-side | API endpoint for international requests. | *Optional* | Defaults to Singapore gateway endpoint. |
| `TAVILY_API_KEY` | Server-side | Real-time web search context helper. | *Optional* | Skipped if undefined. |
| `TELEGRAM_BOT_TOKEN` | Server-side | Authenticates with the Telegram Bot API. | **Yes** | Process will exit on initialization. |
| `BITGET_API_KEY` | Server-side | Validates administration profiles. | *Optional* | Fallback parameters used. |
| `BITGET_SECRET_KEY` | Server-side | Verifies administration profiles. | *Optional* | Fallback parameters used. |
| `BITGET_PASSPHRASE` | Server-side | Verifies administration profiles. | *Optional* | Fallback parameters used. |
| `SOLANA_RPC_URL` | Server-side | Solana JSON-RPC URL (Helius suggested). | **Yes** | Solana tracing functions will fail. |
| `RENDER_EXTERNAL_URL` | Server-side | Active URL parameter on Render. | *Optional* | Self-pinging features will be skipped. |

---

<br>

## ⚙️ <img src="https://readme-typing-svg.demolab.com?font=Share+Tech+Mono&weight=600&size=24&pause=5000&color=00FF7F&vCenter=true&width=800&lines=Local+Deployment+Guide" alt="Local Setup" />

Follow these steps to deploy and run the security agent locally:

### 1. Repository Setup
```bash
git clone https://github.com/Ismmusbaudeen/RugGuard-AI.git
cd RugGuard-AI
```

### 2. Dependency Installation
```bash
npm install
```

### 3. Environment Properties
Create a `.env` file in the root directory and populate your API credentials:
```env
# Target API Keys
QWEN_API_KEY=your_qwen_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_helius_key_here

# Recommended Options
TAVILY_API_KEY=your_tavily_key_here
RENDER_EXTERNAL_URL=http://localhost:8080
```

### 4. Running the Process
```bash
npm start
```

---

<br>

## 🚀 <img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=600&size=24&pause=5000&color=4169E1&vCenter=true&width=700&lines=Production+Deployment+Configurations" alt="Production Deployment" />

### Render Web Services Configuration (24/7 Hosting)

Ensure seamless operations on Render's container runtime by applying the following configuration parameters:

1.  **Platform Setting:** Setup as a **Web Service** tied to your repository.
2.  **Required Commands:**
    *   *Build:* `npm install`
    *   *Start:* `npm start`
3.  **Region Settings:** Select European or Asian region deployments (such as Frankfurt or Singapore) to help avoid IP-related request delays on Bitget exchange endpoints.
4.  **Persistence Setup:** To keep your subscriber preferences intact during deployments, create a persistent disk on Render and map it to your target directory to preserve your `subscribers.json` file.
5.  **Keep-Alive Configuration:** Provide your active Render URL under `RENDER_EXTERNAL_URL`. To prevent the instance from sleeping on free tiers, configure a monitoring service (such as **cron-job.org**) to ping your health endpoint every 10 minutes.

---

<br>

## 🎮 <img src="https://readme-typing-svg.demolab.com?font=Space+Mono&weight=600&size=24&pause=5000&color=00FFFF&vCenter=true&width=500&lines=Interface+%26+Control+Guide" alt="Control Guide" />

RugGuard AI uses a clean, menu-driven interface to help users access features quickly:

*   **Persistent Input Menu:** Uses custom keyboard selections for main operations (🔍 Quick Scan, 📈 Bitget Spot Markets, 🛡️ System Status, ℹ️ Help Guide).
*   **Structured Alert Controls:** Enables quick subscription or unsubscription setups for automated scan reports directly from the interface.
*   **Smart Message Delivery:** Includes formatting helpers that divide audit reviews exceeding the standard Telegram character limits, helping to ensure complete delivery.

---

<br>

## 🚨 <img src="https://readme-typing-svg.demolab.com?font=Bitcount+Ink&weight=600&size=24&pause=5000&color=DC143C&vCenter=true&width=700&lines=Troubleshooting+%26+Diagnostics" alt="Troubleshooting" />

*   **Solana RPC Limit Issues:** If you experience transaction loading delays, verify your Helius API limits or switch your node connection string to a dedicated private RPC endpoint.
*   **Render Deployment Restarts:** If subscriber preferences reset during deployments, ensure you are utilizing a persistent disk path for your `subscribers.json` data store.
*   **Bitget Connection Blocks:** Some hosting configurations located in restricted jurisdictions may experience API timeouts. Deploying your services in European or Asian data centers will help resolve routing issues.

<br><br>

<div align="center">
  <i>Developed to bring clarity to on-chain assets. Check before you ape.</i>
  <br><br>
  <b><a href="https://x.com/asiwajubtc">@asiwajubtc</a></b>
</div>
