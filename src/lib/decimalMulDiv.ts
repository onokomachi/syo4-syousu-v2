/**
 * 小数の かけ算・わり算（筆算）の純粋ロジック。
 * すべて整数スケールで計算し浮動小数点誤差を避ける。
 * 「小数わり算の各桁の手続きは、数字列を整数とみなしたわり算と同一。違うのは小数点の位置だけ」
 * という核心に基づき、表示用の数字列・小数点位置・各ステップを組み立てる。
 */
import { decimalsOf } from './decimal';

/* ===================== かけ算 ===================== */

export type MulLevel = 'mul-tenths' | 'mul-hundredths';

export const MUL_LEVELS: { id: MulLevel; label: string; description: string }[] = [
  { id: 'mul-tenths', label: 'かけ算 ①', description: '小数第一位 × 1けた（2.4 × 3）' },
  { id: 'mul-hundredths', label: 'かけ算 ②', description: '小数第二位 × 1けた（1.36 × 7）' },
];

export interface MulProblem {
  a: number; // 被乗数（小数）
  b: number; // 乗数（整数）
}

export interface MulModel {
  a: number;
  b: number;
  productIntDigits: string; // 整数とみなした積の数字列（小数点なし）
  decimals: number; // 積の小数点以下の桁数（= 被乗数の小数桁数）
  product: number; // 最終的な積（小数）
}

export function buildMul(a: number, b: number): MulModel {
  const decA = decimalsOf(a);
  const scaledA = Math.round(a * 10 ** decA);
  const intProduct = scaledA * b;
  return {
    a,
    b,
    productIntDigits: intProduct.toString(),
    decimals: decA,
    product: intProduct / 10 ** decA,
  };
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateMul(level: MulLevel): MulProblem {
  switch (level) {
    case 'mul-tenths':
      return { a: rnd(12, 49) / 10, b: rnd(2, 9) };
    case 'mul-hundredths':
      return { a: rnd(105, 489) / 100, b: rnd(2, 9) };
  }
}

/* ===================== わり算 ===================== */

export type DivLevel = 'div-basic' | 'div-carry' | 'div-remainder';

export const DIV_LEVELS: { id: DivLevel; label: string; description: string }[] = [
  { id: 'div-basic', label: 'わり算 ①', description: 'わり切れる（空位の0も）4.08 ÷ 4' },
  { id: 'div-carry', label: 'わり算 ②', description: '0をおろして わり進む 4.5 ÷ 6' },
  { id: 'div-remainder', label: 'わり算 ③', description: '商は一の位まで・あまり 13.5 ÷ 4' },
];

export interface DivProblem {
  dividend: number;
  divisor: number;
  mode: 'exact' | 'remainder';
}

export interface DivStep {
  index: number; // 被除数の数字列における桁インデックス
  quotient: number;
  multiply: number;
  remainder: number;
  dividendPart: number;
  appended: boolean; // 割り進みで補った 0 か
}

export interface DivModel {
  dividend: number;
  divisor: number;
  mode: 'exact' | 'remainder';
  digits: string; // 処理する数字列（割り進みの 0 を含む。小数点なし）
  fracStr: string; // remainder モードで表示だけする小数部（処理はしない）
  baseLen: number; // 補う前の元の桁数（これ以降は appended）
  intLen: number; // 被除数の整数部の桁数（小数点はこの後ろ）
  steps: DivStep[];
  quotientStartIndex: number; // 商を書き始める桁（先頭0の抑制）
  quotientPointIndex: number; // 商の小数点を打つ位置（この index の前）。整数商なら -1
  quotientValue: number;
  remainderValue: number; // mode='remainder' のときの小数あまり
}

const MAX_EXTRA_DECIMALS = 3;

export function buildDiv(problem: DivProblem): DivModel {
  const { dividend, divisor, mode } = problem;
  const decD = decimalsOf(dividend);
  const intPartStr = Math.floor(dividend + 1e-9).toString();
  const fullStr = decD > 0 ? dividend.toFixed(decD) : dividend.toString();
  const fracStr = decD > 0 ? fullStr.split('.')[1] : '';
  const intLen = intPartStr.length;

  const steps: DivStep[] = [];

  if (mode === 'remainder') {
    // 整数部の桁だけ処理し、商は一の位まで。あまりは小数。
    const digits = intPartStr;
    let rem = 0;
    for (let i = 0; i < digits.length; i++) {
      const cur = rem * 10 + Number(digits[i]);
      const q = Math.floor(cur / divisor);
      const m = q * divisor;
      rem = cur - m;
      steps.push({ index: i, quotient: q, multiply: m, remainder: rem, dividendPart: cur, appended: false });
    }
    const quotientValue = Math.floor(dividend / divisor);
    const remainderValue = Math.round((dividend - divisor * quotientValue) * 10 ** decD) / 10 ** decD;
    const firstNonZero = steps.findIndex((s) => s.quotient > 0);
    const quotientStartIndex = Math.min(intLen - 1, firstNonZero === -1 ? intLen - 1 : firstNonZero);
    return {
      dividend, divisor, mode,
      digits, fracStr, baseLen: digits.length, intLen,
      steps, quotientStartIndex, quotientPointIndex: -1,
      quotientValue, remainderValue,
    };
  }

  // exact / carry: 整数部＋小数部、必要なら割り進みで 0 を補う
  let digits = intPartStr + fracStr;
  const baseLen = digits.length;
  let rem = 0;
  let i = 0;
  while (true) {
    if (i >= digits.length) {
      if (rem === 0) break;
      const decimalsUsed = digits.length - intLen;
      if (decimalsUsed >= MAX_EXTRA_DECIMALS) break;
      digits += '0';
    }
    const appended = i >= baseLen;
    const cur = rem * 10 + Number(digits[i]);
    const q = Math.floor(cur / divisor);
    const m = q * divisor;
    rem = cur - m;
    steps.push({ index: i, quotient: q, multiply: m, remainder: rem, dividendPart: cur, appended });
    i++;
    if (i >= digits.length && rem === 0) break;
  }

  const firstNonZero = steps.findIndex((s) => s.quotient > 0);
  const quotientStartIndex = Math.min(intLen - 1, firstNonZero === -1 ? intLen - 1 : firstNonZero);
  // 商の小数点は被除数の小数点の真上 → index intLen の前
  const quotientPointIndex = digits.length > intLen ? intLen : -1;
  const totalDec = digits.length - intLen;
  const quotientValue = Math.round((dividend / divisor) * 10 ** (totalDec + 2)) / 10 ** (totalDec + 2);

  return {
    dividend, divisor, mode,
    digits, fracStr: '', baseLen, intLen,
    steps, quotientStartIndex, quotientPointIndex,
    quotientValue, remainderValue: 0,
  };
}

/** 割り切れる（場合により空位0）の被除数・除数を作る。 */
function genExact(): DivProblem {
  for (let t = 0; t < 200; t++) {
    const divisor = rnd(2, 9);
    const decD = Math.random() < 0.5 ? 1 : 2;
    const n = rnd(10 ** (decD), 10 ** (decD + 1) - 1); // 桁数を確保した整数（=被除数×10^decD）
    if (n % divisor !== 0) continue;
    const dividend = n / 10 ** decD;
    if (dividend < divisor) continue; // 商が1以上になるやさしい範囲
    return { dividend, divisor, mode: 'exact' };
  }
  return { dividend: 4.08, divisor: 4, mode: 'exact' };
}

/** 割り進みが必要（被除数より商の小数桁が多い）終わる小数を作る。 */
function genCarry(): DivProblem {
  for (let t = 0; t < 300; t++) {
    const divisor = rnd(2, 9);
    const qScaled = rnd(11, 95); // 商 = qScaled/100（小数第二位）
    const prod = qScaled * divisor; // = 被除数 × 100
    if (prod % 10 !== 0) continue; // 被除数は小数第一位（割り進みが必要）
    if (prod % 100 === 0) continue; // 被除数が整数になるのは除外
    const dividend = prod / 100;
    if (dividend <= 0) continue;
    return { dividend, divisor, mode: 'exact' };
  }
  return { dividend: 4.5, divisor: 6, mode: 'exact' };
}

/** 商を一の位まで求め、あまりが小数になる問題を作る。 */
function genRemainder(): DivProblem {
  for (let t = 0; t < 200; t++) {
    const divisor = rnd(3, 9);
    const q = rnd(1, 9);
    const remTenth = rnd(1, divisor * 10 - 1); // あまり = remTenth/10 < divisor
    if (remTenth % 10 === 0) continue; // あまりを小数にする
    const remainder = remTenth / 10;
    if (remainder >= divisor) continue;
    const dividend = Math.round((divisor * q + remainder) * 10) / 10;
    return { dividend, divisor, mode: 'remainder' };
  }
  return { dividend: 13.5, divisor: 4, mode: 'remainder' };
}

export function generateDiv(level: DivLevel): DivProblem {
  if (level === 'div-basic') return genExact();
  if (level === 'div-carry') return genCarry();
  return genRemainder();
}
