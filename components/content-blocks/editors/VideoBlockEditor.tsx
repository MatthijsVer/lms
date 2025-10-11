import { ContentBlock, VideoContent, ContentBlockType } from "@/lib/content-blocks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Uploader } from "@/components/file-uploader/Uploader";

interface VideoBlockEditorProps {
  block: ContentBlock & { type: ContentBlockType.VIDEO; content: VideoContent };
  onChange: (block: ContentBlock) => void;
}

export function VideoBlockEditor({ block, onChange }: VideoBlockEditorProps) {
  const updateContent = (updates: Partial<VideoContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
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
        <Label>Video File</Label>
        <Uploader
          value={block.content.videoKey}
          onChange={(key) => updateContent({ videoKey: key })}
          fileTypeAccepted="video"
        />
      </div>
    </div>
  );
}