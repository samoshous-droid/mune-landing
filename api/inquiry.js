const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xbgjvllv';

function clean(value, max = 2500) {
  return String(value || '').trim().slice(0, max);
}

function subjectFor(type, name, organization, issue) {
  if (type === 'organization') return `ORGANIZATION — Munē Organization Inquiry — ${organization || name}`;
  if (type === 'community') return `COMMUNITY — Munē Community Inquiry — ${organization || name}`;
  return `PERSONAL — Munē Personal Inquiry — ${name}${issue ? ` — ${issue}` : ''}`;
}

const recentByIp = new Map();
function tooManyRequests(ip) {
  if (!ip) return false;
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const limit = 5;
  const recent = (recentByIp.get(ip) || []).filter(ts => now - ts < windowMs);
  if (recent.length >= limit) return true;
  recent.push(now);
  recentByIp.set(ip, recent);
  if (recentByIp.size > 1000) {
    for (const [key, times] of recentByIp) {
      const live = times.filter(ts => now - ts < windowMs);
      if (live.length) recentByIp.set(key, live);
      else recentByIp.delete(key);
    }
  }
  return false;
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
  if (!startedAt || !Number.isFinite(startedAt)) return res.status(400).json({ error: 'Please refresh the form and try again.' });
  const elapsed = Date.now() - startedAt;
  if (elapsed < 1800 || elapsed > 2 * 60 * 60 * 1000) return res.status(400).json({ error: 'Please refresh the form and try again.' });

  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.socket?.remoteAddress || '';
  if (tooManyRequests(ip)) return res.status(429).json({ error: 'Too many requests. Please wait and try again.' });

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

  const payload = new URLSearchParams();
  payload.set('_subject', subjectFor(type, name, organization, issue));
  payload.set('_replyto', email);
  payload.set('type', type);
  payload.set('name', name);
  payload.set('email', email);
  if (phone) payload.set('phone', phone);
  if (issue) payload.set('issue', issue);
  if (organization) payload.set('organization', organization);
  if (size) payload.set('size', size);
  if (audience) payload.set('audience', audience);
  if (timeframe) payload.set('timeframe', timeframe);
  payload.set('message', note);

  const response = await fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: payload.toString()
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('Formspree inquiry failure:', response.status, detail.slice(0, 500));
    return res.status(502).json({ error: 'Unable to send right now. Please try again.' });
  }

  return res.status(200).json({ ok: true });
}
