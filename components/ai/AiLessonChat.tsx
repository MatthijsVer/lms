// components/ai-lesson-creator/AILessonGeneratorDialog.tsx
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileJson,
  Loader2,
  AlertCircle,
  MessageSquare,
  Wand2,
  Plus,
} from "lucide-react";
import { ContentBlock } from "@/lib/content-blocks";
import { toast } from "sonner";

interface Message {
  role: "assistant" | "user" | "system";
  content: string;
  timestamp?: Date;
}

interface AILessonGeneratorDialogProps {
  onContentGenerated?: (blocks: ContentBlock[]) => void;
  existingBlocks?: ContentBlock[];
  lessonTitle?: string;
  trigger?: React.ReactNode;
}

export function AILessonGeneratorDialog({
  onContentGenerated,
  existingBlocks = [],
  lessonTitle,
  trigger,
}: AILessonGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedJson, setGeneratedJson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize conversation when dialog opens
  useEffect(() => {
    if (open && messages.length === 0) {
      const context = lessonTitle
        ? `I'm working on a lesson titled "${lessonTitle}".`
        : "I'm creating a new lesson.";

      const existingContext =
        existingBlocks.length > 0
          ? ` I already have ${existingBlocks.length} content blocks.`
          : "";

      const initialMessage: Message = {
        role: "assistant",
        content: `Hello! I'm here to help you create engaging lesson content. ${context}${existingContext}\n\nWhat would you like to add to your lesson? I can help you create:\n• 📝 Text explanations\n• ❓ Quiz questions\n• 🔤 Fill-in-the-blank exercises\n• 📹 Video placeholders\n• 💻 Code examples\n• And more!\n\nJust tell me what topic or concept you want to cover.`,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    }
  }, [open, lessonTitle, existingBlocks.length]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Add context about existing blocks if needed
      const contextMessage =
        existingBlocks.length > 0
          ? `Context: The lesson already has ${existingBlocks.length} content blocks. Generate new blocks to add to this lesson.`
          : "";

      const response = await fetch("/api/ai/lesson-creator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...(contextMessage
              ? [{ role: "system", content: contextMessage }]
              : []),
            ...updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          generateJson:
            input.toLowerCase().includes("generate") ||
            input.toLowerCase().includes("create") ||
            input.toLowerCase().includes("yes") ||
            input.toLowerCase().includes("proceed"),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages([...updatedMessages, assistantMessage]);

      // Extract JSON from the response
      if (data.lessonJson || data.message.includes("```json")) {
        const jsonData =
          data.lessonJson || extractJsonFromMessage(data.message);
        if (jsonData) {
          setGeneratedJson(jsonData);
          setActiveTab("preview");
        }
      }
    } catch (err) {
      setError("Failed to generate content. Please try again.");
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const extractJsonFromMessage = (content: string) => {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        // Extract content blocks if it's a full lesson structure
        return parsed.contentBlocks || parsed;
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        return null;
      }
    }
    return null;
  };

  const handleAddToLesson = () => {
    if (generatedJson) {
      // Extract content blocks from the generated JSON
      const blocks = Array.isArray(generatedJson)
        ? generatedJson
        : generatedJson.contentBlocks || [generatedJson];

      // Adjust positions based on existing blocks
      const startPosition = existingBlocks.length;
      const adjustedBlocks = blocks.map((block: any, index: number) => ({
        ...block,
        position: startPosition + index + 1,
        id: undefined, // Remove any generated IDs, let the system create them
      }));

      if (onContentGenerated) {
        onContentGenerated(adjustedBlocks);
      }

      toast.success(
        `Added ${adjustedBlocks.length} content blocks to your lesson`
      );
      handleClose();
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after a delay to avoid visual glitches
    setTimeout(() => {
      setMessages([]);
      setGeneratedJson(null);
      setError(null);
      setActiveTab("chat");
    }, 200);
  };

  const renderContentPreview = () => {
    if (!generatedJson) return null;

    const blocks = Array.isArray(generatedJson)
      ? generatedJson
      : generatedJson.contentBlocks || [generatedJson];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Generated Content Preview</h3>
          <Badge variant="secondary">{blocks.length} blocks</Badge>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {blocks.map((block: any, index: number) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{block.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Position {index + 1}
                  </span>
                </div>

                {block.type === "TEXT" && (
                  <div>
                    <p className="font-medium text-sm">{block.content.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {block.content.text}
                    </p>
                  </div>
                )}

                {block.type === "QUIZ" && (
                  <div>
                    <p className="text-sm">{block.content.question}</p>
                    <p className="text-xs text-muted-foreground">
                      {block.content.options?.length || 0} options
                    </p>
                  </div>
                )}

                {block.type === "FILL_IN_BLANK" && (
                  <div>
                    <p className="text-sm">{block.content.instructions}</p>
                    <p className="text-xs text-muted-foreground">
                      {block.content.blanks?.length || 0} blanks
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleAddToLesson} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Add to Lesson
          </Button>
          <Button variant="outline" onClick={() => setGeneratedJson(null)}>
            Start Over
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Content Generator
          </DialogTitle>
          <DialogDescription>
            Chat with AI to generate lesson content blocks
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "chat" | "preview")}
            className="h-full"
          >
            <TabsList className="mx-6 mt-4">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                disabled={!generatedJson}
                className="flex items-center gap-2"
              >
                <FileJson className="h-4 w-4" />
                Preview
                {generatedJson && (
                  <Badge variant="secondary" className="ml-1">
                    Ready
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="chat"
              className="px-6 pb-4 h-[450px] flex flex-col"
            >
              <ScrollArea
                className="flex-1 pr-4 mb-4 max-h-[40vh]"
                ref={scrollRef}
              >
                <div className="space-y-4 py-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}

                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content.split("```json")[0]}
                        </div>
                        {message.content.includes("```json") && (
                          <Badge variant="secondary" className="mt-2">
                            <FileJson className="h-3 w-3 mr-1" />
                            Content generated - check Preview tab
                          </Badge>
                        )}
                      </div>

                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {error && (
                <Alert variant="destructive" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendMessage()
                  }
                  placeholder="Describe the content you want to create..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="px-6 pb-4 h-[450px]">
              {renderContentPreview()}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AILessonGeneratorDialog;
