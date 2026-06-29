import { ModuleId, SkillMastery } from '../store/progressStore';
import { MODULES } from '../constants';

export interface ReviewTarget {
  moduleId: ModuleId;
  skillId: string;
  label: string;
  mastery: number;
}

function skillToModule(skillId: string): ModuleId | null {
  if (skillId.startsWith('addsub-')) return 'decimal-addsub';
  if (skillId.startsWith('mul-')) return 'decimal-muldiv';
  if (skillId.startsWith('div-')) return 'decimal-muldiv';
  if (skillId.startsWith('compare-')) return 'number-line';
  if (skillId.startsWith('line-')) return 'number-line';
  if (skillId.startsWith('order-')) return 'number-line';
  if (skillId.startsWith('compose-')) return 'place-value';
  if (skillId.startsWith('collect-')) return 'place-value';
  if (skillId.startsWith('scale-')) return 'place-value';
  if (skillId.startsWith('unit-')) return 'place-value';
  if (skillId.startsWith('placeid-')) return 'place-value';
  if (skillId.startsWith('wp-')) return 'word-problem';
  if (skillId.startsWith('judge-') || skillId.startsWith('fix-')) return 'error-hunter';
  return null;
}

/**
 * 復習対象のスキルを選ぶ。苦手（正答率 < 0.7）を基本に、
 * 分散学習（spacing effect, エビレベルA）として「しばらく やっていない」ものを優先する。
 * lastReviewedAt を渡すと、苦手さ＋間隔の空き具合で優先度づけする。
 */
export function getReviewTargets(
  mastery: Record<string, SkillMastery>,
  n = 3,
  lastReviewedAt: Record<string, number> = {},
  now = Date.now(),
): ReviewTarget[] {
  const DAY = 24 * 60 * 60 * 1000;
  const seen = new Set<ModuleId>();
  return Object.entries(mastery)
    .filter(([, m]) => m.attempts >= 2 && m.corrects / m.attempts < 0.7)
    .map(([skillId, m]) => {
      const moduleId = skillToModule(skillId);
      if (!moduleId) return null;
      const acc = m.corrects / m.attempts;
      // 苦手さ（0..0.7）と、最後に出題してからの経過（1週間で最大）を合算して優先度に。
      const weakness = 0.7 - acc;
      const last = lastReviewedAt[skillId];
      const daysSince = last ? (now - last) / DAY : 7; // 未記録は「久しく やっていない」とみなす
      const staleness = Math.min(daysSince / 7, 1);
      return {
        moduleId,
        skillId,
        label: MODULES.find((mod) => mod.id === moduleId)?.title ?? moduleId,
        mastery: acc,
        priority: weakness + staleness * 0.3,
      };
    })
    .filter((x): x is ReviewTarget & { priority: number } => x !== null)
    .sort((a, b) => b.priority - a.priority)
    .filter((t) => {
      if (seen.has(t.moduleId)) return false;
      seen.add(t.moduleId);
      return true;
    })
    .slice(0, n)
    .map(({ priority: _priority, ...t }) => t);
}
