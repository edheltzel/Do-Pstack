declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding?: string): string;
}
