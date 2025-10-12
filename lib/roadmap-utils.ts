// lib/roadmap-utils.ts

/**
 * Utility functions for course roadmap and gamification
 */

export interface AchievementConfig {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: "completion" | "points" | "quiz" | "streak" | "speed" | "custom";
    checkEarned: (data: CourseProgressData) => boolean;
    calculateProgress?: (data: CourseProgressData) => number;
  }
  
  export interface CourseProgressData {
    totalLessons: number;
    completedLessons: number;
    totalPoints: number;
    earnedPoints: number;
    totalQuizzes: number;
    completedQuizzes: number;
    totalTimeSpent: number;
    enrolledAt: Date;
    lastActivityAt?: Date;
    consecutiveDays?: number;
  }
  
  /**
   * Pre-defined achievement templates
   */
  export const ACHIEVEMENT_TEMPLATES: AchievementConfig[] = [
    {
      id: "first-lesson",
      title: "First Steps",
      description: "Complete your first lesson",
      icon: "BookOpen",
      category: "completion",
      checkEarned: (data) => data.completedLessons >= 1,
    },
    {
      id: "quarter-complete",
      title: "Quarter Master",
      description: "Complete 25% of all lessons",
      icon: "Target",
      category: "completion",
      checkEarned: (data) => data.completedLessons >= data.totalLessons * 0.25,
      calculateProgress: (data) =>
        Math.min(100, Math.round((data.completedLessons / (data.totalLessons * 0.25)) * 100)),
    },
    {
      id: "half-complete",
      title: "Halfway Hero",
      description: "Complete 50% of all lessons",
      icon: "Award",
      category: "completion",
      checkEarned: (data) => data.completedLessons >= data.totalLessons * 0.5,
      calculateProgress: (data) =>
        Math.min(100, Math.round((data.completedLessons / (data.totalLessons * 0.5)) * 100)),
    },
    {
      id: "course-complete",
      title: "Course Champion",
      description: "Complete all lessons in the course",
      icon: "Trophy",
      category: "completion",
      checkEarned: (data) => data.completedLessons === data.totalLessons && data.totalLessons > 0,
      calculateProgress: (data) =>
        data.totalLessons > 0 ? Math.round((data.completedLessons / data.totalLessons) * 100) : 0,
    },
    {
      id: "first-points",
      title: "Point Collector",
      description: "Earn your first points",
      icon: "Star",
      category: "points",
      checkEarned: (data) => data.earnedPoints > 0,
    },
    {
      id: "half-points",
      title: "Point Master",
      description: "Earn 50% of all available points",
      icon: "Sparkles",
      category: "points",
      checkEarned: (data) => data.totalPoints > 0 && data.earnedPoints >= data.totalPoints * 0.5,
      calculateProgress: (data) =>
        data.totalPoints > 0
          ? Math.min(100, Math.round((data.earnedPoints / (data.totalPoints * 0.5)) * 100))
          : 0,
    },
    {
      id: "perfect-score",
      title: "Perfect Score",
      description: "Earn 100% of all available points",
      icon: "Crown",
      category: "points",
      checkEarned: (data) => data.totalPoints > 0 && data.earnedPoints === data.totalPoints,
      calculateProgress: (data) =>
        data.totalPoints > 0 ? Math.round((data.earnedPoints / data.totalPoints) * 100) : 0,
    },
    {
      id: "quiz-master",
      title: "Quiz Master",
      description: "Complete all quizzes correctly",
      icon: "Brain",
      category: "quiz",
      checkEarned: (data) => data.totalQuizzes > 0 && data.completedQuizzes === data.totalQuizzes,
      calculateProgress: (data) =>
        data.totalQuizzes > 0 ? Math.round((data.completedQuizzes / data.totalQuizzes) * 100) : 0,
    },
  ];
  
  /**
   * Calculate achievements based on progress data
   */
  export function calculateAchievements(
    data: CourseProgressData,
    customAchievements: AchievementConfig[] = []
  ) {
    const allAchievements = [...ACHIEVEMENT_TEMPLATES, ...customAchievements];
  
    return allAchievements.map((achievement) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      earned: achievement.checkEarned(data),
      progress: achievement.calculateProgress ? achievement.calculateProgress(data) : undefined,
    }));
  }
  
  /**
   * Get achievement tier based on progress
   */
  export function getAchievementTier(progressPercentage: number): {
    tier: "bronze" | "silver" | "gold" | "platinum";
    color: string;
    emoji: string;
  } {
    if (progressPercentage === 100) {
      return { tier: "platinum", color: "text-cyan-600", emoji: "💎" };
    } else if (progressPercentage >= 75) {
      return { tier: "gold", color: "text-yellow-600", emoji: "🥇" };
    } else if (progressPercentage >= 50) {
      return { tier: "silver", color: "text-gray-400", emoji: "🥈" };
    } else {
      return { tier: "bronze", color: "text-orange-600", emoji: "🥉" };
    }
  }
  
  /**
   * Format time duration for display
   */
  export function formatTimeSpent(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
  
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * Calculate streak (consecutive days of activity)
   * This would need to be implemented based on your activity tracking
   */
  export function calculateStreak(activityDates: Date[]): number {
    if (activityDates.length === 0) return 0;
  
    // Sort dates in descending order
    const sortedDates = activityDates
      .map((d) => new Date(d).setHours(0, 0, 0, 0))
      .sort((a, b) => b - a);
  
    let streak = 1;
    const today = new Date().setHours(0, 0, 0, 0);
    const oneDayMs = 24 * 60 * 60 * 1000;
  
    // Check if most recent activity was today or yesterday
    if (sortedDates[0] !== today && sortedDates[0] !== today - oneDayMs) {
      return 0;
    }
  
    // Count consecutive days
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = sortedDates[i - 1] - sortedDates[i];
      if (diff === oneDayMs) {
        streak++;
      } else {
        break;
      }
    }
  
    return streak;
  }
  
  /**
   * Get motivational message based on progress
   */
  export function getMotivationalMessage(progressPercentage: number): {
    message: string;
    emoji: string;
  } {
    if (progressPercentage === 100) {
      return {
        message: "Outstanding! You've mastered this course!",
        emoji: "🎉",
      };
    } else if (progressPercentage >= 75) {
      return {
        message: "Almost there! Keep up the great work!",
        emoji: "🔥",
      };
    } else if (progressPercentage >= 50) {
      return {
        message: "You're halfway there! Keep going strong!",
        emoji: "💪",
      };
    } else if (progressPercentage >= 25) {
      return {
        message: "Great progress! You're building momentum!",
        emoji: "🚀",
      };
    } else if (progressPercentage > 0) {
      return {
        message: "Nice start! Every journey begins with a single step!",
        emoji: "🌟",
      };
    } else {
      return {
        message: "Ready to begin your learning journey?",
        emoji: "📚",
      };
    }
  }
  
  /**
   * Calculate estimated time to completion
   */
  export function estimateTimeToCompletion(
    totalLessons: number,
    completedLessons: number,
    averageTimePerLesson: number // in seconds
  ): string {
    const remainingLessons = totalLessons - completedLessons;
    const estimatedSeconds = remainingLessons * averageTimePerLesson;
  
    const hours = Math.floor(estimatedSeconds / 3600);
    const minutes = Math.floor((estimatedSeconds % 3600) / 60);
  
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `~${days} days`;
    } else if (hours > 0) {
      return `~${hours}h ${minutes}m`;
    } else {
      return `~${minutes}m`;
    }
  }
  
  /**
   * Get next milestone
   */
  export function getNextMilestone(progressPercentage: number): {
    milestone: number;
    description: string;
    remaining: number;
  } {
    const milestones = [
      { value: 25, description: "Quarter Complete" },
      { value: 50, description: "Halfway There" },
      { value: 75, description: "Three Quarters" },
      { value: 100, description: "Course Complete" },
    ];
  
    const nextMilestone = milestones.find((m) => m.value > progressPercentage);
  
    if (!nextMilestone) {
      return {
        milestone: 100,
        description: "Course Complete",
        remaining: 0,
      };
    }
  
    return {
      milestone: nextMilestone.value,
      description: nextMilestone.description,
      remaining: nextMilestone.value - progressPercentage,
    };
  }
  
  /**
   * Generate share text for achievements
   */
  export function generateShareText(
    courseName: string,
    achievementTitle: string,
    progressPercentage: number
  ): string {
    return `🎉 I just unlocked "${achievementTitle}" in ${courseName}! ${progressPercentage}% complete. #LearningJourney`;
  }