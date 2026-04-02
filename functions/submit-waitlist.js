const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { email } = JSON.parse(event.body);

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email required' }) };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GitHub token not configured' }) };
  }

  const issueData = {
    title: `Waitlist: ${email}`,
    body: `Email: ${email}\nTimestamp: ${new Date().toISOString()}`,
    labels: ['waitlist'],
  };

  return new Promise((resolve) => {
    const postData = JSON.stringify(issueData);
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: '/repos/rayanebelhadj/replay-site/issues',
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Replay-Waitlist',
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 201) {
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
