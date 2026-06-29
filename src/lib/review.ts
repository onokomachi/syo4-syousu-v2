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

export function getReviewTargets(
  mastery: Record<string, SkillMastery>,
  n = 3,
): ReviewTarget[] {
  const seen = new Set<ModuleId>();
  return Object.entries(mastery)
    .filter(([, m]) => m.attempts >= 2 && m.corrects / m.attempts < 0.7)
    .map(([skillId, m]) => {
      const moduleId = skillToModule(skillId);
      if (!moduleId) return null;
      return {
        moduleId,
        skillId,
        label: MODULES.find((mod) => mod.id === moduleId)?.title ?? moduleId,
        mastery: m.corrects / m.attempts,
      };
    })
    .filter((x): x is ReviewTarget => x !== null)
    .sort((a, b) => a.mastery - b.mastery)
    .filter((t) => {
      if (seen.has(t.moduleId)) return false;
      seen.add(t.moduleId);
      return true;
    })
    .slice(0, n);
}
