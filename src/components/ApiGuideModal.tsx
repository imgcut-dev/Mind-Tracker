import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, X, HelpCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface ApiGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiGuideModal: React.FC<ApiGuideModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<{
    hasApiKey: boolean;
    model: string;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Failed to check API status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Google AI Studio API Key 연동 가이드
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                안전하고 쉬운 Gemini AI 설정 안내
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Box */}
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 ${
            status?.hasApiKey
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-100'
          }`}
        >
          {status?.hasApiKey ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between mb-1 font-bold">
              <span>
                {status?.hasApiKey ? '✅ Gemini API Key 연동 완료' : 'ℹ️ GEMINI_API_KEY 연결 안내'}
              </span>
              <button
                type="button"
                onClick={checkStatus}
                disabled={isLoading}
                className="text-[11px] underline font-normal text-slate-600 dark:text-slate-300 hover:opacity-80 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
            <p className="leading-relaxed opacity-90">
              {status?.message || '상태를 확인하는 중입니다...'}
            </p>
          </div>
        </div>

        {/* Q&A section explicitly answering the user's question */}
        <div className="space-y-3.5">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1.5">
              <HelpCircle className="w-4 h-4 text-teal-600" />
              <span>Q. 채팅창에 API 키를 전달하면 되나요?</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              <strong>아닙니다! 절대 채팅창에 API 키를 직접 적지 마세요.</strong> API 키는 개인 비밀번호와 같아서 외부에 노출되면 안 됩니다.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>올바르고 안전한 API Key 등록 방법 (단 2단계)</span>
            </h4>

            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal pl-4 leading-relaxed">
              <li>
                Google AI Studio 화면의 <strong>좌측/우측 상단 메뉴 &gt; Settings &gt; Secrets</strong> 패널로 이동합니다.
              </li>
              <li>
                비밀 변수 이름에 <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[11px] text-teal-700 dark:text-teal-300">GEMINI_API_KEY</code>를 넣고, 발급받으신 Gemini API 키를 값으로 저장합니다.
              </li>
            </ol>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              💡 Secrets에 등록해두시면 이 애플리케이션의 백엔드 서버가 자동으로 <code className="font-mono">process.env.GEMINI_API_KEY</code>를 안전하게 인식하여 브라우저에 키 노출 없이 <strong>Gemini 3.8 Flash</strong>로 즉시 실시간 큐레이션을 제공합니다.
            </p>
          </div>
        </div>

        {/* Footer Button */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
