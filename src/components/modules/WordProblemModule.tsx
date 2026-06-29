/**
 * 文章題（立式→計算）モジュール。
 * ①場面から「しき」を選ぶ（スキーマ型立式, エビI）→ ②計算する の2段階。
 * TTS・イラスト(絵文字)で読解負荷を相殺。表面語に つられない練習。
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppShell } from '../shared/AppShell';
import { AnswerEntry } from '../shared/AnswerEntry';
import { HintBox, ResultPanel, Button } from '../ui/primitives';
import { WordProblem, generateWordProblem } from '../../lib/wordProblems';
import { useProgressStore } from '../../store/progressStore';
import { playClear, playCorrect, playSoftTry } from '../../lib/sound';

interface Props { onExit: () => void; }

export const WordProblemModule: React.FC<Props> = ({ onExit }) => {
  const [started, setStarted] = useState(false);
  const [problem, setProblem] = useState<WordProblem>(() => generateWordProblem());
  const [round, setRound] = useState(0);

  if (!started) {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button onClick={onExit} className="flex items-center gap-2 text-muted hover:text-content font-bold px-3 py-2 rounded-xl hover:bg-surface-3 transition-colors mb-2">
            <ChevronLeft size={24} /> 小数ランドへ
          </button>
          <div className="bg-surface border border-line rounded-[28px] shadow-xl p-8 md:p-12 text-center mt-4">
            <h1 className="text-3xl font-black text-content mb-2">ことばの もんだい</h1>
            <p className="text-muted font-bold leading-relaxed mb-8">
              おはなしを よんで、まず <span className="text-content">「しき」</span>を えらぼう。<br />
              ことば だけで きめず、ようすを 思いうかべてね。
            </p>
            <Button onClick={() => setStarted(true)} className="px-10 py-4 text-xl">スタート！</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell title="ことばの もんだい" subtitle="しき → 計算" onBack={onExit}>
      <Round key={round} problem={problem} onNext={() => { setProblem(generateWordProblem()); setRound((r) => r + 1); }} />
    </AppShell>
  );
};

export const Round: React.FC<{ problem: WordProblem; onNext: () => void; onResult?: (perfect: boolean) => void }> = ({ problem, onNext, onResult }) => {
  const [stage, setStage] = useState<'shiki' | 'calc' | 'done'>('shiki');
  const [pickedWrong, setPickedWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const recordResult = useProgressStore((s) => s.recordResult);

  const chooseShiki = (i: number) => {
    if (i === problem.correctIndex) {
      playCorrect();
      setPickedWrong(null);
      setHint(problem.why);
      setStage('calc');
    } else {
      playSoftTry();
      setMistakes((m) => m + 1);
      setPickedWrong(i);
      setHint('ようすを 思いうかべよう。「あわせる/のこり/1つ分のいくつ分/同じに分ける」の どれかな？');
    }
  };

  const submitAnswer = (v: string) => {
    if (Number(v) === Number(problem.answer)) {
      playClear();
      confetti({ particleCount: 130, spread: 70, origin: { y: 0.6 } });
      recordResult({ moduleId: 'word-problem', skillId: `wp-${problem.op}`, label: problem.text.slice(0, 18) + '…', correct: mistakes === 0 });
      onResult?.(mistakes === 0);
      setStage('done');
    } else {
      playSoftTry();
      setMistakes((m) => m + 1);
      setHint(`しきは ${problem.a} ${problem.op} ${problem.b} だね。もう一度 計算してみよう。`);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* おはなし */}
        <div className="bg-surface border border-line rounded-[28px] shadow-xl p-6 md:p-8">
          <div className="flex items-start gap-3">
            <span className="text-5xl shrink-0">{problem.emoji}</span>
            <p className="text-xl md:text-2xl font-black text-content leading-relaxed flex-1">{problem.text}</p>
          </div>
        </div>

        {hint && <HintBox tone={pickedWrong !== null && stage === 'shiki' ? 'wrong' : 'hint'}>{hint}</HintBox>}

        {stage === 'shiki' && (
          <div>
            <p className="text-center text-muted font-black mb-3">どの「しき」に なるかな？</p>
            <div className="grid grid-cols-1 gap-3">
              {problem.choices.map((c, i) => (
                <button key={i} onClick={() => chooseShiki(i)}
                  className={`p-5 rounded-2xl border-2 text-2xl font-black tabular-nums transition-all active:scale-[0.98] ${
                    pickedWrong === i ? 'bg-amber-50 border-amber-300 text-amber-500' : 'bg-surface border-line text-content hover:border-brand'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === 'calc' && (
          <div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Check className="text-emerald-500" size={22} />
              <p className="text-center text-content font-black text-xl tabular-nums">しき：{problem.a} {problem.op} {problem.b}</p>
            </div>
            <p className="text-center text-muted font-bold mb-3">こたえを 計算しよう（たんい：{problem.unit}）</p>
            <AnswerEntry onSubmit={submitAnswer} allowDecimal accentText="text-brand" />
          </div>
        )}

        {stage === 'done' && (
          <ResultPanel perfect={mistakes === 0} detail={<span className="tabular-nums">{problem.a} {problem.op} {problem.b} = {problem.answer} {problem.unit}</span>} onNext={onNext} accentClass="bg-brand hover:bg-brand-strong" />
        )}
      </div>
    </div>
  );
};
