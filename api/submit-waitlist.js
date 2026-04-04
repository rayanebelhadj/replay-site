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
    return res.status(500).json({ error: 'API key not configured' });
  }

  const emailData = {
    from: 'contact@replayteam.com',
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

    if (response.ok) {
      return res.status(200).json({ message: 'Subscribed successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to subscribe' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
