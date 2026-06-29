/**
 * 児童ごとの表示・読み上げ設定。
 * 資料の「アクセシビリティ／認知負荷低減」方針（UDフォント・コントラスト・TTS）に対応。
 * localStorage に永続化（zustand persist）。
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'cream' | 'dark';
export type FontScale = 'normal' | 'large' | 'xlarge';

interface SettingsState {
  theme: Theme;
  fontScale: FontScale;
  soundEnabled: boolean;
  setTheme: (t: Theme) => void;
  setFontScale: (s: FontScale) => void;
  toggleSound: () => void;
}

export const FONT_SCALE_PX: Record<FontScale, string> = {
  normal: '16px',
  large: '18px',
  xlarge: '20px',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      fontScale: 'normal',
      soundEnabled: true,
      setTheme: (theme) => set({ theme }),
      setFontScale: (fontScale) => set({ fontScale }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    { name: 'syousu_settings_v1' }
  )
);
