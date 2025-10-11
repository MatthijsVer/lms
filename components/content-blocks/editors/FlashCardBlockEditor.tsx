import {
  ContentBlock,
  FlashCardContent,
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
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Lightbulb,
  Shuffle,
  Hash,
  FlipVertical,
  CreditCard,
  Info,
} from "lucide-react";
import { useState } from "react";

interface FlashCardBlockEditorProps {
  block: ContentBlock & {
    type: ContentBlockType.FLASHCARD;
    content: FlashCardContent;
  };
  onChange: (block: ContentBlock) => void;
}

export function FlashCardBlockEditor({
  block,
  onChange,
}: FlashCardBlockEditorProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const updateContent = (updates: Partial<FlashCardContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const addCard = () => {
    const newCard = {
      id: Date.now().toString(),
      front: "",
      back: "",
      hint: "",
    };

    updateContent({
      cards: [...(block.content.cards || []), newCard],
    });

    // Auto-expand new card
    setExpandedCards(new Set([...expandedCards, newCard.id]));
  };

  const updateCard = (cardId: string, updates: Partial<FlashCardContent["cards"][0]>) => {
    const updatedCards = block.content.cards.map((card) =>
      card.id === cardId ? { ...card, ...updates } : card
    );
    updateContent({ cards: updatedCards });
  };

  const removeCard = (cardId: string) => {
    const filteredCards = block.content.cards.filter((card) => card.id !== cardId);
    updateContent({ cards: filteredCards });
    
    // Remove from expanded set
    const newExpanded = new Set(expandedCards);
    newExpanded.delete(cardId);
    setExpandedCards(newExpanded);
  };

  const moveCard = (index: number, direction: "up" | "down") => {
    const cards = [...block.content.cards];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < cards.length) {
      [cards[index], cards[newIndex]] = [cards[newIndex], cards[index]];
      updateContent({ cards });
    }
  };

  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  return (
    <div className="space-y-5">
      {/* General Settings */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Flashcard Set Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Title
              <span className="text-xs text-muted-foreground ml-2">(optional)</span>
            </Label>
            <Input
              id="title"
              value={block.content.title || ""}
              onChange={(e) => updateContent({ title: e.target.value })}
              placeholder="Flashcard set title"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="instructions" className="text-sm font-medium">
              Instructions
              <span className="text-xs text-muted-foreground ml-2">(optional)</span>
            </Label>
            <Textarea
              id="instructions"
              value={block.content.instructions || ""}
              onChange={(e) => updateContent({ instructions: e.target.value })}
              placeholder="Provide instructions for using these flashcards..."
              rows={2}
              className="mt-1.5 resize-none"
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="shuffle" className="text-sm font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Shuffle className="h-4 w-4" />
                    Shuffle cards
                  </div>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Randomly order cards for each study session
                </p>
              </div>
              <Switch
                id="shuffle"
                checked={block.content.shuffleCards !== false}
                onCheckedChange={(checked) => updateContent({ shuffleCards: checked })}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="progress" className="text-sm font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Show progress
                  </div>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display card number (e.g., 3/10)
                </p>
              </div>
              <Switch
                id="progress"
                checked={block.content.showProgress !== false}
                onCheckedChange={(checked) => updateContent({ showProgress: checked })}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="flip" className="text-sm font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FlipVertical className="h-4 w-4" />
                    Manual flip
                  </div>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Students click to reveal answer (vs auto-reveal)
                </p>
              </div>
              <Switch
                id="flip"
                checked={block.content.allowFlip !== false}
                onCheckedChange={(checked) => updateContent({ allowFlip: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards Section */}
      <Card className="gap-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Cards
            </CardTitle>
            <Badge variant="secondary">
              {block.content.cards?.length || 0} cards
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(block.content.cards || []).map((card, index) => {
            const isExpanded = expandedCards.has(card.id);
            
            return (
              <div key={card.id} className="border rounded-lg">
                <div className="p-3 flex items-center gap-2 bg-muted/30">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <span className="text-sm font-medium">Card {index + 1}</span>
                  
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveCard(index, "up")}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveCard(index, "down")}
                      disabled={index === block.content.cards.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCardExpansion(card.id)}
                      className="text-xs"
                    >
                      {isExpanded ? "Collapse" : "Edit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCard(card.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-4 border-t">
                    <div>
                      <Label className="text-sm font-medium mb-1.5">
                        Front (Question/Prompt)
                      </Label>
                      <Textarea
                        value={card.front}
                        onChange={(e) => updateCard(card.id, { front: e.target.value })}
                        placeholder="Enter the question or prompt..."
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-1.5">
                        Back (Answer/Explanation)
                      </Label>
                      <Textarea
                        value={card.back}
                        onChange={(e) => updateCard(card.id, { back: e.target.value })}
                        placeholder="Enter the answer or explanation..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium flex items-center gap-1 mb-1.5">
                        <Lightbulb className="h-3 w-3" />
                        Hint
                        <span className="text-xs text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        value={card.hint || ""}
                        onChange={(e) => updateCard(card.id, { hint: e.target.value })}
                        placeholder="Provide a helpful hint..."
                      />
                    </div>
                  </div>
                )}

                {/* Card Preview when collapsed */}
                {!isExpanded && card.front && (
                  <div className="px-4 pb-3 pt-2 text-sm text-muted-foreground">
                    <div className="truncate">
                      <span className="font-medium">Q:</span> {card.front}
                    </div>
                    {card.back && (
                      <div className="truncate">
                        <span className="font-medium">A:</span> {card.back}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {(!block.content.cards || block.content.cards.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No cards added yet</p>
              <p className="text-xs mt-1">
                Add flashcards to help students memorize key concepts
              </p>
            </div>
          )}

          {/* Add Card Button */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={addCard}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}