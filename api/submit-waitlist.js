export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('RESEND_API_KEY not found in environment');
    return res.status(500).json({ error: 'API key not configured' });
  }

  console.log('Using API key:', resendKey.substring(0, 10) + '...');

  const emailData = {
    from: 'noreply@replayteam.com',
    to: 'contact@replayteam.com',
    subject: `New waitlist signup: ${email}`,
    html: `<p>New signup from: <strong>${email}</strong></p><p>Timestamp: ${new Date().toISOString()}</p>`,
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('Email sent successfully:', responseData);
      return res.status(200).json({ message: 'Subscribed successfully' });
    } else {
      console.error('Resend error:', response.status, responseData);
      return res.status(500).json({ error: 'Failed to subscribe', details: responseData });
    }
  } catch (err) {
    console.error('Request error:', err.message);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
