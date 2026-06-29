import { ModuleId } from './store/progressStore';

/**
 * 「小数ランド」のモジュール一覧。資料の4領域＋ミニゲームに対応。
 * status: 'ready' は実装済み、'soon' は今後のフェーズで追加。
 */
export interface ModuleMeta {
  id: ModuleId;
  title: string;
  description: string;
  /** lucide-react のアイコン名 */
  icon: string;
  /** Tailwind の色トークン（カードのアクセント） */
  accent: string;
  status: 'ready' | 'soon';
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'place-value',
    title: '位取りラボ',
    description: '0.1 や 0.01 を あつめてみよう',
    icon: 'LayoutGrid',
    accent: 'rose',
    status: 'ready',
  },
  {
    id: 'number-line',
    title: '数直線・大小くらべ',
    description: 'どちらが 大きいかな？',
    icon: 'Ruler',
    accent: 'amber',
    status: 'ready',
  },
  {
    id: 'decimal-addsub',
    title: '小数の たし算・ひき算',
    description: '小数点をそろえて 筆算しよう',
    icon: 'PlusSquare',
    accent: 'emerald',
    status: 'ready',
  },
  {
    id: 'decimal-muldiv',
    title: '小数の かけ算・わり算',
    description: '小数点の いちに気をつけて',
    icon: 'X',
    accent: 'violet',
    status: 'ready',
  },
  {
    id: 'word-problem',
    title: 'ことばの もんだい',
    description: 'しきを 考えて とこう',
    icon: 'BookOpen',
    accent: 'teal',
    status: 'ready',
  },
  {
    id: 'error-hunter',
    title: 'エラーハンター',
    description: 'まちがいを 見つけて なおそう',
    icon: 'Search',
    accent: 'cyan',
    status: 'ready',
  },
];
