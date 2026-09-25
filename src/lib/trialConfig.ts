/**
 * 神域の試練の層。
 *
 * いまは本番テストの設問から**仮に**組んでいる（設問の順＝やさしい順、同じモジュールはまとめる）。
 * 実際の紙のテストに合わせるときは、ここを手で書きかえる
 * （floors と reqs を直接書く。倍の見方の trialConfig.ts が見本）。
 *
 * このアプリの TEST_STEPS は項目の記号を持っていないので、1回作って skillIdOf で読む。
 */
import { floorsFromTestSteps } from 'learning-app-kit/trial';
import { TEST_STEPS, skillIdOf, type TestProblem } from './testConfig';

const STEPS = TEST_STEPS.map((s) => ({ ...s, skillId: skillIdOf(s.gen()) }));

export const TRIAL = floorsFromTestSteps(STEPS);
export const FLOOR_COUNT = TRIAL.floors.length;

/** その項目の本番テストの設問を1つ選んで作る（同じ項目の設問が複数あれば、ばらばらに出す） */
export function trialProblem(skillId: string): TestProblem {
  const pool = STEPS.filter((s) => s.skillId === skillId);
  const step = pool[Math.floor(Math.random() * pool.length)] ?? STEPS[0]!;
  return step.gen();
}
