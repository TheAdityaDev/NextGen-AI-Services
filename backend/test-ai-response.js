require('dotenv').config();
const mongoose = require('mongoose');
const aiService = require('./src/services/aiService');
const WidgetConfig = require('./src/models/WidgetConfig');
const Ticket = require('./src/models/Ticket');
const Message = require('./src/models/Message');

async function testAIResponse() {
  try {
 
    await mongoose.connect(process.env.MONGO_URI);

    // Get widget config
    const widgetKey = 'cfwk_84e6fbc99ebd4174859a';
    const config = await WidgetConfig.findOne({ widgetKey });
    
    if (!config) {
      return;
    }

    // Test message
    const testMessage = 'Hello, I need help with my account';
  
    // Check if should auto-reply
    const shouldRespond = await aiService.shouldAutoReply(testMessage, []);
    
    if (!shouldRespond) {
      return;
    }

    // Generate AI response
    const aiResult = await aiService.generateResponse(
      testMessage,
      [],
      { companyName: config.companyName }
    );

    if (!aiResult) {
      return;
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testAIResponse();
