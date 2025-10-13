import { NextRequest, NextResponse } from "next/server";
import {
  generateCourseFromChat,
  generateCourseFromSource,
} from "@/lib/ai/course-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages,
      generateJson = false,
      mode = "chat",
      sourceText,
    } = body as {
      messages?: { role: "assistant" | "user" | "system"; content: string }[];
      generateJson?: boolean;
      mode?: "chat" | "video" | "document";
      sourceText?: string;
    };

    if (mode === "chat") {
      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json(
          { error: "Messages array is required" },
          { status: 400 }
        );
      }

      const response = await generateCourseFromChat(messages, generateJson);
      return NextResponse.json(response);
    }

    if (!sourceText || sourceText.trim().length === 0) {
      return NextResponse.json(
        { error: "Source text is required for this mode" },
        { status: 400 }
      );
    }

    const response = await generateCourseFromSource(
      mode === "video" ? "video" : "document",
      sourceText
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
