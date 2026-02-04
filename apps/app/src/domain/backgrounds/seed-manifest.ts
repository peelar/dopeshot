import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { brandPersonalityValues, type BrandPersonality } from "@/lib/types/brand";

export type SeededBackground = {
  id: string;
  personality: BrandPersonality;
  prompt: string;
  seed: number | null;
  provider: string;
  model: string;
  imageUrl: string;
  widthPx: number;
  heightPx: number;
  createdAt: string;
};

export type SeedManifest = {
  version: 1;
  generatedAt: string;
  items: SeededBackground[];
};

const cwd = process.cwd();
const appRoot = cwd.endsWith(`${path.sep}apps${path.sep}app`)
  ? cwd
  : path.join(cwd, "apps", "app");

const SEED_MANIFEST_PATH = path.join(appRoot, "data", "ai-backgrounds", "seeds.json");

const PERSONALITY_SET = new Set(brandPersonalityValues);

export function getSeedManifestPath() {
  return SEED_MANIFEST_PATH;
}

export async function readSeedManifest(): Promise<SeedManifest> {
  try {
    const file = await fs.readFile(SEED_MANIFEST_PATH, "utf-8");
    const parsed = JSON.parse(file) as SeedManifest;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return emptySeedManifest();
    }
    return {
      version: 1,
      generatedAt: parsed.generatedAt ?? new Date().toISOString(),
      items: parsed.items.filter((item) => PERSONALITY_SET.has(item.personality)),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptySeedManifest();
    }
    return emptySeedManifest();
  }
}

export async function writeSeedManifest(manifest: SeedManifest) {
  await fs.mkdir(path.dirname(SEED_MANIFEST_PATH), { recursive: true });
  await fs.writeFile(SEED_MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

export function emptySeedManifest(): SeedManifest {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    items: [],
  };
}

export function isSeedPersonality(value: string): value is BrandPersonality {
  return PERSONALITY_SET.has(value as BrandPersonality);
}
