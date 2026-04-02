import https from 'https';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const emailData = {
    from: 'noreply@replayteam.com',
    to: 'contact@replayteam.com',
    subject: `New waitlist signup: ${email}`,
    html: `<p>New signup from: <strong>${email}</strong></p><p>Timestamp: ${new Date().toISOString()}</p>`,
  };

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

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      if (response.statusCode === 200) {
        res.status(200).json({ message: 'Subscribed successfully' });
      } else {
        console.error('Resend error:', response.statusCode, data);
        res.status(response.statusCode).json({ error: 'Failed to subscribe' });
      }
    });
  });

  request.on('error', (err) => {
    console.error('Request error:', err);
    res.status(500).json({ error: 'Server error' });
  });

  request.write(postData);
  request.end();
}
