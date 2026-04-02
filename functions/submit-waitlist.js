const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let email;
  try {
    const body = JSON.parse(event.body);
    email = body.email;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email required' }) };
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  const emailData = {
    from: 'noreply@replayteam.com',
    to: 'contact@replayteam.com',
    subject: `New waitlist signup: ${email}`,
    html: `<p>New signup from: <strong>${email}</strong></p><p>Timestamp: ${new Date().toISOString()}</p>`,
  };

  return new Promise((resolve) => {
    const postData = JSON.stringify(emailData);
    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({
            statusCode: 200,
            body: JSON.stringify({ message: 'Subscribed successfully' }),
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          console.error('Resend error:', res.statusCode, data);
          resolve({
            statusCode: res.statusCode,
            body: JSON.stringify({ error: 'Failed to subscribe', details: data }),
            headers: { 'Content-Type': 'application/json' },
          });
        }
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err);
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: 'Server error' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    req.write(postData);
    req.end();
  });
};
