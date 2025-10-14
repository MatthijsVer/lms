export type ApiResponse = {
  status: "success" | "error";

  message: string;
};

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";
export type CourseStatus = "Draft" | "Published" | "Archived";
export type EnrollmentStatus = "Pending" | "Active" | "Cancelled";
export type ContentBlockType = 
  | "VIDEO"
  | "TEXT"
  | "IMAGE"
  | "QUIZ"
  | "EXERCISE"
  | "CODE_EXERCISE"
  | "CODE"
  | "PDF"
  | "AUDIO"
  | "DOWNLOAD"
  | "FILL_IN_BLANK"
  | "FLASHCARD"
  | "MATCHING"
  | "ORDERING"
  | "DRAG_DROP"
  | "TIMELINE";

  // GAMIFICATION
  export enum BadgeCategory {
    COURSE_COMPLETION = "COURSE_COMPLETION",
    LEARNING_STREAK = "LEARNING_STREAK",
    QUIZ_MASTER = "QUIZ_MASTER",
    EARLY_BIRD = "EARLY_BIRD",
    NIGHT_OWL = "NIGHT_OWL",
    SPEED_LEARNER = "SPEED_LEARNER",
    PERFECTIONIST = "PERFECTIONIST",
    SOCIAL = "SOCIAL",
    MILESTONE = "MILESTONE",
    SPECIAL = "SPECIAL",
  }
  
  export enum BadgeRequirement {
    COMPLETE_COURSES = "COMPLETE_COURSES",
    COMPLETE_LESSONS = "COMPLETE_LESSONS",
    MAINTAIN_STREAK = "MAINTAIN_STREAK",
    PASS_QUIZZES = "PASS_QUIZZES",
    PERFECT_QUIZ_SCORE = "PERFECT_QUIZ_SCORE",
    REACH_XP = "REACH_XP",
    REACH_LEVEL = "REACH_LEVEL",
    COMPLETE_COURSE_CATEGORY = "COMPLETE_COURSE_CATEGORY",
    LEARN_EARLY_MORNING = "LEARN_EARLY_MORNING",
    LEARN_LATE_NIGHT = "LEARN_LATE_NIGHT",
    FAST_COMPLETION = "FAST_COMPLETION",
    COMMENT_COUNT = "COMMENT_COUNT",
    HELP_OTHERS = "HELP_OTHERS",
  }
  
  export enum BadgeRarity {
    Common = "Common",
    Uncommon = "Uncommon",
    Rare = "Rare",
    Epic = "Epic",
    Legendary = "Legendary",
  }
  
  export enum XPReason {
    LESSON_COMPLETED = "LESSON_COMPLETED",
    QUIZ_PASSED = "QUIZ_PASSED",
    QUIZ_PERFECT_SCORE = "QUIZ_PERFECT_SCORE",
    COURSE_COMPLETED = "COURSE_COMPLETED",
    STREAK_MILESTONE = "STREAK_MILESTONE",
    BADGE_EARNED = "BADGE_EARNED",
    DAILY_LOGIN = "DAILY_LOGIN",
    FIRST_LESSON_OF_DAY = "FIRST_LESSON_OF_DAY",
    SPEED_BONUS = "SPEED_BONUS",
    PERFECT_CHAPTER = "PERFECT_CHAPTER",
    MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT",
  }
  
  export enum LeaderboardType {
    XP_TOTAL = "XP_TOTAL",
    XP_WEEKLY = "XP_WEEKLY",
    XP_MONTHLY = "XP_MONTHLY",
    COURSES_COMPLETED = "COURSES_COMPLETED",
    STREAK_LENGTH = "STREAK_LENGTH",
    QUIZZES_PASSED = "QUIZZES_PASSED",
    COURSE_CATEGORY = "COURSE_CATEGORY",
  }
  
  export enum LeaderboardTimeframe {
    ALL_TIME = "ALL_TIME",
    MONTHLY = "MONTHLY",
    WEEKLY = "WEEKLY",
    DAILY = "DAILY",
    CUSTOM = "CUSTOM",
  }
  
  export enum ChallengeType {
    COMPLETE_LESSONS = "COMPLETE_LESSONS",
    PASS_QUIZZES = "PASS_QUIZZES",
    SPEND_TIME_LEARNING = "SPEND_TIME_LEARNING",
    ACHIEVE_PERFECT_SCORE = "ACHIEVE_PERFECT_SCORE",
    COMPLETE_CHAPTER = "COMPLETE_CHAPTER",
  }