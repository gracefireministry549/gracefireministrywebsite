// Grace Fire Deliverance Healing Global World Ministry website server
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public'), { etag: true, maxAge: '1h' }));
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

const attempts = new Map();
app.post('/api/notify-prayer', async (req, res) => {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter(ts => now - ts < 10 * 60 * 1000);
  if (recent.length >= 5) return res.status(429).json({ error: 'Please wait before sending another request.' });
  recent.push(now); attempts.set(ip, recent);
  if (attempts.size > 2000) for (const [key, times] of attempts) if (!times.some(ts => now - ts < 10 * 60 * 1000)) attempts.delete(key);

  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 120) : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().slice(0, 254) : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim().slice(0, 40) : '';
  const request = typeof req.body?.request === 'string' ? req.body.request.trim().slice(0, 3000) : '';
  if (name.length < 2 || request.length < 3 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return res.status(400).json({ error: 'Please check the prayer request details.' });

  const { GMAIL_USER, GMAIL_APP_PASSWORD, PRAYER_DESTINATION_EMAIL } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !PRAYER_DESTINATION_EMAIL) return res.status(503).json({ error: 'Email notifications are not configured yet.' });
  try {
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
    await transporter.sendMail({
      from: GMAIL_USER, to: PRAYER_DESTINATION_EMAIL, replyTo: email || undefined,
      subject: 'Website prayer request — ' + name,
      text: ['PRAYER REQUEST — GRACE FIRE DELIVERANCE HEALING GLOBAL WORLD MINISTRY', 'Name: ' + name, 'Phone: ' + (phone || 'Not provided'), 'Email: ' + (email || 'Not provided'), '', 'Prayer request:', request].join('\n')
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Prayer email delivery failed:', error?.code || 'mail_error');
    return res.status(502).json({ error: 'Email notification failed.' });
  }
});

app.use((req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin/')) return res.status(404).json({ error: 'Endpoint not found.' });
  return res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(PORT, '0.0.0.0', () => console.log(`Grace Fire Ministry website listening on port ${PORT}`));
