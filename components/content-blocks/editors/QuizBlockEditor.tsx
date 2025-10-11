import {
  ContentBlock,
  QuizContent,
  ContentBlockType,
} from "@/lib/content-blocks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Check,
  Circle,
  Settings,
  MessageSquare,
  ListChecks,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

interface QuizBlockEditorProps {
  block: ContentBlock & { type: ContentBlockType.QUIZ; content: QuizContent };
  onChange: (block: ContentBlock) => void;
}

export function QuizBlockEditor({ block, onChange }: QuizBlockEditorProps) {
  const [newOptionText, setNewOptionText] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const updateContent = (updates: Partial<QuizContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const addOption = () => {
    if (!newOptionText.trim()) return;

    const newOption = {
      id: Date.now().toString(),
      text: newOptionText,
      isCorrect: false,
    };

    updateContent({
      options: [...(block.content.options || []), newOption],
    });
    setNewOptionText("");
  };

  const updateOption = (
    optionId: string,
    updates: Partial<{ text: string; isCorrect: boolean }>
  ) => {
    const updatedOptions = block.content.options.map((opt) =>
      opt.id === optionId ? { ...opt, ...updates } : opt
    );
    updateContent({ options: updatedOptions });
  };

  const removeOption = (optionId: string) => {
    const filteredOptions = block.content.options.filter(
      (opt) => opt.id !== optionId
    );
    updateContent({ options: filteredOptions });
  };

  const setCorrectAnswer = (
    optionId: string,
    allowMultiple: boolean = false
  ) => {
    const updatedOptions = block.content.options.map((opt) => {
      if (allowMultiple) {
        // Toggle the clicked option
        return opt.id === optionId
          ? { ...opt, isCorrect: !opt.isCorrect }
          : opt;
      } else {
        // Single correct answer - set only this one as correct
        return { ...opt, isCorrect: opt.id === optionId };
      }
    });
    updateContent({ options: updatedOptions });
  };

  const correctAnswerCount =
    block.content.options?.filter((opt) => opt.isCorrect).length || 0;
  const hasOptions = (block.content.options?.length || 0) > 0;

  return (
    <div className="space-y-3">
      {/* Question Section */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Question
            </CardTitle>
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Quiz Settings</h4>

                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="multiple-attempts"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Multiple attempts
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Allow students to retry if incorrect
                        </p>
                      </div>
                      <Switch
                        id="multiple-attempts"
                        checked={block.content.allowMultipleAttempts || false}
                        onCheckedChange={(checked: boolean) =>
                          updateContent({ allowMultipleAttempts: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="show-correct"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Show correct answer
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Reveal answer after submission
                        </p>
                      </div>
                      <Switch
                        id="show-correct"
                        checked={block.content.showCorrectAnswer !== false}
                        onCheckedChange={(checked: boolean) =>
                          updateContent({ showCorrectAnswer: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="randomize"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Randomize options
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Display options in random order
                        </p>
                      </div>
                      <Switch
                        id="randomize"
                        checked={block.content.randomizeOptions || false}
                        onCheckedChange={(checked: boolean) =>
                          updateContent({ randomizeOptions: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={block.content.question || ""}
            onChange={(e) => updateContent({ question: e.target.value })}
            placeholder="Enter your quiz question here..."
            rows={3}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Answer Options Section */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Answer Options
            </CardTitle>
            <div className="flex items-center gap-2">
              {correctAnswerCount > 0 ? (
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  {correctAnswerCount} correct
                </Badge>
              ) : hasOptions ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  No correct answer
                </Badge>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Options List */}
          <div className="space-y-2">
            {(block.content.options || []).map((option, index) => (
              <div
                key={option.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  option.isCorrect
                    ? "bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800"
                    : "bg-background border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {String.fromCharCode(65 + index)}.
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 shrink-0 ${
                      option.isCorrect
                        ? "text-green-600 hover:text-green-700 dark:text-green-500"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={(e) => setCorrectAnswer(option.id, e.shiftKey)}
                    title={
                      option.isCorrect
                        ? "Currently marked as correct (click to unmark)"
                        : "Click to mark as correct (Shift+click for multiple)"
                    }
                  >
                    {option.isCorrect ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                <Input
                  value={option.text}
                  onChange={(e) =>
                    updateOption(option.id, { text: e.target.value })
                  }
                  placeholder="Enter answer option..."
                  className="flex-1"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeOption(option.id)}
                  title="Remove option"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {!hasOptions && (
              <div className="text-center py-8 text-muted-foreground">
                <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No answer options yet</p>
                <p className="text-xs mt-1">
                  Add at least 2 options to create a quiz
                </p>
              </div>
            )}
          </div>

          {/* Add Option */}
          <div className="flex gap-2 pt-2">
            <Input
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              placeholder="Type a new answer option..."
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addOption())
              }
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addOption}
              variant="secondary"
              disabled={!newOptionText.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Option
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback & Scoring Section */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Feedback & Scoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="explanation" className="text-sm font-medium mb-1.5">
              Explanation
              <span className="text-xs text-muted-foreground ml-2">
                (shown after answer submission)
              </span>
            </Label>
            <Textarea
              id="explanation"
              value={block.content.explanation || ""}
              onChange={(e) => updateContent({ explanation: e.target.value })}
              placeholder="Explain why the answer is correct and provide additional context..."
              rows={3}
              className="mt-1.5 resize-none"
            />
          </div>

          <div>
            <Label htmlFor="points" className="text-sm font-medium mb-1.5">
              Points Value
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="points"
                type="number"
                value={block.content.points || 1}
                onChange={(e) =>
                  updateContent({ points: parseInt(e.target.value) || 1 })
                }
                min={1}
                max={100}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">points</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
