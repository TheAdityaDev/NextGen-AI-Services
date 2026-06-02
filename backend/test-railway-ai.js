const https = require('https');

function test() {
  const postData = JSON.stringify({
    widgetKey: 'cfwk_93e7cc38151643a6b149',
    message: 'Hello, I need help with my account. Can you assist me?'
  });

  const options = {
    hostname: 'nextgen-ai-services-production.up.railway.app',
    port: 443,
    path: '/api/widget/message',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  console.log('Sending test message to Railway production: https://nextgen-ai-services-production.up.railway.app/api/widget/message');

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      console.log('Response:', body);
    });
  });

  req.on('error', (err) => {
    console.error('Request error:', err);
  });

  req.write(postData);
  req.end();
}

test();
