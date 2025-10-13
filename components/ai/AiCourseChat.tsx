"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Send, Sparkles, Bot, User } from "lucide-react";
import { AiCourseStructure } from "@/lib/ai/course-structure";

interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

interface AiCourseChatProps {
  onCourseGenerated?: (course: AiCourseStructure | null) => void;
}

export function AiCourseChat({ onCourseGenerated }: AiCourseChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm here to help you build a complete course. Tell me about the subject, audience, and goals. When you're ready, say something like “generate the course outline”.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (forceGenerate = false) => {
    if (!input.trim() && !forceGenerate) return;

    const userContent = forceGenerate
      ? "Please generate the full course JSON now."
      : input.trim();

    const userMessage: Message = {
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };

    const conversation = forceGenerate
      ? messages
      : [...messages, userMessage];

    if (!forceGenerate) {
      setMessages(conversation);
      onCourseGenerated?.(null);
    }

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/course-creator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversation.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          generateJson:
            forceGenerate ||
            userContent.toLowerCase().includes("generate") ||
            userContent.toLowerCase().includes("create outline"),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message ?? "I'm not sure I understood. Could you rephrase?",
        timestamp: new Date(),
      };

      setMessages([...conversation, assistantMessage]);

      if (data.courseJson) {
        onCourseGenerated?.(data.courseJson);
        toast.success("Course outline generated!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while generating the course.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Chat-based course builder
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-[540px] flex-col gap-4">
        <ScrollArea className="flex-1 rounded-md border bg-muted/40 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-lg border px-3 py-2 text-sm leading-relaxed",
                    message.role === "assistant"
                      ? "border-primary/30 bg-primary/5 text-muted-foreground"
                      : "border-secondary bg-secondary/20 text-secondary-foreground"
                  )}
                >
                  {message.content}
                </div>
                {message.role === "user" && (
                  <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-secondary/20 text-secondary-foreground">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Describe the course or say 'generate course outline'"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={isLoading || input.trim().length === 0}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => sendMessage(true)}
            disabled={isLoading}
          >
            Generate JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
