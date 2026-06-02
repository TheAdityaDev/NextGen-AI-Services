require('dotenv').config();
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;

console.log('Testing Gemini API with REST...');
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 15)}...` : 'NOT SET');
console.log('');

// Test 1: List models
function listModels() {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          console.log('✅ API Key is valid!');
          console.log('Available models:', json.models?.slice(0, 3).map(m => m.name).join(', '));
          resolve(json.models);
        } else {
          console.log('❌ API Key test failed');
          console.log('Response:', data);
          reject(new Error(data));
        }
      });
    }).on('error', reject);
  });
}

// Test 2: Generate content
function generateContent(model) {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${API_KEY}`;
    
    const postData = JSON.stringify({
      contents: [{
        parts: [{ text: 'Say hello in one word' }]
      }]
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          console.log(`✅ ${model} works! Response: "${text}"`);
          resolve(text);
        } else {
          console.log(`❌ ${model} failed (${res.statusCode})`);
          console.log('Response:', data.substring(0, 200));
          reject(new Error(data));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function test() {
  try {
    console.log('1. Testing API key...\n');
    const models = await listModels();
    
    console.log('\n2. Testing content generation...\n');
    
    // Try the first available model
    if (models && models.length > 0) {
      const modelToTest = models.find(m => m.name.includes('gemini')) || models[0];
      await generateContent(modelToTest.name);
    }
    
    console.log('\n✅ All tests passed! API is working.');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

test();
