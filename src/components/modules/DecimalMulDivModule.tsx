/**
 * 小数の かけ算・わり算（筆算）モジュール。
 * - かけ算: 整数として積を立て、最後に「小数点をうつ」（積の小数点の位置決定＝核心スキル, Mugz対策）
 * - わり算: 商の小数点を被除数の真上にそろえる・割り進み・空位0・あまり（Dugz対策）
 * 既存 DivisionSimulator の見た目／グリッド配置・採点演出のパターンと共通部品を再利用する。
 */
import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, RotateCcw, Lightbulb, X as XIcon, Divide } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppShell } from '../shared/AppShell';
import { Keypad } from '../shared/Keypad';
import {
  MUL_LEVELS, MulLevel, MulProblem, buildMul, generateMul,
  DIV_LEVELS, DivLevel, DivProblem, buildDiv, generateDiv,
} from '../../lib/decimalMulDiv';
import { useProgressStore } from '../../store/progressStore';
import { LevelCard } from '../ui/primitives';
import { playClear, playCorrect, playSoftTry } from '../../lib/sound';
import { useAdaptive } from '../../lib/useAdaptive';
import { AdaptiveBar } from '../shared/AdaptiveBar';
import { Wand2 } from 'lucide-react';

interface Props {
  onExit: () => void;
}

type Op = 'mul' | 'div';

export const DecimalMulDivModule: React.FC<Props> = ({ onExit }) => {
  const [phase, setPhase] = useState<'SETUP' | 'SIM'>('SETUP');
  const [op, setOp] = useState<Op>('mul');
  const [mode, setMode] = useState<'fixed' | 'adaptive'>('fixed');
  const [mulLevel, setMulLevel] = useState<MulLevel>('mul-tenths');
  const [divLevel, setDivLevel] = useState<DivLevel>('div-basic');
  const [mulProblem, setMulProblem] = useState<MulProblem | null>(null);
  const [divProblem, setDivProblem] = useState<DivProblem | null>(null);
  const mulAdaptive = useAdaptive(MUL_LEVELS.map((l) => l.id), 'mul');
  const divAdaptive = useAdaptive(DIV_LEVELS.map((l) => l.id), 'div');

  const effMulLevel = mode === 'adaptive' ? mulAdaptive.level : mulLevel;
  const effDivLevel = mode === 'adaptive' ? divAdaptive.level : divLevel;
  const getMasteryStreak = useProgressStore((s) => s.getMasteryStreak);
  const getTodaySkillCount = useProgressStore((s) => s.getTodaySkillCount);

  const startMul = (lv: MulLevel) => {
    setOp('mul'); setMode('fixed'); setMulLevel(lv); setMulProblem(generateMul(lv)); setPhase('SIM');
  };
  const startDiv = (lv: DivLevel) => {
    setOp('div'); setMode('fixed'); setDivLevel(lv); setDivProblem(generateDiv(lv)); setPhase('SIM');
  };
  const startMulAdaptive = () => {
    setOp('mul'); setMode('adaptive'); setMulProblem(generateMul(mulAdaptive.level)); setPhase('SIM');
  };
  const startDivAdaptive = () => {
    setOp('div'); setMode('adaptive'); setDivProblem(generateDiv(divAdaptive.level)); setPhase('SIM');
  };

  if (phase === 'SETUP') {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-muted hover:text-content font-bold px-3 py-2 rounded-xl hover:bg-surface-3 transition-colors mb-2"
          >
            <ChevronLeft size={24} /> 小数ランドへ
          </button>
          <h1 className="text-3xl font-black text-content text-center mb-6">小数の かけ算・わり算</h1>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-violet-600">
              <XIcon size={20} /><span className="font-black">かけ算（小数 × 整数）</span>
            </div>
            <button onClick={startMulAdaptive} className="w-full mb-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow hover:shadow-lg text-left transition-all active:scale-[0.98] flex items-center gap-3">
              <Wand2 size={24} /><div><div className="font-black">おまかせ（じどうレベル）</div><div className="text-sm text-white/80">むずかしさが かわるよ</div></div>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MUL_LEVELS.map((lv) => (
                <LevelCard
                  key={lv.id}
                  label={lv.label}
                  desc={lv.description}
                  mastery={getMasteryStreak(`mul-${lv.id}`)}
                  todayCount={getTodaySkillCount(`mul-${lv.id}`)}
                  onClick={() => startMul(lv.id)}
                  accentBorder="hover:border-violet-400"
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 text-blue-600">
              <Divide size={20} /><span className="font-black">わり算（小数 ÷ 整数）</span>
            </div>
            <button onClick={startDivAdaptive} className="w-full mb-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow hover:shadow-lg text-left transition-all active:scale-[0.98] flex items-center gap-3">
              <Wand2 size={24} /><div><div className="font-black">おまかせ（じどうレベル）</div><div className="text-sm text-white/80">むずかしさが かわるよ</div></div>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DIV_LEVELS.map((lv) => (
                <LevelCard
                  key={lv.id}
                  label={lv.label}
                  desc={lv.description}
                  mastery={getMasteryStreak(`div-${lv.id}`)}
                  todayCount={getTodaySkillCount(`div-${lv.id}`)}
                  onClick={() => startDiv(lv.id)}
                  accentBorder="hover:border-blue-400"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const title = op === 'mul' ? '小数の かけ算' : '小数の わり算';
  const adaptiveState = op === 'mul' ? mulAdaptive : divAdaptive;
  const subtitle = mode === 'adaptive' ? 'おまかせ'
    : op === 'mul' ? MUL_LEVELS.find((l) => l.id === mulLevel)?.label
      : DIV_LEVELS.find((l) => l.id === divLevel)?.label;

  return (
    <AppShell title={title} subtitle={subtitle} onBack={() => setPhase('SETUP')}>
      <div className="flex flex-col h-full">
        {mode === 'adaptive' && (
          <AdaptiveBar index={adaptiveState.index} total={adaptiveState.total} leveledUp={adaptiveState.leveledUp} onClearLevelUp={adaptiveState.clearLevelUp} />
        )}
        <div className="flex-1 min-h-0">
          {op === 'mul' && mulProblem && (
            <MulSimulator
              key={`${mulProblem.a}x${mulProblem.b}`}
              problem={mulProblem} level={effMulLevel}
              onNext={() => setMulProblem(generateMul(effMulLevel))}
              onResult={mode === 'adaptive' ? mulAdaptive.onResult : undefined}
            />
          )}
          {op === 'div' && divProblem && (
            <DivSimulator
              key={`${divProblem.dividend}/${divProblem.divisor}`}
              problem={divProblem} level={effDivLevel}
              onNext={() => setDivProblem(generateDiv(effDivLevel))}
              onResult={mode === 'adaptive' ? divAdaptive.onResult : undefined}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
};

/* ============================ かけ算 ============================ */

const MCELL = 50;
const MGAP = 18;

const MulSimulator: React.FC<{ problem: MulProblem; level: MulLevel; onNext: () => void; onResult?: (perfect: boolean) => void }> = ({ problem, level, onNext, onResult }) => {
  const model = useMemo(() => buildMul(problem.a, problem.b), [problem]);
  const { productIntDigits, decimals, product, b } = model;
  const aScaled = Math.round(problem.a * 10 ** decimals).toString();
  const totalCols = Math.max(productIntDigits.length, aScaled.length);

  const [stage, setStage] = useState<'DIGITS' | 'POINT' | 'DONE'>('DIGITS');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [buffer, setBuffer] = useState(''); // アクティブセルの入力中（最大2桁）
  const [carries, setCarries] = useState<Record<number, string>>({}); // くり上がりメモ（被乗数の上・採点なし）
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [shakeCol, setShakeCol] = useState<number | null>(null);
  const recordResult = useProgressStore((s) => s.recordResult);

  const rightAlign = (str: string): string[] => {
    const arr = Array(totalCols).fill('');
    for (let i = 0; i < str.length; i++) arr[totalCols - str.length + i] = str[i];
    return arr;
  };
  const aCells = rightAlign(aScaled);
  const prodCells = rightAlign(productIntDigits);
  const dotGap = totalCols - 1 - decimals; // この cell の右のすきまに小数点
  const expectedPointGap = dotGap;

  const activeCol = useMemo(() => {
    for (let c = totalCols - 1; c >= 0; c--) {
      if (prodCells[c] !== '' && answers[c] === undefined) return c;
    }
    return null;
  }, [answers, prodCells, totalCols]);

  const finish = () => {
    setStage('DONE');
    playClear();
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    recordResult({ moduleId: 'decimal-muldiv', skillId: `mul-${level}`, label: `${problem.a} × ${problem.b}`, correct: mistakes === 0 });
    onResult?.(mistakes === 0);
  };

  const handleInput = (d: string) => {
    if (stage !== 'DIGITS' || activeCol === null || d === '.') return;
    // 2桁まで入力可能。最後に入れた桁＝答え（一の位・採点）、その前の桁＝くり上がりメモ（十の位・採点なし）
    const buf = (buffer + d).slice(-2);
    const ones = buf[buf.length - 1];
    const tens = buf.length === 2 ? buf[0] : null;

    if (ones === prodCells[activeCol]) {
      // 答えが合っていれば確定。2桁入力なら十の位を 隣（左）の位の上に くり上がりメモ表示。
      const next = { ...answers, [activeCol]: ones };
      setAnswers(next);
      setBuffer('');
      if (tens && activeCol - 1 >= 0) setCarries((c) => ({ ...c, [activeCol - 1]: tens }));
      setHint(null);
      const allDone = prodCells.every((c, i) => c === '' || next[i] !== undefined);
      if (allDone) { setStage('POINT'); setHint(`小数点より下の数字は ${decimals}こ。だから 右から ${decimals}こ 数えて 小数点をうとう。`); }
      else playCorrect();
    } else if (buf.length === 1) {
      // まだ1桁。十の位（くり上がり）の入力中かもしれないので、誤りにはせず保持。
      setBuffer(buf);
    } else {
      // 2桁入れても一の位が合わない＝まちがい。
      playSoftTry();
      setMistakes((m) => m + 1);
      setBuffer('');
      setShakeCol(activeCol); setTimeout(() => setShakeCol(null), 450);
      setHint('一の位の 数字を 入れてね。くり上がりが あるときは 2けた 入れると、十の位が 左の上に 小さく出るよ。');
    }
  };
  const handleBackspace = () => {
    if (stage !== 'DIGITS') return;
    if (buffer) { setBuffer(''); return; } // 入力中バッファを先に消す
    const filled = Object.keys(answers).map(Number);
    if (filled.length === 0) return;
    const target = Math.max(...filled);
    const next = { ...answers }; delete next[target];
    setAnswers(next);
    // その桁の入力で付けた左隣のくり上がりメモも消す
    setCarries((c) => { const n = { ...c }; delete n[target - 1]; return n; });
  };
  const placePoint = (gap: number) => {
    if (stage !== 'POINT') return;
    if (gap === expectedPointGap) { finish(); }
    else { setMistakes((m) => m + 1); setHint(`小数点より下の数字は ${decimals}こだよ。右から ${decimals}こ 数えてみよう。`); }
  };
  const reset = () => { setAnswers({}); setBuffer(''); setCarries({}); setStage('DIGITS'); setMistakes(0); setHint(null); };

  // 行の描画（cell と gap を交互に）
  const renderRow = (
    cells: string[],
    opts: { showDotAtGap?: number; interactive?: boolean; isProduct?: boolean; showCarry?: boolean } = {}
  ) => (
    <div className="flex items-center justify-end">
      {cells.map((ch, c) => (
        <React.Fragment key={c}>
          {c > 0 && (
            <div style={{ width: MGAP, height: 60 }} className="flex items-end justify-center pb-2 relative">
              {opts.showDotAtGap === c - 1 && <span className="text-amber-500 font-black text-3xl leading-none">.</span>}
              {opts.interactive && c - 1 <= totalCols - 2 && (
                <button
                  onClick={() => placePoint(c - 1)}
                  className="absolute inset-x-[-6px] bottom-0 h-10 rounded-md bg-amber-100 hover:bg-amber-300 border border-amber-300 text-amber-600 text-xl font-black"
                  aria-label="ここに小数点"
                >∙</button>
              )}
            </div>
          )}
          <motion.div
            animate={shakeCol === c ? { x: [0, -6, 6, -6, 0] } : { x: 0 }}
            style={{ width: MCELL, height: 60 }}
            className={`relative flex items-center justify-center text-4xl font-black ${
              opts.isProduct && activeCol === c && stage === 'DIGITS'
                ? 'bg-violet-50 ring-4 ring-violet-400 ring-inset rounded-xl' : ''
            }`}
          >
            {/* くり上がりメモ（補助線のすぐ下・左隣けたの右上に小さく・採点なし。「？」枠と重ならないよう右へ） */}
            {opts.showCarry && carries[c] && (
              <span className="absolute -top-1 right-[-10px] text-base font-black text-rose-400 leading-none">{carries[c]}</span>
            )}
            {opts.isProduct ? (
              answers[c] !== undefined ? <span className="text-violet-600">{answers[c]}</span>
                : activeCol === c && stage === 'DIGITS'
                  ? (buffer ? <span className="text-violet-400">{buffer}</span> : <span className="text-violet-300 animate-pulse">？</span>)
                : prodCells[c] !== '' && (stage === 'POINT' || stage === 'DONE') ? <span className="text-violet-600">{prodCells[c]}</span>
                : null
            ) : (
              ch !== '' ? <span className="text-content">{ch}</span> : null
            )}
          </motion.div>
        </React.Fragment>
      ))}
    </div>
  );

  const lineW = totalCols * MCELL + (totalCols - 1) * MGAP;

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="flex-1 overflow-auto p-4 md:p-10 flex justify-center items-start">
        <div className="bg-surface p-8 md:p-12 rounded-[36px] shadow-2xl border border-line">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h2 className="text-2xl font-black text-content tabular-nums">{problem.a} × {problem.b}</h2>
          </div>
          <div className="font-mono">
            {renderRow(aCells, { showDotAtGap: dotGap })}
            {/* ×b 行 */}
            <div className="flex items-center justify-end relative">
              <span className="absolute left-[-40px] text-3xl font-black text-muted">×</span>
              {renderRow(rightAlign(b.toString()))}
            </div>
            <div className="border-b-4 border-slate-800 rounded-full my-1 ml-auto" style={{ width: lineW }} />
            {renderRow(prodCells, {
              isProduct: true,
              interactive: stage === 'POINT',
              showCarry: true,
              showDotAtGap: stage === 'DONE' ? dotGap : undefined,
            })}
          </div>
        </div>
      </div>

      <div className="w-full md:w-[400px] bg-surface border-l border-line p-6 md:p-8 flex flex-col gap-5 overflow-y-auto">
        {stage === 'DONE' ? (
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-violet-50 border border-violet-100 rounded-3xl text-center">
            <span className="text-6xl mb-4">{mistakes === 0 ? '🏆' : '🎉'}</span>
            <h3 className="text-2xl font-black text-violet-800 mb-2">{mistakes === 0 ? 'パーフェクト！' : 'できたね！'}</h3>
            <p className="text-violet-600 font-bold mb-2">{problem.a} × {problem.b} = {product}</p>
            <button onClick={onNext} className="w-full py-4 mt-4 bg-violet-500 hover:bg-violet-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">つぎの もんだい</button>
          </div>
        ) : (
          <>
            <div className="bg-violet-50 p-6 rounded-3xl border border-violet-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-violet-700 font-black text-lg flex items-center gap-2"><Lightbulb size={20} /> ヒント</h3>
              </div>
              <p className="text-muted font-bold leading-relaxed">
                {hint ?? (stage === 'DIGITS'
                  ? 'まず 小数点を 考えずに、整数の かけ算として 一の位から 計算しよう。'
                  : `小数点より下の数字は ${decimals}こ。右から ${decimals}こ 数えて、すきまの ボタンを おそう。`)}
              </p>
            </div>
            {stage === 'DIGITS' && (
              <div className="flex-1 flex flex-col justify-center">
                <Keypad onInput={handleInput} onBackspace={handleBackspace} />
              </div>
            )}
          </>
        )}
        <button onClick={reset} className="flex items-center justify-center gap-2 text-faint hover:text-muted py-4 font-bold border-t border-line shrink-0">
          <RotateCcw size={20} /> さいしょから
        </button>
      </div>
    </div>
  );
};

/* ============================ わり算 ============================ */

const DLEAD = 52;
const DCELL = 50;
const DH = 56;

type DivStage = 'PLACE' | 'QUOTIENT' | 'MUL' | 'SUB' | 'BRING';

const DivSimulator: React.FC<{ problem: DivProblem; level: DivLevel; onNext: () => void; onResult?: (perfect: boolean) => void }> = ({ problem, level, onNext, onResult }) => {
  const model = useMemo(() => buildDiv(problem), [problem]);
  const { divisor, steps, intLen, baseLen, quotientStartIndex, quotientPointIndex, quotientValue, remainderValue, mode } = model;

  const displayDigits = mode === 'remainder' ? model.digits + model.fracStr : model.digits;
  const n = displayDigits.length;

  // 先頭の桁（商の先頭0で「書かない」桁）は手続きから除外する。
  const activeSteps = useMemo(
    () => steps.filter((s) => s.index >= quotientStartIndex),
    [steps, quotientStartIndex]
  );

  const [stepIdx, setStepIdx] = useState(0);
  const [stage, setStage] = useState<DivStage>('PLACE');
  const [enteredQ, setEnteredQ] = useState<Record<number, number>>({});
  // step ごとの「かける」「ひく/おろす」行に入力した数字（col -> 文字）
  const [mulByStep, setMulByStep] = useState<Record<number, Record<number, string>>>({});
  const [subByStep, setSubByStep] = useState<Record<number, Record<number, string>>>({});
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const recordResult = useProgressStore((s) => s.recordResult);

  const current = activeSteps[stepIdx];
  const isLast = stepIdx >= activeSteps.length - 1;

  // 現ステップの「かける」値（=商×除数）と列範囲
  const mulStr = current ? current.multiply.toString() : '';
  const mulStart = current ? current.index - mulStr.length + 1 : 0;
  const mulCols = current ? Array.from({ length: mulStr.length }, (_, i) => mulStart + i) : [];
  // 現ステップの「ひく」結果（=あまり, 1桁）。列は current.index。
  const subStr = current ? current.remainder.toString() : '';

  const curMul = (current && mulByStep[stepIdx]) || {};
  const curSub = (current && subByStep[stepIdx]) || {};
  const activeMulCol = mulCols.find((c) => curMul[c] === undefined) ?? null;
  const subDone = current ? curSub[current.index] !== undefined : true;

  const wrong = (msg: string) => {
    playSoftTry();
    setMistakes((m) => m + 1);
    setShake(true); setTimeout(() => setShake(false), 450);
    setHint(msg);
  };

  const finish = (miss: number) => {
    setFinished(true);
    playClear();
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    recordResult({
      moduleId: 'decimal-muldiv', skillId: `div-${level}`,
      label: `${problem.dividend} ÷ ${problem.divisor}`, correct: miss === 0,
    });
    onResult?.(miss === 0);
  };

  // たてる：商を書く位（列）をタップ
  const placeAt = (c: number) => {
    if (finished || stage !== 'PLACE' || !current) return;
    if (c === current.index) { setHint(null); setStage('QUOTIENT'); playCorrect(); }
    else wrong('商は わられる数の 計算した位の 真上に 書くよ。正しい ますを えらぼう。');
  };

  const handleInput = (d: string) => {
    if (finished || !current || d === '.') return;
    const num = Number(d);

    if (stage === 'QUOTIENT') {
      if (num === current.quotient) {
        setEnteredQ((p) => ({ ...p, [current.index]: current.quotient }));
        setHint(null); setStage('MUL'); playCorrect();
      } else {
        wrong(`${current.dividendPart} の中に ${divisor} は いくつ 入るかな？大きすぎても 小さすぎても だめだよ。`);
      }
      return;
    }

    if (stage === 'MUL') {
      if (activeMulCol === null) return;
      const expected = mulStr[activeMulCol - mulStart];
      if (d === expected) {
        const nextMul = { ...curMul, [activeMulCol]: d };
        setMulByStep((p) => ({ ...p, [stepIdx]: nextMul }));
        setHint(null);
        if (mulCols.every((c) => nextMul[c] !== undefined)) { setStage('SUB'); }
        else playCorrect();
      } else {
        wrong(`「かける」だよ。商 ${current.quotient} × ${divisor} の 答えを 書こう。`);
      }
      return;
    }

    if (stage === 'SUB') {
      if (d === subStr) {
        setSubByStep((p) => ({ ...p, [stepIdx]: { ...curSub, [current.index]: d } }));
        setHint(null);
        if (isLast) { finish(mistakes); }
        else { setStage('BRING'); playCorrect(); }
      } else {
        wrong(`「ひく」だよ。${current.dividendPart} − ${current.multiply} は いくつかな？`);
      }
      return;
    }
  };

  // おろす：次の位の数字を下ろして 次のステップへ
  const bringDown = () => {
    if (finished || stage !== 'BRING' || isLast) return;
    const nxt = activeSteps[stepIdx + 1];
    const broughtDigit = displayDigits[nxt.index];
    setSubByStep((p) => ({ ...p, [stepIdx]: { ...(p[stepIdx] ?? {}), [nxt.index]: broughtDigit } }));
    setStepIdx(stepIdx + 1);
    setStage('PLACE');
    playCorrect();
    if (nxt.index === quotientPointIndex) {
      setHint('ここからは 小数点より下だね。商の小数点は わられる数の 小数点の 真上に うつよ。');
    } else {
      setHint(null);
    }
  };

  const handleBackspace = () => {
    if (finished || !current) return;
    if (stage === 'MUL') {
      const filled = mulCols.filter((c) => curMul[c] !== undefined);
      if (filled.length === 0) return;
      const last = filled[filled.length - 1];
      const next = { ...curMul }; delete next[last];
      setMulByStep((p) => ({ ...p, [stepIdx]: next }));
    }
  };

  const reset = () => {
    setStepIdx(0); setStage('PLACE'); setEnteredQ({}); setMulByStep({}); setSubByStep({});
    setFinished(false); setMistakes(0); setHint(null);
  };

  const gridStyle = { gridTemplateColumns: `${DLEAD}px repeat(${n}, ${DCELL}px)` } as React.CSSProperties;

  // 小数点ドット（数字セルの右端）
  const Dot = () => (
    <span className="absolute right-[-3px] bottom-2 text-amber-500 font-black text-3xl leading-none z-20">.</span>
  );

  // 各ステップの作業行（かける・ひく/おろす）を、入力済みのものだけ描画
  const workRows: { kind: 'mul' | 'sub'; stepRef: number; cells: Record<number, string> }[] = [];
  activeSteps.forEach((_, idx) => {
    const mul = mulByStep[idx];
    const sub = subByStep[idx];
    if (mul && Object.keys(mul).length) workRows.push({ kind: 'mul', stepRef: idx, cells: mul });
    if (sub && Object.keys(sub).length) workRows.push({ kind: 'sub', stepRef: idx, cells: sub });
  });

  const stageTitle: Record<DivStage, string> = {
    PLACE: 'たてる（位をえらぶ）', QUOTIENT: 'たてる', MUL: 'かける', SUB: 'ひく', BRING: 'おろす',
  };
  const stageHint = (): string => {
    if (!current) return '';
    if (stage === 'PLACE') return '商を 書く ますを タップして えらぼう。';
    if (stage === 'QUOTIENT') return `${current.dividendPart} の中に ${divisor} は いくつ 入るかな？ 商を 1けた たてよう。`;
    if (stage === 'MUL') return `かけ算だよ。商 ${current.quotient} × ${divisor} の 答えを 書こう。`;
    if (stage === 'SUB') return `ひき算だよ。${current.dividendPart} − ${current.multiply} は いくつかな？`;
    return 'つぎの 数字を おろそう。';
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="flex-1 overflow-auto p-4 md:p-10 flex justify-center items-start">
        <div className="bg-surface p-8 md:p-12 rounded-[36px] shadow-2xl border border-line">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h2 className="text-2xl font-black text-content tabular-nums">{problem.dividend} ÷ {problem.divisor}</h2>
          </div>

          <div className="font-mono text-content">
            {/* 商の行 */}
            <div className="grid items-center text-center" style={gridStyle}>
              <div />
              {Array.from({ length: n }, (_, c) => {
                const showPoint = quotientPointIndex > 0 && c === quotientPointIndex - 1;
                const q = c >= quotientStartIndex ? enteredQ[c] : undefined;
                const isActive = !finished && current?.index === c && (stage === 'PLACE' || stage === 'QUOTIENT');
                const tappable = !finished && stage === 'PLACE' && c >= quotientStartIndex && enteredQ[c] === undefined;
                return (
                  <button
                    key={c}
                    onClick={() => tappable && placeAt(c)}
                    disabled={!tappable}
                    className={`relative flex items-center justify-center text-4xl font-black ${isActive ? 'bg-blue-50 ring-4 ring-blue-400 ring-inset rounded-xl' : ''} ${tappable ? 'cursor-pointer bg-blue-50/40 ring-2 ring-blue-200 ring-inset rounded-xl hover:bg-blue-100' : ''}`}
                    style={{ height: DH }}
                  >
                    {q !== undefined ? <span className="text-blue-600">{q}</span>
                      : isActive && stage === 'QUOTIENT' ? <span className="text-blue-300 animate-pulse">？</span> : null}
                    {showPoint && (enteredQ[c] !== undefined || (current && current.index > c)) && <Dot />}
                  </button>
                );
              })}
            </div>

            {/* わくの行（divisor ) dividend） */}
            <div className="grid items-center text-center relative" style={{ ...gridStyle, height: DH }}>
              <div className="flex items-center justify-end pr-2 font-black border-r-4 border-slate-800 h-full z-20">{divisor}</div>
              <div className="absolute left-[52px] right-0 top-0 border-t-4 border-slate-800 z-10" />
              {Array.from({ length: n }, (_, c) => {
                const appended = c >= baseLen && mode !== 'remainder';
                const isFrac = c >= intLen;
                const showPoint = c === intLen - 1;
                return (
                  <div key={c} className="relative flex items-center justify-center text-4xl font-black" style={{ height: DH }}>
                    <span className={appended ? 'text-faint' : isFrac && mode === 'remainder' ? 'text-faint' : ''}>{displayDigits[c]}</span>
                    {showPoint && <Dot />}
                  </div>
                );
              })}
            </div>

            {/* 作業行（かける・ひく/おろす）：入力した分だけ表示 */}
            {workRows.map((row, i) => (
              <div key={i} className="grid items-center text-center relative" style={{ ...gridStyle, height: DH }}>
                <div className="flex items-center justify-end pr-2 text-faint font-bold text-2xl">
                  {row.kind === 'mul' ? '×' : '−'}
                </div>
                {row.kind === 'mul' && (
                  <div className="absolute left-[52px] right-0 bottom-0 border-b-2 border-slate-300" />
                )}
                {Array.from({ length: n }, (_, c) => (
                  <div key={c} className={`flex items-center justify-center text-3xl font-medium ${row.kind === 'mul' ? 'text-rose-500' : 'text-blue-500'}`} style={{ height: DH }}>
                    {row.cells[c] ?? ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full md:w-[400px] bg-surface border-l border-line p-6 md:p-8 flex flex-col gap-5 overflow-y-auto">
        {finished ? (
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-blue-50 border border-blue-100 rounded-3xl text-center">
            <span className="text-6xl mb-4">{mistakes === 0 ? '🏆' : '🎉'}</span>
            <h3 className="text-2xl font-black text-blue-800 mb-2">{mistakes === 0 ? 'パーフェクト！' : 'できたね！'}</h3>
            <p className="text-blue-600 font-bold mb-2">
              {problem.dividend} ÷ {problem.divisor} = {quotientValue}
              {mode === 'remainder' && ` あまり ${remainderValue}`}
            </p>
            <button onClick={onNext} className="w-full py-4 mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95">つぎの もんだい</button>
          </div>
        ) : (
          <>
            <motion.div animate={shake ? { x: [0, -6, 6, -6, 0] } : { x: 0 }} className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-blue-700 font-black text-lg flex items-center gap-2"><Lightbulb size={20} /> {stageTitle[stage]}</h3>
              </div>
              <p className="text-muted font-bold leading-relaxed">{hint ?? stageHint()}</p>
            </motion.div>
            <div className="flex-1 flex flex-col justify-center">
              {stage === 'PLACE' ? (
                <div className="text-center text-muted font-bold p-6 bg-surface-2 rounded-2xl border border-line">
                  ↑ 上の 商の ますを タップしてね
                </div>
              ) : stage === 'BRING' ? (
                <button onClick={bringDown} className="w-full py-6 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black text-2xl shadow-lg transition-all active:scale-95">
                  つぎの 数字を おろす ⬇
                </button>
              ) : (
                <Keypad onInput={handleInput} onBackspace={handleBackspace} />
              )}
            </div>
          </>
        )}
        <button onClick={reset} className="flex items-center justify-center gap-2 text-faint hover:text-muted py-4 font-bold border-t border-line shrink-0">
          <RotateCcw size={20} /> さいしょから
        </button>
      </div>
    </div>
  );
};
