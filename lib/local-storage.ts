export class LocalFileStorage {
  static getPublicUrl(key: string): string {
    return `/uploads/${key}`;
  }

  static isLocalDevelopment(): boolean {
    return process.env.NODE_ENV === "development";
  }
}