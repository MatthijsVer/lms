import {
  ContentBlock,
  ContentBlockType,
  CodeContent,
} from "@/lib/content-blocks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormDescription } from "@/components/ui/form";
import { useMemo } from "react";

const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "tsx", label: "TSX / React" },
  { value: "jsx", label: "JSX / React" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Plain text" },
];

interface CodeBlockEditorProps {
  block: ContentBlock & { type: ContentBlockType.CODE; content: CodeContent };
  onChange: (block: ContentBlock) => void;
}

export function CodeBlockEditor({ block, onChange }: CodeBlockEditorProps) {
  const updateContent = (updates: Partial<CodeContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const languageOptions = useMemo(() => {
    if (!block.content.language) {
      return LANGUAGE_OPTIONS;
    }

    const exists = LANGUAGE_OPTIONS.some(
      (option) => option.value === block.content.language
    );

    if (exists) {
      return LANGUAGE_OPTIONS;
    }

    return [
      ...LANGUAGE_OPTIONS,
      { value: block.content.language, label: block.content.language },
    ];
  }, [block.content.language]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code-block-title">Snippet title</Label>
        <Input
          id="code-block-title"
          value={block.content.title ?? ""}
          placeholder="Optional title shown above the snippet"
          onChange={(event) => updateContent({ title: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code-block-language">Language</Label>
        <Select
          value={block.content.language || "plaintext"}
          onValueChange={(value) => updateContent({ language: value })}
        >
          <SelectTrigger id="code-block-language">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormDescription>
          Choose the syntax your snippet uses. This label also appears in the
          lesson.
        </FormDescription>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`code-block-${block.id || "new"}`}>Code</Label>
        <Textarea
          id={`code-block-${block.id || "new"}`}
          value={block.content.code}
          onChange={(event) => updateContent({ code: event.target.value })}
          placeholder={`// Paste or write the code sample here\nconsole.log("Hello from Marshal LMS!");`}
          className="font-mono text-sm min-h-[220px]"
        />
      </div>

      <div className="flex items-start gap-3 rounded-md border p-3">
        <Switch
          id="code-block-runnable"
          checked={block.content.runnable ?? false}
          onCheckedChange={(checked) =>
            updateContent({ runnable: checked ? true : undefined })
          }
        />
        <div className="space-y-1">
          <Label htmlFor="code-block-runnable" className="text-sm">
            Mark as runnable
          </Label>
          <FormDescription>
            Flags snippets that learners are expected to run locally. The portal
            does not execute code, but this flag can surface additional
            instructions.
          </FormDescription>
        </div>
      </div>
    </div>
  );
}
