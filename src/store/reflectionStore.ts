/**
 * 振り返り（自己調整学習）のデータ。
 * 資料: Zimmerman の自己省察フェーズ＋自己説明＋実行意図（エビレベルA〜B）。
 * 「きょう むずかしかったこと → なぜ → つぎ どうする」を児童自身が言語化して残す（AIは使わない）。
 * 保存先は progressRepository 経由で差し替え可能（progressStore と同じ方針）。
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getProgressStorage } from '../services/progressRepository';

/** 1日分の振り返りカード。 */
export interface ReflectionCard {
  id: string;
  ts: number;
  dateKey: string; // 'YYYY-MM-DD'（1日1枚を目安に上書き）
  hardestTopic: string; // きょう いちばん むずかしかったこと
  reasonChoice?: string; // まちがえた りゆう（選択：ErrorHunter の REASONS を流用）
  reasonText?: string; // りゆうの 自由記述（自己説明）
  nextPlan: string; // つぎの 実行意図「◯◯のとき △△する」
}

/** 「できたつもり」チェック（メタ認知キャリブレーション）の1件。 */
export interface CalibrationRecord {
  ts: number;
  skillId: string;
  predicted: number; // 自己予想（0..1。3段階を 0/0.5/1 で持つ）
  actual: number; // 実際（0..1。perfect/score 由来）
}

function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface ReflectionState {
  cards: ReflectionCard[];
  calibration: CalibrationRecord[];
  /** その日のカードを保存（同じ日付があれば上書き）。 */
  saveCard: (input: Omit<ReflectionCard, 'id' | 'ts' | 'dateKey'> & { dateKey?: string }) => void;
  getTodayCard: () => ReflectionCard | undefined;
  addCalibration: (rec: Omit<CalibrationRecord, 'ts'>) => void;
  reset: () => void;
}

export const useReflectionStore = create<ReflectionState>()(
  persist(
    (set, get) => ({
      cards: [],
      calibration: [],

      saveCard: (input) => {
        set((state) => {
          const dateKey = input.dateKey ?? todayKey();
          const card: ReflectionCard = {
            id: crypto.randomUUID(),
            ts: Date.now(),
            dateKey,
            hardestTopic: input.hardestTopic,
            reasonChoice: input.reasonChoice,
            reasonText: input.reasonText,
            nextPlan: input.nextPlan,
          };
          // 同じ日のカードは置き換え、新しい順で先頭に。直近100件まで保持。
          const others = state.cards.filter((c) => c.dateKey !== dateKey);
          return { cards: [card, ...others].slice(0, 100) };
        });
      },

      getTodayCard: () => {
        const key = todayKey();
        return get().cards.find((c) => c.dateKey === key);
      },

      addCalibration: (rec) => {
        set((state) => ({
          calibration: [{ ...rec, ts: Date.now() }, ...state.calibration].slice(0, 200),
        }));
      },

      reset: () => set({ cards: [], calibration: [] }),
    }),
    {
      name: 'syousu_reflection_v1',
      version: 1,
      storage: createJSONStorage(() => getProgressStorage()),
    }
  )
);
