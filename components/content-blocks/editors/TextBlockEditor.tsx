import {
  ContentBlock,
  TextContent,
  ContentBlockType,
} from "@/lib/content-blocks";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";

interface TextBlockEditorProps {
  block: ContentBlock & { type: ContentBlockType.TEXT; content: TextContent };
  onChange: (block: ContentBlock) => void;
}

export function TextBlockEditor({ block, onChange }: TextBlockEditorProps) {
  const updateContent = (updates: Partial<TextContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const field = {
    value: block.content.text,
    onChange: (value: string) => updateContent({ text: value }),
  };

  return (
    <div className="space-y-4 flex flex-col">
      <div>
        <Label className="mb-2">Format</Label>
        <Select
          value={block.content.format || "markdown"}
          onValueChange={(value: "markdown" | "html" | "plain") =>
            updateContent({ format: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="markdown">Markdown</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="plain">Plain Text</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2">Content</Label>
        <RichTextEditor field={field} />
      </div>
    </div>
  );
}
