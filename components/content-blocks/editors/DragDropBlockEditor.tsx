import {
  ContentBlock,
  DragDropContent,
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
  Move,
  Target,
  Eye,
  EyeOff,
  Settings,
  Trophy,
  Timer,
  MessageSquare,
  HelpCircle,
  Tag,
  Box,
} from "lucide-react";
import { useState } from "react";

interface DragDropBlockEditorProps {
  block: ContentBlock & {
    type: ContentBlockType.DRAG_DROP;
    content: DragDropContent;
  };
  onChange: (block: ContentBlock) => void;
}

export function DragDropBlockEditor({
  block,
  onChange,
}: DragDropBlockEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"tokens" | "targets">("tokens");

  const updateContent = (updates: Partial<DragDropContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const addToken = () => {
    const newToken = {
      id: Date.now().toString(),
      text: "",
      correctTargets: [],
      hint: "",
    };

    updateContent({
      tokens: [...(block.content.tokens || []), newToken],
    });
  };

  const updateToken = (
    tokenId: string,
    updates: Partial<DragDropContent["tokens"][0]>
  ) => {
    const updatedTokens = block.content.tokens.map((token) =>
      token.id === tokenId ? { ...token, ...updates } : token
    );
    updateContent({ tokens: updatedTokens });
  };

  const removeToken = (tokenId: string) => {
    const filteredTokens = block.content.tokens.filter(
      (token) => token.id !== tokenId
    );
    updateContent({ tokens: filteredTokens });
  };

  const addTarget = () => {
    const newTarget = {
      id: Date.now().toString(),
      label: "",
      description: "",
      maxItems: undefined,
      acceptsMultiple: true,
    };

    updateContent({
      targets: [...(block.content.targets || []), newTarget],
    });
  };

  const updateTarget = (
    targetId: string,
    updates: Partial<DragDropContent["targets"][0]>
  ) => {
    const updatedTargets = block.content.targets.map((target) =>
      target.id === targetId ? { ...target, ...updates } : target
    );
    updateContent({ targets: updatedTargets });
  };

  const removeTarget = (targetId: string) => {
    const filteredTargets = block.content.targets.filter(
      (target) => target.id !== targetId
    );
    // Also remove this target from all tokens
    const updatedTokens = block.content.tokens.map((token) => ({
      ...token,
      correctTargets: token.correctTargets.filter((id) => id !== targetId),
    }));
    updateContent({ targets: filteredTargets, tokens: updatedTokens });
  };

  const toggleTokenTarget = (tokenId: string, targetId: string) => {
    const token = block.content.tokens.find((t) => t.id === tokenId);
    if (!token) return;

    const isSelected = token.correctTargets.includes(targetId);
    const newTargets = isSelected
      ? token.correctTargets.filter((id) => id !== targetId)
      : [...token.correctTargets, targetId];

    updateToken(tokenId, { correctTargets: newTargets });
  };

  const renderPreview = () => {
    const tokens = block.content.tokens || [];
    const targets = block.content.targets || [];
    
    if (tokens.length === 0 || targets.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Move className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Add tokens and targets to see preview</p>
        </div>
      );
    }

    const displayTokens = block.content.shuffleTokens
      ? [...tokens].sort(() => Math.random() - 0.5)
      : tokens;

    return (
      <div className="space-y-4">
        <div className="p-4 border-2 border-dashed border-muted rounded-lg">
          <h4 className="text-sm font-medium mb-3">Token Bank</h4>
          <div className="flex flex-wrap gap-2">
            {displayTokens.map((token) => (
              <div
                key={token.id}
                className="px-3 py-2 bg-primary/10 border border-primary/20 rounded-md text-sm cursor-grab hover:bg-primary/20 transition-colors"
              >
                {token.text || "Empty token"}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targets.map((target) => (
            <div
              key={target.id}
              className="p-4 border-2 border-dashed border-muted rounded-lg min-h-[100px] hover:border-primary/50 transition-colors"
            >
              {block.content.showTargetLabels && (
                <h4 className="text-sm font-medium mb-2">{target.label || "Target"}</h4>
              )}
              {target.description && (
                <p className="text-xs text-muted-foreground mb-2">
                  {target.description}
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                Drop zone {target.maxItems && `(max ${target.maxItems} items)`}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Students will drag tokens from the bank into the correct target areas
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
                    <h4 className="font-medium text-sm">Drag & Drop Settings</h4>

                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="shuffle-tokens"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Shuffle tokens
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Randomly order tokens initially
                          </p>
                        </div>
                        <Switch
                          id="shuffle-tokens"
                          checked={block.content.shuffleTokens !== false}
                          onCheckedChange={(checked) =>
                            updateContent({ shuffleTokens: checked })
                          }
                        />
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="show-labels"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Show target labels
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Display labels on drop zones
                          </p>
                        </div>
                        <Switch
                          id="show-labels"
                          checked={block.content.showTargetLabels !== false}
                          onCheckedChange={(checked) =>
                            updateContent({ showTargetLabels: checked })
                          }
                        />
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="partial-credit"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Partial credit
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Award points for partially correct placement
                          </p>
                        </div>
                        <Switch
                          id="partial-credit"
                          checked={block.content.allowPartialCredit !== false}
                          onCheckedChange={(checked) =>
                            updateContent({ allowPartialCredit: checked })
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
                            Immediate feedback on each drop
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
                            Show hints for tokens
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

                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="return-to-bank"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Return to bank
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Return incorrect tokens to bank
                          </p>
                        </div>
                        <Switch
                          id="return-to-bank"
                          checked={block.content.returnToBank !== false}
                          onCheckedChange={(checked) =>
                            updateContent({ returnToBank: checked })
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
                  placeholder="Drag items to the correct categories..."
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
                  placeholder="Drag the tokens from the bank into the correct target areas."
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

      {/* Tokens and Targets Section */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Move className="h-4 w-4" />
                Tokens & Targets
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant={activeTab === "tokens" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("tokens")}
                  className="h-8"
                >
                  <Tag className="h-4 w-4 mr-1" />
                  Tokens ({(block.content.tokens || []).length})
                </Button>
                <Button
                  variant={activeTab === "targets" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("targets")}
                  className="h-8"
                >
                  <Target className="h-4 w-4 mr-1" />
                  Targets ({(block.content.targets || []).length})
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === "tokens" && (
            <div className="space-y-3">
              {(block.content.tokens || []).map((token, index) => (
                <div
                  key={token.id}
                  className="p-4 rounded-lg border bg-background"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Token {index + 1}
                      </span>
                      <Tag className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeToken(token.id)}
                      title="Remove token"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-1.5">
                        Token Text
                      </Label>
                      <Input
                        value={token.text}
                        onChange={(e) =>
                          updateToken(token.id, { text: e.target.value })
                        }
                        placeholder="e.g., Apple, Dog, Red..."
                        className="font-medium"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2">
                        Correct Target(s)
                      </Label>
                      <div className="space-y-2">
                        {(block.content.targets || []).map((target) => (
                          <div key={target.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`token-${token.id}-target-${target.id}`}
                              checked={token.correctTargets.includes(target.id)}
                              onChange={() => toggleTokenTarget(token.id, target.id)}
                              className="w-4 h-4"
                            />
                            <Label
                              htmlFor={`token-${token.id}-target-${target.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {target.label || "Unnamed target"}
                            </Label>
                          </div>
                        ))}
                        {(block.content.targets || []).length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Create targets first to assign them to tokens
                          </p>
                        )}
                      </div>
                    </div>

                    {block.content.allowHints && (
                      <div>
                        <Label className="text-sm font-medium flex items-center gap-1 mb-1.5">
                          <HelpCircle className="h-3 w-3" />
                          Hint
                          <span className="text-xs text-muted-foreground">
                            (optional)
                          </span>
                        </Label>
                        <Input
                          value={token.hint || ""}
                          onChange={(e) =>
                            updateToken(token.id, { hint: e.target.value })
                          }
                          placeholder="Provide a hint for this token..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {(block.content.tokens || []).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tokens yet</p>
                  <p className="text-xs mt-1">
                    Add draggable items for students to sort
                  </p>
                </div>
              )}

              <Button variant="secondary" className="w-full" onClick={addToken}>
                <Plus className="h-4 w-4 mr-2" />
                Add Token
              </Button>
            </div>
          )}

          {activeTab === "targets" && (
            <div className="space-y-3">
              {(block.content.targets || []).map((target, index) => (
                <div
                  key={target.id}
                  className="p-4 rounded-lg border bg-background"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Target {index + 1}
                      </span>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeTarget(target.id)}
                      title="Remove target"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-1.5">
                        Target Label
                      </Label>
                      <Input
                        value={target.label}
                        onChange={(e) =>
                          updateTarget(target.id, { label: e.target.value })
                        }
                        placeholder="e.g., Animals, Colors, Verbs..."
                        className="font-medium"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium flex items-center gap-1 mb-1.5">
                        <MessageSquare className="h-3 w-3" />
                        Description
                        <span className="text-xs text-muted-foreground">
                          (optional)
                        </span>
                      </Label>
                      <Textarea
                        value={target.description || ""}
                        onChange={(e) =>
                          updateTarget(target.id, { description: e.target.value })
                        }
                        placeholder="Describe what belongs in this target area..."
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-1.5">
                          Max Items
                          <span className="text-xs text-muted-foreground ml-2">
                            (optional)
                          </span>
                        </Label>
                        <Input
                          type="number"
                          value={target.maxItems || ""}
                          onChange={(e) =>
                            updateTarget(target.id, {
                              maxItems: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          placeholder="Unlimited"
                          min={1}
                          max={20}
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id={`target-${target.id}-multiple`}
                          checked={target.acceptsMultiple !== false}
                          onChange={(e) =>
                            updateTarget(target.id, { acceptsMultiple: e.target.checked })
                          }
                          className="w-4 h-4"
                        />
                        <Label
                          htmlFor={`target-${target.id}-multiple`}
                          className="text-sm cursor-pointer"
                        >
                          Accepts multiple items
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {(block.content.targets || []).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No targets yet</p>
                  <p className="text-xs mt-1">
                    Add drop zones for students to sort tokens into
                  </p>
                </div>
              )}

              <Button variant="secondary" className="w-full" onClick={addTarget}>
                <Plus className="h-4 w-4 mr-2" />
                Add Target
              </Button>
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
              {(block.content.tokens?.length || 0) > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({((block.content.points || 1) / block.content.tokens.length).toFixed(1)}{" "}
                  per token)
                </span>
              )}
            </div>
            
            {block.content.allowPartialCredit && (
              <p className="text-xs text-muted-foreground mt-2">
                Partial credit will be awarded based on the number of correctly placed tokens
              </p>
            )}
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
                    complete the drag & drop activity
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