"use client";

import { TextContent } from "@/lib/content-blocks";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";

interface TextBlockRendererProps {
  content: TextContent;
  blockId: string;
}

export function TextBlockRenderer({ content, blockId }: TextBlockRendererProps) {
  if (!content.text) {
    return null;
  }

  if (content.format === "rich") {
    try {
      const jsonContent = typeof content.text === "string" 
        ? JSON.parse(content.text) 
        : content.text;
      return (
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <RenderDescription json={jsonContent} />
        </div>
      );
    } catch (error) {
      // Fallback to plain text if JSON parsing fails
      return (
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p>{content.text}</p>
        </div>
      );
    }
  }

  // Handle markdown format
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <p className="whitespace-pre-wrap">{content.text}</p>
    </div>
  );
}