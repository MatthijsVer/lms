"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type BlockProgress = {
  blockId: string;
  completed: boolean;
  score: number;
  maxScore: number;
  attempts: number;
};

type LessonProgressContextType = {
  blockProgress: Map<string, BlockProgress>;
  updateBlockProgress: (
    blockId: string,
    progress: Partial<BlockProgress>
  ) => void;
  isBlockCompleted: (blockId: string) => boolean;
  getAllProgress: () => BlockProgress[];
  getTotalScore: () => { earned: number; possible: number };
  areAllBlocksCompleted: (requiredBlocks: string[]) => boolean;
  resetProgress: () => void;
};

const LessonProgressContext = createContext<
  LessonProgressContextType | undefined
>(undefined);

export function LessonProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [blockProgress, setBlockProgress] = useState<
    Map<string, BlockProgress>
  >(new Map());

  const updateBlockProgress = useCallback(
    (blockId: string, progress: Partial<BlockProgress>) => {
      setBlockProgress((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(blockId) || {
          blockId,
          completed: false,
          score: 0,
          maxScore: 0,
          attempts: 0,
        };

        newMap.set(blockId, {
          ...existing,
          ...progress,
          attempts:
            progress.attempts !== undefined
              ? progress.attempts
              : existing.attempts + 1,
        });

        return newMap;
      });
    },
    []
  );

  const isBlockCompleted = useCallback(
    (blockId: string) => {
      return blockProgress.get(blockId)?.completed || false;
    },
    [blockProgress]
  );

  const getAllProgress = useCallback(() => {
    return Array.from(blockProgress.values());
  }, [blockProgress]);

  const getTotalScore = useCallback(() => {
    let earned = 0;
    let possible = 0;

    blockProgress.forEach((progress) => {
      earned += progress.score;
      possible += progress.maxScore;
    });

    return { earned, possible };
  }, [blockProgress]);

  const areAllBlocksCompleted = useCallback(
    (requiredBlocks: string[]) => {
      return requiredBlocks.every((blockId) => isBlockCompleted(blockId));
    },
    [isBlockCompleted]
  );

  const resetProgress = useCallback(() => {
    setBlockProgress(new Map());
  }, []);

  return (
    <LessonProgressContext.Provider
      value={{
        blockProgress,
        updateBlockProgress,
        isBlockCompleted,
        getAllProgress,
        getTotalScore,
        areAllBlocksCompleted,
        resetProgress,
      }}
    >
      {children}
    </LessonProgressContext.Provider>
  );
}

export function useLessonProgress() {
  const context = useContext(LessonProgressContext);
  if (!context) {
    throw new Error(
      "useLessonProgress must be used within LessonProgressProvider"
    );
  }
  return context;
}
