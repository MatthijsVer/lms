"use client";

import { ContentBlock, ContentBlockType } from "@/lib/content-blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Video,
  FileText,
  Image,
  HelpCircle,
  Code,
  FileDown,
  Music,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Square,
  Space,
  CreditCard,
  Link2,
  ArrowUpDown,
  Move,
  MapPin,
  ClipboardCheck,
  SquareCode,
} from "lucide-react";
import { useState } from "react";
import { VideoBlockEditor } from "./editors/VideoBlockEditor";
import { TextBlockEditor } from "./editors/TextBlockEditor";
import { ImageBlockEditor } from "./editors/ImageBlockEditor";
import { QuizBlockEditor } from "./editors/QuizBlockEditor";
import { FillInBlankBlockEditor } from "./editors/FillInBlankBlockEditor";
import { FlashCardBlockEditor } from "./editors/FlashCardBlockEditor";
import { MatchingBlockEditor } from "./editors/MatchingBlockEditor";
import { OrderingBlockEditor } from "./editors/OrderingBlockEditor";
import { DragDropBlockEditor } from "./editors/DragDropBlockEditor";
import { TimelineBlockEditor } from "./editors/TimelineBlockEditor";
import { CodeBlockEditor } from "./editors/CodeBlockEditor";
import { PdfBlockEditor } from "./editors/PdfBlockEditor";
import { AudioBlockEditor } from "./editors/AudioBlockEditor";
import { ExerciseBlockEditor } from "./editors/ExerciseBlockEditor";
import { CodeExerciseBlockEditor } from "./editors/CodeExerciseBlockEditor";

interface ContentBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

const blockIcons = {
  [ContentBlockType.VIDEO]: Video,
  [ContentBlockType.TEXT]: FileText,
  [ContentBlockType.IMAGE]: Image,
  [ContentBlockType.QUIZ]: HelpCircle,
  [ContentBlockType.EXERCISE]: ClipboardCheck,
  [ContentBlockType.CODE_EXERCISE]: SquareCode,
  [ContentBlockType.CODE]: Code,
  [ContentBlockType.PDF]: FileDown,
  [ContentBlockType.AUDIO]: Music,
  [ContentBlockType.DOWNLOAD]: FileDown,
  [ContentBlockType.FILL_IN_BLANK]: Square,
  [ContentBlockType.FLASHCARD]: CreditCard,
  [ContentBlockType.MATCHING]: Link2,
  [ContentBlockType.ORDERING]: ArrowUpDown,
  [ContentBlockType.DRAG_DROP]: Move,
  [ContentBlockType.TIMELINE]: MapPin,
};

const blockLabels = {
  [ContentBlockType.VIDEO]: "Video",
  [ContentBlockType.TEXT]: "Text",
  [ContentBlockType.IMAGE]: "Image",
  [ContentBlockType.QUIZ]: "Quiz",
  [ContentBlockType.EXERCISE]: "Exercise",
  [ContentBlockType.CODE_EXERCISE]: "Code Exercise",
  [ContentBlockType.CODE]: "Code",
  [ContentBlockType.PDF]: "PDF",
  [ContentBlockType.AUDIO]: "Audio",
  [ContentBlockType.DOWNLOAD]: "Download",
  [ContentBlockType.FILL_IN_BLANK]: "Fill in the Blank",
  [ContentBlockType.FLASHCARD]: "Flashcards",
  [ContentBlockType.MATCHING]: "Matching",
  [ContentBlockType.ORDERING]: "Ordering",
  [ContentBlockType.DRAG_DROP]: "Drag & Drop",
  [ContentBlockType.TIMELINE]: "Timeline",
};

export function ContentBlockEditor({
  blocks,
  onChange,
}: ContentBlockEditorProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());

  const addBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      type,
      position: blocks.length,
      content: getDefaultContent(type),
    } as ContentBlock;

    onChange([...blocks, newBlock]);
    setExpandedBlocks(new Set([...expandedBlocks, blocks.length]));
  };

  const updateBlock = (index: number, updatedBlock: ContentBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    onChange(newBlocks);
  };

  const deleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    // Update positions
    newBlocks.forEach((block, i) => {
      block.position = i;
    });
    onChange(newBlocks);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === blocks.length - 1)
    ) {
      return;
    }

    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Swap blocks
    [newBlocks[index], newBlocks[targetIndex]] = [
      newBlocks[targetIndex],
      newBlocks[index],
    ];

    // Update positions
    newBlocks.forEach((block, i) => {
      block.position = i;
    });

    onChange(newBlocks);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedBlocks(newExpanded);
  };

  const renderBlockEditor = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case ContentBlockType.VIDEO:
        return (
          <VideoBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.TEXT:
        return (
          <TextBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.IMAGE:
        return (
          <ImageBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.QUIZ:
        return (
          <QuizBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.EXERCISE:
        return (
          <ExerciseBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.FILL_IN_BLANK:
        return (
          <FillInBlankBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.FLASHCARD:
        return (
          <FlashCardBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.MATCHING:
        return (
          <MatchingBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.ORDERING:
        return (
          <OrderingBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.DRAG_DROP:
        return (
          <DragDropBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.TIMELINE:
        return (
          <TimelineBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.AUDIO:
        return (
          <AudioBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.PDF:
        return (
          <PdfBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.CODE:
        return (
          <CodeBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      case ContentBlockType.CODE_EXERCISE:
        return (
          <CodeExerciseBlockEditor
            block={block}
            onChange={(b) => updateBlock(index, b)}
          />
        );
      default:
        return (
          <div className="text-muted-foreground">
            Editor for {block.type} coming soon...
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const Icon = blockIcons[block.type];
        const isExpanded = expandedBlocks.has(index);

        return (
          <Card key={index} className="overflow-hidden py-0 bg-muted">
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{blockLabels[block.type]}</span>

                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(index, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(index, "down")}
                    disabled={index === blocks.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(index)}
                  >
                    {isExpanded ? "Collapse" : "Expand"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBlock(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="p-4 pt-0">
                {renderBlockEditor(block, index)}
              </CardContent>
            )}
          </Card>
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Content Block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem onClick={() => addBlock(ContentBlockType.VIDEO)}>
            <Video className="h-4 w-4 mr-2" />
            Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock(ContentBlockType.TEXT)}>
            <FileText className="h-4 w-4 mr-2" />
            Text
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock(ContentBlockType.IMAGE)}>
            <Image className="h-4 w-4 mr-2" />
            Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock(ContentBlockType.QUIZ)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Quiz
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock(ContentBlockType.CODE_EXERCISE)}>
            <SquareCode className="h-4 w-4 mr-2" />
            Code Exercise
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock(ContentBlockType.EXERCISE)}>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Exercise
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addBlock(ContentBlockType.FILL_IN_BLANK)}
          >
            <Space className="h-4 w-4 mr-2" />
            Fill in the Blank
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addBlock(ContentBlockType.FLASHCARD)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Flashcards
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addBlock(ContentBlockType.MATCHING)}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Matching
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addBlock(ContentBlockType.ORDERING)}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Ordering
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addBlock(ContentBlockType.DRAG_DROP)}
          >
            <Move className="h-4 w-4 mr-2" />
            Drag & Drop
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => addBlock(ContentBlockType.TIMELINE)}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Timeline
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock(ContentBlockType.AUDIO)}>
            <Music className="h-4 w-4 mr-2" />
            Audio
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock(ContentBlockType.PDF)}>
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock(ContentBlockType.CODE)}>
            <Code className="h-4 w-4 mr-2" />
            Code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getDefaultContent(type: ContentBlockType): any {
  switch (type) {
    case ContentBlockType.VIDEO:
      return { videoKey: "", title: "" };
    case ContentBlockType.TEXT:
      return { text: "", format: "markdown" };
    case ContentBlockType.IMAGE:
      return { imageKey: "", alt: "", caption: "" };
    case ContentBlockType.QUIZ:
      return {
        question: "",
        options: [],
        explanation: "",
        points: 1,
        allowMultipleAttempts: true,
        showCorrectAnswer: true,
        randomizeOptions: false,
      };
    case ContentBlockType.EXERCISE:
      return {
        title: "",
        instructions: "",
        expectedOutput: "",
        hints: [],
      };
    case ContentBlockType.CODE_EXERCISE:
      return {
        title: "Implement add(a, b)",
        prompt: "Write a function `add(a, b)` that returns the numeric sum of both arguments.",
        starterCode: `function add(a, b) {
  // TODO: return the sum of a and b
}
`,
        solution: `function add(a, b) {
  return a + b;
}
`,
        tests: [
          {
            description: "adds two positive numbers",
            code: "assert(add(2, 2) === 4, 'add(2, 2) should equal 4');",
          },
          {
            description: "handles negative numbers",
            code: "assert(add(-3, 5) === 2, 'add(-3, 5) should equal 2');",
          },
        ],
      };
    case ContentBlockType.CODE:
      return { code: "", language: "javascript" };
    case ContentBlockType.PDF:
      return { pdfKey: "", title: "", description: "", downloadable: true };
    case ContentBlockType.AUDIO:
      return {
        audioKey: "",
        title: "",
        description: "",
        transcript: "",
        shouldShowTranscript: true,
      };
    case ContentBlockType.DOWNLOAD:
      return { fileKey: "", fileName: "" };
    case ContentBlockType.FILL_IN_BLANK:
      return {
        text: "",
        blanks: [],
        instructions: "",
        points: 1,
        showHints: true,
      };
    case ContentBlockType.FLASHCARD:
      return {
        title: "",
        instructions: "",
        cards: [],
        shuffleCards: true,
        showProgress: true,
        allowFlip: true,
      };
    case ContentBlockType.MATCHING:
      return {
        title: "",
        instructions: "Draw lines to connect related items.",
        pairs: [],
        shuffleItems: true,
        showFeedback: true,
        allowHints: true,
        points: 1,
      };
    case ContentBlockType.ORDERING:
      return {
        title: "",
        instructions: "Drag and drop the items to arrange them in the correct order.",
        items: [],
        shuffleItems: true,
        showPositionNumbers: true,
        allowPartialCredit: true,
        showFeedback: true,
        allowHints: true,
        points: 1,
      };
    case ContentBlockType.DRAG_DROP:
      return {
        title: "",
        instructions: "Drag the tokens from the bank into the correct target areas.",
        tokens: [],
        targets: [],
        shuffleTokens: true,
        showTargetLabels: true,
        allowPartialCredit: true,
        showFeedback: true,
        allowHints: true,
        returnToBank: true,
        points: 1,
      };
    case ContentBlockType.TIMELINE:
      return {
        title: "",
        instructions: "Drag and drop the events to arrange them in chronological order from earliest to latest.",
        events: [],
        layout: "vertical",
        showDates: true,
        showTimes: true,
        chronological: true,
        allowPartialCredit: true,
        shuffleEvents: true,
        allowHints: true,
        points: 1,
      };
  }
}
