// Vercel 서버리스 진입점. 모든 /api/* 요청을 Express 앱이 처리한다(vercel.json rewrite).
import app from '../app.ts';
export default app;
