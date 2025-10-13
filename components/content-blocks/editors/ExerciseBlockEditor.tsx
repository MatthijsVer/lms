import {
  ContentBlock,
  ContentBlockType,
  ExerciseContent,
} from "@/lib/content-blocks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Lightbulb } from "lucide-react";

interface ExerciseBlockEditorProps {
  block: ContentBlock & {
    type: ContentBlockType.EXERCISE;
    content: ExerciseContent;
  };
  onChange: (block: ContentBlock) => void;
}

export function ExerciseBlockEditor({
  block,
  onChange,
}: ExerciseBlockEditorProps) {
  const hints = block.content.hints ?? [];

  const updateContent = (updates: Partial<ExerciseContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const updateHint = (index: number, value: string) => {
    const nextHints = [...hints];
    nextHints[index] = value;
    updateContent({ hints: nextHints });
  };

  const removeHint = (index: number) => {
    const nextHints = hints.filter((_, i) => i !== index);
    updateContent({ hints: nextHints });
  };

  const addHint = () => {
    updateContent({ hints: [...hints, ""] });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="exerciseTitle">Title</Label>
        <Input
          id="exerciseTitle"
          value={block.content.title || ""}
          onChange={(event) => updateContent({ title: event.target.value })}
          placeholder="Example: Practice writing SQL joins"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exerciseInstructions">Instructions</Label>
        <Textarea
          id="exerciseInstructions"
          value={block.content.instructions || ""}
          onChange={(event) =>
            updateContent({ instructions: event.target.value })
          }
          placeholder="Describe the task learners should complete."
          rows={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exerciseExpectedOutput">
          Expected output <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="exerciseExpectedOutput"
          value={block.content.expectedOutput || ""}
          onChange={(event) =>
            updateContent({ expectedOutput: event.target.value })
          }
          placeholder="Provide a sample answer or completion criteria."
          rows={4}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4" />
            Hints <span className="text-xs text-muted-foreground">(optional)</span>
          </div>
          <Button variant="outline" size="sm" onClick={addHint} className="gap-2">
            <Plus className="h-4 w-4" />
            Add hint
          </Button>
        </div>

        {hints.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Add quick tips or steps that guide learners without revealing the answer.
          </p>
        )}

        <div className="space-y-3">
          {hints.map((hint, index) => (
            <div
              key={`hint-${index}`}
              className="rounded-md border bg-muted/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <Label htmlFor={`exerciseHint-${index}`} className="text-sm font-medium">
                  Hint {index + 1}
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeHint(index)}
                  aria-label="Remove hint"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <Textarea
                id={`exerciseHint-${index}`}
                value={hint}
                onChange={(event) => updateHint(index, event.target.value)}
                placeholder="Keep hints short and actionable."
                rows={3}
                className="mt-2"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
