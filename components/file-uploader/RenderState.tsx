import { cn } from "@/lib/utils";
import {
  CloudUploadIcon,
  FileText,
  ImageIcon,
  Loader2,
  XIcon,
  ExternalLink,
  Music,
} from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";

export function RenderEmptyState({ isDragActive }: { isDragActive: boolean }) {
  return (
    <div className="text-center">
      <div className="flex items-center mx-auto justify-center size-12 rounded-full bg-muted mb-4">
        <CloudUploadIcon
          className={cn(
            "size-6 text-muted-foreground",
            isDragActive && "text-primary"
          )}
        />
      </div>
      <p className="text-base font-semibold text-foreground">
        Drop your files here or{" "}
        <span className="text-primary font-bold cursor-pointer">
          click to upload
        </span>
      </p>
      <Button type="button" className="mt-4">
        Select File
      </Button>
    </div>
  );
}

export function RenderErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className=" text-center">
      <div className="flex items-center mx-auto justify-center size-12 rounded-full bg-destructive/30 mb-4">
        <ImageIcon className={cn("size-6 text-destructive")} />
      </div>

      <p className="text-base font-semibold">Upload Failed</p>
      <p className="text-xs mt-1 text-muted-foreground">Something went wrong</p>
      <Button className="mt-4" type="button" onClick={onRetry}>
        Retry File Selection
      </Button>
    </div>
  );
}

export function RenderUploadedState({
  previewUrl,
  isDeleting,
  handleRemoveFile,
  fileType,
  fileName,
}: {
  previewUrl: string;
  isDeleting: boolean;
  handleRemoveFile: () => void;
  fileType: "image" | "video" | "document" | "audio";
  fileName?: string;
}) {
  return (
    <div className="relative group w-full h-full flex items-center justify-center">
      {fileType === "video" && (
        <video src={previewUrl} controls className="rounded-md w-full h-full" />
      )}

      {fileType === "image" && (
        <Image
          src={previewUrl}
          alt="Uploaded File"
          fill
          className="object-cover rounded-2xl p-1"
        />
      )}

      {fileType === "document" && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg bg-muted/40 p-6 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {fileName || "PDF document uploaded"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Preview opens in a new tab.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open preview
            </a>
          </Button>
        </div>
      )}
      {fileType === "audio" && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg bg-muted/40 p-6 text-center">
          <Music className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {fileName || "Audio file uploaded"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Press play to preview the recording.
            </p>
          </div>
          <audio controls src={previewUrl} className="w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      <Button
        variant="destructive"
        size="icon"
        className={cn("absolute top-4 right-4")}
        onClick={handleRemoveFile}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <XIcon className="size-4" />
        )}
      </Button>
    </div>
  );
}

export function RenderUploadingState({
  progress,
  file,
}: {
  progress: number;
  file: File;
}) {
  return (
    <div className="text-center flex justify-center items-center flex-col">
      <p>{progress}</p>

      <p className="mt-2 text-sm font-medium text-foreground">Uploading...</p>

      <p className="mt-1 text-xs text-muted-foreground truncate max-w-xs">
        {file.name}
      </p>
    </div>
  );
}
