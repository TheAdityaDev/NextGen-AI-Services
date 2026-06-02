require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function diagnoseAI() {
  // console.log('=== AI DIAGNOSTIC TOOL ===\n');

  // // Check environment variables
  // console.log('1. Environment Variables:');
  // console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');
  // console.log('   AI_AUTO_REPLY_ENABLED:', process.env.AI_AUTO_REPLY_ENABLED);
  // console.log('   AI_CONFIDENCE_THRESHOLD:', process.env.AI_CONFIDENCE_THRESHOLD);
  // console.log('');

  if (!process.env.GEMINI_API_KEY) {
    // console.log('❌ GEMINI_API_KEY is not set!');
    return;
  }

  // Test API key with different models
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const modelsToTry = [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-pro',
    'gemini-1.0-pro',
  ];

  console.log('2. Testing Gemini Models:\n');

  for (const modelName of modelsToTry) {
    try {
      console.log(`   Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "Hello" in one word');
      const response = await result.response;
      const text = response.text();
      // console.log(`   ✅ ${modelName} WORKS!`);
      // console.log(`   Response: "${text.trim()}"`);
      // console.log('');
      
      // If we found a working model, suggest it
      if (modelName !== 'gemini-1.5-pro') {
        // console.log(`   ⚠️  Current code uses 'gemini-1.5-pro' but '${modelName}' works!`);
        // console.log(`   Consider updating aiService.js to use '${modelName}'`);
      }
      
      return; // Stop after first success
    } catch (error) {
      // console.log(`   ❌ ${modelName} failed:`);
      // console.log(`      ${error.message.substring(0, 100)}`);
      // console.log('');
    }
  }

  // console.log('❌ All models failed! Your API key may be invalid or leaked.');
  // console.log('   Get a new key from: https://makersuite.google.com/app/apikey');
}

diagnoseAI();
