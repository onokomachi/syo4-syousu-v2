/**
 * バッジ獲得率に応じて解放される「特別なデザイン（テーマ）」の定義。
 * 50% → 深海 / 75% → 極光 / 100% → 宇宙神。
 * light・和（cream）・マトリックス（dark）は最初から使える。
 */
import { Theme } from '../store/settingsStore';

export interface ThemeUnlock {
  /** バッジ獲得率がこの値以上で解放（0..1）。未指定＝最初から解放。 */
  ratio?: number;
  /** 解放条件の表示（例: 'バッジ 50%'）。 */
  label?: string;
}

export const THEME_UNLOCK: Record<Theme, ThemeUnlock> = {
  light: {},
  cream: {},
  dark: {},
  deep: { ratio: 0.5, label: 'バッジ 50%' },
  aurora: { ratio: 0.75, label: 'バッジ 75%' },
  cosmos: { ratio: 1.0, label: 'バッジ 100%' },
};

/** そのテーマが現在の獲得率で解放されているか。 */
export function isThemeUnlocked(theme: Theme, ratio: number): boolean {
  const req = THEME_UNLOCK[theme]?.ratio;
  if (req == null) return true;
  // 浮動小数の誤差を吸収して 100% 到達を確実に判定する
  return ratio >= req - 1e-9;
}
