import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the OpenAI client pointing to Alibaba Qwen's DashScope compatible endpoint
const openai = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

/**
 * Generates a unified risk report by reasoning over contract data and web search traces
 * @param {object} securityResult The output from security.js check
 * @param {object} searchResult The output from search.js search
 */
export async function generateSecurityReport(securityResult, searchResult) {
  try {
    // Construct the payload for Qwen analysis
    const systemPrompt = `You are RugGuard AI, an elite Web3 Smart Contract Auditor and On-chain Forensics Analyst. 
Your purpose is to protect crypto traders from rug pulls, honeypots, malicious smart contracts, phishing attempts, and exit scams.

Analyze the raw on-chain security technical scan data and the accompanying web search intelligence context.
You must synthesize this information and output a highly structured, objective security audit report in clear, telegram-friendly Markdown format.

Your report must strictly include:
1. RISK SCORE: A calculated numerical score from 0 (Critical Scam / Active Rug) to 100 (Safe).
2. RISK LEVEL: Critical, High, Medium, or Low risk classification.
3. ON-CHAIN FINDINGS: Evaluation of contract permissions, honeypot status, mint capabilities, transfer taxes, or URL safety status.
4. WEB INTEL SUMMARY: Highlights or red flags discovered from web/social sentiment searches.
5. EXPLANATION & SUGGESTIONS: Clear advice on what the user should do next (e.g., "Do not buy", "Exercise high caution due to dynamic taxes", "Safe to interact with standard risk controls").

Be direct, analytical, and highly precise. Avoid vague definitions. Format the message clearly with bold headings and structured bullet points.`;

    const userContent = `### Target Under Analysis
Target Type: ${securityResult.type}
Target Identifier/Address: ${securityResult.target}

### Technical Scan Data (On-Chain/dApp Registry)
${JSON.stringify(securityResult, null, 2)}

### Web Search & Social Intelligence
Web Query Status: ${searchResult.success ? 'Success' : 'Failed'}
Summary of News/Sentiment: ${searchResult.summary}
Raw Search Traces:
${JSON.stringify(searchResult.results, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: 'qwen-plus', // Using Alibaba Qwen-Plus for advanced analytical reasoning
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.1, // Keep score calculation and analysis deterministic and analytical
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