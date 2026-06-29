/**
 * モジュール横断の学習進捗。スキル別の習熟度（正答率）を保持し、
 * 適応難易度（資料: BKT の簡易版, エビレベルI）や「がくしゅうのきろく」に使う。
 * 保存先は progressRepository 経由で差し替え可能。
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getProgressStorage } from '../services/progressRepository';

export type ModuleId =
  | 'decimal-addsub'
  | 'decimal-muldiv'
  | 'error-hunter'
  | 'number-line'
  | 'place-value'
  | 'word-problem'
  | 'mock-test';

/** 本番テストの各設問の結果（学習のきろくで詳細表示するため） */
export interface TestStepResult {
  daimon: number;
  sub?: string;
  title: string;
  section: '表' | '裏' | '参考';
  q: string; // 問題
  a: string; // 正しい答え
  points: number;
  earned: number;
  correct: boolean; // 一発正解できたか
}

export interface TestDetail {
  mode: '表' | '裏' | 'ぜんぶ';
  omoteScore: number;
  omoteMax: number;
  uraScore: number;
  uraMax: number;
  total: number;
  totalMax: number;
  steps: TestStepResult[];
}

export interface ResultRecord {
  id: string;
  ts: number;
  moduleId: ModuleId;
  skillId: string; // 例: 'addsub-diff-digits', 'compare', 'muldiv-remainder'
  label: string; // 履歴表示用（例: "3.5 + 4.18"）
  correct: boolean; // ノーミスで完答できたか
  detail?: TestDetail; // 本番テストのときだけ。各設問の問題・正答・○×
}

export interface SkillMastery {
  attempts: number;
  corrects: number;
  perfectStreak?: number; // 連続ノーミス数（熟達バー表示用。ミスで0にリセット）
}

/** skillId のプレフィックスから所属モジュールを判定（累計カウンタの移行用） */
function skillToModuleId(skillId: string): ModuleId | null {
  if (skillId === 'mock-test' || skillId.startsWith('mock-')) return 'mock-test';
  if (skillId.startsWith('addsub-')) return 'decimal-addsub';
  if (skillId.startsWith('mul-') || skillId.startsWith('div-') || skillId.startsWith('muldiv-')) return 'decimal-muldiv';
  if (skillId.startsWith('compare-') || skillId.startsWith('line-') || skillId.startsWith('lineread-') || skillId.startsWith('order-')) return 'number-line';
  if (skillId.startsWith('compose-') || skillId.startsWith('collect-') || skillId.startsWith('scale-') || skillId.startsWith('unit-') || skillId.startsWith('placeid-') || skillId.startsWith('decompose-')) return 'place-value';
  if (skillId.startsWith('wp-') || skillId.startsWith('word-')) return 'word-problem';
  if (skillId.startsWith('judge-') || skillId.startsWith('fix-') || skillId.startsWith('eh-') || skillId.startsWith('error-')) return 'error-hunter';
  return null;
}

interface ProgressState {
  logs: ResultRecord[];
  mastery: Record<string, SkillMastery>;
  currentStreak: number;
  maxStreak: number;
  dailyGoal: number;
  // 累計カウンタ（logs は直近200件で打ち切るため、総数はこちらで保持して頭打ちを防ぐ）
  totalCorrect: number;
  moduleCounts: Partial<Record<ModuleId, number>>;
  // 本番テストの自己ベスト得点（バッジ判定用。表/裏/両面それぞれの最高点）
  bestTestOmote: number;
  bestTestUra: number;
  bestTestTotal: number;
  // 習熟度MAX（あるレベルで5問連続ノーミス＝熟達バー満タン）を一度でも達成したモジュール。
  // perfectStreak はミスで0に戻るが、この記録は永続（バッジ用なので消えない）。
  masteredModules: Partial<Record<ModuleId, boolean>>;
  recordResult: (rec: Omit<ResultRecord, 'id' | 'ts'>) => void;
  getMastery: (skillId: string) => number; // 0..1（試行なしは 0）
  getMasteryStreak: (skillId: string) => number; // 0..1（連続ノーミス/5。熟達バー表示用）
  getModuleCount: (moduleId: ModuleId) => number;
  getTodayCount: () => number; // きょう 正解した数
  getTodaySkillCount: (skillId: string) => number; // きょう そのスキルを 正解した数
  setDailyGoal: (n: number) => void;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      logs: [],
      mastery: {},
      currentStreak: 0,
      maxStreak: 0,
      dailyGoal: 10,
      totalCorrect: 0,
      moduleCounts: {},
      bestTestOmote: 0,
      bestTestUra: 0,
      bestTestTotal: 0,
      masteredModules: {},

      recordResult: (rec) => {
        set((state) => {
          const entry: ResultRecord = {
            ...rec,
            id: crypto.randomUUID(),
            ts: Date.now(),
          };
          const logs = [entry, ...state.logs].slice(0, 200);

          const prev = state.mastery[rec.skillId] ?? { attempts: 0, corrects: 0, perfectStreak: 0 };
          const newPerfectStreak = rec.correct ? Math.min((prev.perfectStreak ?? 0) + 1, 5) : 0;
          const mastery = {
            ...state.mastery,
            [rec.skillId]: {
              attempts: prev.attempts + 1,
              corrects: prev.corrects + (rec.correct ? 1 : 0),
              // 連続ノーミス：正解で +1（最大5）、ミスありの完答で 0 にリセット
              perfectStreak: newPerfectStreak,
            },
          };

          // 熟達バーが満タン（5連続ノーミス）に達したら、そのモジュールを「習熟度MAX」として永続記録
          const masteredModules = newPerfectStreak >= 5 && !state.masteredModules[rec.moduleId]
            ? { ...state.masteredModules, [rec.moduleId]: true }
            : state.masteredModules;

          const currentStreak = rec.correct ? state.currentStreak + 1 : 0;
          const maxStreak = Math.max(state.maxStreak, currentStreak);

          // 累計カウンタ（頭打ち防止。logs のキャップに依存しない）
          const totalCorrect = state.totalCorrect + (rec.correct ? 1 : 0);
          const moduleCounts = rec.correct
            ? { ...state.moduleCounts, [rec.moduleId]: (state.moduleCounts[rec.moduleId] ?? 0) + 1 }
            : state.moduleCounts;

          // 本番テストの自己ベスト得点を更新（その範囲に含まれたセクションのみ）
          let bestTestOmote = state.bestTestOmote;
          let bestTestUra = state.bestTestUra;
          let bestTestTotal = state.bestTestTotal;
          if (rec.detail) {
            if (rec.detail.omoteMax > 0) bestTestOmote = Math.max(bestTestOmote, rec.detail.omoteScore);
            if (rec.detail.uraMax > 0) bestTestUra = Math.max(bestTestUra, rec.detail.uraScore);
            // 両面（ぜんぶ）= 表と裏の両方を解いたときだけ合計のベストを更新
            if (rec.detail.omoteMax > 0 && rec.detail.uraMax > 0) bestTestTotal = Math.max(bestTestTotal, rec.detail.total);
          }

          return { logs, mastery, currentStreak, maxStreak, totalCorrect, moduleCounts, bestTestOmote, bestTestUra, bestTestTotal, masteredModules };
        });
      },

      getMastery: (skillId) => {
        const m = get().mastery[skillId];
        if (!m || m.attempts === 0) return 0;
        return m.corrects / m.attempts;
      },

      getMasteryStreak: (skillId) => {
        const m = get().mastery[skillId];
        return Math.min((m?.perfectStreak ?? 0) / 5, 1);
      },

      getModuleCount: (moduleId) => get().moduleCounts[moduleId] ?? 0,

      getTodayCount: () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const t = start.getTime();
        return get().logs.filter((l) => l.ts >= t && l.correct).length;
      },

      getTodaySkillCount: (skillId) => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const t = start.getTime();
        return get().logs.filter((l) => l.ts >= t && l.correct && l.skillId === skillId).length;
      },

      setDailyGoal: (n) => set({ dailyGoal: n }),

      reset: () => set({ logs: [], mastery: {}, currentStreak: 0, maxStreak: 0, totalCorrect: 0, moduleCounts: {}, bestTestOmote: 0, bestTestUra: 0, bestTestTotal: 0, masteredModules: {} }),
    }),
    {
      name: 'syousu_progress_v1',
      version: 3,
      storage: createJSONStorage(() => getProgressStorage()),
      // v0→v1: 累計カウンタを mastery（打ち切られない corrects）から復元する。
      // v1→v2: 本番テストの自己ベスト得点を、残っている logs の detail から復元する。
      migrate: (persisted, version) => {
        const state = persisted as Partial<ProgressState> | undefined;
        if (state && version < 1) {
          const mastery = state.mastery ?? {};
          let totalCorrect = 0;
          const moduleCounts: Partial<Record<ModuleId, number>> = {};
          for (const [skillId, m] of Object.entries(mastery)) {
            const c = m?.corrects ?? 0;
            totalCorrect += c;
            const mod = skillToModuleId(skillId);
            if (mod) moduleCounts[mod] = (moduleCounts[mod] ?? 0) + c;
          }
          state.totalCorrect = totalCorrect;
          state.moduleCounts = moduleCounts;
        }
        if (state && version < 2) {
          let bestTestOmote = 0;
          let bestTestUra = 0;
          let bestTestTotal = 0;
          for (const l of state.logs ?? []) {
            const d = l.detail;
            if (!d) continue;
            if (d.omoteMax > 0) bestTestOmote = Math.max(bestTestOmote, d.omoteScore);
            if (d.uraMax > 0) bestTestUra = Math.max(bestTestUra, d.uraScore);
            if (d.omoteMax > 0 && d.uraMax > 0) bestTestTotal = Math.max(bestTestTotal, d.total);
          }
          state.bestTestOmote = bestTestOmote;
          state.bestTestUra = bestTestUra;
          state.bestTestTotal = bestTestTotal;
        }
        if (state && version < 3) {
          // 既存ユーザー: 現在の mastery で perfectStreak が満タンのスキルから習熟度MAXを復元
          const masteredModules: Partial<Record<ModuleId, boolean>> = {};
          for (const [skillId, m] of Object.entries(state.mastery ?? {})) {
            if ((m?.perfectStreak ?? 0) >= 5) {
              const mod = skillToModuleId(skillId);
              if (mod) masteredModules[mod] = true;
            }
          }
          state.masteredModules = masteredModules;
        }
        return state as ProgressState;
      },
    }
  )
);
