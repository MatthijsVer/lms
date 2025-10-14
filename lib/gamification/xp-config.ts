export const XP_REWARDS = {
    LESSON_COMPLETED: 10,
    QUIZ_PASSED: 15,
    QUIZ_PERFECT_SCORE: 25,
    COURSE_COMPLETED: 100,
    DAILY_LOGIN: 5,
    FIRST_LESSON_OF_DAY: 10,
    STREAK_MILESTONE_3: 20,
    STREAK_MILESTONE_7: 50,
    STREAK_MILESTONE_30: 200,
    STREAK_MILESTONE_100: 500,
  } as const;
  
  export const LEVEL_CALCULATION = {
    BASE_XP: 100,
    MULTIPLIER: 1.5,
    // Level 1: 100 XP
    // Level 2: 150 XP
    // Level 3: 225 XP
    // Level 4: 337 XP
    // etc.
  };
  
  export function calculateXPForLevel(level: number): number {
    return Math.floor(
      LEVEL_CALCULATION.BASE_XP * Math.pow(LEVEL_CALCULATION.MULTIPLIER, level - 1)
    );
  }
  
  export function calculateLevelFromXP(totalXP: number): {
    level: number;
    xpToNextLevel: number;
    currentLevelXP: number;
  } {
    let level = 1;
    let xpRequired = 0;
    let xpForCurrentLevel = 0;
  
    while (xpRequired <= totalXP) {
      xpForCurrentLevel = calculateXPForLevel(level);
      if (xpRequired + xpForCurrentLevel > totalXP) {
        break;
      }
      xpRequired += xpForCurrentLevel;
      level++;
    }
  
    const currentLevelXP = totalXP - xpRequired;
    const xpToNextLevel = calculateXPForLevel(level) - currentLevelXP;
  
    return {
      level,
      xpToNextLevel,
      currentLevelXP,
    };
  }