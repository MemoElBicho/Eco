const express = require('express');
const app = express();
app.use(express.json());

app.all('*', (req, res) => {
  console.log(`[MOCK WA] ${req.method} ${req.path} — ${JSON.stringify(req.body)}`);
  const msgId = `mock_wa_${Date.now()}`;
  res.json({ messaging_product: 'whatsapp', contacts: [{ input: req.body?.to }], messages: [{ id: msgId }] });
});

app.listen(4010, () => console.log('Mock WhatsApp API on :4010'));
