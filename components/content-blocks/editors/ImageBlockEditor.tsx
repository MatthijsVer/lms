import { ContentBlock, ImageContent, ContentBlockType } from "@/lib/content-blocks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Uploader } from "@/components/file-uploader/Uploader";

interface ImageBlockEditorProps {
  block: ContentBlock & { type: ContentBlockType.IMAGE; content: ImageContent };
  onChange: (block: ContentBlock) => void;
}

export function ImageBlockEditor({ block, onChange }: ImageBlockEditorProps) {
  const updateContent = (updates: Partial<ImageContent>) => {
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
        <Label>Image</Label>
        <Uploader
          value={block.content.imageKey}
          onChange={(key) => updateContent({ imageKey: key })}
          fileTypeAccepted="image"
        />
      </div>
      
      <div>
        <Label>Alt Text</Label>
        <Input
          value={block.content.alt || ""}
          onChange={(e) => updateContent({ alt: e.target.value })}
          placeholder="Describe the image for accessibility"
        />
      </div>
      
      <div>
        <Label>Caption (optional)</Label>
        <Textarea
          value={block.content.caption || ""}
          onChange={(e) => updateContent({ caption: e.target.value })}
          placeholder="Add a caption for the image"
          rows={2}
        />
      </div>
    </div>
  );
}