// Define ContentBlockType enum locally until Prisma types are available
export enum ContentBlockType {
  VIDEO = "VIDEO",
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  QUIZ = "QUIZ",
  EXERCISE = "EXERCISE",
  CODE = "CODE",
  CODE_EXERCISE = "CODE_EXERCISE",
  PDF = "PDF",
  AUDIO = "AUDIO",
  DOWNLOAD = "DOWNLOAD",
  FILL_IN_BLANK = "FILL_IN_BLANK",
  FLASHCARD = "FLASHCARD",
  MATCHING = "MATCHING",
  ORDERING = "ORDERING",
  DRAG_DROP = "DRAG_DROP",
  TIMELINE = "TIMELINE"
}

// Base content block structure
export interface BaseContentBlock {
  id?: string;
  type: ContentBlockType;
  position: number;
}

// Specific content types
export interface VideoContent {
  videoKey: string;
  title?: string;
  duration?: number;
}

export interface TextContent {
  text: string;
  format?: "markdown" | "html" | "plain";
}

export interface ImageContent {
  imageKey: string;
  alt?: string;
  caption?: string;
}

export interface QuizContent {
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
  points?: number; // Points awarded for correct answer
  allowMultipleAttempts?: boolean;
  showCorrectAnswer?: boolean; // Show correct answer after submission
  randomizeOptions?: boolean; // Randomize option order
}

export interface ExerciseContent {
  title: string;
  instructions: string;
  expectedOutput?: string;
  hints?: string[];
}

export interface CodeContent {
  code: string;
  language: string;
  title?: string;
  runnable?: boolean;
}

export interface CodeExerciseContent {
  title?: string;
  prompt: string;
  starterCode: string;
  solution?: string;
  tests: {
    description: string;
    code: string;
  }[];
}

export interface PdfContent {
  pdfKey: string;
  title: string;
  downloadable?: boolean;
  description?: string;
}

export interface AudioContent {
  audioKey: string;
  title?: string;
  transcript?: string;
  description?: string;
  shouldShowTranscript?: boolean;
}

export interface DownloadContent {
  fileKey: string;
  fileName: string;
  fileSize?: number;
  description?: string;
}

export interface FillInBlankContent {
  text: string; // Text with placeholders marked as {{blank}} or {{answer}}
  blanks: {
    id: string;
    correctAnswers: string[]; // Multiple possible correct answers
    caseSensitive?: boolean;
    allowPartialCredit?: boolean;
    hint?: string;
  }[];
  instructions?: string;
  points?: number;
  showHints?: boolean;
}

export interface FlashCardContent {
  title?: string;
  instructions?: string;
  cards: {
    id: string;
    front: string; // Question or prompt
    back: string; // Answer or explanation
    hint?: string;
  }[];
  shuffleCards?: boolean; // Randomly shuffle card order
  showProgress?: boolean; // Show card number (1/5)
  allowFlip?: boolean; // Allow manual flip vs auto-flip
}

export interface MatchingContent {
  title?: string;
  instructions?: string;
  pairs: {
    id: string;
    leftItem: string; // Item on the left side
    rightItem: string; // Item on the right side
    explanation?: string; // Explanation shown after matching
  }[];
  shuffleItems?: boolean; // Randomly shuffle the items
  showFeedback?: boolean; // Show immediate feedback on match
  allowHints?: boolean; // Allow hints to be shown
  points?: number; // Points awarded for completing all matches
  timeLimit?: number; // Optional time limit in seconds
}

export interface OrderingContent {
  title?: string;
  instructions?: string;
  items: {
    id: string;
    text: string; // The item text to be ordered
    correctPosition: number; // 0-based index for correct position
    explanation?: string; // Explanation for why this item goes in this position
    hint?: string; // Optional hint for this item
  }[];
  shuffleItems?: boolean; // Randomly shuffle the initial order
  showPositionNumbers?: boolean; // Show position numbers (1, 2, 3...)
  allowPartialCredit?: boolean; // Award points for partially correct ordering
  showFeedback?: boolean; // Show immediate feedback on drop
  allowHints?: boolean; // Allow hints to be shown
  points?: number; // Points awarded for correct ordering
  timeLimit?: number; // Optional time limit in seconds
}

export interface DragDropContent {
  title?: string;
  instructions?: string;
  tokens: {
    id: string;
    text: string; // The draggable token text
    correctTargets: string[]; // Array of target IDs where this token belongs
    hint?: string; // Optional hint for this token
  }[];
  targets: {
    id: string;
    label: string; // Label displayed on the drop zone
    description?: string; // Optional description of what belongs here
    maxItems?: number; // Maximum number of items this target can accept (default: unlimited)
    acceptsMultiple?: boolean; // Whether this target can accept multiple items
  }[];
  shuffleTokens?: boolean; // Randomly shuffle the initial token order
  showTargetLabels?: boolean; // Show labels on drop targets
  allowPartialCredit?: boolean; // Award points for partially correct placement
  showFeedback?: boolean; // Show immediate feedback on drop
  allowHints?: boolean; // Allow hints to be shown
  returnToBank?: boolean; // Return incorrectly placed tokens to bank
  points?: number; // Points awarded for correct placement
  timeLimit?: number; // Optional time limit in seconds
}

export interface TimelineContent {
  title?: string;
  instructions?: string;
  events: {
    id: string;
    title: string; // Main event title
    description?: string; // Detailed description of the event (also used as hint)
    date: string; // Date in ISO format or human readable format
    time?: string; // Optional time if needed (e.g., "14:30", "2:30 PM")
    type?: "milestone" | "event" | "deadline" | "achievement"; // Visual styling type
    icon?: string; // Optional icon name (lucide icon names)
    color?: string; // Optional color for the event marker
    metadata?: { [key: string]: any }; // Additional flexible data
  }[];
  layout?: "vertical" | "horizontal"; // Timeline orientation (currently only vertical supported for exercise)
  showDates?: boolean; // Whether to display dates on event cards
  showTimes?: boolean; // Whether to display times on event cards
  chronological?: boolean; // Whether this is a chronological ordering exercise (default: true)
  interactive?: boolean; // Whether events can be clicked for more details (legacy, not used in exercise mode)
  allowNavigation?: boolean; // Whether users can navigate through events (legacy, not used in exercise mode)
  showProgress?: boolean; // Show completion progress through timeline (legacy, not used in exercise mode)
  allowPartialCredit?: boolean; // Award points for partially correct ordering
  shuffleEvents?: boolean; // Whether to shuffle events initially (default: true)
  allowHints?: boolean; // Whether to show hints after submission (uses description as hint)
  points?: number; // Points awarded for completing the exercise correctly
}

// Union type for all content blocks
export type ContentBlock = BaseContentBlock & (
  | { type: ContentBlockType.VIDEO; content: VideoContent }
  | { type: ContentBlockType.TEXT; content: TextContent }
  | { type: ContentBlockType.IMAGE; content: ImageContent }
  | { type: ContentBlockType.QUIZ; content: QuizContent }
  | { type: ContentBlockType.EXERCISE; content: ExerciseContent }
  | { type: ContentBlockType.CODE; content: CodeContent }
  | { type: ContentBlockType.CODE_EXERCISE; content: CodeExerciseContent }
  | { type: ContentBlockType.PDF; content: PdfContent }
  | { type: ContentBlockType.AUDIO; content: AudioContent }
  | { type: ContentBlockType.DOWNLOAD; content: DownloadContent }
  | { type: ContentBlockType.FILL_IN_BLANK; content: FillInBlankContent }
  | { type: ContentBlockType.FLASHCARD; content: FlashCardContent }
  | { type: ContentBlockType.MATCHING; content: MatchingContent }
  | { type: ContentBlockType.ORDERING; content: OrderingContent }
  | { type: ContentBlockType.DRAG_DROP; content: DragDropContent }
  | { type: ContentBlockType.TIMELINE; content: TimelineContent }
);

// Helper to create content blocks
export const createContentBlock = {
  video: (content: VideoContent, position: number): ContentBlock => ({
    type: ContentBlockType.VIDEO,
    position,
    content
  }),
  text: (content: TextContent, position: number): ContentBlock => ({
    type: ContentBlockType.TEXT,
    position,
    content
  }),
  image: (content: ImageContent, position: number): ContentBlock => ({
    type: ContentBlockType.IMAGE,
    position,
    content
  }),
  quiz: (content: QuizContent, position: number): ContentBlock => ({
    type: ContentBlockType.QUIZ,
    position,
    content
  }),
  exercise: (content: ExerciseContent, position: number): ContentBlock => ({
    type: ContentBlockType.EXERCISE,
    position,
    content
  }),
  code: (content: CodeContent, position: number): ContentBlock => ({
    type: ContentBlockType.CODE,
    position,
    content
  }),
  codeExercise: (
    content: CodeExerciseContent,
    position: number
  ): ContentBlock => ({
    type: ContentBlockType.CODE_EXERCISE,
    position,
    content,
  }),
  pdf: (content: PdfContent, position: number): ContentBlock => ({
    type: ContentBlockType.PDF,
    position,
    content
  }),
  audio: (content: AudioContent, position: number): ContentBlock => ({
    type: ContentBlockType.AUDIO,
    position,
    content
  }),
  download: (content: DownloadContent, position: number): ContentBlock => ({
    type: ContentBlockType.DOWNLOAD,
    position,
    content
  }),
  fillInBlank: (content: FillInBlankContent, position: number): ContentBlock => ({
    type: ContentBlockType.FILL_IN_BLANK,
    position,
    content
  }),
  flashcard: (content: FlashCardContent, position: number): ContentBlock => ({
    type: ContentBlockType.FLASHCARD,
    position,
    content
  }),
  matching: (content: MatchingContent, position: number): ContentBlock => ({
    type: ContentBlockType.MATCHING,
    position,
    content
  }),
  ordering: (content: OrderingContent, position: number): ContentBlock => ({
    type: ContentBlockType.ORDERING,
    position,
    content
  }),
  dragDrop: (content: DragDropContent, position: number): ContentBlock => ({
    type: ContentBlockType.DRAG_DROP,
    position,
    content
  }),
  timeline: (content: TimelineContent, position: number): ContentBlock => ({
    type: ContentBlockType.TIMELINE,
    position,
    content
  })
};
