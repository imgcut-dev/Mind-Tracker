import React, { useState } from 'react';
import { BookItem, AIServiceItem, EmotionBall } from '../data/emotions';
import { BookOpen, Sparkles, ExternalLink, Copy, Check, ArrowRight, Book, Bot, Compass, RefreshCw } from 'lucide-react';

interface RecommendationViewProps {
  primaryEmotion: string;
  emotionAnalysis?: string;
  books: BookItem[];
  aiServices: AIServiceItem[];
  selectedEmotions: EmotionBall[];
  textQuery?: string;
  isAiGenerated?: boolean;
  onReset: () => void;
  onRefreshAi?: () => void;
  isLoadingAi?: boolean;
}

export const RecommendationView: React.FC<RecommendationViewProps> = ({
  primaryEmotion,
  emotionAnalysis,
  books,
  aiServices,
  selectedEmotions,
  textQuery,
  isAiGenerated,
  onReset,
  onRefreshAi,
  isLoadingAi,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'books' | 'ai'>('all');
  const [selectedBookIndex, setSelectedBookIndex] = useState(0);
  const [selectedAiIndex, setSelectedAiIndex] = useState(0);
  const [copiedTip, setCopiedTip] = useState<string | null>(null);

  const selectedBook = books[selectedBookIndex] || books[0];
  const selectedAi = aiServices[selectedAiIndex] || aiServices[0];

  const handleCopyPrompt = (tip: string) => {
    navigator.clipboard.writeText(tip);
    setCopiedTip(tip);
    setTimeout(() => setCopiedTip(null), 2000);
  };

  const getEmotionColor = (index: number) => {
    if (selectedEmotions[index]) return selectedEmotions[index].color;
    const colors = ['#B7D3F2', '#F2D49B', '#C9C6F0', '#BFD8B5'];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn">
      {/* Header Analysis Card */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-teal-50 via-cyan-50/60 to-slate-50 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900 border border-teal-100 dark:border-slate-700 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-600 text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAiGenerated ? 'Gemini 3.8 Flash 맞춤 큐레이션' : '마음 큐레이션'}</span>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshAi && (
              <button
                type="button"
                onClick={onRefreshAi}
                disabled={isLoadingAi}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-700 dark:text-teal-300 hover:bg-teal-100/60 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingAi ? 'animate-spin' : ''}`} />
                <span>새로운 추천 받기</span>
              </button>
            )}

            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            >
              처음으로
            </button>
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
          {textQuery ? (
            <span>
              "{textQuery}" 속에서 찾은 마음: <span className="text-teal-600 dark:text-teal-400">‘{primaryEmotion}’</span>
            </span>
          ) : (
            <span>
              선택한 마음 {selectedEmotions.map((e) => `‘${e.name}’`).join(', ')}에서 건진 이야기
            </span>
          )}
        </h3>

        {emotionAnalysis && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2 font-normal">
            {emotionAnalysis}
          </p>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-teal-100/80 dark:border-slate-700/80">
          <span className="text-xs text-slate-500 font-medium mr-1">보기 선택:</span>
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50'
            }`}
          >
            전체 처방 ({books.length + aiServices.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('books')}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer flex items-center gap-1 ${
              filterTab === 'books'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50'
            }`}
          >
            <Book className="w-3 h-3" />
            도서 추천 ({books.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('ai')}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer flex items-center gap-1 ${
              filterTab === 'ai'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bot className="w-3 h-3" />
            AI 서비스 ({aiServices.length})
          </button>
        </div>
      </div>

      {/* SECTION 1: BOOKS (Visible if filter is 'all' or 'books') */}
      {(filterTab === 'all' || filterTab === 'books') && books.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>마음을 어루만지는 도서 큐레이션</span>
            </h4>
            <span className="text-xs text-slate-500">책 표지를 눌러 상세 정보를 확인하세요</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Shelf Book Covers (Left 5 cols) */}
            <div className="md:col-span-5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-2 gap-2.5">
              {books.map((book, idx) => {
                const isSelected = idx === selectedBookIndex;
                const bookColor = getEmotionColor(idx);
                return (
                  <button
                    key={`${book.title}-${idx}`}
                    type="button"
                    onClick={() => setSelectedBookIndex(idx)}
                    className={`relative p-3.5 rounded-lg text-left flex flex-col justify-between transition-all aspect-[2/3] book-spine cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-teal-600 ring-offset-2 scale-102 shadow-lg z-10'
                        : 'opacity-85 hover:opacity-100 hover:scale-101'
                    }`}
                    style={{
                      backgroundColor: bookColor,
                    }}
                  >
                    {/* Spine line */}
                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/15 rounded-l-lg" />

                    <div className="pl-1">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/70 text-slate-800 mb-1 max-w-full truncate">
                        {book.genre || '추천도서'}
                      </span>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-3">
                        {book.title}
                      </h5>
                    </div>

                    <div className="pl-1 text-[11px] text-slate-700 truncate font-medium">
                      {book.author}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Book Details (Right 7 cols) */}
            {selectedBook && (
              <div className="md:col-span-7 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      {selectedBook.genre || '도서'}
                    </span>
                    {selectedBook.year && <span>• {selectedBook.year}년 출간</span>}
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedBook.title}
                  </h4>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                    저자: {selectedBook.author}
                  </p>
                </div>

                {selectedBook.intro && (
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    {selectedBook.intro}
                  </p>
                )}

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider block">
                    이 책이 추천된 이유
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-normal">
                    {selectedBook.reason}
                  </p>
                </div>

                {selectedBook.forWhom && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">이런 분께</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-slate-700/40 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-slate-600">
                      💡 {selectedBook.forWhom}
                    </p>
                  </div>
                )}

                {/* Keywords */}
                {selectedBook.keywords && selectedBook.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedBook.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bookstore Quick Links */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 mr-1">서점에서 확인:</span>
                  <a
                    href={`https://search.kyobobook.co.kr/search?keyword=${encodeURIComponent(selectedBook.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    교보문고
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a
                    href={`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=All&SearchWord=${encodeURIComponent(
                      selectedBook.title
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    알라딘
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a
                    href={`https://search.naver.com/search.naver?query=${encodeURIComponent(selectedBook.title + ' 책')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    네이버 도서
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 2: AI SERVICES (Visible if filter is 'all' or 'ai') */}
      {(filterTab === 'all' || filterTab === 'ai') && aiServices.length > 0 && (
        <section className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-cyan-600" />
              <span>문제를 해결하고 위로를 주는 AI 서비스 큐레이션</span>
            </h4>
            <span className="text-xs text-slate-500">실시간 활용 가능한 추천 도구</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {aiServices.map((ai, idx) => (
              <div
                key={`${ai.name}-${idx}`}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200">
                      {ai.category}
                    </span>
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      {ai.badge}
                    </span>
                  </div>

                  <h5 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>{ai.name}</span>
                  </h5>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {ai.reason}
                  </p>
                </div>

                {/* Practical Usage Prompt Tip */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-600 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>💡 바로 써보는 추천 프롬프트:</span>
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(ai.usageTip)}
                      className="text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                      title="프롬프트 복사"
                    >
                      {copiedTip === ai.usageTip ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 text-[10px]">복사됨</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="text-[10px]">복사</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-600 select-all line-clamp-3">
                    {ai.usageTip}
                  </p>
                </div>

                {/* Keywords & Link */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap gap-1">
                    {ai.keywords.map((k) => (
                      <span key={k} className="text-[10px] text-slate-400">
                        #{k}
                      </span>
                    ))}
                  </div>

                  <a
                    href={ai.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors shadow-xs"
                  >
                    <span>열기</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
