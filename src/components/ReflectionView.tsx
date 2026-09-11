/**
 * ふりかえりカード（自己調整学習の自己省察フェーズ）。
 * 文の書き出し（sentence starter）で足場かけし、低学年でもメタ認知の質を保つ。
 * ・きょう むずかしかったこと → ・なぜ まちがえた（自己説明）→ ・つぎ どうする（実行意図）
 * AIは使わず、児童自身が言語化して残す。先生へは Google フォームで提出（任意）。
 */
import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, NotebookPen, Save, Send, Check, Lightbulb } from 'lucide-react';
import { useReflectionStore } from '../store/reflectionStore';
import { useSettingsStore } from '../store/settingsStore';
import { useProgressStore } from '../store/progressStore';
import { REASONS } from '../lib/errorHunter';
import { missTagLabel } from '../lib/missTags';

interface Props { onBack: () => void; }

const REASON_LIST = Object.values(REASONS);

export const ReflectionView: React.FC<Props> = ({ onBack }) => {
  const todayCard = useReflectionStore((s) => s.getTodayCard());
  const saveCard = useReflectionStore((s) => s.saveCard);
  const teacherFormUrl = useSettingsStore((s) => s.teacherFormUrl);
  const errorTags = useProgressStore((s) => s.errorTags);

  const [hardestTopic, setHardestTopic] = React.useState(todayCard?.hardestTopic ?? '');
  const [reasonChoice, setReasonChoice] = React.useState<string | undefined>(todayCard?.reasonChoice);
  const [reasonText, setReasonText] = React.useState(todayCard?.reasonText ?? '');
  const [nextPlan, setNextPlan] = React.useState(todayCard?.nextPlan ?? '');
  const [saved, setSaved] = React.useState(false);

  // まちがいマップと連動：きょう までの つまずき上位を ヒントとして見せる。
  const topTags = Object.entries(errorTags)
    .map(([tag, count]) => ({ tag, count }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const canSave = hardestTopic.trim().length > 0 || nextPlan.trim().length > 0;

  const handleSave = () => {
    saveCard({ hardestTopic, reasonChoice, reasonText, nextPlan });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const summaryText = () =>
    [
      `きょう むずかしかったこと：${hardestTopic || '（なし）'}`,
      `まちがえた りゆう：${[reasonChoice, reasonText].filter(Boolean).join(' / ') || '（なし）'}`,
      `つぎ がんばること：${nextPlan || '（なし）'}`,
    ].join('\n');

  const handleSubmit = async () => {
    handleSave();
    try {
      await navigator.clipboard.writeText(summaryText());
    } catch {
      /* クリップボード不可でもフォームは開く */
    }
    if (teacherFormUrl) window.open(teacherFormUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col h-full bg-surface-2">
      <div className="flex items-center justify-between p-6 bg-surface border-b border-line shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-muted hover:text-content transition-colors font-bold">
          <ChevronLeft size={20} /><span>もどる</span>
        </button>
        <div className="flex items-center gap-2 text-violet-600">
          <NotebookPen size={24} /><h2 className="text-xl font-black tracking-tight">きょうの ふりかえり</h2>
        </div>
        <div className="w-20" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-5">
          <p className="text-muted font-bold text-center">
            まちがいは 学びの たからもの。きょうを ふりかえって、つぎに つなげよう！
          </p>

          {/* まちがいマップ連動ヒント */}
          {topTags.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-2">
              <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div className="text-sm font-bold text-amber-800">
                さいきん おおい つまずき：
                {topTags.map((t) => `「${missTagLabel(t.tag)}」`).join('・')}
                <span className="block text-amber-700 font-medium mt-0.5">これを ヒントに かいてみよう。</span>
              </div>
            </div>
          )}

          {/* ① きょう むずかしかったこと */}
          <Field label="きょう いちばん むずかしかったのは…">
            <input
              value={hardestTopic}
              onChange={(e) => setHardestTopic(e.target.value)}
              placeholder="れい：小数点の いちが むずかしかった"
              className="w-full p-3 rounded-2xl border-2 border-line bg-surface text-content font-bold focus:border-violet-400 outline-none"
            />
          </Field>

          {/* ② まちがえた りゆう（自己説明） */}
          <Field label="まちがえた りゆうは…（えらぶ・かく）">
            <div className="flex flex-wrap gap-2 mb-2">
              {REASON_LIST.map((r) => (
                <button
                  key={r}
                  onClick={() => setReasonChoice(reasonChoice === r ? undefined : r)}
                  className={`px-3 py-2 rounded-full text-xs font-black border-2 transition-all active:scale-95 ${
                    reasonChoice === r ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-line bg-surface text-muted hover:border-faint'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="じぶんの ことばで（れい：くり下がりで 上の位を へらしわすれた）"
              rows={2}
              className="w-full p-3 rounded-2xl border-2 border-line bg-surface text-content font-bold focus:border-violet-400 outline-none resize-none"
            />
          </Field>

          {/* ③ つぎ どうする（実行意図） */}
          <Field label="つぎは…でがんばる（「◯◯のとき △△する」）">
            <input
              value={nextPlan}
              onChange={(e) => setNextPlan(e.target.value)}
              placeholder="れい：たし算の とき、小数点を たてに そろえてから 計算する"
              className="w-full p-3 rounded-2xl border-2 border-line bg-surface text-content font-bold focus:border-violet-400 outline-none"
            />
          </Field>

          {/* ボタン */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 ${
                canSave ? 'bg-violet-500 hover:bg-violet-600 text-white' : 'bg-surface-3 text-faint cursor-not-allowed'
              }`}
            >
              {saved ? <><Check size={22} /> ほぞんしたよ！</> : <><Save size={22} /> ほぞんする</>}
            </button>
            {teacherFormUrl && (
              <button
                onClick={handleSubmit}
                disabled={!canSave}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 ${
                  canSave ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-surface-3 text-faint cursor-not-allowed'
                }`}
              >
                <Send size={20} /> 先生に ていしゅつ
              </button>
            )}
          </div>
          {teacherFormUrl && (
            <p className="text-center text-faint text-xs font-bold">
              「ていしゅつ」を おすと、かいた ないようを コピーして フォームを ひらくよ。
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-3xl border border-line shadow-sm p-5">
    <label className="block text-sm font-black text-content mb-3">{label}</label>
    {children}
  </motion.div>
);
