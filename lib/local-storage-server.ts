import { writeFile, unlink, access } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export class LocalFileStorageServer {
  static async saveFile(key: string, buffer: Buffer): Promise<void> {
    const filePath = join(UPLOAD_DIR, key);
    await writeFile(filePath, buffer);
  }

  static async deleteFile(key: string): Promise<void> {
    const filePath = join(UPLOAD_DIR, key);
    try {
      await access(filePath);
      await unlink(filePath);
    } catch {
      // File doesn't exist, ignore error
    }
  }
}
