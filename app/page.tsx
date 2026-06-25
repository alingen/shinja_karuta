'use client';

import { useEffect } from 'react';
import { useGame } from '@/features/game/context/GameContext';

export default function HomePage() {
  const { startGame } = useGame();

  useEffect(() => {
    startGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
