require('dotenv').config();
const aiService = require('./src/services/aiService');

async function test() {
  console.log('Is AI enabled?', aiService.isAIEnabled());
  console.log('AI configuration:', {
    isEnabled: aiService.isEnabled,
    confidenceThreshold: aiService.confidenceThreshold,
    model: aiService.model ? aiService.model.model : 'null'
  });

  const testMessage = 'Hello, I need help with my account';
  try {
    const shouldRespond = await aiService.shouldAutoReply(testMessage, []);
    console.log('Should Auto Reply:', shouldRespond);

    if (shouldRespond) {
      console.log('Generating response...');
      const result = await aiService.generateResponse(testMessage, [], { companyName: 'Test Company' });
      console.log('AI response result:', result);
    }
  } catch (err) {
    console.error('Error during AI test:', err);
  }
}

test();
