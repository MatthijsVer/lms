// Define ContentBlockType enum locally until Prisma types are available
export enum ContentBlockType {
  VIDEO = "VIDEO",
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  QUIZ = "QUIZ",
  EXERCISE = "EXERCISE",
  CODE = "CODE",
  PDF = "PDF",
  AUDIO = "AUDIO",
  DOWNLOAD = "DOWNLOAD",
  FILL_IN_BLANK = "FILL_IN_BLANK",
  FLASHCARD = "FLASHCARD"
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

export interface PdfContent {
  pdfKey: string;
  title: string;
  downloadable?: boolean;
}

export interface AudioContent {
  audioKey: string;
  title?: string;
  transcript?: string;
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

// Union type for all content blocks
export type ContentBlock = BaseContentBlock & (
  | { type: ContentBlockType.VIDEO; content: VideoContent }
  | { type: ContentBlockType.TEXT; content: TextContent }
  | { type: ContentBlockType.IMAGE; content: ImageContent }
  | { type: ContentBlockType.QUIZ; content: QuizContent }
  | { type: ContentBlockType.EXERCISE; content: ExerciseContent }
  | { type: ContentBlockType.CODE; content: CodeContent }
  | { type: ContentBlockType.PDF; content: PdfContent }
  | { type: ContentBlockType.AUDIO; content: AudioContent }
  | { type: ContentBlockType.DOWNLOAD; content: DownloadContent }
  | { type: ContentBlockType.FILL_IN_BLANK; content: FillInBlankContent }
  | { type: ContentBlockType.FLASHCARD; content: FlashCardContent }
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
  })
};