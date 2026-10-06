const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max = 2500) {
  return String(value || '').trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function subjectFor(type, name, organization) {
  if (type === 'organization') return `ORGANIZATION — Munē Organization Inquiry — ${organization || name}`;
  if (type === 'community') return `COMMUNITY — Munē Community Inquiry — ${organization || name}`;
  return `PERSONAL — Munē Personal Inquiry — ${name}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  const type = clean(body.type, 40);
  const allowedTypes = new Set(['personal', 'organization', 'community']);
  if (!allowedTypes.has(type)) return res.status(400).json({ error: 'Invalid inquiry type.' });

  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const startedAt = Number(body.startedAt || 0);
  if (startedAt && Date.now() - startedAt < 1800) return res.status(400).json({ error: 'Please wait a moment and try again.' });

  const name = clean(body.name, 120);
  const email = clean(body.email, 180);
  const note = clean(body.note, 2500);
  if (!name || !EMAIL_RE.test(email) || !note) return res.status(400).json({ error: 'Please complete the required fields.' });

  const phone = clean(body.phone, 60);
  const issue = clean(body.issue, 160);
  const organization = clean(body.organization, 180);
  const size = clean(body.size, 120);
  const audience = clean(body.audience, 180);
  const timeframe = clean(body.timeframe, 120);

  if ((type === 'organization' || type === 'community') && !organization) {
    return res.status(400).json({ error: 'Please include your organization or community.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error('Inquiry email is not configured: missing RESEND_API_KEY or RESEND_FROM_EMAIL.');
    return res.status(503).json({ error: 'Inquiry delivery is being configured. Please email sam@getmune.com for now.' });
  }

  const lines = [
    ['Type', type],
    ['Name', name],
    ['Email', email],
    ['Phone', phone],
    ['Issue', issue],
    ['Organization / Community', organization],
    ['Size', size],
    ['Audience', audience],
    ['Timeframe', timeframe],
    ['Message', note],
  ].filter(([, value]) => value);

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6">
    <h2>New Munē website inquiry</h2>
    ${lines.map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong><br>${escapeHtml(value).replace(/\n/g, '<br>')}</p>`).join('')}
  </div>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: ['sam@getmune.com'],
      reply_to: email,
      subject: subjectFor(type, name, organization),
      html
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('Resend inquiry failure:', response.status, detail.slice(0, 500));
    return res.status(502).json({ error: 'Unable to send right now. Please try again.' });
  }

  return res.status(200).json({ ok: true });
}
