import { ContentBlockType } from "@/lib/content-blocks";

interface ContentBlockData {
  id: string;
  type: ContentBlockType;
  content: any;
}

/**
 * Get the default points for each content block type
 */
function getDefaultPointsForType(type: ContentBlockType): number {
  switch (type) {
    case ContentBlockType.CODE_EXERCISE:
      return 20; // Code exercises are more complex
    case ContentBlockType.QUIZ:
    case ContentBlockType.FILL_IN_BLANK:
    case ContentBlockType.MATCHING:
    case ContentBlockType.ORDERING:
    case ContentBlockType.DRAG_DROP:
    case ContentBlockType.TIMELINE:
      return 10; // Standard interactive exercises
    default:
      return 0; // Non-interactive blocks
  }
}

/**
 * Check if a content block awards points
 */
function isPointAwardingBlock(type: ContentBlockType): boolean {
  const pointAwardingTypes = [
    ContentBlockType.QUIZ,
    ContentBlockType.FILL_IN_BLANK,
    ContentBlockType.MATCHING,
    ContentBlockType.ORDERING,
    ContentBlockType.DRAG_DROP,
    ContentBlockType.TIMELINE,
    ContentBlockType.CODE_EXERCISE,
  ];
  
  return pointAwardingTypes.includes(type);
}

/**
 * Calculate points for a specific content block
 */
export function getContentBlockPoints(block: ContentBlockData): number {
  if (!isPointAwardingBlock(block.type)) {
    return 0;
  }

  // Check if content has explicit points defined
  if (block.content?.points !== undefined && block.content.points !== null) {
    return block.content.points;
  }

  // Return default points for this type
  return getDefaultPointsForType(block.type);
}

/**
 * Get content blocks that award points
 */
export function getPointAwardingBlocks(contentBlocks: ContentBlockData[]): ContentBlockData[] {
  return contentBlocks.filter(block => isPointAwardingBlock(block.type));
}

/**
 * Calculate the total possible points for a lesson based on its content blocks
 */
export function calculateLessonTotalPoints(contentBlocks: ContentBlockData[]): number {
  return contentBlocks.reduce((total, block) => {
    return total + getContentBlockPoints(block);
  }, 0);
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

/**
 * Get a human-readable name for a content block type
 */
export function getContentBlockTypeName(type: ContentBlockType): string {
  switch (type) {
    case ContentBlockType.QUIZ:
      return "Quiz";
    case ContentBlockType.FILL_IN_BLANK:
      return "Fill in the Blanks";
    case ContentBlockType.MATCHING:
      return "Matching";
    case ContentBlockType.ORDERING:
      return "Ordering";
    case ContentBlockType.DRAG_DROP:
      return "Drag & Drop";
    case ContentBlockType.TIMELINE:
      return "Timeline";
    case ContentBlockType.CODE_EXERCISE:
      return "Code Exercise";
    case ContentBlockType.EXERCISE:
      return "Exercise";
    case ContentBlockType.TEXT:
      return "Text";
    case ContentBlockType.VIDEO:
      return "Video";
    case ContentBlockType.IMAGE:
      return "Image";
    case ContentBlockType.CODE:
      return "Code";
    case ContentBlockType.PDF:
      return "PDF";
    case ContentBlockType.AUDIO:
      return "Audio";
    default:
      return "Content";
  }
}