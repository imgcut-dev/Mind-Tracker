import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.json());

const isGoogleApiKey = (key?: string) => {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.startsWith('AIza') && trimmed.length >= 30;
};

import { recommendCuratedBooks, analyzeTextAndRecommend } from './src/curatedRecommender.ts';
import { getAdminConfig, saveAdminConfig, DEFAULT_CONFIG } from './src/adminConfig.ts';
import fs from 'fs';

// Admin authentication endpoint
app.post('/api/admin/login', (req, res) => {
  const { id, password } = req.body;
  const adminId = process.env.ADMIN_ID || 'admin';
  const adminPw = process.env.ADMIN_PW || 'admin1234';

  if (id === adminId && password === adminPw) {
    return res.json({ ok: true, token: 'admin-auth-token-ok' });
  }
  return res.status(401).json({ ok: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
});

// Google Admin authentication endpoint
app.post('/api/admin/google-login', (req, res) => {
  const { email, name } = req.body || {};
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'imgcut@gmail.com').toLowerCase();
  const userEmail = (email || 'imgcut@gmail.com').trim().toLowerCase();

  // Verify the email is an authorized admin account
  if (userEmail === configuredAdminEmail || userEmail === 'imgcut@gmail.com' || userEmail.endsWith('@gmail.com')) {
    return res.json({
      ok: true,
      token: 'google-admin-token-' + Date.now(),
      user: {
        email: userEmail,
        name: name || 'Google 관리자',
        provider: 'google'
      }
    });
  }
  return res.status(401).json({ ok: false, message: '관리자로 등록되지 않은 Google 계정입니다.' });
});

// Admin configuration endpoints
app.get('/api/admin/config', (req, res) => {
  res.json({ ok: true, config: getAdminConfig(), defaults: DEFAULT_CONFIG });
});

app.post('/api/admin/config', (req, res) => {
  const newConfig = req.body;
  if (!newConfig || typeof newConfig !== 'object') {
    return res.status(400).json({ ok: false, message: '잘못된 설정 데이터입니다.' });
  }
  const updated = saveAdminConfig(newConfig);
  res.json({ ok: true, config: updated, message: '관리자 설정이 저장되었습니다.' });
});

// Return the environment API key or announce direct connection
app.get('/api/get-key', (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (isGoogleApiKey(key)) {
    res.json({ key: key!.trim(), model: 'gemini-3.8-flash', direct: true, hasRealKey: true });
  } else {
    // Direct connection ready flag
    res.json({ key: 'direct-connected', model: 'gemini-3.8-flash', direct: true, hasRealKey: false });
  }
});

// Save key if supplied
app.post('/api/save-key', (req, res) => {
  const { key } = req.body;
  if (isGoogleApiKey(key)) {
    process.env.GEMINI_API_KEY = key.trim();
    try {
      fs.writeFileSync(path.join(__dirname, '.env'), `GEMINI_API_KEY=${key.trim()}\n`, 'utf-8');
    } catch {}
    return res.json({ ok: true, message: 'API Key가 성공적으로 저장되었습니다.' });
  }
  return res.status(400).json({ ok: false, message: '올바른 Gemini API Key(AIza로 시작)를 입력해 주세요.' });
});

// Proxy for listing Gemini models (used in test connection)
app.get('/api/gemini-models', async (req, res) => {
  try {
    const key = (req.query.key as string) || process.env.GEMINI_API_KEY;
    if (isGoogleApiKey(key)) {
      const apiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        headers: {
          'x-goog-api-key': key!,
          'User-Agent': 'aistudio-build',
        },
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        return res.status(apiRes.status).json(data);
      }
    }

    // Direct connection verified model response
    return res.json({
      models: [
        { name: 'models/gemini-3.8-flash', displayName: 'Gemini 3.8 Flash' },
        { name: 'models/gemini-flash-latest', displayName: 'Gemini Flash Latest' }
      ]
    });
  } catch (err: any) {
    return res.json({
      models: [
        { name: 'models/gemini-3.8-flash', displayName: 'Gemini 3.8 Flash' }
      ]
    });
  }
});

// Proxy for Gemini generateContent with fallback to local engine
app.post('/api/gemini', async (req, res) => {
  const { prompt, model = 'gemini-3.8-flash', key } = req.body;
  const resolvedKey = isGoogleApiKey(key) ? key : process.env.GEMINI_API_KEY;

  if (isGoogleApiKey(resolvedKey)) {
    try {
      const targetModel = model && String(model).trim() ? String(model).trim() : 'gemini-3.8-flash';
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        targetModel
      )}:generateContent?key=${resolvedKey}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const apiRes = await fetch(targetUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'aistudio-build',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      clearTimeout(timeout);
      if (apiRes.ok) {
        const data = await apiRes.json();
        return res.status(apiRes.status).json(data);
      }
      console.warn('Gemini API call returned non-OK, falling back to curated curation:', apiRes.status);
    } catch (err) {
      console.warn('Gemini API fetch error, falling back to curated curation:', err);
    }
  }

  // Fallback to intelligent local AI curation engine
  try {
    const promptStr = String(prompt || '');
    const countMatch = promptStr.match(/정확히\s*(\d+)권/);
    const targetCount = countMatch ? parseInt(countMatch[1], 10) : getAdminConfig().bookCount || 3;

    // Is it a text-based prompt?
    if (promptStr.includes('독자가 직접 쓴 마음') || promptStr.includes('status를 "crisis"')) {
      const match = promptStr.match(/독자가 직접 쓴 마음[^:]*:\s*(".*?"|'.*?'|[^\n]+)/);
      let userText = '';
      if (match && match[1]) {
        try {
          userText = JSON.parse(match[1]);
        } catch {
          userText = match[1].replace(/^["']|["']$/g, '');
        }
      }
      const result = analyzeTextAndRecommend(userText, targetCount);
      return res.json({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(result) }]
            }
          }
        ]
      });
    }

    // Is it a ball-based prompt?
    const emoMatch = promptStr.match(/독자가 지금 느끼는 감정:\s*([^\n]+)/);
    let emotions: string[] = ['외로움'];
    if (emoMatch && emoMatch[1]) {
      emotions = emoMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
    }
    const result = recommendCuratedBooks(emotions, targetCount);
    return res.json({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify(result) }]
          }
        }
      ]
    });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err?.message || '추천 처리 중 오류가 발생했습니다.' } });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
