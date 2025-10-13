import {
  CodeExerciseContent,
  ContentBlock,
  ContentBlockType,
} from "@/lib/content-blocks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface CodeExerciseBlockEditorProps {
  block: ContentBlock & {
    type: ContentBlockType.CODE_EXERCISE;
    content: CodeExerciseContent;
  };
  onChange: (block: ContentBlock) => void;
}

export function CodeExerciseBlockEditor({
  block,
  onChange,
}: CodeExerciseBlockEditorProps) {
  const updateContent = (updates: Partial<CodeExerciseContent>) => {
    onChange({
      ...block,
      content: {
        ...block.content,
        ...updates,
      },
    });
  };

  const tests = block.content.tests ?? [];

  const updateTest = (index: number, updates: Partial<CodeExerciseContent["tests"][number]>) => {
    const next = [...tests];
    next[index] = {
      ...next[index],
      ...updates,
    };
    updateContent({ tests: next });
  };

  const addTest = () => {
    updateContent({
      tests: [
        ...tests,
        {
          description: "",
          code: "// Use assert(condition, message?) to validate behaviour\nassert(true, \"Replace with your test\");",
        },
      ],
    });
  };

  const removeTest = (index: number) => {
    updateContent({
      tests: tests.filter((_, idx) => idx !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="codeExerciseTitle">Title</Label>
        <Input
          id="codeExerciseTitle"
          value={block.content.title || ""}
          onChange={(event) => updateContent({ title: event.target.value })}
          placeholder="Example: Implement add(a, b)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="codeExercisePrompt">Prompt</Label>
        <Textarea
          id="codeExercisePrompt"
          value={block.content.prompt || ""}
          onChange={(event) => updateContent({ prompt: event.target.value })}
          placeholder="Explain what learners should build. Markdown is supported."
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="codeExerciseStarter">Starter code</Label>
        <Textarea
          id="codeExerciseStarter"
          value={block.content.starterCode || ""}
          onChange={(event) => updateContent({ starterCode: event.target.value })}
          placeholder="// Provide starter functions or scaffolding"
          className="font-mono text-sm"
          rows={10}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="codeExerciseSolution">
          Instructor solution <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="codeExerciseSolution"
          value={block.content.solution || ""}
          onChange={(event) => updateContent({ solution: event.target.value })}
          placeholder="// Optional reference solution for facilitators"
          className="font-mono text-sm"
          rows={8}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Tests</Label>
          <Button variant="outline" size="sm" onClick={addTest} className="gap-2">
            <Plus className="h-4 w-4" />
            Add test
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Each test runs after the learner&apos;s code. Use <code>assert(condition, message?)</code> to fail with a helpful note.
        </p>

        <div className="space-y-4">
          {tests.map((test, index) => (
            <div key={`code-exercise-test-${index}`} className="rounded-md border bg-muted/40 p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`codeExerciseTestDesc-${index}`}>Description</Label>
                  <Input
                    id={`codeExerciseTestDesc-${index}`}
                    value={test.description}
                    onChange={(event) => updateTest(index, { description: event.target.value })}
                    placeholder="Describe what this test checks"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTest(index)}
                  aria-label="Remove test"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`codeExerciseTestCode-${index}`}>Test code</Label>
                <Textarea
                  id={`codeExerciseTestCode-${index}`}
                  value={test.code}
                  onChange={(event) => updateTest(index, { code: event.target.value })}
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>
            </div>
          ))}
          {tests.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No tests added yet. Learners can still run their code, but providing automated checks gives instant feedback.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
