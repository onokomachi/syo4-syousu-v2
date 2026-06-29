/**
 * エラーハンター（誤り例の発見・修正・理由の言語化）。
 * 「正しい？まちがい？」→（まちがいなら）正しい答え→なぜ まちがえた？ の3ステップ。
 * 失敗は責めず、ヒントで支える（誤り例＋自己説明, エビレベルII）。
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, RotateCcw, Lightbulb, Search, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppShell } from '../shared/AppShell';
import { AnswerEntry } from '../shared/AnswerEntry';
import { ErrorExample, generateError } from '../../lib/errorHunter';
import { useProgressStore } from '../../store/progressStore';
import { playClear, playSoftTry } from '../../lib/sound';

interface Props { onExit: () => void; }

export const ErrorHunterModule: React.FC<Props> = ({ onExit }) => {
  const [started, setStarted] = useState(false);
  const [ex, setEx] = useState<ErrorExample>(() => generateError());
  const [round, setRound] = useState(0);

  if (!started) {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button onClick={onExit} className="flex items-center gap-2 text-muted hover:text-content font-bold px-3 py-2 rounded-xl hover:bg-surface-3 transition-colors mb-2">
            <ChevronLeft size={24} /> 小数ランドへ
          </button>
          <div className="bg-surface rounded-[36px] shadow-2xl border border-line p-8 md:p-12 text-center mt-4">
            <div className="w-24 h-24 rounded-3xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-6"><Search size={44} /></div>
            <h1 className="text-3xl font-black text-content mb-2">エラーハンター</h1>
            <p className="text-muted font-bold leading-relaxed mb-8">
              ともだちの 計算を チェック！「正しい？ まちがい？」を 見ぬいて、まちがいは 正しく なおそう。<br />まちがいは 学びの たからもの だよ。
            </p>
            <button onClick={() => setStarted(true)} className="px-10 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">スタート！</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell title="エラーハンター" subtitle="まちがい さがし" onBack={onExit}>
      <ErrorRound key={round} ex={ex} onNext={() => { setEx(generateError()); setRound((r) => r + 1); }} />
    </AppShell>
  );
};

export const ErrorRound: React.FC<{ ex: ErrorExample; onNext: () => void; startStage?: 'judge' | 'fix'; onResult?: (perfect: boolean) => void }> = ({ ex, onNext, startStage = 'judge', onResult }) => {
  const [stage, setStage] = useState<'judge' | 'fix' | 'reason' | 'done'>(startStage);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const recordResult = useProgressStore((s) => s.recordResult);

  const finish = () => {
    setStage('done');
    playClear();
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    recordResult({ moduleId: 'error-hunter', skillId: ex.isCorrect ? 'judge-correct' : `fix-${ex.fixKind}`, label: ex.expr, correct: mistakes === 0 });
    onResult?.(mistakes === 0);
  };

  const judge = (saysCorrect: boolean) => {
    setHint(null);
    if (saysCorrect === ex.isCorrect) {
      if (ex.isCorrect) finish(); // 正しい式を「正しい」と見ぬけた
      else setStage('fix'); // まちがいを「まちがい」と見ぬけた
    } else {
      playSoftTry();
      setMistakes((m) => m + 1);
      setHint(ex.isCorrect ? 'もう一度 よく見て。この式は 合っているかな？' : 'もう一度 よく見て。どこかに まちがいが あるよ。');
    }
  };

  const submitFix = (v: string) => {
    if (Number(v) === Number(ex.correctAnswer)) setStage('reason');
    else { playSoftTry(); setMistakes((m) => m + 1); setHint('正しい 答えを もう一度 計算してみよう。小数点の いちに 気をつけて。'); }
  };
  const submitSign = (s: string) => {
    if (s === ex.correctAnswer) setStage('reason');
    else { playSoftTry(); setMistakes((m) => m + 1); setHint('数直線で 考えよう。右にあるほうが 大きいよ。'); }
  };
  const chooseReason = (i: number) => {
    if (i === ex.correctReasonIndex) finish();
    else { playSoftTry(); setMistakes((m) => m + 1); setHint('うーん、ちがうみたい。どんな まちがいだったか もう一度 考えよう。'); }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-surface rounded-[36px] shadow-2xl border border-line p-6 md:p-10">
          {/* 出題（ともだちの計算） */}
          <div className="bg-surface-2 rounded-3xl p-6 mb-6 border border-line">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black text-faint">{ex.character}さんの こたえ</span>
            </div>
            <div className="text-4xl md:text-5xl font-black text-content text-center tabular-nums py-2">{ex.expr}</div>
          </div>

          {hint && (
            <div className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-2">
              <Lightbulb className="text-amber-500 shrink-0" size={20} /><p className="text-muted font-bold">{hint}</p>
            </div>
          )}

          {stage === 'judge' && (
            <>
              <p className="text-center text-muted font-bold mb-4">この こたえは…？</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => judge(true)} className="flex items-center gap-2 px-8 py-5 rounded-2xl bg-surface border-2 border-emerald-200 text-emerald-600 font-black text-xl hover:bg-emerald-50 active:scale-95 transition-all"><Check size={28} /> 正しい</button>
                <button onClick={() => judge(false)} className="flex items-center gap-2 px-8 py-5 rounded-2xl bg-surface border-2 border-rose-200 text-rose-500 font-black text-xl hover:bg-rose-50 active:scale-95 transition-all"><X size={28} /> まちがい</button>
              </div>
            </>
          )}

          {stage === 'fix' && (
            <>
              <p className="text-center text-muted font-black mb-4">正しい こたえは？</p>
              {ex.fixKind === 'number' ? (
                <AnswerEntry onSubmit={submitFix} allowDecimal accentText="text-cyan-600" />
              ) : (
                <div className="flex justify-center gap-4">
                  {(['>', '=', '<'] as const).map((s) => (
                    <button key={s} onClick={() => submitSign(s)} className="w-24 h-24 rounded-3xl text-5xl font-black bg-surface border-2 border-line text-content hover:border-cyan-400 active:scale-95 transition-all">{s}</button>
                  ))}
                </div>
              )}
            </>
          )}

          {stage === 'reason' && (
            <>
              <p className="text-center text-muted font-black mb-4">なぜ まちがえたのかな？</p>
              <div className="flex flex-col gap-3">
                {ex.reasonOptions.map((r, i) => (
                  <button key={i} onClick={() => chooseReason(i)} className="text-left p-4 rounded-2xl bg-surface border-2 border-line text-content font-bold hover:border-cyan-400 active:scale-[0.99] transition-all">{r}</button>
                ))}
              </div>
            </>
          )}

          {stage === 'done' && (
            <div className="text-center">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-6xl mb-3">{mistakes === 0 ? '🏆' : '🎉'}</motion.div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-black px-5 py-3 rounded-2xl">
                {ex.isCorrect ? 'この式は 正しかったね！' : `正しい こたえは ${ex.correctAnswer} だね！`}
              </div>
              <div><button onClick={onNext} className="mt-6 px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">つぎの もんだい</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
