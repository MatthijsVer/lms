import {
  ContentBlock,
  MatchingContent,
  ContentBlockType,
} from "@/lib/content-blocks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Trash2,
  FileText,
  Link2,
  Eye,
  EyeOff,
  Settings,
  Trophy,
  ArrowLeftRight,
  Timer,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

interface MatchingBlockEditorProps {
  block: ContentBlock & {
    type: ContentBlockType.MATCHING;
    content: MatchingContent;
  };
  onChange: (block: ContentBlock) => void;
}

export function MatchingBlockEditor({
  block,
  onChange,
}: MatchingBlockEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const updateContent = (updates: Partial<MatchingContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const addPair = () => {
    const newPair = {
      id: Date.now().toString(),
      leftItem: "",
      rightItem: "",
      explanation: "",
    };

    updateContent({
      pairs: [...(block.content.pairs || []), newPair],
    });
  };

  const updatePair = (
    pairId: string,
    updates: Partial<MatchingContent["pairs"][0]>
  ) => {
    const updatedPairs = block.content.pairs.map((pair) =>
      pair.id === pairId ? { ...pair, ...updates } : pair
    );
    updateContent({ pairs: updatedPairs });
  };

  const removePair = (pairId: string) => {
    const filteredPairs = block.content.pairs.filter(
      (pair) => pair.id !== pairId
    );
    updateContent({ pairs: filteredPairs });
  };

  const renderPreview = () => {
    const pairs = block.content.pairs || [];
    if (pairs.length === 0) return null;

    // Shuffle items if enabled
    const leftItems = pairs.map((pair) => pair.leftItem);
    const rightItems = block.content.shuffleItems
      ? [...pairs].sort(() => Math.random() - 0.5).map((pair) => pair.rightItem)
      : pairs.map((pair) => pair.rightItem);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-3">Left Side</h4>
            {leftItems.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-md border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{item || "Empty"}</span>
                  <div className="w-4 h-4 rounded-full border-2 border-primary" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-3">Right Side</h4>
            {rightItems.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-md border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-4 h-4 rounded-full border-2 border-primary" />
                  <span className="text-sm">{item || "Empty"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Students will draw lines to connect matching items
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Content Section */}
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
                    <h4 className="font-medium text-sm">Matching Settings</h4>

                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="shuffle-items"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Shuffle items
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Randomly order the right side items
                          </p>
                        </div>
                        <Switch
                          id="shuffle-items"
                          checked={block.content.shuffleItems !== false}
                          onCheckedChange={(checked) =>
                            updateContent({ shuffleItems: checked })
                          }
                        />
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="show-feedback"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Show feedback
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Immediate feedback on each match
                          </p>
                        </div>
                        <Switch
                          id="show-feedback"
                          checked={block.content.showFeedback !== false}
                          onCheckedChange={(checked) =>
                            updateContent({ showFeedback: checked })
                          }
                        />
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="allow-hints"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Allow hints
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Show explanations as hints
                          </p>
                        </div>
                        <Switch
                          id="allow-hints"
                          checked={block.content.allowHints !== false}
                          onCheckedChange={(checked) =>
                            updateContent({ allowHints: checked })
                          }
                        />
                      </div>

                      <Separator />

                      <div>
                        <Label
                          htmlFor="time-limit"
                          className="text-sm font-medium"
                        >
                          Time limit (optional)
                        </Label>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Input
                            id="time-limit"
                            type="number"
                            value={block.content.timeLimit || ""}
                            onChange={(e) =>
                              updateContent({
                                timeLimit: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              })
                            }
                            placeholder="No limit"
                            min={30}
                            max={3600}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">
                            seconds
                          </span>
                        </div>
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
                <Label htmlFor="title" className="text-sm font-medium">
                  Title
                  <span className="text-xs text-muted-foreground ml-2">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="title"
                  value={block.content.title || ""}
                  onChange={(e) => updateContent({ title: e.target.value })}
                  placeholder="Match the following items..."
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="instructions" className="text-sm font-medium">
                  Instructions
                </Label>
                <Textarea
                  id="instructions"
                  value={block.content.instructions || ""}
                  onChange={(e) =>
                    updateContent({ instructions: e.target.value })
                  }
                  placeholder="Draw lines to connect related items on the left with their matching items on the right."
                  rows={2}
                  className="mt-1.5 resize-none"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              {renderPreview()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matching Pairs Section */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Matching Pairs
            </CardTitle>
            {(block.content.pairs?.length || 0) > 0 && (
              <Badge variant="secondary">{block.content.pairs.length} pairs</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Pairs */}
          <div className="space-y-3">
            {(block.content.pairs || []).map((pair, index) => (
              <div
                key={pair.id}
                className="p-4 rounded-lg border bg-background"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Pair {index + 1}
                    </span>
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removePair(pair.id)}
                    title="Remove pair"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-1.5">
                        Left Item
                      </Label>
                      <Input
                        value={pair.leftItem}
                        onChange={(e) =>
                          updatePair(pair.id, { leftItem: e.target.value })
                        }
                        placeholder="e.g., Capital of France"
                        className="font-medium"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1.5">
                        Right Item
                      </Label>
                      <Input
                        value={pair.rightItem}
                        onChange={(e) =>
                          updatePair(pair.id, { rightItem: e.target.value })
                        }
                        placeholder="e.g., Paris"
                        className="font-medium"
                      />
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1 mb-1.5">
                      <MessageSquare className="h-3 w-3" />
                      Explanation
                      <span className="text-xs text-muted-foreground">
                        (optional - shown after matching)
                      </span>
                    </Label>
                    <Textarea
                      value={pair.explanation || ""}
                      onChange={(e) =>
                        updatePair(pair.id, { explanation: e.target.value })
                      }
                      placeholder="Provide additional context or explanation..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {(block.content.pairs?.length || 0) === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No matching pairs yet</p>
              <p className="text-xs mt-1">
                Add pairs of items for students to match
              </p>
            </div>
          )}

          {/* Add Button */}
          <Button variant="secondary" className="w-full" onClick={addPair}>
            <Plus className="h-4 w-4 mr-2" />
            Add Matching Pair
          </Button>
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
              {(block.content.pairs?.length || 0) > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({(
                    (block.content.points || 1) / block.content.pairs.length
                  ).toFixed(1)}{" "}
                  per pair)
                </span>
              )}
            </div>
          </div>

          {block.content.timeLimit && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950/30 dark:border-blue-900">
              <div className="flex items-start gap-2">
                <Timer className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Time limit active
                  </p>
                  <p className="text-blue-700 dark:text-blue-200 text-xs mt-1">
                    Students will have {block.content.timeLimit} seconds to
                    complete all matches
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
