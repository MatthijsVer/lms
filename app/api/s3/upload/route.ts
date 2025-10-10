// import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/S3Client";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { LocalFileStorage } from "@/lib/local-storage";
import { LocalFileStorageServer } from "@/lib/local-storage-server";

const fileUploadSchema = z.object({
  fileName: z.string().min(1, { message: "Filename is required" }),
  contentType: z.string().min(1, { message: "Content type is required" }),
  size: z.number().min(1, { message: "Size is required" }),
  isImage: z.boolean(),
});

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

export async function POST(request: Request) {
  const session = await requireAdmin();
  try {
    const decision = await aj.protect(request, {
      fingerprint: session?.user.id as string,
    });

    if (decision.isDenied()) {
      return NextResponse.json({ error: "dudde not good" }, { status: 429 });
    }

    // Handle local development - return a mock presigned URL
    if (LocalFileStorage.isLocalDevelopment()) {
      const body = await request.json();

      const validation = fileUploadSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid Request Body" },
          { status: 400 }
        );
      }

      const { fileName } = validation.data;
      const uniqueKey = `${uuidv4()}-${fileName}`;

      // Return a special URL that indicates this is for local development
      return NextResponse.json({
        presignedUrl: `/api/s3/upload/local?key=${uniqueKey}`,
        key: uniqueKey,
      });
    }

    // Handle production S3 upload
    const body = await request.json();

    const validation = fileUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid Request Body" },
        { status: 400 }
      );
    }

    const { fileName, contentType, size } = validation.data;

    const uniqueKey = `${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      ContentType: contentType,
      ContentLength: size,
      Key: uniqueKey,
    });

    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360, // URL expires in 6 minutes
    });

    const response = {
      presignedUrl,
      key: uniqueKey,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
