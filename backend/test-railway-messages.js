const https = require('https');

function test() {
  const options = {
    hostname: 'nextgen-ai-services-production.up.railway.app',
    port: 443,
    path: '/api/widget/messages/6a1eaf12e2af6b12b03a3834',
    method: 'GET'
  };

  console.log('Fetching messages from Railway: https://nextgen-ai-services-production.up.railway.app/api/widget/messages/6a1eb2f5e2af6b12b03a385d');

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

  req.end();
}

test();
