import React from 'react';
import { PhoneCall, HeartHandshake, X } from 'lucide-react';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900/50 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <HeartHandshake className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            소중한 당신의 마음에 귀 기울입니다
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            혼자 견디기 힘든 아픔이나 위기 상황이 느껴지신다면, 언제든 24시간 열려 있는 전문 상담기관에 도움을 청해 주세요.
          </p>
        </div>

        <div className="w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex flex-col items-center gap-1.5">
          <span className="text-xs font-semibold text-rose-800 dark:text-rose-200">
            자살예방 상담전화 (24시간)
          </span>
          <a
            href="tel:109"
            className="inline-flex items-center gap-2 text-2xl font-black text-rose-600 dark:text-rose-400 hover:underline"
          >
            <PhoneCall className="w-5 h-5 animate-pulse" />
            <span>국번없이 109</span>
          </a>
          <span className="text-[11px] text-slate-500">정신건강 상담전화 1577-0199</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          확인했습니다
        </button>
      </div>
    </div>
  );
};
