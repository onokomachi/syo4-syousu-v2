/**
 * 「小数の かけ算・わり算」の問題の自動チェック（npm run verify）。
 * - 紙のテストの問題（4.9×72・54÷24・18.2÷28・16÷7 など）を、筆算の手順どおりに正しく解けるか
 * - 各レベルのジェネレーターが作る問題を 何百問も作り、答えを整数だけの計算で たしかめる
 * - 本番テスト2つの配点（表100点・裏50点）と、記録の名前（skillId）がレベルの一覧にあるか
 * 失敗したら終了コード1で止める（npm run check に入っている）。
 */
import { buildMul, buildDiv, type DivProblem } from '../src/lib/decimalMulDiv';
import { ALL_MULDIV_LEVELS, generateMulDiv, describeMulDiv, type MulDivLevel } from '../src/lib/mulDivQuestions';
import { TESTS, skillIdOf, describeProblem } from '../src/lib/testConfig';
import { TRIAL, FLOOR_COUNT } from '../src/lib/trialConfig';

let fails = 0;
const fail = (msg: string) => { fails++; console.error('NG', msg); };
const eq = (got: unknown, want: unknown, msg: string) => { if (got !== want) fail(`${msg}: got ${String(got)} want ${String(want)}`); };

/** 小数の文字列 → [整数, 小数けた数] */
const sc = (s: string): [bigint, number] => {
  const [i, f = ''] = s.split('.');
  return [BigInt(i! + f), f.length];
};
const same = (a: string, b: string) => {
  const [x, dx] = sc(a); const [y, dy] = sc(b);
  const d = Math.max(dx, dy);
  return x * 10n ** BigInt(d - dx) === y * 10n ** BigInt(d - dy);
};

/* ---------- 紙のテストの問題 ---------- */
const mulCases: [number, number, string, string[]][] = [
  [2.7, 6, '16.2', []], [13.4, 4, '53.6', []], [4.9, 72, '352.8', ['98', '343']],
  [17.6, 40, '704', []], [2.43, 8, '19.44', []], [3.85, 2, '7.7', []], [4.3, 16, '68.8', ['258', '43']],
  [1.6, 35, '56', ['80', '48']],
];
for (const [a, b, want, parts] of mulCases) {
  const m = buildMul(a, b);
  eq(m.productStr, want, `${a}×${b}`);
  eq(m.partials.map((p) => p.digits).join(','), parts.join(','), `${a}×${b} 部分積`);
}
eq(buildMul(17.6, 40).trailingZeros, 1, '17.6×40 消す0');
eq(buildMul(3.85, 2).trailingZeros, 1, '3.85×2 消す0');

const divCases: [DivProblem, string, string][] = [
  [{ dividend: 9.2, divisor: 4, mode: 'exact' }, '2.3', ''],
  [{ dividend: 5.34, divisor: 6, mode: 'exact' }, '0.89', ''],
  [{ dividend: 54, divisor: 24, mode: 'exact' }, '2.25', ''],
  [{ dividend: 18.2, divisor: 28, mode: 'exact' }, '0.65', ''],
  [{ dividend: 16, divisor: 7, mode: 'round' }, '2.28', '2.3'],
  [{ dividend: 95.3, divisor: 23, mode: 'round' }, '4.14', '4.1'],
  [{ dividend: 68.1, divisor: 5, mode: 'remainder' }, '13', '3.1'],
  [{ dividend: 8.4, divisor: 3, mode: 'exact' }, '2.8', ''],
  [{ dividend: 43.8, divisor: 6, mode: 'exact' }, '7.3', ''],
  [{ dividend: 91, divisor: 14, mode: 'exact' }, '6.5', ''],
];
for (const [p, q, extra] of divCases) {
  const m = buildDiv(p);
  eq(m.quotientStr, q, `${p.dividend}÷${p.divisor} 商`);
  if (p.mode === 'round') eq(m.roundedStr, extra, `${p.dividend}÷${p.divisor} がい数`);
  if (p.mode === 'remainder') eq(m.remainderStr, extra, `${p.dividend}÷${p.divisor} あまり`);
}

/* ---------- ジェネレーター ---------- */
function checkDiv(p: DivProblem, tag: string) {
  const m = buildDiv(p);
  const D = String(p.dividend);
  // 手順の整合: 各ステップ 商×わる数＋あまり＝その段の数、あまり < わる数
  for (const s of m.steps) {
    if (s.quotient < 0 || s.quotient > 9) fail(`${tag} ${D}÷${p.divisor} 商のけた ${s.quotient}`);
    if (s.multiply + s.remainder !== s.dividendPart || s.remainder >= p.divisor) fail(`${tag} ${D}÷${p.divisor} 手順`);
  }
  if (p.mode === 'exact') {
    const [qi, qd] = sc(m.quotientStr); const [di, dd] = sc(D);
    const d = Math.max(qd, dd);
    if (qi * BigInt(p.divisor) * 10n ** BigInt(d - qd) !== di * 10n ** BigInt(d - dd)) fail(`${tag} ${D}÷${p.divisor}=${m.quotientStr} わりきれていない`);
  } else if (p.mode === 'remainder') {
    const [ri, rd] = sc(m.remainderStr); const [di, dd] = sc(D);
    const d = Math.max(rd, dd);
    const lhs = BigInt(p.divisor) * BigInt(m.quotientStr) * 10n ** BigInt(d) + ri * 10n ** BigInt(d - rd);
    if (lhs !== di * 10n ** BigInt(d - dd)) fail(`${tag} ${D}÷${p.divisor} けん算が合わない`);
    if (Number(m.remainderStr) >= p.divisor) fail(`${tag} あまりが わる数以上`);
  } else {
    // 上から3けたまでの商を 本当の商と くらべる（切りすて）
    const exact = p.dividend / p.divisor;
    if (Math.abs(exact - Number(m.quotientStr)) >= 0.01 * 10 ** Math.floor(Math.log10(exact))) fail(`${tag} ${D}÷${p.divisor} 商がずれる`);
    const sig = m.quotientStr.replace('.', '').replace(/^0+/, '').length;
    if (sig !== 3) fail(`${tag} ${D}÷${p.divisor} 3けたまで求めていない (${m.quotientStr})`);
  }
}

const N = 400;
for (const lv of ALL_MULDIV_LEVELS) {
  for (let k = 0; k < N; k++) {
    const q = generateMulDiv(lv.id as MulDivLevel);
    const d = describeMulDiv(q);
    if (!d.q || !d.a || /NaN|undefined/.test(d.a + d.q)) fail(`${lv.id} 説明 ${d.q} → ${d.a}`);
    if (q.ui === 'mul' || q.ui === 'mulPoint') {
      const m = buildMul(q.p.a, q.p.b);
      if (!same(m.productStr, String(Math.round(q.p.a * 1000) * q.p.b / 1000)) && !same(m.productStr, (q.p.a * q.p.b).toFixed(4))) fail(`${lv.id} ${q.p.a}×${q.p.b}=${m.productStr}`);
      if (q.ui === 'mulPoint' && m.trailingZeros > 0) fail(`mul-point に 終わりの0`);
      if (lv.id === 'mul-2digit' && m.partials.length !== 2) fail(`mul-2digit 部分積が2行でない ${q.p.a}×${q.p.b}`);
      if (lv.id === 'mul-zero-end' && m.trailingZeros === 0) fail(`mul-zero-end に 消す0がない ${q.p.a}×${q.p.b}`);
    }
    if (q.ui === 'div' || q.ui === 'divPoint') {
      checkDiv(q.p, lv.id);
      if (lv.id === 'div-2digit' && q.p.divisor < 10) fail('div-2digit のわる数が1けた');
      if (lv.id === 'div-check' && !q.p.check) fail('div-check に けん算がない');
    }
    if (q.ui === 'mental') {
      const exact = q.p.op === '×' ? q.p.a * q.p.b : q.p.a / q.p.b;
      if (Math.abs(exact - Number(q.p.answer)) > 1e-9) fail(`mental ${q.p.a}${q.p.op}${q.p.b}=${q.p.answer}`);
    }
    if (q.ui === 'word') {
      const exact = q.p.op === '×' ? q.p.a * q.p.b : q.p.a / q.p.b;
      if (Math.abs(exact - Number(q.p.answer)) > 1e-9) fail(`word ${q.p.text} ${q.p.answer}`);
      if (q.p.choices[q.p.correctIndex] !== `${q.p.a} ${q.p.op} ${q.p.b}`) fail('word 式の正解');
    }
    if (q.ui === 'remWord') {
      if (Math.abs(q.p.each * q.p.count + Number(q.p.rest) - q.p.total) > 1e-9 || Number(q.p.rest) >= q.p.each) fail(`remWord ${q.p.text}`);
    }
    if (q.ui === 'times') {
      if (Math.abs(q.p.target / q.p.base - Number(q.p.answer)) > 1e-9) fail(`times ${q.p.target}/${q.p.base}=${q.p.answer}`);
    }
  }
}

/* ---------- 本番テスト ---------- */
const known = new Set(ALL_MULDIV_LEVELS.map((l) => l.id as string));
for (const t of TESTS) {
  eq(t.omoteMax, 100, `${t.title} 表の配点`);
  eq(t.uraMax, 50, `${t.title} 裏の配点`);
  for (let k = 0; k < 50; k++) {
    for (const s of t.steps) {
      const tp = s.gen();
      const d = describeProblem(tp);
      if (!d.q || !d.a) fail(`${t.title} 大問${s.daimon}${s.sub ?? ''} 説明が空`);
      if (t.id === 'muldiv' && !known.has(skillIdOf(tp))) fail(`${t.title} 大問${s.daimon} skillId ${skillIdOf(tp)} がレベルにない`);
    }
  }
}
const md = TESTS.find((t) => t.id === 'muldiv')!;
eq(md.steps.filter((s) => s.section === '表').length, 20, 'かけ算とわり算 表の問題数');
eq(TRIAL.max, TESTS.reduce((a, t) => a + t.totalMax, 0), '実力の階段のテスト予想の満点');
if (TRIAL.reqs.some((r) => r.floor < 1 || r.floor > FLOOR_COUNT)) fail('実力の階段 段の番号');

if (fails) { console.error(`\n${fails} 件 NG`); process.exit(1); }
console.log(`OK かけ算・わり算 ${ALL_MULDIV_LEVELS.length}レベル × ${N}問・本番テスト${TESTS.length}つ・実力の階段 ${FLOOR_COUNT}段`);
