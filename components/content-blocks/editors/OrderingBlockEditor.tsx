import {
  ContentBlock,
  OrderingContent,
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
  ArrowUpDown,
  Eye,
  EyeOff,
  Settings,
  Trophy,
  GripVertical,
  Timer,
  MessageSquare,
  HelpCircle,
  Hash,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

interface OrderingBlockEditorProps {
  block: ContentBlock & {
    type: ContentBlockType.ORDERING;
    content: OrderingContent;
  };
  onChange: (block: ContentBlock) => void;
}

export function OrderingBlockEditor({
  block,
  onChange,
}: OrderingBlockEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const updateContent = (updates: Partial<OrderingContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const addItem = () => {
    const newItem = {
      id: Date.now().toString(),
      text: "",
      correctPosition: (block.content.items || []).length,
      explanation: "",
      hint: "",
    };

    updateContent({
      items: [...(block.content.items || []), newItem],
    });
  };

  const updateItem = (
    itemId: string,
    updates: Partial<OrderingContent["items"][0]>
  ) => {
    const updatedItems = block.content.items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    updateContent({ items: updatedItems });
  };

  const removeItem = (itemId: string) => {
    const filteredItems = block.content.items.filter(
      (item) => item.id !== itemId
    );
    // Recalculate correct positions
    const reorderedItems = filteredItems.map((item, index) => ({
      ...item,
      correctPosition: index,
    }));
    updateContent({ items: reorderedItems });
  };

  const moveItem = (itemId: string, direction: "up" | "down") => {
    const items = [...block.content.items];
    const itemIndex = items.findIndex((item) => item.id === itemId);
    
    if (
      (direction === "up" && itemIndex === 0) ||
      (direction === "down" && itemIndex === items.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    
    // Swap items
    [items[itemIndex], items[targetIndex]] = [items[targetIndex], items[itemIndex]];
    
    // Update correct positions
    items.forEach((item, index) => {
      item.correctPosition = index;
    });

    updateContent({ items });
  };

  const renderPreview = () => {
    const items = block.content.items || [];
    if (items.length === 0) return null;

    // Shuffle items if enabled for preview
    const displayItems = block.content.shuffleItems
      ? [...items].sort(() => Math.random() - 0.5)
      : items;

    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          {block.content.instructions || "Drag and drop to reorder the items"}
        </p>
        {displayItems.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-md border bg-background hover:bg-muted/50 cursor-grab transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            {block.content.showPositionNumbers && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium">{index + 1}</span>
              </div>
            )}
            <span className="text-sm flex-1">{item.text || "Empty item"}</span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground text-center">
          Students will drag items to arrange them in the correct order
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
                    <h4 className="font-medium text-sm">Ordering Settings</h4>

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
                            Randomly order items initially
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
                            htmlFor="show-numbers"
                            className="text-sm font-medium cursor-pointer"
                          >
                            Show position numbers
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Display 1, 2, 3... in each position
                          </p>
                        </div>
                        <Switch
                          id="show-numbers"
                          checked={block.content.showPositionNumbers !== false}
                          onCheckedChange={(checked) =>
                            updateContent({ showPositionNumbers: checked })
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
                            Award points for partially correct order
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
                            Show hints for each item
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
                  placeholder="Put the following items in order..."
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
                  placeholder="Drag and drop the items to arrange them in the correct order."
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

      {/* Items Section */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Items to Order
            </CardTitle>
            {(block.content.items?.length || 0) > 0 && (
              <Badge variant="secondary">{block.content.items.length} items</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
            Items are arranged in their correct order below. Students will see them shuffled (if enabled).
          </div>

          {/* Items */}
          <div className="space-y-3">
            {(block.content.items || []).map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border bg-background"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Position {index + 1}
                    </span>
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveItem(item.id, "up")}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveItem(item.id, "down")}
                      disabled={index === block.content.items.length - 1}
                      title="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-1.5">
                      Item Text
                    </Label>
                    <Input
                      value={item.text}
                      onChange={(e) =>
                        updateItem(item.id, { text: e.target.value })
                      }
                      placeholder="e.g., First, gather all ingredients"
                      className="font-medium"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1 mb-1.5">
                      <MessageSquare className="h-3 w-3" />
                      Explanation
                      <span className="text-xs text-muted-foreground">
                        (optional - shown after ordering)
                      </span>
                    </Label>
                    <Textarea
                      value={item.explanation || ""}
                      onChange={(e) =>
                        updateItem(item.id, { explanation: e.target.value })
                      }
                      placeholder="Explain why this item comes at this position..."
                      rows={2}
                      className="resize-none"
                    />
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
                        value={item.hint || ""}
                        onChange={(e) =>
                          updateItem(item.id, { hint: e.target.value })
                        }
                        placeholder="Provide a hint for this item..."
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {(block.content.items?.length || 0) === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowUpDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No items to order yet</p>
              <p className="text-xs mt-1">
                Add items that students will arrange in the correct sequence
              </p>
            </div>
          )}

          {/* Add Button */}
          <Button variant="secondary" className="w-full" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
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
            </div>
            
            {block.content.allowPartialCredit && (
              <p className="text-xs text-muted-foreground mt-2">
                Partial credit will be awarded based on the number of items in correct positions
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
                    complete the ordering
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