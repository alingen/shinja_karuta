import { GameProvider } from '@/features/game/context/GameContext';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <GameProvider>{children}</GameProvider>;
}
