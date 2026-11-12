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

/* ---------- 관리자 인증: 서버가 서명한 토큰(HMAC), 별도 저장소 불필요 ---------- */
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const adminCreds = () => ({ id: process.env.ADMIN_ID || '', pw: process.env.ADMIN_PW || '' });
const signingKey = () =>
  crypto.createHash('sha256').update('mind-tracker:' + (process.env.ADMIN_TOKEN_SECRET || adminCreds().pw)).digest();

const safeEqual = (a: string, b: string) => {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
};

function issueToken(): string {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token?: string): boolean {
  if (!token || !adminCreds().pw) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url');
  if (!safeEqual(sig, expected)) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}

const requireAdmin: express.RequestHandler = (req, res, next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (verifyToken(token)) return next();
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
app.post('/api/admin/login', rateLimit('login', 10, 15 * 60 * 1000), (req, res) => {
  const { id: adminId, pw: adminPw } = adminCreds();
  if (!adminId || !adminPw) {
    return res.status(503).json({ ok: false, message: '관리자 계정이 서버에 설정되지 않았습니다.' });
  }
  const { id, password } = req.body || {};
  if (typeof id === 'string' && typeof password === 'string' && safeEqual(id, adminId) && safeEqual(password, adminPw)) {
    return res.json({ ok: true, token: issueToken() });
  }
  return res.status(401).json({ ok: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
});

app.get('/api/admin/me', requireAdmin, (_req, res) => res.json({ ok: true }));

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
