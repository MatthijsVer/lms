import {
  AudioContent,
  ContentBlock,
  ContentBlockType,
} from "@/lib/content-blocks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Uploader } from "@/components/file-uploader/Uploader";
import { Button } from "@/components/ui/button";
import { Trash2, Music } from "lucide-react";

interface AudioBlockEditorProps {
  block: ContentBlock & { type: ContentBlockType.AUDIO; content: AudioContent };
  onChange: (block: ContentBlock) => void;
}

export function AudioBlockEditor({ block, onChange }: AudioBlockEditorProps) {
  const updateContent = (updates: Partial<AudioContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const clearFile = () => {
    updateContent({ audioKey: "" });
  };

  const transcriptEnabled = Boolean(block.content.transcript?.trim());
  const transcriptChecked =
    transcriptEnabled && block.content.shouldShowTranscript !== false;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="audioTitle">Title</Label>
        <Input
          id="audioTitle"
          value={block.content.title || ""}
          onChange={(event) => updateContent({ title: event.target.value })}
          placeholder="Example: Lesson audio introduction"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="audioDescription">
          Description <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="audioDescription"
          value={block.content.description || ""}
          onChange={(event) =>
            updateContent({ description: event.target.value })
          }
          placeholder="Give learners context before they listen."
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Audio file</Label>
          {block.content.audioKey && (
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
          value={block.content.audioKey}
          onChange={(key) => updateContent({ audioKey: key })}
          fileTypeAccepted="audio"
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Music className="h-3.5 w-3.5" />
          Upload an MP3, WAV, or AAC file up to 30&nbsp;MB.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="audioTranscript">
          Transcript <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="audioTranscript"
          value={block.content.transcript || ""}
          onChange={(event) =>
            updateContent({ transcript: event.target.value })
          }
          placeholder="Paste the transcript to improve accessibility."
          rows={6}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Show transcript by default</p>
          <p className="text-xs text-muted-foreground">
            Learners can still toggle visibility themselves.
          </p>
        </div>
        <Switch
          checked={transcriptChecked}
          disabled={!transcriptEnabled}
          onCheckedChange={(checked) => {
            if (!transcriptEnabled) return;
            updateContent({ shouldShowTranscript: checked });
          }}
        />
      </div>
      {!transcriptEnabled && (
        <p className="text-xs text-muted-foreground">
          Add a transcript to enable this option.
        </p>
      )}
    </div>
  );
}
