import { PrismaClient } from "@prisma/client";
import { BadgeCategory, BadgeRequirement, BadgeRarity } from '@/lib/types'

const prisma = new PrismaClient();

const BADGES = [
  // Course Completion Badges
  {
    name: "First Steps",
    description: "Complete your first course",
    imageKey: "badges/first-steps.png",
    category: BadgeCategory.COURSE_COMPLETION,
    requirement: BadgeRequirement.COMPLETE_COURSES,
    targetValue: 1,
    xpReward: 50,
    rarity: BadgeRarity.Common,
  },
  {
    name: "Knowledge Seeker",
    description: "Complete 5 courses",
    imageKey: "badges/knowledge-seeker.png",
    category: BadgeCategory.COURSE_COMPLETION,
    requirement: BadgeRequirement.COMPLETE_COURSES,
    targetValue: 5,
    xpReward: 100,
    rarity: BadgeRarity.Uncommon,
  },
  {
    name: "Scholar",
    description: "Complete 10 courses",
    imageKey: "badges/scholar.png",
    category: BadgeCategory.COURSE_COMPLETION,
    requirement: BadgeRequirement.COMPLETE_COURSES,
    targetValue: 10,
    xpReward: 200,
    rarity: BadgeRarity.Rare,
  },
  {
    name: "Master Learner",
    description: "Complete 25 courses",
    imageKey: "badges/master-learner.png",
    category: BadgeCategory.COURSE_COMPLETION,
    requirement: BadgeRequirement.COMPLETE_COURSES,
    targetValue: 25,
    xpReward: 500,
    rarity: BadgeRarity.Epic,
  },
  {
    name: "Legend",
    description: "Complete 50 courses",
    imageKey: "badges/legend.png",
    category: BadgeCategory.COURSE_COMPLETION,
    requirement: BadgeRequirement.COMPLETE_COURSES,
    targetValue: 50,
    xpReward: 1000,
    rarity: BadgeRarity.Legendary,
  },

  // Streak Badges
  {
    name: "Consistent",
    description: "Maintain a 3-day learning streak",
    imageKey: "badges/consistent.png",
    category: BadgeCategory.LEARNING_STREAK,
    requirement: BadgeRequirement.MAINTAIN_STREAK,
    targetValue: 3,
    xpReward: 30,
    rarity: BadgeRarity.Common,
  },
  {
    name: "Dedicated",
    description: "Maintain a 7-day learning streak",
    imageKey: "badges/dedicated.png",
    category: BadgeCategory.LEARNING_STREAK,
    requirement: BadgeRequirement.MAINTAIN_STREAK,
    targetValue: 7,
    xpReward: 75,
    rarity: BadgeRarity.Uncommon,
  },
  {
    name: "Unstoppable",
    description: "Maintain a 30-day learning streak",
    imageKey: "badges/unstoppable.png",
    category: BadgeCategory.LEARNING_STREAK,
    requirement: BadgeRequirement.MAINTAIN_STREAK,
    targetValue: 30,
    xpReward: 300,
    rarity: BadgeRarity.Rare,
  },
  {
    name: "Iron Will",
    description: "Maintain a 100-day learning streak",
    imageKey: "badges/iron-will.png",
    category: BadgeCategory.LEARNING_STREAK,
    requirement: BadgeRequirement.MAINTAIN_STREAK,
    targetValue: 100,
    xpReward: 1000,
    rarity: BadgeRarity.Legendary,
  },

  // Quiz Master Badges
  {
    name: "Quiz Novice",
    description: "Pass 10 quizzes",
    imageKey: "badges/quiz-novice.png",
    category: BadgeCategory.QUIZ_MASTER,
    requirement: BadgeRequirement.PASS_QUIZZES,
    targetValue: 10,
    xpReward: 50,
    rarity: BadgeRarity.Common,
  },
  {
    name: "Quiz Expert",
    description: "Pass 50 quizzes",
    imageKey: "badges/quiz-expert.png",
    category: BadgeCategory.QUIZ_MASTER,
    requirement: BadgeRequirement.PASS_QUIZZES,
    targetValue: 50,
    xpReward: 200,
    rarity: BadgeRarity.Rare,
  },
  {
    name: "Perfectionist",
    description: "Get perfect scores on 10 quizzes",
    imageKey: "badges/perfectionist.png",
    category: BadgeCategory.PERFECTIONIST,
    requirement: BadgeRequirement.PERFECT_QUIZ_SCORE,
    targetValue: 10,
    xpReward: 300,
    rarity: BadgeRarity.Epic,
  },

  // Lesson Badges
  {
    name: "Getting Started",
    description: "Complete 10 lessons",
    imageKey: "badges/getting-started.png",
    category: BadgeCategory.MILESTONE,
    requirement: BadgeRequirement.COMPLETE_LESSONS,
    targetValue: 10,
    xpReward: 25,
    rarity: BadgeRarity.Common,
  },
  {
    name: "Lesson Master",
    description: "Complete 100 lessons",
    imageKey: "badges/lesson-master.png",
    category: BadgeCategory.MILESTONE,
    requirement: BadgeRequirement.COMPLETE_LESSONS,
    targetValue: 100,
    xpReward: 250,
    rarity: BadgeRarity.Rare,
  },

  // Level Badges
  {
    name: "Rising Star",
    description: "Reach Level 5",
    imageKey: "badges/rising-star.png",
    category: BadgeCategory.MILESTONE,
    requirement: BadgeRequirement.REACH_LEVEL,
    targetValue: 5,
    xpReward: 100,
    rarity: BadgeRarity.Uncommon,
  },
  {
    name: "Elite Learner",
    description: "Reach Level 10",
    imageKey: "badges/elite-learner.png",
    category: BadgeCategory.MILESTONE,
    requirement: BadgeRequirement.REACH_LEVEL,
    targetValue: 10,
    xpReward: 250,
    rarity: BadgeRarity.Rare,
  },
  {
    name: "Grandmaster",
    description: "Reach Level 25",
    imageKey: "badges/grandmaster.png",
    category: BadgeCategory.MILESTONE,
    requirement: BadgeRequirement.REACH_LEVEL,
    targetValue: 25,
    xpReward: 1000,
    rarity: BadgeRarity.Legendary,
  },
];

async function seedBadges() {
  console.log("Seeding badges...");

  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: {
        name: badge.name,
      },
      update: badge,
      create: badge,
    });
  }

  console.log(`Seeded ${BADGES.length} badges`);
}

seedBadges()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });