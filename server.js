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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRateLimited(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter(ts => now - ts < 10 * 60 * 1000);
  if (recent.length >= 5) return true;
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 2000) for (const [key, times] of attempts) if (!times.some(ts => now - ts < 10 * 60 * 1000)) attempts.delete(key);
  return false;
}

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

let transporter = null;
function getMailer() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, PRAYER_DESTINATION_EMAIL } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !PRAYER_DESTINATION_EMAIL) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD.replace(/\s+/g, '') }
    });
  }
  return { transporter, from: GMAIL_USER, to: PRAYER_DESTINATION_EMAIL };
}

async function sendNotification(res, label, { subject, replyTo, lines }) {
  const mailer = getMailer();
  if (!mailer) {
    console.error(label + ' email not configured: set GMAIL_USER, GMAIL_APP_PASSWORD and PRAYER_DESTINATION_EMAIL');
    return res.status(503).json({ error: 'Email notifications are not configured yet.' });
  }
  try {
    await mailer.transporter.sendMail({
      from: 'Grace Fire Ministry Website <' + mailer.from + '>',
      to: mailer.to,
      replyTo: replyTo || undefined,
      subject: subject.replace(/[\r\n]+/g, ' '),
      text: lines.join('\n')
    });
    return res.status(200).json({ ok: true, emailSent: true });
  } catch (error) {
    console.error(label + ' email delivery failed:', error && (error.code || error.responseCode) || '', error && error.message || 'smtp_error');
    return res.status(502).json({ error: 'Email notification failed.', emailSent: false });
  }
}

app.post('/api/notify-prayer', async (req, res) => {
  if (isRateLimited(req)) return res.status(429).json({ error: 'Please wait before sending another request.' });
  const name = clean(req.body && req.body.name, 120);
  const email = clean(req.body && req.body.email, 254);
  const phone = clean(req.body && req.body.phone, 40);
  const request = clean(req.body && req.body.request, 3000);
  if (name.length < 2 || request.length < 3 || (email && !EMAIL_RE.test(email))) {
    return res.status(400).json({ error: 'Please check the prayer request details.' });
  }
  return sendNotification(res, 'Prayer', {
    subject: 'Website prayer request \u2014 ' + name,
    replyTo: email,
    lines: [
      'PRAYER REQUEST \u2014 GRACE FIRE DELIVERANCE HEALING GLOBAL WORLD MINISTRY',
      'Name: ' + name,
      'Phone: ' + (phone || 'Not provided'),
      'Email: ' + (email || 'Not provided'),
      '',
      'Prayer request:',
      request
    ]
  });
});

app.post('/api/notify-contact', async (req, res) => {
  if (isRateLimited(req)) return res.status(429).json({ error: 'Please wait before sending another request.' });
  const name = clean(req.body && req.body.name, 120);
  const email = clean(req.body && req.body.email, 254);
  const subject = clean(req.body && req.body.subject, 160) || 'Website contact message';
  const message = clean(req.body && req.body.message, 3000);
  if (name.length < 2 || message.length < 3 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please check the contact message details.' });
  }
  return sendNotification(res, 'Contact', {
    subject: 'Website contact \u2014 ' + subject + ' (' + name + ')',
    replyTo: email,
    lines: [
      'CONTACT MESSAGE \u2014 GRACE FIRE DELIVERANCE HEALING GLOBAL WORLD MINISTRY',
      'Name: ' + name,
      'Email: ' + email,
      'Subject: ' + subject,
      '',
      'Message:',
      message
    ]
  });
});

app.use((req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin/')) return res.status(404).json({ error: 'Endpoint not found.' });
  return res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(PORT, '0.0.0.0', () => console.log(`Grace Fire Ministry website listening on port ${PORT}`));
