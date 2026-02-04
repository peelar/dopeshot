import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { SeededBackground } from "@/domain/backgrounds/seed-manifest";

export type DiscardedSeed = SeededBackground & { discardedAt: string };

export type SeedDiscardManifest = {
  version: 1;
  updatedAt: string;
  items: DiscardedSeed[];
};

const cwd = process.cwd();
const appRoot = cwd.endsWith(`${path.sep}apps${path.sep}app`)
  ? cwd
  : path.join(cwd, "apps", "app");

const DISCARD_MANIFEST_PATH = path.join(appRoot, "data", "ai-backgrounds", "discards.json");

function emptyDiscardManifest(): SeedDiscardManifest {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    items: [],
  };
}

export async function readSeedDiscards(): Promise<SeedDiscardManifest> {
  try {
    const file = await fs.readFile(DISCARD_MANIFEST_PATH, "utf-8");
    const parsed = JSON.parse(file) as SeedDiscardManifest;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return emptyDiscardManifest();
    }
    return {
      version: 1,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      items: parsed.items,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyDiscardManifest();
    }
    return emptyDiscardManifest();
  }
}

export async function writeSeedDiscards(manifest: SeedDiscardManifest) {
  await fs.mkdir(path.dirname(DISCARD_MANIFEST_PATH), { recursive: true });
  await fs.writeFile(DISCARD_MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

export async function appendSeedDiscards(items: SeededBackground[]) {
  if (items.length === 0) return;
  const manifest = await readSeedDiscards();
  const discardedAt = new Date().toISOString();
  const nextItems = [
    ...items.map((item) => ({
      ...item,
      discardedAt,
    })),
    ...manifest.items,
  ];
  await writeSeedDiscards({
    version: 1,
    updatedAt: discardedAt,
    items: nextItems,
  });
}
