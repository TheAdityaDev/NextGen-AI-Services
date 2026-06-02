/**
 * Verify AI Summarization logic
 */

require('dotenv').config();
const aiService = require('../src/services/aiService');

async function verifySummary() {
  console.log("=== VERIFYING AI SUMMARIZATION ===");
  console.log("AI Enabled:", aiService.isAIEnabled());

  const mockHistory = [
    { senderType: 'customer', content: 'Hi, I bought a subscription yesterday but my account still says free trial. Can you help?' },
    { senderType: 'agent', content: 'Hello! I would be happy to help. Can you please share the email address associated with your purchase?' },
    { senderType: 'customer', content: 'Sure, it is customer@example.com. The transaction ID was TXN_99182.' },
    { senderType: 'agent', content: 'Thank you! I see the transaction. There was a slight sync delay, but I have manually upgraded your account to Pro now. Please log out and back in.' },
    { senderType: 'customer', content: 'That worked! Thank you so much for the quick help.' }
  ];

  console.log("\nMock Conversation History:\n", mockHistory.map(m => `[${m.senderType}] ${m.content}`).join('\n'));
  console.log("\nGenerating summary with Gemini (gemini-2.5-flash)...");

  try {
    const summary = await aiService.generateSummary(mockHistory);
    console.log("\n✅ AI Summary Output:\n", summary);
  } catch (error) {
    console.error("❌ Summary Generation Failed:", error);
  }
}

verifySummary();
