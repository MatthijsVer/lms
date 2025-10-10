import { NextResponse } from "next/server";
import { LocalFileStorageServer } from "@/lib/local-storage-server";
import { requireAdmin } from "@/app/data/admin/require-admin";

export async function PUT(request: Request) {
  await requireAdmin();
  
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    
    if (!key) {
      return NextResponse.json(
        { error: "Missing key parameter" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await request.arrayBuffer());
    await LocalFileStorageServer.saveFile(key, buffer);

    return NextResponse.json(
      { message: "File uploaded successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Local file upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}