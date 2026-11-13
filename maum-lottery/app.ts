import express from 'express';
import crypto from 'crypto';
import { recommendCuratedBooks, analyzeTextAndRecommend } from './src/curatedRecommender.ts';
import { getAdminConfig, saveAdminConfig, DEFAULT_CONFIG } from './src/adminConfig.ts';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '200kb' }));

const isGoogleApiKey = (key?: string) => {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.startsWith('AIza') && trimmed.length >= 30;
};

/* ---------- 관리자 인증: Google 로그인(서버가 ID 토큰 검증) + 서버 서명 토큰(HMAC) ---------- */
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const googleClientId = () => (process.env.GOOGLE_CLIENT_ID || '').trim();
const adminEmails = () =>
  (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
const tokenSecret = () => process.env.ADMIN_TOKEN_SECRET || '';
const signingKey = () => crypto.createHash('sha256').update('mind-tracker:' + tokenSecret()).digest();

const safeEqual = (a: string, b: string) => {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
};

function issueToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS, email })).toString('base64url');
  const sig = crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

// 유효하면 관리자 이메일을 돌려준다. 허용 목록에서 빠진 이메일의 기존 토큰도 거부한다.
function verifyToken(token?: string): string | null {
  if (!token || !tokenSecret()) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url');
  if (!safeEqual(sig, expected)) return null;
  try {
    const { exp, email } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return exp > Date.now() && adminEmails().includes(String(email).toLowerCase()) ? String(email) : null;
  } catch {
    return null;
  }
}

// ponytail: Google tokeninfo로 검증(요청마다 외부 호출 1회). 로그인 빈도가 낮아 충분하며, 늘면 google-auth-library로 로컬 검증.
async function verifyGoogleIdToken(idToken: string): Promise<string | null> {
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken));
  if (!r.ok) return null;
  const t: any = await r.json();
  const okIss = t.iss === 'accounts.google.com' || t.iss === 'https://accounts.google.com';
  if (t.aud !== googleClientId() || !okIss || Number(t.exp) * 1000 <= Date.now() || String(t.email_verified) !== 'true') return null;
  return typeof t.email === 'string' ? t.email.toLowerCase() : null;
}

const requireAdmin: express.RequestHandler = (req, res, next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const email = verifyToken(token);
  if (email) {
    res.locals.adminEmail = email;
    return next();
  }
  res.status(401).json({ ok: false, message: '관리자 로그인이 필요합니다.' });
};

/* ---------- 호출 제한 ---------- */
// ponytail: 인스턴스 메모리 기준(서버리스에선 인스턴스마다 따로 셈). 엄밀한 제한이 필요하면 Redis/DB.
const hits = new Map<string, number[]>();
const rateLimit = (name: string, max: number, windowMs: number): express.RequestHandler => (req, res, next) => {
  const k = `${name}:${req.ip}`;
  const now = Date.now();
  const arr = (hits.get(k) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    return res.status(429).json({ ok: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.', error: { message: '요청이 너무 많습니다.' } });
  }
  arr.push(now);
  hits.set(k, arr);
  next();
};

/* ---------- 관리자 API ---------- */
// 클라이언트 ID는 공개 값이다(Google 로그인 버튼에 필요).
app.get('/api/admin/google-config', (_req, res) => res.json({ ok: true, clientId: googleClientId() }));

app.post('/api/admin/google-login', rateLimit('login', 10, 15 * 60 * 1000), async (req, res) => {
  if (!googleClientId() || !adminEmails().length || !tokenSecret()) {
    return res.status(503).json({ ok: false, message: '관리자 로그인이 서버에 설정되지 않았습니다. (GOOGLE_CLIENT_ID, ADMIN_EMAILS, ADMIN_TOKEN_SECRET)' });
  }
  const { credential } = req.body || {};
  if (typeof credential !== 'string' || credential.length > 4096) {
    return res.status(400).json({ ok: false, message: '로그인 정보가 올바르지 않습니다.' });
  }
  try {
    const email = await verifyGoogleIdToken(credential);
    if (!email) return res.status(401).json({ ok: false, message: 'Google 계정을 확인하지 못했습니다. 다시 시도해 주세요.' });
    if (!adminEmails().includes(email)) return res.status(403).json({ ok: false, message: '관리자로 등록된 계정이 아닙니다.' });
    return res.json({ ok: true, token: issueToken(email), email });
  } catch {
    return res.status(502).json({ ok: false, message: 'Google 인증 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
  }
});

app.get('/api/admin/me', requireAdmin, (_req, res) => res.json({ ok: true, email: res.locals.adminEmail }));

// 읽기는 공개: 메인 화면이 감정 목록·프롬프트를 이 값으로 구성한다.
app.get('/api/admin/config', (_req, res) => {
  res.json({ ok: true, config: getAdminConfig(), defaults: DEFAULT_CONFIG });
});

function validateConfig(c: any): string | null {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return '잘못된 설정 데이터입니다.';
  if (c.bookCount !== undefined && !(Number.isInteger(c.bookCount) && c.bookCount >= 1 && c.bookCount <= 10)) return '추천 도서 수는 1~10 사이 정수여야 합니다.';
  for (const k of ['promptBall', 'promptText']) {
    if (c[k] !== undefined && !(typeof c[k] === 'string' && c[k].length <= 6000)) return `${k}는 6000자 이하 문자열이어야 합니다.`;
  }
  if (c.emotions !== undefined) {
    if (!Array.isArray(c.emotions) || c.emotions.length > 30) return '감정 목록은 30개 이하 배열이어야 합니다.';
    for (const e of c.emotions) {
      if (!e || typeof e.name !== 'string' || !e.name.trim() || e.name.length > 20 || !/^#[0-9a-fA-F]{6}$/.test(e.color) || typeof e.enabled !== 'boolean') {
        return '감정 항목 형식이 올바르지 않습니다.';
      }
    }
  }
  return null;
}

app.post('/api/admin/config', requireAdmin, (req, res) => {
  const bad = validateConfig(req.body);
  if (bad) return res.status(400).json({ ok: false, message: bad });
  res.json({ ok: true, config: saveAdminConfig(req.body), message: '관리자 설정이 저장되었습니다.' });
});

/* ---------- AI ---------- */
// 서버 키는 절대 응답에 싣지 않는다. 연결 여부만 알려준다.
// 책 표지: 카카오 책 검색에서 제목+저자가 맞는 첫 표지 주소만 돌려준다(이미지는 저장하지 않음).
const coverCache = new Map<string, { url: string | null; at: number }>();
const norm = (s: string) => s.replace(/[\s·.,:;!?'"‘’“”()\[\]-]/g, '').toLowerCase();
app.get('/api/cover', rateLimit('cover', 60, 60 * 1000), async (req, res) => {
  const title = String(req.query.title || '').trim().slice(0, 100);
  const author = String(req.query.author || '').trim().slice(0, 100);
  const key = (process.env.KAKAO_REST_API_KEY || '').trim();
  if (!title) return res.status(400).json({ ok: false, error: 'title이 필요합니다.' });
  if (!key) return res.json({ ok: true, url: null, reason: 'no-key' });
  const ck = norm(title) + '|' + norm(author);
  const hit = coverCache.get(ck);
  // 찾은 표지는 1일, 못 찾은 결과는 1시간만 기억
  if (hit && Date.now() - hit.at < (hit.url ? 864e5 : 36e5)) return res.json({ ok: true, url: hit.url });
  try {
    const r = await fetch('https://dapi.kakao.com/v3/search/book?target=title&size=10&query=' + encodeURIComponent(title), {
      headers: { Authorization: 'KakaoAK ' + key },
    });
    if (!r.ok) return res.json({ ok: true, url: null, reason: 'upstream-' + r.status });
    const data: any = await r.json();
    const t = norm(title);
    const firstAuthor = norm(author.split(/[,，&]/)[0] || '');
    const docs: any[] = Array.isArray(data.documents) ? data.documents : [];
    const match = docs.find((d) => d.thumbnail && norm(String(d.title)).includes(t) &&
      (!firstAuthor || (d.authors || []).some((a: string) => norm(a).includes(firstAuthor) || firstAuthor.includes(norm(a)))));
    const url = match ? String(match.thumbnail).replace(/^http:/, 'https:') : null;
    coverCache.set(ck, { url, at: Date.now() });
    return res.json({ ok: true, url });
  } catch {
    return res.json({ ok: true, url: null, reason: 'error' });
  }
});

app.get('/api/ai-status', (_req, res) => {
  res.json({ key: 'server-managed', model: 'gemini-3.8-flash', direct: true, hasRealKey: isGoogleApiKey(process.env.GEMINI_API_KEY) });
});

app.get('/api/gemini-models', rateLimit('models', 20, 60 * 1000), async (req, res) => {
  const fallback = { models: [{ name: 'models/gemini-3.8-flash', displayName: 'Gemini 3.8 Flash' }] };
  try {
    const key = isGoogleApiKey(req.query.key as string) ? (req.query.key as string) : process.env.GEMINI_API_KEY;
    if (isGoogleApiKey(key)) {
      const apiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        headers: { 'x-goog-api-key': key!, 'User-Agent': 'aistudio-build' },
      });
      if (apiRes.ok) return res.json(await apiRes.json());
    }
  } catch {}
  return res.json(fallback);
});

app.post('/api/gemini', rateLimit('gemini', 20, 10 * 60 * 1000), async (req, res) => {
  const { prompt, model = 'gemini-3.8-flash', key } = req.body || {};
  if (typeof prompt !== 'string' || prompt.length > 8000) {
    return res.status(400).json({ error: { message: '프롬프트 형식이 올바르지 않습니다.' } });
  }
  const resolvedKey = isGoogleApiKey(key) ? key : process.env.GEMINI_API_KEY;

  if (isGoogleApiKey(resolvedKey)) {
    try {
      const m = String(model || '').trim();
      const targetModel = /^[\w.\-]{1,60}$/.test(m) ? m : 'gemini-3.8-flash';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const apiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(targetModel)}:generateContent`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': resolvedKey!.trim(), 'User-Agent': 'aistudio-build' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }),
        }
      );
      clearTimeout(timeout);
      if (apiRes.ok) return res.json(await apiRes.json());
      console.warn('Gemini API non-OK, falling back to curated engine:', apiRes.status);
    } catch (err) {
      console.warn('Gemini API error, falling back to curated engine');
    }
  }

  // 키가 없거나 실패하면 내장 큐레이션 엔진으로 대체
  try {
    const countMatch = prompt.match(/정확히\s*(\d+)권/);
    const targetCount = countMatch ? parseInt(countMatch[1], 10) : getAdminConfig().bookCount || 3;
    const wrap = (result: unknown) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }] });

    if (prompt.includes('독자가 직접 쓴 마음') || prompt.includes('status를 "crisis"')) {
      const match = prompt.match(/독자가 직접 쓴 마음[^:]*:\s*(".*?"|'.*?'|[^\n]+)/);
      let userText = '';
      if (match && match[1]) {
        try { userText = JSON.parse(match[1]); } catch { userText = match[1].replace(/^["']|["']$/g, ''); }
      }
      return res.json(wrap(analyzeTextAndRecommend(userText, targetCount)));
    }

    const emoMatch = prompt.match(/독자가 지금 느끼는 감정:\s*([^\n]+)/);
    const emotions = emoMatch && emoMatch[1] ? emoMatch[1].split(',').map((s) => s.trim()).filter(Boolean) : ['외로움'];
    return res.json(wrap(recommendCuratedBooks(emotions, targetCount)));
  } catch (err: any) {
    return res.status(500).json({ error: { message: err?.message || '추천 처리 중 오류가 발생했습니다.' } });
  }
});

export default app;
