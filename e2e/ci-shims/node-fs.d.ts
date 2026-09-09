declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding?: string): string;
  export function statSync(path: string): { mtimeMs: number; size: number };
}
