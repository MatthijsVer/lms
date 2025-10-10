import { LocalFileStorage } from "@/lib/local-storage";

export function useConstructUrl(key: string): string {
  if (LocalFileStorage.isLocalDevelopment()) {
    return LocalFileStorage.getPublicUrl(key);
  }
  return `https://${process?.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.fly.storage.tigris.dev/${key}`;
}
