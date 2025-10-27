"use server";

import { NextRequest, NextResponse } from "next/server";
import { generateCourseFromSource, openai } from "@/lib/ai/course-generator";

type SupportedMode = "video" | "document";

function readTextFile(file: File) {
  return file.text();
}

async function extractDocumentNotesWithOpenAI(file: File, notes: string) {
  const uploaded = await openai.files.create({
    file,
    purpose: "assistants",
  });

  const prompt =
    "Extract detailed notes from the attached document to help build an online course. Organise the output into labelled sections with headings, bullet points, and key concepts that the course should cover." +
    (notes.trim().length ? ` Additional context: ${notes.trim()}` : "");

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_file", file_id: uploaded.id },
        ],
      },
    ],
  });

  const textOutput =
    response.output_text ??
    response.output
      ?.flatMap((item: any) =>
        (item.content || [])
          .filter((content: any) => content.type === "output_text")
          .map((content: any) => content.text)
      )
      .join("\n") ??
    "";

  // Optionally delete uploaded file to avoid storage accumulation
  try {
    await openai.files.delete(uploaded.id);
  } catch (error) {
    console.warn("Failed to delete uploaded file", error);
  }

  return textOutput.trim();
}

async function transcribeMedia(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type || "audio/mp4" });
  const response = await openai.audio.transcriptions.create({
    file: new File([blob], file.name, { type: blob.type }),
    model: "whisper-1",
  });
  return response.text;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const mode = formData.get("mode");
    const file = formData.get("file");
    const notes =
      typeof formData.get("notes") === "string"
        ? (formData.get("notes") as string)
        : "";

    if (mode !== "video" && mode !== "document") {
      return NextResponse.json(
        { error: "Invalid mode provided." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A file upload is required." },
        { status: 400 }
      );
    }

    let workingText = "";
    if (mode === "document") {
      if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
        workingText = await readTextFile(file);
      } else {
        workingText = await extractDocumentNotesWithOpenAI(file, notes);
      }
    } else {
      workingText = await transcribeMedia(file);
    }

    workingText = workingText.trim();

    if (notes.trim().length > 0) {
      workingText += `\n\nAdditional context from course creator:\n${notes.trim()}`;
    }

    if (!workingText) {
      return NextResponse.json(
        { error: "Unable to extract meaningful content from the provided file." },
        { status: 400 }
      );
    }
    const response = await generateCourseFromSource(
      mode as SupportedMode,
      workingText
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("AI course extractor error:", error);
    return NextResponse.json(
      { error: "Failed to process uploaded file" },
      { status: 500 }
    );
  }
}
