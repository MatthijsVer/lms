import {
  ContentBlock,
  FillInBlankContent,
  ContentBlockType,
} from "@/lib/content-blocks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Trash2,
  FileText,
  Lightbulb,
  Eye,
  EyeOff,
  Target,
  Settings,
  Trophy,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { useState } from "react";

interface FillInBlankBlockEditorProps {
  block: ContentBlock & {
    type: ContentBlockType.FILL_IN_BLANK;
    content: FillInBlankContent;
  };
  onChange: (block: ContentBlock) => void;
}

export function FillInBlankBlockEditor({
  block,
  onChange,
}: FillInBlankBlockEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const updateContent = (updates: Partial<FillInBlankContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const addBlank = () => {
    const newBlank = {
      id: Date.now().toString(),
      correctAnswers: [""],
      caseSensitive: false,
      allowPartialCredit: false,
      hint: "",
    };

    updateContent({
      blanks: [...(block.content.blanks || []), newBlank],
    });
  };

  const updateBlank = (
    blankId: string,
    updates: Partial<FillInBlankContent["blanks"][0]>
  ) => {
    const updatedBlanks = block.content.blanks.map((blank) =>
      blank.id === blankId ? { ...blank, ...updates } : blank
    );
    updateContent({ blanks: updatedBlanks });
  };

  const removeBlank = (blankId: string) => {
    const filteredBlanks = block.content.blanks.filter(
      (blank) => blank.id !== blankId
    );
    updateContent({ blanks: filteredBlanks });
  };

  const addCorrectAnswer = (blankId: string) => {
    const blank = block.content.blanks.find((b) => b.id === blankId);
    if (blank) {
      updateBlank(blankId, {
        correctAnswers: [...blank.correctAnswers, ""],
      });
    }
  };

  const updateCorrectAnswer = (
    blankId: string,
    answerIndex: number,
    value: string
  ) => {
    const blank = block.content.blanks.find((b) => b.id === blankId);
    if (blank) {
      const updatedAnswers = [...blank.correctAnswers];
      updatedAnswers[answerIndex] = value;
      updateBlank(blankId, { correctAnswers: updatedAnswers });
    }
  };

  const removeCorrectAnswer = (blankId: string, answerIndex: number) => {
    const blank = block.content.blanks.find((b) => b.id === blankId);
    if (blank && blank.correctAnswers.length > 1) {
      const updatedAnswers = blank.correctAnswers.filter(
        (_, index) => index !== answerIndex
      );
      updateBlank(blankId, { correctAnswers: updatedAnswers });
    }
  };

  const renderPreview = () => {
    const text = block.content.text || "";
    let blankIndex = 0;

    const previewText = text.replace(/\{\{(blank|answer)\}\}/g, () => {
      blankIndex++;
      return `[BLANK_${blankIndex - 1}]`;
    });

    return (
      <div className="p-4 bg-muted/30 rounded-lg border">
        <div className="prose prose-sm max-w-none">
          {previewText.split(/\[BLANK_(\d+)\]/).map((part, index) => {
            if (part.match(/^\d+$/)) {
              return (
                <span
                  key={index}
                  className="inline-flex items-center mx-1 px-3 py-1 bg-blue-50 border-2 border-dashed border-blue-300 rounded min-w-[100px] text-center text-sm font-medium dark:bg-blue-950/30 dark:border-blue-800"
                >
                  ___________
                </span>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </div>
      </div>
    );
  };

  // Count blanks in text
  const blanksInText = (
    block.content.text?.match(/\{\{(blank|answer)\}\}/g) || []
  ).length;
  const configuredBlanks = block.content.blanks?.length || 0;
  const hasBlankMismatch = blanksInText !== configuredBlanks;

  return (
    <div className="space-y-5">
      {/* Text Content Section */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {showPreview ? "Edit" : "Preview"}
              </Button>
              <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">
                      Fill-in-the-Blank Settings
                    </h4>

                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="show-hints"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Show hints
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Display hint button for students
                          </p>
                        </div>
                        <Switch
                          id="show-hints"
                          checked={block.content.showHints !== false}
                          onCheckedChange={(checked) =>
                            updateContent({ showHints: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPreview ? (
            <>
              <div>
                <Label htmlFor="instructions" className="text-sm font-medium">
                  Instructions
                  <span className="text-xs text-muted-foreground ml-2">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="instructions"
                  value={block.content.instructions || ""}
                  onChange={(e) =>
                    updateContent({ instructions: e.target.value })
                  }
                  placeholder="Provide instructions for students..."
                  rows={2}
                  className="mt-1.5 resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="text-content" className="text-sm font-medium">
                    Text with blanks
                  </Label>
                  {hasBlankMismatch && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Mismatch
                    </Badge>
                  )}
                </div>
                <Textarea
                  id="text-content"
                  value={block.content.text || ""}
                  onChange={(e) => updateContent({ text: e.target.value })}
                  placeholder="Enter your text here. Use {{blank}} to create fill-in locations."
                  rows={5}
                  className="resize-none font-mono text-sm"
                />
                <div className="flex items-center gap-2 mt-2">
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {"{{blank}}"}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    Insert this to create a blank
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              {renderPreview()}
              <p className="text-xs text-muted-foreground">
                This is how students will see the question
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answer Configuration Section */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Answer Configuration
            </CardTitle>
            <div className="flex items-center gap-2">
              {configuredBlanks > 0 ? (
                <Badge
                  variant={hasBlankMismatch ? "destructive" : "default"}
                  className="gap-1"
                >
                  {hasBlankMismatch ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  {configuredBlanks} configured
                </Badge>
              ) : blanksInText > 0 ? (
                <Badge variant="destructive" className="gap-1">
                  <X className="h-3 w-3" />
                  Not configured
                </Badge>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Instructions */}
          {blanksInText > 0 && configuredBlanks === 0 && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
              Configure correct answers for each blank in your text.
            </div>
          )}

          {/* Blank Configurations */}
          <div className="space-y-3">
            {(block.content.blanks || []).map((blank, index) => (
              <div
                key={blank.id}
                className="p-4 rounded-lg border bg-background"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Blank {index + 1}
                    </span>
                    {blank.caseSensitive && (
                      <Badge variant="secondary" className="text-xs">
                        Case sensitive
                      </Badge>
                    )}
                    {blank.allowPartialCredit && (
                      <Badge variant="secondary" className="text-xs">
                        Partial credit
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeBlank(blank.id)}
                    title="Remove blank"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Correct Answers */}
                  <div>
                    <Label className="text-sm font-medium mb-2">
                      Accepted answers
                    </Label>
                    <div className="space-y-2">
                      {blank.correctAnswers.map((answer, answerIndex) => (
                        <div key={answerIndex} className="flex gap-2">
                          <Input
                            value={answer}
                            onChange={(e) =>
                              updateCorrectAnswer(
                                blank.id,
                                answerIndex,
                                e.target.value
                              )
                            }
                            placeholder={
                              answerIndex === 0
                                ? "Primary answer"
                                : "Alternative answer"
                            }
                            className={answerIndex === 0 ? "font-medium" : ""}
                          />
                          {blank.correctAnswers.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                removeCorrectAnswer(blank.id, answerIndex)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addCorrectAnswer(blank.id)}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add alternative
                      </Button>
                    </div>
                  </div>

                  {/* Hint */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1 mb-1.5">
                      <Lightbulb className="h-3 w-3" />
                      Hint
                      <span className="text-xs text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      value={blank.hint || ""}
                      onChange={(e) =>
                        updateBlank(blank.id, { hint: e.target.value })
                      }
                      placeholder="Provide a helpful clue..."
                    />
                  </div>

                  {/* Options */}
                  <div className="flex gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`case-${blank.id}`}
                        checked={blank.caseSensitive || false}
                        onCheckedChange={(checked) =>
                          updateBlank(blank.id, { caseSensitive: checked })
                        }
                      />
                      <Label
                        className="text-xs cursor-pointer"
                        htmlFor={`case-${blank.id}`}
                      >
                        Case sensitive
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`partial-${blank.id}`}
                        checked={blank.allowPartialCredit || false}
                        onCheckedChange={(checked) =>
                          updateBlank(blank.id, { allowPartialCredit: checked })
                        }
                      />
                      <Label
                        className="text-xs cursor-pointer"
                        htmlFor={`partial-${blank.id}`}
                      >
                        Partial credit
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {configuredBlanks === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No blanks configured yet</p>
              <p className="text-xs mt-1">
                {blanksInText > 0
                  ? "Click below to configure answers for your blanks"
                  : `Add {'{{blank}}'} to your text first`}
              </p>
            </div>
          )}

          {/* Add Button */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={addBlank}
            disabled={configuredBlanks >= blanksInText && blanksInText > 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Blank Configuration
          </Button>

          {/* Mismatch Warning */}
          {hasBlankMismatch && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-950/30 dark:border-yellow-900">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Configuration mismatch
                </p>
                <p className="text-yellow-700 dark:text-yellow-200 text-xs mt-1">
                  You have {blanksInText} {"{{blank}}"} marker
                  {blanksInText !== 1 ? "s" : ""} but {configuredBlanks}{" "}
                  configuration{configuredBlanks !== 1 ? "s" : ""}.
                  {blanksInText > configuredBlanks
                    ? " Add more configurations below."
                    : " Remove extra configurations or add more blanks to your text."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scoring Section */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Scoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="points" className="text-sm font-medium mb-1.5">
              Total points
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
              {configuredBlanks > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({((block.content.points || 1) / configuredBlanks).toFixed(1)}{" "}
                  per blank)
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
