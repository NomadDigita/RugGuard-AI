import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

/**
 * Generates a unified risk report by reasoning over contract data and web search traces
 */
export async function generateSecurityReport(securityResult, searchResult) {
  try {
    const systemPrompt = `You are RugGuard AI, an elite Web3 Smart Contract Auditor and On-chain Forensics Analyst. 
Your purpose is to protect crypto traders from rug pulls, honeypots, malicious smart contracts, phishing attempts, and market manipulation.

Your analysis must pay strict attention to:
- COORDINATED CABAL DUMP RISK (Insider Centralization): Analyze the top holders array. Scammers often distribute 40-70% of supply across 10-15 alt-wallets (Cabal Rings) to bypass security checks and dump simultaneously.
- LIQUIDITY POOL (LP) SECURITY: Check if LP tokens are burned (sent to dead addresses like 0x000... or 1111...) or locked in secure lockers. Unlocked liquidity is the #1 rug vector.
- GENESIS FUNDING FORENSICS: Note who funded the creator and check for Sybil Cluster Scam Networks.

ADDITIONAL INSTITUTIONAL METRIC (BITGET ADVANTAGE):
If the analyzed token is listed on Bitget (indicated by "bitgetSafetyStatus.listed: true" in the input data), calculate an institutional cost-benefit and safety comparison:
- DEX risks: high slippage (1-5%), hidden token buy/sell taxes, network gas spikes, sandwich attacks (MEV), and cabal dump risks.
- Bitget Spot advantages: 100% immune to smart-contract exploits/honeypots, zero DEX front-run risk, and low fees (0.1% Maker/Taker).
- Provide a brief comparison card showing the estimated capital saved on a standard $1,000 purchase on Bitget.

Format your output using professional, highly structured sections:
1. RISK SCORE: A calculated numerical score from 0 (Critical Scam / Active Rug) to 100 (Safe).
2. RISK LEVEL: Critical, High, Medium, or Low risk classification.
3. 👥 CABAL RING & INSIDER CENTRALIZATION: Evaluate holder concentration. Calculate a "Cabal Centralization Index" and warn of coordinated dev alt-wallet dumps.
4. 💧 LIQUIDITY Pool & LP LOCK STATUS: Audit of the LP status, showing if it's burned, locked, or exposed.
5. ⚙️ ON-CHAIN & DEVELOPER FORENSICS: Analyze mint/freeze authorities, genesis funding, and Sybil cluster networks.
6. 📊 BITGET INSTITUTIONAL SAFETY (Include this section ONLY if listed on Bitget): Display the Cost-Savings and contract-security comparison.
7. 🌐 WEB & SOCIAL INTELLIGENCE: Search results, community sentiment, or team records.
8. 🛡️ ACTIONABLE RECOMMENDATIONS: Clear instructions for the user.

Write in clear, direct, and professional Markdown. Do not abbreviate or shorten your findings. Offer an exhaustive, high-end evaluation.`;

    const userContent = `### Target Under Analysis
Target Type: ${securityResult.type}
Target Identifier/Address: ${securityResult.target}

### Technical Scan & Developer Forensics
${JSON.stringify(securityResult, null, 2)}

### Web Search & Social Intelligence
Web Query Status: ${searchResult.success ? 'Success' : 'Failed'}
Summary of News/Sentiment: ${searchResult.summary}
Raw Search Traces:
${JSON.stringify(searchResult.results, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.1,
      max_tokens: 1500
    });

    if (response.choices && response.choices[0] && response.choices[0].message) {
      return response.choices[0].message.content;
    }
    
    throw new Error('Alibaba Qwen engine returned an empty response.');
  } catch (error) {
    return `⚠️ **RugGuard AI Reasoning Engine Error** ⚠️\n\nFailed to calculate risk analysis: ${error.message}`;
  }
}