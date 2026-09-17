/**
 * 「本番テストモード」の設定表。
 * 実際の単元テスト「5.小数のしくみ」（東書・表=知識技能100点 / 裏=思考判断表現50点）を
 * 同じ大問順・同じ問題数で再現する。各設問は既存ジェネレータを呼び、既存アクティビティで解く。
 * 採点: ノーミス完答=満点、ミスありで完答=0点（＝一発正解を採点）。
 */
import {
  generateDecompose, DecomposeProblem,
  generatePlaceId, PlaceIdProblem, PlaceIdLevel,
  generateUnit, UnitProblem, UnitLevel,
  generateCompose, ComposeProblem, ComposeLevel,
  generateCollect, CollectProblem, CollectLevel,
  generateScale, ScaleProblem, ScaleLevel,
} from './placeValue';
import { scaleOpLabel } from './placeValue';
import {
  generateLine, LineProblem, LineLevel,
  generateCompare, ComparePair, CompareLevel,
  generateOrder, OrderProblem, OrderLevel,
  relation,
} from './numberLine';
import { generateAddSub, AddSubProblem, AddSubLevel, buildColumns } from './decimal';
import { generateWordProblem, WordProblem } from './wordProblems';
import { makeError, ErrorExample, ErrorPreset } from './errorHunter';
import { skillToModuleId, type ModuleId } from '../store/progressStore';

export type TestProblem =
  | { kind: 'decompose'; p: DecomposeProblem }
  | { kind: 'placeid'; p: PlaceIdProblem; level: PlaceIdLevel }
  | { kind: 'unit'; p: UnitProblem; level: UnitLevel }
  | { kind: 'compose'; p: ComposeProblem; level: ComposeLevel }
  | { kind: 'collect'; p: CollectProblem; level: CollectLevel }
  | { kind: 'lineRead'; p: LineProblem; level: LineLevel }
  | { kind: 'compare'; p: ComparePair; level: CompareLevel }
  | { kind: 'scale'; p: ScaleProblem; level: ScaleLevel }
  | { kind: 'addsub'; p: AddSubProblem; level: AddSubLevel; build: boolean }
  | { kind: 'word'; p: WordProblem }
  | { kind: 'error'; p: ErrorExample; preset: ErrorPreset }
  | { kind: 'order'; p: OrderProblem; level: OrderLevel };

export type Section = '表' | '裏' | '参考';

export interface TestStep {
  daimon: number;
  sub?: string;        // ①②③④
  title: string;       // 大問の説明（採点画面・ヘッダ用）
  section: Section;
  points: number;      // 配点（参考は 0）
  gen: () => TestProblem;
}

const addsub = (level: AddSubLevel, build: boolean): TestProblem => ({ kind: 'addsub', p: generateAddSub(level), level, build });
const errorStep = (preset: ErrorPreset): TestProblem => ({ kind: 'error', p: makeError(preset), preset });

export const TEST_STEPS: TestStep[] = [
  /* ===== 表・知識技能（各5点・計100点） ===== */
  { daimon: 1, sub: '①', title: '位取りのしくみ（何個分）', section: '表', points: 5, gen: () => ({ kind: 'decompose', p: generateDecompose() }) },
  { daimon: 1, sub: '②', title: '位取りのしくみ（位の数字）', section: '表', points: 5, gen: () => ({ kind: 'placeid', p: generatePlaceId('placeid-3', -3), level: 'placeid-3' }) },

  { daimon: 2, sub: '①', title: '単位の換算（長さ m⇔cm）', section: '表', points: 5, gen: () => ({ kind: 'unit', p: generateUnit('unit-length'), level: 'unit-length' }) },
  { daimon: 2, sub: '②', title: '単位の換算（重さ g⇔kg）', section: '表', points: 5, gen: () => ({ kind: 'unit', p: generateUnit('unit-mass'), level: 'unit-mass' }) },

  { daimon: 3, sub: '①', title: '小数の構成（組み立て）', section: '表', points: 5, gen: () => ({ kind: 'compose', p: generateCompose('compose-3'), level: 'compose-3' }) },
  { daimon: 3, sub: '②', title: '小数の構成（0.01の何個分）', section: '表', points: 5, gen: () => ({ kind: 'collect', p: generateCollect('collect-basic', { unit: '0.01', direction: 'count' }), level: 'collect-basic' }) },

  { daimon: 4, sub: 'ア', title: '数直線の読み取り（0.01目盛り）', section: '表', points: 5, gen: () => ({ kind: 'lineRead', p: generateLine('line-hundredths'), level: 'line-hundredths' }) },
  { daimon: 4, sub: 'イ', title: '数直線の読み取り（0.01目盛り）', section: '表', points: 5, gen: () => ({ kind: 'lineRead', p: generateLine('line-hundredths'), level: 'line-hundredths' }) },

  { daimon: 5, sub: '①', title: '小数の大小比較（不等号）', section: '表', points: 5, gen: () => ({ kind: 'compare', p: generateCompare('compare-mixed'), level: 'compare-mixed' }) },
  { daimon: 5, sub: '②', title: '小数の大小比較（不等号）', section: '表', points: 5, gen: () => ({ kind: 'compare', p: generateCompare('compare-int'), level: 'compare-int' }) },

  { daimon: 6, sub: '①', title: '10倍した数', section: '表', points: 5, gen: () => ({ kind: 'scale', p: generateScale('scale-10'), level: 'scale-10' }) },
  { daimon: 6, sub: '②', title: '1/10にした数', section: '表', points: 5, gen: () => ({ kind: 'scale', p: generateScale('scale-tenth'), level: 'scale-tenth' }) },

  { daimon: 7, sub: '①', title: '筆算 たし算（位がそろっている）', section: '表', points: 5, gen: () => addsub('add-basic', false) },
  { daimon: 7, sub: '②', title: '筆算 たし算（位がそろっている）', section: '表', points: 5, gen: () => addsub('add-diff', false) },
  { daimon: 7, sub: '③', title: '筆算 ひき算（位がそろっている）', section: '表', points: 5, gen: () => addsub('sub-basic', false) },
  { daimon: 7, sub: '④', title: '筆算 ひき算（位がそろっている）', section: '表', points: 5, gen: () => addsub('sub-diff', false) },

  { daimon: 8, sub: '①', title: '筆算 たし算（自分で位をそろえる）', section: '表', points: 5, gen: () => addsub('add-basic', true) },
  { daimon: 8, sub: '②', title: '筆算 たし算（自分で位をそろえる）', section: '表', points: 5, gen: () => addsub('add-diff', true) },
  { daimon: 8, sub: '③', title: '筆算 ひき算（自分で位をそろえる）', section: '表', points: 5, gen: () => addsub('sub-basic', true) },
  { daimon: 8, sub: '④', title: '筆算 ひき算（自分で位をそろえる）', section: '表', points: 5, gen: () => addsub('sub-diff', true) },

  /* ===== 裏・思考判断表現（計50点） ===== */
  { daimon: 9, sub: '①', title: '多様な見方（0.001を何個）', section: '裏', points: 5, gen: () => ({ kind: 'collect', p: generateCollect('collect-regroup', { unit: '0.001', direction: 'count' }), level: 'collect-regroup' }) },
  { daimon: 9, sub: '②', title: '多様な見方（1/100にした数）', section: '裏', points: 5, gen: () => ({ kind: 'scale', p: generateScale('scale-100', '÷100'), level: 'scale-100' }) },

  { daimon: 10, title: 'たし算の文章題（式・答え）', section: '裏', points: 10, gen: () => ({ kind: 'word', p: generateWordProblem('+') }) },

  { daimon: 11, sub: '①', title: 'まちがい探し たし算（理由・正答）', section: '裏', points: 10, gen: () => errorStep('addAlign') },
  { daimon: 11, sub: '②', title: 'まちがい探し たし算（理由・正答）', section: '裏', points: 10, gen: () => errorStep('addCarry') },
  { daimon: 11, sub: '③', title: 'まちがい探し ひき算（理由・正答）', section: '裏', points: 10, gen: () => errorStep('subBorrow') },

  /* ===== 参考（点数なし・評価のみ） ===== */
  { daimon: 12, title: 'いかそう算数（100m走 速い順にならべる）', section: '参考', points: 0, gen: () => ({ kind: 'order', p: generateOrder('order-5'), level: 'order-5' }) },
];

/**
 * テスト結果のきろく用に、各問題を「問題文」と「正しい答え」の文字列にする。
 * 児童の入力値そのものは保存せず、問題・正答・○×だけを残す。
 */
export function describeProblem(tp: TestProblem): { q: string; a: string } {
  switch (tp.kind) {
    case 'decompose': {
      const c = tp.p.counts;
      return {
        q: `${tp.p.valueStr} は それぞれ 何こ分？`,
        a: `1を${c.ones}こ・0.1を${c.tenths}こ・0.01を${c.hundredths}こ・0.001を${c.thousandths}こ`,
      };
    }
    case 'placeid':
      return { q: `${tp.p.valueStr} の ${tp.p.placeLabel}の数字`, a: tp.p.answer };
    case 'unit':
      return { q: tp.p.promptStr, a: `${tp.p.answer}${tp.p.answerUnit}` };
    case 'compose':
      return { q: `各位を 組み立てて 数をつくる`, a: String(tp.p.target) };
    case 'collect':
      return tp.p.direction === 'count'
        ? { q: `${tp.p.value} は ${tp.p.unitLabel}を 何こ 集めた数？`, a: `${tp.p.answer}こ` }
        : { q: `${tp.p.unitLabel}を ${tp.p.count}こ 集めた数`, a: tp.p.answer };
    case 'lineRead':
      return { q: `数直線の ◆ を よむ（${tp.p.min}〜${tp.p.max}）`, a: tp.p.targetStr };
    case 'compare':
      return { q: `${tp.p.aStr} ☐ ${tp.p.bStr}`, a: relation(tp.p.aStr, tp.p.bStr) };
    case 'scale':
      return { q: `${tp.p.value} を ${scaleOpLabel(tp.p.op)}`, a: tp.p.answer };
    case 'addsub':
      return { q: `${tp.p.a} ${tp.p.op} ${tp.p.b}`, a: String(buildColumns(tp.p).result) };
    case 'word':
      return { q: tp.p.text, a: `${tp.p.answer}${tp.p.unit}` };
    case 'error':
      return { q: `まちがい探し：${tp.p.expr}`, a: `正しい答え ${tp.p.correctAnswer}` };
    case 'order':
      return { q: `${tp.p.dir === 'asc' ? '小さい' : '大きい'}順に ならべる`, a: tp.p.sorted.join(' → ') };
  }
}

export const OMOTE_MAX = TEST_STEPS.filter((s) => s.section === '表').reduce((a, s) => a + s.points, 0); // 100
export const URA_MAX = TEST_STEPS.filter((s) => s.section === '裏').reduce((a, s) => a + s.points, 0);   // 50
export const TOTAL_MAX = OMOTE_MAX + URA_MAX; // 150

/* ---------------- 答案に残す記号と、テストのあとの「やり方」 ---------------- */

/**
 * 出題から項目の記号を取り出す。カタログと同じ文字列にする。
 * 大問の題名は問題を作り直すたびに変わりうるので、集計の軸にはできない。
 */
export function skillIdOf(tp: TestProblem): string {
  switch (tp.kind) {
    case 'decompose': return 'decompose-3';
    case 'word': return 'wp-mixed';
    case 'error': return tp.preset as string;
    case 'lineRead': return `line-read-${tp.level}`;
    case 'addsub': return tp.build ? `addsub-build-${tp.level}` : `addsub-${tp.level}`;
    default: return (tp as { level?: string }).level ?? tp.kind;
  }
}

/**
 * まちがえた問題に添える、やり方のひとこと。
 * テスト中は出さない。**終わってから**まちがえた問題にだけ添える。
 */
const HOW_BY_SKILL: Record<string, string> = {
  'decompose-3': '1が何こ・0.1が何こ・0.01が何こ、に 分けて 考えよう。',
  'addsub-sub-whole': '空いている位には 0が あると 考えて、位を そろえよう。',
  'addsub-add-diff': 'けた数が ちがっても、**小数点を そろえて** たてに 書こう。',
  'addsub-sub-diff': 'けた数が ちがっても、**小数点を そろえて** たてに 書こう。',
  'compare-mixed': '上の位から 順に くらべよう。けた数の 多さでは 決まらないよ。',
};

const HOW_BY_MODULE: Record<string, string> = {
  addsub: '小数点を そろえて、同じ位どうしを たてに そろえよう。',
  div: 'わる数の 小数点を 右へ動かした ぶんだけ、わられる数も 動かすよ。',
  mul: '答えの 小数点は、かけられる数と かける数の 小数点の けた数を たした ぶん。',
  compare: '上の位から 順に くらべよう。けた数の 多さでは 決まらないよ。',
  line: '1めもりが いくつかを 先に 読みとろう。',
  order: '同じ位で そろえてから、上の位の 順に ならべよう。',
  collect: '0.1が10こで 1、0.01が10こで 0.1 だよ。',
  compose: '1が何こ・0.1が何こ…を たし合わせると もとの数に なるよ。',
  placeid: '小数点の すぐ左が 一の位。そこから 数えよう。',
  scale: '10倍で 小数点が 右へ1つ、10でわると 左へ1つ 動くよ。',
  unit: '1m＝100cm、1kg＝1000g。単位を そろえてから 直そう。',
  wp: '場面から「たすのか・ひくのか・かけるのか・わるのか」を 先に 決めよう。',
  fix: 'まず 小数点の 位置が そろっているかを 見よう。',
  judge: '小数点の 位置と 位の そろえ方を、順に たしかめよう。',
  mock: '見直しは 小数点の 位置から。位が そろっているか 見よう。',
};

export function howTo(skillId: string): string {
  return HOW_BY_SKILL[skillId]
    ?? HOW_BY_MODULE[skillId.split('-')[0] ?? '']
    ?? 'もう一度 ゆっくり やってみよう。';
}

/** その項目を練習できるモジュール。テストのあと「れんしゅうする」で飛ぶ先。 */
export function practiceModuleOf(skillId: string): ModuleId | null {
  const m = skillToModuleId(skillId);
  return m === 'mock-test' ? null : m;
}
