// Test production AI endpoint
const https = require('https');

function testProductionAI() {
  const options = {
    hostname: 'chatframe-y2j7.onrender.com',
    port: 443,
    path: '/api/widget/message',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const data = JSON.stringify({
    widgetKey: 'cfwk_84e6fbc99ebd4174859a',
    message: 'Hello, I need help with my account. Can you assist me?'
  });

  console.log('Sending test message to production...\n');

  const req = https.request(options, (res) => {
    let body = '';

    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      console.log('Response:', body);
      
      try {
        const json = JSON.parse(body);
        console.log('\nParsed Response:');
        console.log('- Success:', json.success);
        console.log('- Ticket ID:', json.data?.ticketId);
        console.log('- AI Response:', json.data?.response || 'NO AI RESPONSE');
        
        if (!json.data?.response) {
          console.log('\n❌ AI did not generate a response!');
          console.log('Check Render logs for errors.');
        } else {
          console.log('\n✅ AI responded successfully!');
        }
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.write(data);
  req.end();
}

testProductionAI();
