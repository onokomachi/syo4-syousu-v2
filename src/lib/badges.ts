/**
 * ごほうびバッジ。進捗データから「獲得済み/未獲得」を計算する純粋関数。
 * 資料: バッジ等の報酬で学習意欲・自信を持続させ、算数不安を下げる（GBLE）。
 */
import { MODULES } from '../constants';

export interface BadgeData {
  totalCorrect: number;
  maxStreak: number;
  moduleCounts: Record<string, number>;
  // 本番テストの自己ベスト得点（表/裏/両面）
  bestTestOmote?: number;
  bestTestUra?: number;
  bestTestTotal?: number;
  // 習熟度MAX（5連続ノーミス）を達成したモジュール
  masteredModules?: Record<string, boolean>;
}

export interface Badge {
  id: string;
  title: string;
  desc: string;
  icon: string; // lucide アイコン名
  earned: boolean;
}

export function computeBadges(d: BadgeData): Badge[] {
  const omote = d.bestTestOmote ?? 0;
  const ura = d.bestTestUra ?? 0;
  const total = d.bestTestTotal ?? 0;
  const list: Badge[] = [
    { id: 'first', title: 'はじめの一歩', desc: '1問 クリア', icon: 'Star', earned: d.totalCorrect >= 1 },
    // がんばり（累計クリア数）
    { id: 't20', title: 'がんばり20', desc: '累計20問 クリア', icon: 'Sparkles', earned: d.totalCorrect >= 20 },
    { id: 't30', title: 'がんばり30', desc: '累計30問 クリア', icon: 'Medal', earned: d.totalCorrect >= 30 },
    { id: 't50', title: 'がんばり50', desc: '累計50問 クリア', icon: 'Award', earned: d.totalCorrect >= 50 },
    { id: 't100', title: 'がんばり100', desc: '累計100問 クリア', icon: 'Trophy', earned: d.totalCorrect >= 100 },
    // ノーミス（連続ノーミス記録）
    { id: 's5', title: 'ノーミス5', desc: '5問連続 ノーミス', icon: 'Flame', earned: d.maxStreak >= 5 },
    { id: 's10', title: 'ノーミス10', desc: '10問連続 ノーミス', icon: 'Crown', earned: d.maxStreak >= 10 },
    { id: 's20', title: 'ノーミス20', desc: '20問連続 ノーミス', icon: 'Zap', earned: d.maxStreak >= 20 },
    { id: 's30', title: 'ノーミス30', desc: '30問連続 ノーミス', icon: 'Target', earned: d.maxStreak >= 30 },
    { id: 's50', title: 'ノーミス50', desc: '50問連続 ノーミス', icon: 'Rocket', earned: d.maxStreak >= 50 },
    // テスト表面（知識技能・満点100）
    { id: 'to50', title: '表テスト50', desc: 'テスト表で 50点いじょう', icon: 'ClipboardCheck', earned: omote >= 50 },
    { id: 'to75', title: '表テスト75', desc: 'テスト表で 75点いじょう', icon: 'ClipboardCheck', earned: omote >= 75 },
    { id: 'to90', title: '表テスト90', desc: 'テスト表で 90点いじょう', icon: 'ClipboardCheck', earned: omote >= 90 },
    { id: 'to100', title: '表テスト満点', desc: 'テスト表で 100点', icon: 'Trophy', earned: omote >= 100 },
    // テスト裏面（思考判断表現・満点50）
    { id: 'tu25', title: '裏テスト25', desc: 'テスト裏で 25点いじょう', icon: 'BookOpen', earned: ura >= 25 },
    { id: 'tu40', title: '裏テスト40', desc: 'テスト裏で 40点いじょう', icon: 'BookOpen', earned: ura >= 40 },
    { id: 'tu50', title: '裏テスト満点', desc: 'テスト裏で 50点', icon: 'Award', earned: ura >= 50 },
    // テスト両面（表＋裏・満点150）
    { id: 'tt75', title: '両面テスト75', desc: '両面テストで 75点いじょう', icon: 'Gem', earned: total >= 75 },
    { id: 'tt100', title: '両面テスト100', desc: '両面テストで 100点いじょう', icon: 'Gem', earned: total >= 100 },
    { id: 'tt140', title: '両面テスト140', desc: '両面テストで 140点いじょう', icon: 'Crown', earned: total >= 140 },
    { id: 'tt150', title: '両面テスト満点', desc: '両面テストで 150点', icon: 'Crown', earned: total >= 150 },
  ];
  MODULES.forEach((m) =>
    list.push({
      id: `m-${m.id}`,
      title: `${m.title} デビュー`,
      desc: 'はじめて クリア',
      icon: m.icon,
      earned: (d.moduleCounts[m.id] || 0) >= 1,
    })
  );
  // 各モジュールの「習熟度MAX」バッジ（あるレベルで5問連続ノーミス＝熟達バー満タン）
  MODULES.forEach((m) =>
    list.push({
      id: `mx-${m.id}`,
      title: `${m.title} マスター`,
      desc: '習熟度MAX たっせい',
      icon: 'Crown',
      earned: !!(d.masteredModules && d.masteredModules[m.id]),
    })
  );
  // 最後の称号「【小数】神」: ほかの全バッジを獲得したときだけ手に入る。
  // （この時点の list には自分以外の全バッジが入っているので every で判定）
  list.push({
    id: 'god',
    title: '【小数】神',
    desc: 'すべての バッジを かくとく',
    icon: 'Crown',
    earned: list.every((b) => b.earned),
  });
  return list;
}
