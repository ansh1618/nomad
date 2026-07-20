const https = require('https');
https.get('https://www.nomadik.co.in/journey/udaipur-weekend', (resp) => {
  let data = '';
  resp.on('data', (chunk) => data += chunk);
  resp.on('end', () => {
    console.log(data);
  });
});
