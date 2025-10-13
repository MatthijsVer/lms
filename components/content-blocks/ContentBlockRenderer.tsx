"use client";

import { ContentBlockType } from "@/lib/content-blocks";
import { VideoBlockRenderer } from "./renderers/VideoBlockRenderer";
import { TextBlockRenderer } from "./renderers/TextBlockRenderer";
import { ImageBlockRenderer } from "./renderers/ImageBlockRenderer";
import { QuizBlockRenderer } from "./renderers/QuizBlockRenderer";
import { FillInBlankBlockRenderer } from "./renderers/FillInBlankBlockRenderer";
import { FlashCardBlockRenderer } from "./renderers/FlashCardBlockRenderer";
import { MatchingBlockRenderer } from "./renderers/MatchingBlockRenderer";
import { OrderingBlockRenderer } from "./renderers/OrderingBlockRenderer";
import { DragDropBlockRenderer } from "./renderers/DragDropBlockRenderer";
import { TimelineBlockRenderer } from "./renderers/TimelineBlockRenderer";
import { CodeBlockRenderer } from "./renderers/CodeBlockRenderer";
import { PdfBlockRenderer } from "./renderers/PdfBlockRenderer";
import { AudioBlockRenderer } from "./renderers/AudioBlockRenderer";
import { ExerciseBlockRenderer } from "./renderers/ExerciseBlockRenderer";

interface ContentBlockData {
  id: string;
  type: ContentBlockType;
  position: number;
  content: any;
}

interface ContentBlockRendererProps {
  blocks: ContentBlockData[];
  lessonId: string;
}

export function ContentBlockRenderer({ blocks, lessonId }: ContentBlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  const renderBlock = (block: ContentBlockData) => {
    switch (block.type) {
      case ContentBlockType.VIDEO:
        return (
          <VideoBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
          />
        );
      case ContentBlockType.TEXT:
        return (
          <TextBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
          />
        );
      case ContentBlockType.IMAGE:
        return (
          <ImageBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
          />
        );
      case ContentBlockType.QUIZ:
        return (
          <QuizBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
            lessonId={lessonId}
          />
        );
      case ContentBlockType.EXERCISE:
        return (
          <ExerciseBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
          />
        );
      case ContentBlockType.FILL_IN_BLANK:
        return (
          <FillInBlankBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
            lessonId={lessonId}
          />
        );
      case ContentBlockType.FLASHCARD:
        return (
          <FlashCardBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
          />
        );
      case ContentBlockType.MATCHING:
        return (
          <MatchingBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
            lessonId={lessonId}
          />
        );
      case ContentBlockType.ORDERING:
        return (
          <OrderingBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
            lessonId={lessonId}
          />
        );
      case ContentBlockType.DRAG_DROP:
        return (
          <DragDropBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
            lessonId={lessonId}
          />
        );
      case ContentBlockType.TIMELINE:
        return (
          <TimelineBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
            lessonId={lessonId}
          />
        );
      case ContentBlockType.PDF:
        return (
          <PdfBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
          />
        );
      case ContentBlockType.AUDIO:
        return (
          <AudioBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
          />
        );
      case ContentBlockType.CODE:
        return (
          <CodeBlockRenderer
            key={block.id}
            content={block.content}
            blockId={block.id}
          />
        );
      default:
        return (
          <div key={block.id} className="p-4 border rounded-lg bg-muted/50">
            <p className="text-muted-foreground text-sm">
              Content type "{block.type}" is not yet supported for viewing.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {blocks.map(renderBlock)}
    </div>
  );
}
