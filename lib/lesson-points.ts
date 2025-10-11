import { ContentBlockType } from "@/lib/content-blocks";

interface ContentBlockData {
  id: string;
  type: ContentBlockType;
  content: any;
}

/**
 * Calculate the total possible points for a lesson based on its content blocks
 */
export function calculateLessonTotalPoints(contentBlocks: ContentBlockData[]): number {
  return contentBlocks.reduce((total, block) => {
    switch (block.type) {
      case ContentBlockType.QUIZ:
        return total + (block.content.points || 1);
      case ContentBlockType.FILL_IN_BLANK:
        return total + (block.content.points || 1);
      // Add more content types that have points as needed
      default:
        return total;
    }
  }, 0);
}

/**
 * Get content blocks that award points
 */
export function getPointAwardingBlocks(contentBlocks: ContentBlockData[]): ContentBlockData[] {
  return contentBlocks.filter(block => {
    switch (block.type) {
      case ContentBlockType.QUIZ:
      case ContentBlockType.FILL_IN_BLANK:
        return true;
      default:
        return false;
    }
  });
}

/**
 * Calculate points for a specific content block
 */
export function getContentBlockPoints(block: ContentBlockData): number {
  switch (block.type) {
    case ContentBlockType.QUIZ:
      return block.content.points || 1;
    case ContentBlockType.FILL_IN_BLANK:
      return block.content.points || 1;
    default:
      return 0;
  }
}

/**
 * Get a summary of points distribution in a lesson
 */
export function getLessonPointsSummary(contentBlocks: ContentBlockData[]) {
  const pointBlocks = getPointAwardingBlocks(contentBlocks);
  const totalPoints = calculateLessonTotalPoints(contentBlocks);
  
  const breakdown = pointBlocks.map(block => ({
    id: block.id,
    type: block.type,
    points: getContentBlockPoints(block),
  }));

  return {
    totalPoints,
    pointAwardingBlocks: pointBlocks.length,
    breakdown,
  };
}

/**
 * Calculate completion percentage based on earned points vs total points
 */
export function calculatePointsProgress(earnedPoints: number, totalPoints: number): number {
  if (totalPoints === 0) return 100; // No points to earn = 100% complete
  return Math.round((earnedPoints / totalPoints) * 100);
}