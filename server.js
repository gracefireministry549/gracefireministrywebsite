// Grace Fire Deliverance Healing Global World Ministry website server
// Supabase stores prayer requests and contact messages; do not store submissions on local disk.
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  maxAge: '1h'
}));

app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

// Never expose public endpoints that return private prayer requests or contact messages.
// Form submissions go directly to Supabase REST and are restricted by database RLS policies.
app.use((req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin/')) {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }
  return res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Grace Fire Ministry website listening on port ${PORT}`);
});
