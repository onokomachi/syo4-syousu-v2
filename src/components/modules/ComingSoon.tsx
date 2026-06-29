/**
 * 未実装モジュールのプレースホルダ。次フェーズで本実装に差し替える。
 */
import React from 'react';
import { Hammer } from 'lucide-react';
import { AppShell } from '../shared/AppShell';

interface Props {
  title: string;
  onBack: () => void;
}

export const ComingSoon: React.FC<Props> = ({ title, onBack }) => (
  <AppShell title={title} subtitle="じゅんびちゅう" onBack={onBack}>
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="w-24 h-24 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6">
        <Hammer size={44} />
      </div>
      <h2 className="text-2xl font-black text-content mb-2">ただいま じゅんびちゅう</h2>
      <p className="text-muted font-medium">このコーナーは もうすぐ あそべるよ！</p>
    </div>
  </AppShell>
);
