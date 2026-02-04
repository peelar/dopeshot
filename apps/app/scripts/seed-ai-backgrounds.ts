import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";

type OrchestrationModel = {
  provider?: string;
  model: string;
  widthPx?: number;
  heightPx?: number;
  countPerPersonality?: number;
  enabled?: boolean;
};

type OrchestrationUnderrepresented = {
  enabled?: boolean;
  topN?: number;
  bonusPerPersonality?: number;
  personalities?: string[];
  fallbackPersonalities?: string[];
};

type OrchestrationConfig = {
  version?: number;
  countPerPersonality?: number;
  models?: OrchestrationModel[];
  underrepresented?: OrchestrationUnderrepresented;
};

type PromptPack = {
  version?: number;
  widthPx?: number;
  heightPx?: number;
  basePrompt?: string;
  negativePrompt?: string;
  provider?: string;
  model?: string;
  personalityPrompts?: Record<string, string[]>;
  promptVariants?: string[];
  personalityVariants?: Record<string, string[]>;
  variantsPerPrompt?: number;
  repeatAvoidance?: RepeatAvoidanceConfig;
  orchestration?: OrchestrationConfig;
};

type RepeatAvoidanceConfig = {
  enabled?: boolean;
  lookback?: number;
  maxRetries?: number;
};

type SeedItem = {
  id: string;
  personality: string;
  prompt: string;
  seed: number | null;
  provider: string;
  model: string;
  imageUrl: string;
  widthPx: number;
  heightPx: number;
  createdAt: string;
};

type SeedManifest = {
  version: 1;
  generatedAt: string;
  items: SeedItem[];
};

type SeedJob = {
  personality: string;
  seed: number;
  prompt: string;
};

type ParsedArgs = {
  count?: number;
  personality?: string;
  model?: string;
  width?: number;
  height?: number;
};

type RepeatState = {
  enabled: boolean;
  signatures: Set<string>;
  maxRetries: number;
};

const DEFAULT_COUNT = 16;
const DEFAULT_PROVIDER = "replicate";
const DEFAULT_MODEL = "jyoung105/sdxl-turbo";
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_ORCHESTRATION_COUNT_PER_PERSONALITY = 3;
const DEFAULT_UNDERREPRESENTED_TOP_N = 2;
const DEFAULT_UNDERREPRESENTED_BONUS = 2;
const DEFAULT_VARIANTS_PER_PROMPT = 3;
const DEFAULT_REPEAT_LOOKBACK = 200;
const DEFAULT_REPEAT_MAX_RETRIES = 8;
const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_TIMEOUT_MS = 6 * 60 * 1000;

async function main() {
  const appRoot = resolveAppRoot();
  dotenv.config({ path: path.join(appRoot, ".env.local") });

  const args = parseArgs(process.argv.slice(2));
  const promptPackPath = path.join(appRoot, "data", "ai-backgrounds", "prompt-pack.json");
  const seedManifestPath = path.join(appRoot, "data", "ai-backgrounds", "seeds.json");

  const promptPack = await loadPromptPack(promptPackPath);
  const basePrompt = promptPack.basePrompt ?? "";
  const negativePrompt = promptPack.negativePrompt ?? "";

  const wantsSingleRun = Boolean(
    args.count || args.personality || args.model || args.width || args.height,
  );

  if (!wantsSingleRun && promptPack.orchestration?.models?.length) {
    await runOrchestration({
      promptPack,
      seedManifestPath,
      basePrompt,
      negativePrompt,
    });
    return;
  }

  const count = args.count ?? DEFAULT_COUNT;
  const personalityOverride = args.personality ?? null;
  let widthPx = args.width ?? promptPack.widthPx ?? DEFAULT_WIDTH;
  let heightPx = args.height ?? promptPack.heightPx ?? DEFAULT_HEIGHT;
  const provider = process.env.AI_BG_PROVIDER ?? promptPack.provider ?? DEFAULT_PROVIDER;
  const model =
    args.model ?? process.env.AI_BG_MODEL ?? promptPack.model ?? DEFAULT_MODEL;

  const manifest = await loadSeedManifest(seedManifestPath);
  const repeatState = createRepeatState({
    manifest,
    config: promptPack.repeatAvoidance,
  });

  const jobs = buildJobs({
    count,
    personalities: personalityOverride
      ? [personalityOverride]
      : Object.keys(promptPack.personalityPrompts ?? {}),
    promptPack,
    basePrompt,
    repeatState,
  });

  if (jobs.length === 0) {
    console.error("No jobs to run. Check personality prompts in prompt-pack.json.");
    process.exit(1);
  }

  for (const job of jobs) {
    console.log(`Generating ${job.personality} seed ${job.seed}...`);
    const result = await generateImageWithFallback({
      provider,
      model,
      prompt: job.prompt,
      negativePrompt,
      widthPx,
      heightPx,
      seed: job.seed,
    });

    if (result.widthPx !== widthPx || result.heightPx !== heightPx) {
      widthPx = result.widthPx;
      heightPx = result.heightPx;
    }

    const item: SeedItem = {
      id: `seed_${randomUUID()}`,
      personality: job.personality,
      prompt: job.prompt,
      seed: job.seed,
      provider,
      model,
      imageUrl: result.imageUrl,
      widthPx: result.widthPx,
      heightPx: result.heightPx,
      createdAt: new Date().toISOString(),
    };

    manifest.items.push(item);
    manifest.generatedAt = new Date().toISOString();
    await saveSeedManifest(seedManifestPath, manifest);

    console.log(`Saved ${item.id}`);
  }

  console.log(`Done. Wrote ${jobs.length} seeds to ${seedManifestPath}`);
}

void main();

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--count") {
      const value = Number.parseInt(argv[i + 1] ?? "", 10);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("--count must be a positive integer");
      }
      parsed.count = value;
      i += 1;
      continue;
    }
    if (arg === "--personality") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--personality requires a value");
      }
      parsed.personality = value;
      i += 1;
      continue;
    }
    if (arg === "--model") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--model requires a value");
      }
      parsed.model = value;
      i += 1;
      continue;
    }
    if (arg === "--width") {
      const value = Number.parseInt(argv[i + 1] ?? "", 10);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("--width must be a positive integer");
      }
      parsed.width = value;
      i += 1;
      continue;
    }
    if (arg === "--height") {
      const value = Number.parseInt(argv[i + 1] ?? "", 10);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("--height must be a positive integer");
      }
      parsed.height = value;
      i += 1;
      continue;
    }
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown arg: ${arg}`);
  }
  return parsed;
}

function printHelp() {
  console.log("AI background seeder");
  console.log("Usage:");
  console.log("  pnpm --filter dopeshot-app exec tsx scripts/seed-ai-backgrounds.ts");
  console.log("  pnpm --filter dopeshot-app exec tsx scripts/seed-ai-backgrounds.ts # orchestrated");
  console.log("  pnpm --filter dopeshot-app exec tsx scripts/seed-ai-backgrounds.ts --count 100");
  console.log(
    "  pnpm --filter dopeshot-app exec tsx scripts/seed-ai-backgrounds.ts --personality kawaii --count 12",
  );
  console.log(
    "  pnpm --filter dopeshot-app exec tsx scripts/seed-ai-backgrounds.ts --model jyoung105/sdxl-turbo",
  );
  console.log(
    "  pnpm --filter dopeshot-app exec tsx scripts/seed-ai-backgrounds.ts --model aolaru/abstract-flux-backgrounds --width 1440 --height 810",
  );
}

function resolveAppRoot() {
  const cwd = process.cwd();
  const marker = `${path.sep}apps${path.sep}app`;
  return cwd.endsWith(marker) ? cwd : path.join(cwd, "apps", "app");
}

async function loadPromptPack(filePath: string): Promise<PromptPack> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as PromptPack;
}

async function loadSeedManifest(filePath: string): Promise<SeedManifest> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as SeedManifest;
    if (!parsed || !Array.isArray(parsed.items)) {
      return { version: 1, generatedAt: new Date().toISOString(), items: [] };
    }
    return parsed;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") {
      return { version: 1, generatedAt: new Date().toISOString(), items: [] };
    }
    throw error;
  }
}

async function saveSeedManifest(filePath: string, manifest: SeedManifest) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(manifest, null, 2));
}

function createRepeatState({
  manifest,
  config,
}: {
  manifest: SeedManifest;
  config?: RepeatAvoidanceConfig;
}): RepeatState {
  const enabled = config?.enabled ?? true;
  const lookback = Math.max(0, config?.lookback ?? DEFAULT_REPEAT_LOOKBACK);
  const maxRetries = Math.max(0, config?.maxRetries ?? DEFAULT_REPEAT_MAX_RETRIES);
  const signatures = new Set<string>();

  if (!enabled || lookback === 0) {
    return { enabled: false, signatures, maxRetries };
  }

  const items = manifest.items.slice(-lookback);
  for (const item of items) {
    signatures.add(buildPromptSignature(item.personality, item.prompt));
  }

  return { enabled: true, signatures, maxRetries };
}

function buildPromptSignature(personality: string, prompt: string) {
  return `${personality}::${prompt}`;
}

function pickPromptWithAvoidance({
  buildPrompt,
  personality,
  repeatState,
}: {
  buildPrompt: () => string;
  personality: string;
  repeatState: RepeatState;
}) {
  let prompt = buildPrompt();
  if (!repeatState.enabled) {
    return prompt;
  }
  let signature = buildPromptSignature(personality, prompt);
  let attempts = 0;
  while (repeatState.signatures.has(signature) && attempts < repeatState.maxRetries) {
    prompt = buildPrompt();
    signature = buildPromptSignature(personality, prompt);
    attempts += 1;
  }
  repeatState.signatures.add(signature);
  return prompt;
}

function buildJobs({
  count,
  personalities,
  promptPack,
  basePrompt,
  repeatState,
}: {
  count: number;
  personalities: string[];
  promptPack: PromptPack;
  basePrompt: string;
  repeatState: RepeatState;
}): SeedJob[] {
  const jobs: SeedJob[] = [];
  const available = personalities.filter((personality) =>
    Array.isArray(promptPack.personalityPrompts?.[personality]),
  );

  if (available.length === 0) return jobs;

  const perPersonality = Math.ceil(count / available.length);

  for (const personality of available) {
    const buildPrompt = createPromptBuilder({
      personality,
      promptPack,
      basePrompt,
    });
    const prompts = promptPack.personalityPrompts?.[personality] ?? [];
    if (prompts.length === 0) continue;
    for (let i = 0; i < perPersonality; i += 1) {
      const prompt = pickPromptWithAvoidance({
        buildPrompt,
        personality,
        repeatState,
      });
      jobs.push({
        personality,
        seed: randomSeed(),
        prompt,
      });
    }
  }

  return jobs.slice(0, count);
}

function randomSeed() {
  return Math.floor(Math.random() * 2147483647) + 1;
}

function createPromptBuilder({
  personality,
  promptPack,
  basePrompt,
}: {
  personality: string;
  promptPack: PromptPack;
  basePrompt: string;
}) {
  const basePrompts = promptPack.personalityPrompts?.[personality] ?? [];
  let baseQueue = shuffle(basePrompts);
  let baseIndex = 0;

  const globalVariants = promptPack.promptVariants ?? [];
  const personalityVariants = promptPack.personalityVariants?.[personality] ?? [];
  const variantPool = [...globalVariants, ...personalityVariants];
  const variantsPerPrompt =
    promptPack.variantsPerPrompt ?? DEFAULT_VARIANTS_PER_PROMPT;

  const nextBase = () => {
    if (basePrompts.length === 0) return "";
    if (baseIndex >= baseQueue.length) {
      baseQueue = shuffle(basePrompts);
      baseIndex = 0;
    }
    const next = baseQueue[baseIndex] ?? basePrompts[0] ?? "";
    baseIndex += 1;
    return next;
  };

  return () => {
    const base = nextBase();
    const pickedVariants =
      variantPool.length > 0 && variantsPerPrompt > 0
        ? sampleUnique(variantPool, variantsPerPrompt)
        : [];
    const parts = [basePrompt, base, ...pickedVariants].filter(Boolean);
    return parts.join(", ");
  };
}

function sampleUnique<T>(items: T[], count: number) {
  if (count <= 0) return [];
  if (items.length <= count) return shuffle(items);
  const pool = shuffle(items);
  return pool.slice(0, count);
}

async function runOrchestration({
  promptPack,
  seedManifestPath,
  basePrompt,
  negativePrompt,
}: {
  promptPack: PromptPack;
  seedManifestPath: string;
  basePrompt: string;
  negativePrompt: string;
}) {
  const orchestration = promptPack.orchestration;
  const models = orchestration?.models?.filter((model) => model.enabled !== false) ?? [];
  if (models.length === 0) {
    console.error("No orchestration models configured. Add orchestration.models to prompt-pack.json.");
    process.exit(1);
  }

  const personalities = Object.keys(promptPack.personalityPrompts ?? {});
  if (personalities.length === 0) {
    console.error("No personalities configured in prompt-pack.json.");
    process.exit(1);
  }

  const manifest = await loadSeedManifest(seedManifestPath);
  const repeatState = createRepeatState({
    manifest,
    config: promptPack.repeatAvoidance,
  });

  const underrepresentedConfig = orchestration?.underrepresented;
  let publishedCounts: Map<string, number> | null = null;
  let underrepresented = new Set<string>();

  if (underrepresentedConfig?.enabled !== false) {
    if (underrepresentedConfig?.personalities?.length) {
      underrepresented = new Set(underrepresentedConfig.personalities);
      console.log(
        `Underrepresented boost (manual): ${Array.from(underrepresented).join(", ")}`,
      );
    } else {
      publishedCounts = await loadPublishedCounts(personalities);
      if (publishedCounts) {
        underrepresented = resolveUnderrepresented({
          personalities,
          counts: publishedCounts,
          config: underrepresentedConfig,
        });

        if (underrepresented.size > 0) {
          const summary = personalities
            .map((personality) => `${personality}:${publishedCounts.get(personality) ?? 0}`)
            .join(", ");
          console.log(`Published counts: ${summary}`);
          console.log(`Underrepresented boost: ${Array.from(underrepresented).join(", ")}`);
        } else {
          console.log("Published counts are balanced. Underrepresented boost disabled.");
        }
      } else {
        const fallback =
          underrepresentedConfig?.fallbackPersonalities?.length
            ? underrepresentedConfig.fallbackPersonalities
            : [];
        if (fallback.length > 0) {
          underrepresented = new Set(fallback);
          console.log(
            `Underrepresented boost (fallback): ${Array.from(underrepresented).join(", ")}`,
          );
        } else {
          console.log("Skipping underrepresented boost (no database counts available).");
        }
      }
    }
  }
  let totalSaved = 0;
  let totalFailed = 0;

  for (const modelConfig of models) {
    const provider = modelConfig.provider ?? promptPack.provider ?? DEFAULT_PROVIDER;
    const model = modelConfig.model;
    if (!model) {
      console.warn("Skipping model without name.");
      continue;
    }

    const countPerPersonality =
      modelConfig.countPerPersonality ??
      orchestration?.countPerPersonality ??
      DEFAULT_ORCHESTRATION_COUNT_PER_PERSONALITY;
    if (countPerPersonality <= 0) {
      console.warn(`Skipping ${model} (countPerPersonality <= 0).`);
      continue;
    }

    let widthPx = modelConfig.widthPx ?? promptPack.widthPx ?? DEFAULT_WIDTH;
    let heightPx = modelConfig.heightPx ?? promptPack.heightPx ?? DEFAULT_HEIGHT;

    const jobs = buildJobsForModel({
      personalities,
      promptPack,
      basePrompt,
      countPerPersonality,
      underrepresented,
      underrepresentedBonus:
        orchestration?.underrepresented?.bonusPerPersonality ?? DEFAULT_UNDERREPRESENTED_BONUS,
      repeatState,
    });

    if (jobs.length === 0) {
      console.warn(`No jobs for model ${model}.`);
      continue;
    }

    console.log(
      `Model ${model} (${widthPx}x${heightPx}) -> ${jobs.length} jobs`,
    );

    let saved = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        const result = await generateImageWithFallback({
          provider,
          model,
          prompt: job.prompt,
          negativePrompt,
          widthPx,
          heightPx,
          seed: job.seed,
        });

        if (result.widthPx !== widthPx || result.heightPx !== heightPx) {
          widthPx = result.widthPx;
          heightPx = result.heightPx;
        }

        const item: SeedItem = {
          id: `seed_${randomUUID()}`,
          personality: job.personality,
          prompt: job.prompt,
          seed: job.seed,
          provider,
          model,
          imageUrl: result.imageUrl,
          widthPx: result.widthPx,
          heightPx: result.heightPx,
          createdAt: new Date().toISOString(),
        };

        manifest.items.push(item);
        manifest.generatedAt = new Date().toISOString();
        await saveSeedManifest(seedManifestPath, manifest);
        saved += 1;
        totalSaved += 1;
        console.log(`Saved ${item.id}`);
      } catch (error) {
        failed += 1;
        totalFailed += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Failed ${job.personality} seed ${job.seed} (${model}): ${message}`);
      }
    }

    console.log(`Model ${model} done. saved=${saved} failed=${failed}`);
  }

  console.log(
    `Done. Saved ${totalSaved} seeds (${totalFailed} failed). Wrote to ${seedManifestPath}`,
  );
}

function buildJobsForModel({
  personalities,
  promptPack,
  basePrompt,
  countPerPersonality,
  underrepresented,
  underrepresentedBonus,
  repeatState,
}: {
  personalities: string[];
  promptPack: PromptPack;
  basePrompt: string;
  countPerPersonality: number;
  underrepresented: Set<string>;
  underrepresentedBonus: number;
  repeatState: RepeatState;
}): SeedJob[] {
  const jobs: SeedJob[] = [];
  const available = personalities.filter((personality) =>
    Array.isArray(promptPack.personalityPrompts?.[personality]),
  );

  for (const personality of available) {
    const buildPrompt = createPromptBuilder({
      personality,
      promptPack,
      basePrompt,
    });
    const prompts = promptPack.personalityPrompts?.[personality] ?? [];
    if (prompts.length === 0) continue;
    const bonus = underrepresented.has(personality) ? underrepresentedBonus : 0;
    const total = Math.max(0, countPerPersonality + bonus);
    if (total === 0) continue;

    for (let i = 0; i < total; i += 1) {
      const prompt = pickPromptWithAvoidance({
        buildPrompt,
        personality,
        repeatState,
      });
      jobs.push({
        personality,
        seed: randomSeed(),
        prompt,
      });
    }
  }

  return jobs;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function loadPublishedCounts(personalities: string[]) {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    try {
      const rows = await prisma.aiBackground.groupBy({
        by: ["personality"],
        where: { status: "published" },
        _count: { _all: true },
      });
      const counts = new Map<string, number>();
      for (const personality of personalities) {
        counts.set(personality, 0);
      }
      for (const row of rows) {
        counts.set(row.personality, row._count._all);
      }
      return counts;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Could not load published counts: ${message}`);
    return null;
  }
}

function resolveUnderrepresented({
  personalities,
  counts,
  config,
}: {
  personalities: string[];
  counts: Map<string, number> | null;
  config?: OrchestrationUnderrepresented;
}) {
  const enabled = config?.enabled ?? true;
  if (!enabled || !counts) return new Set<string>();

  const entries = personalities.map((personality) => ({
    personality,
    count: counts.get(personality) ?? 0,
  }));
  const max = Math.max(...entries.map((entry) => entry.count));
  const min = Math.min(...entries.map((entry) => entry.count));
  if (max === min) return new Set<string>();

  const topN = Math.max(1, config?.topN ?? DEFAULT_UNDERREPRESENTED_TOP_N);
  const sorted = [...entries].sort((a, b) => a.count - b.count);
  return new Set(sorted.slice(0, topN).map((entry) => entry.personality));
}

async function generateImageWithFallback({
  provider,
  model,
  prompt,
  negativePrompt,
  widthPx,
  heightPx,
  seed,
}: {
  provider: string;
  model: string;
  prompt: string;
  negativePrompt: string;
  widthPx: number;
  heightPx: number;
  seed: number;
}) {
  try {
    const imageUrl = await generateImage({
      provider,
      model,
      prompt,
      negativePrompt,
      widthPx,
      heightPx,
      seed,
    });
    return { imageUrl, widthPx, heightPx };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const constrained = constrainDimensions({ widthPx, heightPx, message });
    if (!constrained) {
      throw error;
    }
    if (constrained.widthPx === widthPx && constrained.heightPx === heightPx) {
      throw error;
    }
    console.warn(
      `Retrying with ${constrained.widthPx}x${constrained.heightPx} after constraint: ${message}`,
    );
    const imageUrl = await generateImage({
      provider,
      model,
      prompt,
      negativePrompt,
      widthPx: constrained.widthPx,
      heightPx: constrained.heightPx,
      seed,
    });
    return { imageUrl, widthPx: constrained.widthPx, heightPx: constrained.heightPx };
  }
}

function constrainDimensions({
  widthPx,
  heightPx,
  message,
}: {
  widthPx: number;
  heightPx: number;
  message: string;
}) {
  const widthMatch = message.match(/input\\.width: Must be less than or equal to (\\d+)/);
  const heightMatch = message.match(/input\\.height: Must be less than or equal to (\\d+)/);
  const widthDivisibleMatch = message.match(/width must be divisible by (\\d+)/i);
  const heightDivisibleMatch = message.match(/height must be divisible by (\\d+)/i);
  const widthMultipleMatch = message.match(/input\\.width: Must be a multiple of (\\d+)/i);
  const heightMultipleMatch = message.match(/input\\.height: Must be a multiple of (\\d+)/i);
  const widthAllowedMatch = message.match(
    /input\\.width: .*?one of the following: ([\\d,\\s]+)/i,
  );
  const heightAllowedMatch = message.match(
    /input\\.height: .*?one of the following: ([\\d,\\s]+)/i,
  );

  if (
    !widthMatch &&
    !heightMatch &&
    !widthDivisibleMatch &&
    !heightDivisibleMatch &&
    !widthMultipleMatch &&
    !heightMultipleMatch &&
    !widthAllowedMatch &&
    !heightAllowedMatch
  ) {
    return null;
  }

  let maxWidth = widthPx;
  let maxHeight = heightPx;
  if (widthMatch) {
    maxWidth = Number.parseInt(widthMatch[1] ?? "", 10);
  }
  if (heightMatch) {
    maxHeight = Number.parseInt(heightMatch[1] ?? "", 10);
  }

  if (!Number.isFinite(maxWidth) || !Number.isFinite(maxHeight)) return null;

  let nextWidth = widthPx;
  let nextHeight = heightPx;

  if (widthMatch || heightMatch) {
    const ratio = Math.min(maxWidth / widthPx, maxHeight / heightPx);
    if (!Number.isFinite(ratio) || ratio <= 0) return null;
    nextWidth = Math.max(1, Math.floor(widthPx * ratio));
    nextHeight = Math.max(1, Math.floor(heightPx * ratio));
  }

  const widthMultiple =
    widthDivisibleMatch?.[1] ?? widthMultipleMatch?.[1] ?? null;
  const heightMultiple =
    heightDivisibleMatch?.[1] ?? heightMultipleMatch?.[1] ?? null;

  if (widthMultiple) {
    const multiple = Number.parseInt(widthMultiple, 10);
    if (Number.isFinite(multiple) && multiple > 0) {
      nextWidth = roundToMultiple(nextWidth, multiple);
    }
  }

  if (heightMultiple) {
    const multiple = Number.parseInt(heightMultiple, 10);
    if (Number.isFinite(multiple) && multiple > 0) {
      nextHeight = roundToMultiple(nextHeight, multiple);
    }
  }

  const allowedWidths = widthAllowedMatch ? parseAllowedList(widthAllowedMatch[1]) : null;
  const allowedHeights = heightAllowedMatch ? parseAllowedList(heightAllowedMatch[1]) : null;

  if (allowedWidths?.length || allowedHeights?.length) {
    if (allowedWidths?.length && allowedHeights?.length) {
      const targetRatio = widthPx / heightPx;
      const choice = pickAllowedPair({
        widths: allowedWidths,
        heights: allowedHeights,
        targetRatio,
        targetWidth: nextWidth,
        targetHeight: nextHeight,
      });
      nextWidth = choice.width;
      nextHeight = choice.height;
    } else if (allowedWidths?.length) {
      nextWidth = pickClosest(allowedWidths, nextWidth);
    } else if (allowedHeights?.length) {
      nextHeight = pickClosest(allowedHeights, nextHeight);
    }
  }

  return {
    widthPx: Math.max(1, nextWidth),
    heightPx: Math.max(1, nextHeight),
  };
}

function roundToMultiple(value: number, multiple: number) {
  const rounded = Math.round(value / multiple) * multiple;
  if (rounded <= 0) return multiple;
  return rounded;
}

function parseAllowedList(raw: string) {
  return raw
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function pickClosest(values: number[], target: number) {
  let best = values[0] ?? target;
  let bestDiff = Math.abs(best - target);
  for (const value of values) {
    const diff = Math.abs(value - target);
    if (diff < bestDiff) {
      best = value;
      bestDiff = diff;
    } else if (diff === bestDiff && value > best) {
      best = value;
    }
  }
  return best;
}

function pickAllowedPair({
  widths,
  heights,
  targetRatio,
  targetWidth,
  targetHeight,
}: {
  widths: number[];
  heights: number[];
  targetRatio: number;
  targetWidth: number;
  targetHeight: number;
}) {
  let bestWidth = widths[0] ?? targetWidth;
  let bestHeight = heights[0] ?? targetHeight;
  let bestRatioDiff = Math.abs(bestWidth / bestHeight - targetRatio);
  let bestSizeDiff = Math.abs(bestWidth - targetWidth) + Math.abs(bestHeight - targetHeight);

  for (const width of widths) {
    for (const height of heights) {
      const ratioDiff = Math.abs(width / height - targetRatio);
      const sizeDiff = Math.abs(width - targetWidth) + Math.abs(height - targetHeight);
      if (ratioDiff < bestRatioDiff) {
        bestWidth = width;
        bestHeight = height;
        bestRatioDiff = ratioDiff;
        bestSizeDiff = sizeDiff;
      } else if (ratioDiff === bestRatioDiff) {
        if (sizeDiff < bestSizeDiff) {
          bestWidth = width;
          bestHeight = height;
          bestSizeDiff = sizeDiff;
        } else if (sizeDiff === bestSizeDiff) {
          const bestArea = bestWidth * bestHeight;
          const area = width * height;
          if (area > bestArea) {
            bestWidth = width;
            bestHeight = height;
          }
        }
      }
    }
  }

  return { width: bestWidth, height: bestHeight };
}

async function generateImage({
  provider,
  model,
  prompt,
  negativePrompt,
  widthPx,
  heightPx,
  seed,
}: {
  provider: string;
  model: string;
  prompt: string;
  negativePrompt: string;
  widthPx: number;
  heightPx: number;
  seed: number;
}) {
  if (provider === "replicate") {
    return runReplicate({ model, prompt, negativePrompt, widthPx, heightPx, seed });
  }
  throw new Error(`Unsupported provider: ${provider}`);
}

async function runReplicate({
  model,
  prompt,
  negativePrompt,
  widthPx,
  heightPx,
  seed,
}: {
  model: string;
  prompt: string;
  negativePrompt: string;
  widthPx: number;
  heightPx: number;
  seed: number;
}) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("REPLICATE_API_TOKEN is not set");
  }

  const { modelName, versionOverride } = parseModelVersion(model);
  const version = versionOverride ?? (await resolveReplicateVersion({ token, model: modelName }));

  const input = buildReplicateInput({
    model: modelName,
    prompt,
    negativePrompt,
    widthPx,
    heightPx,
    seed,
  });

  const prediction = await replicateRequest({
    token,
    path: "/v1/predictions",
    method: "POST",
    body: {
      version,
      input,
    },
  });

  const pollUrl = prediction?.urls?.get ?? `/v1/predictions/${prediction.id}`;
  const startedAt = Date.now();

  while (true) {
    const result = await replicateRequest({ token, path: pollUrl, method: "GET" });
    if (result.status === "succeeded") {
      const output = result.output;
      if (Array.isArray(output)) {
        if (!output[0]) throw new Error("Missing output image URL");
        return output[0] as string;
      }
      if (typeof output === "string") {
        return output;
      }
      throw new Error("Unexpected output format from Replicate");
    }
    if (result.status === "failed" || result.status === "canceled") {
      throw new Error(result.error ?? "Replicate generation failed");
    }
    if (Date.now() - startedAt > DEFAULT_TIMEOUT_MS) {
      throw new Error("Replicate generation timed out");
    }
    await sleep(DEFAULT_POLL_INTERVAL_MS);
  }
}

function buildReplicateInput({
  model,
  prompt,
  negativePrompt,
  widthPx,
  heightPx,
  seed,
}: {
  model: string;
  prompt: string;
  negativePrompt: string;
  widthPx: number;
  heightPx: number;
  seed: number;
}) {
  const input: Record<string, unknown> = {
    prompt,
    width: widthPx,
    height: heightPx,
    seed,
  };

  if (supportsNegativePrompt(model) && negativePrompt) {
    input.negative_prompt = negativePrompt;
  }

  if (isPrunaPImage(model)) {
    input.aspect_ratio = "custom";
  }

  if (isPrunaZImage(model)) {
    input.guidance_scale = 0;
    input.num_inference_steps = 8;
  }

  return input;
}

function supportsNegativePrompt(model: string) {
  if (isFluxModel(model)) return false;
  if (isPrunaPImage(model)) return false;
  if (isPrunaZImage(model)) return false;
  return true;
}

function isFluxModel(model: string) {
  return model.includes("flux");
}

function isPrunaPImage(model: string) {
  return model.startsWith("prunaai/p-image");
}

function isPrunaZImage(model: string) {
  return model.startsWith("prunaai/z-image-turbo");
}

function parseModelVersion(model: string) {
  const [owner, rawName] = model.split("/");
  if (!owner || !rawName) {
    throw new Error(`Invalid model name: ${model}`);
  }
  const [name, versionOverride] = rawName.split(":");
  return {
    modelName: `${owner}/${name}`,
    versionOverride: versionOverride || null,
  };
}

async function resolveReplicateVersion({ token, model }: { token: string; model: string }) {
  const [owner, name] = model.split("/");
  if (!owner || !name) {
    throw new Error(`Invalid model name: ${model}`);
  }
  const response = await replicateRequest({
    token,
    path: `/v1/models/${owner}/${name}`,
    method: "GET",
  });
  if (!response?.latest_version?.id) {
    throw new Error("Could not resolve model version");
  }
  return response.latest_version.id as string;
}

async function replicateRequest({
  token,
  path: requestPath,
  method,
  body,
}: {
  token: string;
  path: string;
  method: "GET" | "POST";
  body?: Record<string, unknown>;
}) {
  const url = requestPath.startsWith("http")
    ? requestPath
    : `https://api.replicate.com${requestPath}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.detail ?? payload?.error ?? "Replicate request failed";
    throw new Error(message);
  }
  return payload as Record<string, any>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
