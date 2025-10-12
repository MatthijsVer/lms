import {
  ContentBlock,
  VideoContent,
  ContentBlockType,
} from "@/lib/content-blocks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Uploader } from "@/components/file-uploader/Uploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, Upload } from "lucide-react";
import { useState, useEffect } from "react";

interface VideoBlockEditorProps {
  block: ContentBlock & { type: ContentBlockType.VIDEO; content: VideoContent };
  onChange: (block: ContentBlock) => void;
}

export function VideoBlockEditor({ block, onChange }: VideoBlockEditorProps) {
  const [activeTab, setActiveTab] = useState<"url" | "upload">(
    block.content.videoUrl ? "url" : "upload"
  );

  useEffect(() => {
    // Sync external changes (e.g., if content updated elsewhere)
    setActiveTab(block.content.videoUrl ? "url" : "upload");
  }, [block.content.videoUrl]);

  const updateContent = (updates: Partial<VideoContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "url" | "upload");

    if (value === "url") {
      updateContent({ videoKey: undefined });
    } else {
      updateContent({ videoUrl: undefined });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Video Title (optional)</Label>
        <Input
          value={block.content.title || ""}
          onChange={(e) => updateContent({ title: e.target.value })}
          placeholder="Enter video title"
        />
      </div>

      <div>
        <Label>Video Description (optional)</Label>
        <Input
          value={block.content.description || ""}
          onChange={(e) => updateContent({ description: e.target.value })}
          placeholder="Enter video description"
        />
      </div>

      <div>
        <Label>Video Source</Label>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-card">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Video URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Upload a video file from your computer
            </p>
            <Uploader
              value={block.content.videoKey}
              onChange={(key) =>
                updateContent({ videoKey: key, videoUrl: undefined })
              }
              fileTypeAccepted="video"
            />
          </TabsContent>

          <TabsContent value="url" className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Enter a video URL (YouTube, Vimeo, or direct video link)
            </p>
            <Input
              value={block.content.videoUrl || ""}
              onChange={(e) =>
                updateContent({ videoUrl: e.target.value, videoKey: undefined })
              }
              placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
              type="url"
            />
            {block.content.videoUrl && (
              <p className="text-xs text-muted-foreground">
                Supported: YouTube, Vimeo, and direct video links (.mp4, .webm,
                .ogg)
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
