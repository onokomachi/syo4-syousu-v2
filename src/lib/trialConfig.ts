/**
 * 実力の階段の段。
 *
 * この単元には本番テストが2つある（「5. 小数のしくみ」と「13. 小数のかけ算とわり算」）。
 * 実力の階段は app_id ごとに1本（記録の置き場所も送り先も app_id で決まる）なので、
 * 2つのテストを**1本の階段につなぐ**：下の段＝小数のしくみ（前と同じ段・同じ順）、上の段＝かけ算とわり算。
 * 小数のしくみの段は前とまったく同じに組むので、これまでの記録（何段まで届いたか・セーブ）はそのまま生きる。
 * テスト予想は 2つのテストの合計（150点＋150点）で出る。
 *
 * このアプリの TEST_STEPS は項目の記号を持っていないので、1回作って skillIdOf で読む。
 */
import { floorsFromTestSteps, withExtraSkills, type TrialPlan } from 'learning-app-kit/trial';
import { TEST_STEPS, MULDIV_TEST_STEPS, skillIdOf, type TestProblem, type TestStep } from './testConfig';

const withSkill = (steps: TestStep[]) => steps.map((s) => ({ ...s, skillId: skillIdOf(s.gen()) }));

const SHIKUMI_STEPS = withSkill(TEST_STEPS);
const MULDIV_STEPS = withSkill(MULDIV_TEST_STEPS);
const STEPS = [...SHIKUMI_STEPS, ...MULDIV_STEPS];

/** 2本の階段を、上下につなぐ（上の階段の段番号は 下の階段の段数だけずらす） */
function stack(lower: TrialPlan, upper: TrialPlan): TrialPlan {
  const off = lower.floors.length;
  return {
    floors: [...lower.floors, ...upper.floors],
    reqs: [...lower.reqs, ...upper.reqs.map((r) => ({ ...r, floor: r.floor + off }))],
    max: lower.max + upper.max,
  };
}

export const SHIKUMI_TRIAL = floorsFromTestSteps(SHIKUMI_STEPS);
export const MULDIV_TRIAL = floorsFromTestSteps(MULDIV_STEPS, { maxFloors: 6 });
export const TRIAL = stack(SHIKUMI_TRIAL, MULDIV_TRIAL);
export const FLOOR_COUNT = TRIAL.floors.length;

/** その項目の本番テストの設問を1つ選んで作る（同じ項目の設問が複数あれば、ばらばらに出す） */
export function trialProblem(skillId: string): TestProblem {
  const pool = STEPS.filter((s) => s.skillId === skillId);
  const step = pool[Math.floor(Math.random() * pool.length)] ?? STEPS[0]!;
  return step.gen();
}

/**
 * 本番テストに出ない項目。極限には出さず（テスト予想を正直に保つ）、無限でだけ出す。
 * 頂点に届いた子は、無限で単元のすべての項目に挑める。
 * （かけ算・わり算の項目は、ほとんどが「13. 小数のかけ算とわり算」のテストに出るので段に入っている）
 */
export const EXTRA_SKILLS: readonly string[] = [
  'addsub-sub-whole',
  'div-carry',
  'compare-tenths',
  'line-tenths',
  'line-0to10',
  'line-hundredths',
  'order-3',
  'order-5',
  'compose-2',
  'placeid-2',
  'scale-mix',
  'unit-mix',
];

/** 無限で出す段（テスト外の項目を、同じモジュールの段に混ぜたもの） */
export const ENDLESS_FLOORS = withExtraSkills(TRIAL.floors, EXTRA_SKILLS);
