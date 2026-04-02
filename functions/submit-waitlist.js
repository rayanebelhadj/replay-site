const https = require('https');

exports.handler = async (event) => {
  // Only POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { email } = JSON.parse(event.body);

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email required' }) };
  }

  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  const mailData = {
    personalizations: [
      {
        to: [{ email: 'contact@replayteam.com' }],
        subject: `New waitlist signup: ${email}`,
      },
    ],
    from: { email: 'noreply@tryreplay.co', name: 'Replay' },
    content: [
      {
        type: 'text/html',
        value: `<p>New signup: <strong>${email}</strong></p>`,
      },
    ],
  };

  return new Promise((resolve) => {
    const postData = JSON.stringify(mailData);
    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 202) {
        resolve({
          statusCode: 200,
          body: JSON.stringify({ message: 'Subscribed successfully' }),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to subscribe' }),
          headers: { 'Content-Type': 'application/json' },
        });
      }
    });

    req.on('error', () => {
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
