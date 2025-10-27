"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SetStateAction,
} from "react";

export type BlockProgress = {
  blockId: string;
  completed: boolean;
  score: number;
  maxScore: number;
  attempts: number;
  metadata?: Record<string, any> | null;
};

type UpdateOptions = {
  persist?: boolean;
  incrementAttempt?: boolean;
};

type LessonProgressContextType = {
  blockProgress: Map<string, BlockProgress>;
  updateBlockProgress: (
    blockId: string,
    progress: Partial<BlockProgress>,
    options?: UpdateOptions
  ) => Promise<BlockProgress | undefined>;
  isBlockCompleted: (blockId: string) => boolean;
  getAllProgress: () => BlockProgress[];
  getTotalScore: () => { earned: number; possible: number };
  areAllBlocksCompleted: (requiredBlocks: string[]) => boolean;
  resetProgress: () => void;
  getBlockProgress: (blockId: string) => BlockProgress | undefined;
  resetSignal: number;
};

type LessonProgressProviderProps = {
  children: ReactNode;
  initialProgress?: BlockProgress[];
  onPersist?: (progress: BlockProgress) => Promise<void> | void;
};

const LessonProgressContext = createContext<
  LessonProgressContextType | undefined
>(undefined);

const defaultProgressFor = (blockId: string): BlockProgress => ({
  blockId,
  completed: false,
  score: 0,
  maxScore: 0,
  attempts: 0,
  metadata: {},
});

export function LessonProgressProvider({
  children,
  initialProgress = [],
  onPersist,
}: LessonProgressProviderProps) {
  const initialMap = useMemo(() => {
    const map = new Map<string, BlockProgress>();
    initialProgress.forEach((progress) => {
      map.set(progress.blockId, {
        ...defaultProgressFor(progress.blockId),
        ...progress,
        metadata: progress.metadata ?? {},
      });
    });
    return map;
  }, [initialProgress]);

  const [blockProgress, setBlockProgress] = useState<Map<string, BlockProgress>>(
    initialMap
  );
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    setBlockProgress(initialMap);
  }, [initialMap]);

  const updateBlockProgress = useCallback(
    async (
      blockId: string,
      progress: Partial<BlockProgress>,
      options: UpdateOptions = {}
    ) => {
      let nextProgress: BlockProgress | undefined;

      setBlockProgress((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(blockId) ?? defaultProgressFor(blockId);

        nextProgress = {
          ...existing,
          metadata: existing.metadata ?? {},
        };

        if (progress.completed !== undefined) {
          nextProgress.completed = progress.completed;
        }
        if (progress.score !== undefined) {
          nextProgress.score = progress.score;
        }
        if (progress.maxScore !== undefined) {
          nextProgress.maxScore = progress.maxScore;
        }
        if (progress.attempts !== undefined) {
          nextProgress.attempts = progress.attempts;
        } else if (options.incrementAttempt) {
          nextProgress.attempts = (existing.attempts ?? 0) + 1;
        }

        if (progress.metadata) {
          nextProgress.metadata = {
            ...(nextProgress.metadata ?? {}),
            ...progress.metadata,
          };
        }

        newMap.set(blockId, nextProgress!);
        return newMap;
      });

      if (nextProgress && options.persist !== false && onPersist) {
        try {
          await onPersist(nextProgress);
        } catch (error) {
          console.error("Failed to persist block progress", error);
        }
      }

      return nextProgress;
    },
    [onPersist]
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

  const getBlockProgress = useCallback(
    (blockId: string) => blockProgress.get(blockId),
    [blockProgress]
  );

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
    setResetSignal((prev) => prev + 1);
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
        getBlockProgress,
        resetSignal,
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

export function useBlockPersistentState<T extends Record<string, any>>(
  blockId: string,
  initialState: T,
  options?: { debounceMs?: number }
) {
  const { getBlockProgress, updateBlockProgress, resetSignal } =
    useLessonProgress();
  const baseStateRef = useRef<T>(initialState);
  const [state, setState] = useState<T>(() => {
    const stored = (getBlockProgress(blockId)?.metadata?.state ?? {}) as T;
    return {
      ...baseStateRef.current,
      ...stored,
    };
  });

  useEffect(() => {
    baseStateRef.current = initialState;
  }, [initialState]);

  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (hasHydratedRef.current) return;
    const stored = (getBlockProgress(blockId)?.metadata?.state ?? {}) as T;
    if (stored && Object.keys(stored).length > 0) {
      setState(() => ({
        ...baseStateRef.current,
        ...stored,
      }));
    }
    hasHydratedRef.current = true;
  }, [blockId, getBlockProgress, resetSignal]);

  useEffect(() => {
    if (resetSignal === 0) return;
    hasHydratedRef.current = false;
    setState({ ...baseStateRef.current });
  }, [resetSignal]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;

    const timeout = setTimeout(() => {
      updateBlockProgress(
        blockId,
        {
          metadata: {
            state,
          },
        },
        { persist: true }
      );
    }, options?.debounceMs ?? 400);

    return () => clearTimeout(timeout);
  }, [blockId, state, updateBlockProgress, options?.debounceMs]);

  const setPersistentState = useCallback(
    (value: SetStateAction<T>) => {
      setState((prev) =>
        typeof value === "function"
          ? (value as (prevState: T) => T)(prev)
          : value
      );
    },
    []
  );

  return [state, setPersistentState] as const;
}
