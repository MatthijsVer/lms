import {
  ContentBlock,
  ContentBlockType,
  PdfContent,
} from "@/lib/content-blocks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Uploader } from "@/components/file-uploader/Uploader";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";

interface PdfBlockEditorProps {
  block: ContentBlock & { type: ContentBlockType.PDF; content: PdfContent };
  onChange: (block: ContentBlock) => void;
}

export function PdfBlockEditor({ block, onChange }: PdfBlockEditorProps) {
  const updateContent = (updates: Partial<PdfContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const clearFile = () => {
    updateContent({ pdfKey: "" });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="pdfTitle">Title</Label>
        <Input
          id="pdfTitle"
          value={block.content.title || ""}
          onChange={(event) => updateContent({ title: event.target.value })}
          placeholder="Example: Course syllabus or Reading material"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pdfDescription">
          Description <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="pdfDescription"
          value={block.content.description || ""}
          onChange={(event) =>
            updateContent({ description: event.target.value })
          }
          placeholder="Give learners context for this PDF."
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>PDF file</Label>
          {block.content.pdfKey && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              className="gap-2 text-xs"
            >
              <Trash2 className="h-4 w-4" />
              Remove file
            </Button>
          )}
        </div>
        <Uploader
          value={block.content.pdfKey}
          onChange={(key) => updateContent({ pdfKey: key })}
          fileTypeAccepted="document"
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          Upload a PDF up to 25 MB. We’ll handle storage and sharing links.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Allow downloads</p>
          <p className="text-xs text-muted-foreground">
            Let learners save the PDF locally.
          </p>
        </div>
        <Switch
          checked={block.content.downloadable !== false}
          onCheckedChange={(checked) =>
            updateContent({ downloadable: checked })
          }
        />
      </div>
    </div>
  );
}
