"use client";

import { FlashCardContent } from "@/lib/content-blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  FlipVertical,
  Lightbulb,
  CreditCard,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FlashCardBlockRendererProps {
  content: FlashCardContent;
  blockId: string;
}

export function FlashCardBlockRenderer({ content, blockId }: FlashCardBlockRendererProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [viewedCards, setViewedCards] = useState<Set<number>>(new Set([0]));
  
  // Initialize card order immediately
  const [cardOrder, setCardOrder] = useState<number[]>(() => {
    const order = Array.from({ length: content.cards.length }, (_, i) => i);
    if (content.shuffleCards) {
      // Fisher-Yates shuffle
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
    return order;
  });

  // Only reset when cards length changes
  useEffect(() => {
    if (cardOrder.length !== content.cards.length) {
      const order = Array.from({ length: content.cards.length }, (_, i) => i);
      if (content.shuffleCards) {
        // Fisher-Yates shuffle
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
      }
      setCardOrder(order);
      setCurrentCardIndex(0);
      setViewedCards(new Set([0]));
    }
  }, [content.cards.length, cardOrder.length]);

  if (!content.cards || content.cards.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center text-muted-foreground">
          <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No flashcards available</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure we have valid card order before trying to access cards
  if (cardOrder.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center text-muted-foreground">
          <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Loading flashcards...</p>
        </CardContent>
      </Card>
    );
  }

  const currentCard = content.cards[cardOrder[currentCardIndex]];
  const isFirstCard = currentCardIndex === 0;
  const isLastCard = currentCardIndex === cardOrder.length - 1;
  const allCardsViewed = viewedCards.size === content.cards.length;

  // Safety check for current card
  if (!currentCard) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center text-muted-foreground">
          <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Error loading flashcard</p>
        </CardContent>
      </Card>
    );
  }

  const handlePrevious = () => {
    if (!isFirstCard) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleNext = () => {
    if (!isLastCard) {
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      setViewedCards(new Set([...viewedCards, nextIndex]));
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleFlip = () => {
    if (content.allowFlip !== false || !isFlipped) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleRestart = () => {
    const order = Array.from({ length: content.cards.length }, (_, i) => i);
    if (content.shuffleCards) {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
    setCardOrder(order);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setViewedCards(new Set([0]));
  };

  return (
    <Card className="w-full">
      {(content.title || content.instructions) && (
        <CardHeader>
          {content.title && (
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {content.title}
            </CardTitle>
          )}
          {content.instructions && (
            <p className="text-sm text-muted-foreground">{content.instructions}</p>
          )}
        </CardHeader>
      )}
      
      <CardContent className="space-y-4">
        {/* Progress indicator */}
        {content.showProgress !== false && (
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1">
              Card {currentCardIndex + 1} of {content.cards.length}
            </Badge>
            <div className="text-sm text-muted-foreground">
              {viewedCards.size}/{content.cards.length} viewed
            </div>
          </div>
        )}

        {/* Flashcard */}
        <div className="relative">
          <div 
            className={cn(
              "relative h-64 cursor-pointer transition-all duration-500 preserve-3d",
              isFlipped && "rotate-y-180"
            )}
            onClick={handleFlip}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front of card */}
            <div className={cn(
              "flashcard-front absolute inset-0 w-full h-full rounded-lg border p-6 flex flex-col items-center justify-center text-center backface-hidden",
              "hover:brightness-95 transition-all shadow-sm"
            )}>
              <div className="bg-card w-full h-full rounded-lg flex flex-col items-center justify-center relative">
                <p className="text-lg font-medium text-foreground">{currentCard.front}</p>
                {!isFlipped && content.allowFlip !== false && (
                  <div className="absolute bottom-4 text-xs text-muted-foreground flex items-center gap-1">
                    <FlipVertical className="h-3 w-3" />
                    Click to flip
                  </div>
                )}
              </div>
            </div>

            {/* Back of card */}
            <div className={cn(
              "flashcard-back absolute inset-0 w-full h-full rounded-lg border p-6 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180",
              "shadow-sm"
            )}>
              <div className="bg-muted w-full h-full rounded-lg flex flex-col items-center justify-center relative">
                <p className="text-lg text-foreground">{currentCard.back}</p>
                {isFlipped && content.allowFlip !== false && (
                  <div className="absolute bottom-4 text-xs text-muted-foreground flex items-center gap-1">
                    <FlipVertical className="h-3 w-3" />
                    Click to flip back
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hint section */}
          {currentCard.hint && (
            <div className="mt-3">
              {!showHint ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHint(true)}
                  className="w-full"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Show Hint
                </Button>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-950/30 dark:border-yellow-900">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {currentCard.hint}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation controls */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstCard}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {!allCardsViewed ? (
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={isLastCard}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                All cards viewed!
              </Badge>
              <Button
                variant="outline"
                onClick={handleRestart}
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}