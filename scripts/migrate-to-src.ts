#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DRY_RUN = process.argv.includes('--dry-run');

// Color utilities for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step: string) {
  log(`\n${colors.bright}${colors.blue}▶ ${step}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`${colors.green}✓${colors.reset} ${message}`);
}

function logInfo(message: string) {
  log(`  ${colors.cyan}→${colors.reset} ${message}`);
}

function logWarning(message: string) {
  log(`${colors.yellow}⚠${colors.reset} ${message}`, colors.yellow);
}

function logDryRun(message: string) {
  log(`  ${colors.yellow}[DRY RUN]${colors.reset} ${message}`);
}

// File system utilities
function ensureDir(dirPath: string) {
  if (DRY_RUN) {
    logDryRun(`Create directory: ${dirPath}`);
    return;
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

function moveFile(from: string, to: string) {
  if (DRY_RUN) {
    logDryRun(`Move: ${from} → ${to}`);
    return;
  }

  // Ensure destination directory exists
  ensureDir(path.dirname(to));

  if (fs.existsSync(from)) {
    fs.renameSync(from, to);
    logInfo(`Moved: ${from} → ${to}`);
  } else {
    logWarning(`File not found: ${from}`);
  }
}

function moveDirectory(from: string, to: string) {
  if (DRY_RUN) {
    logDryRun(`Move directory: ${from} → ${to}`);
    return;
  }

  if (fs.existsSync(from)) {
    ensureDir(path.dirname(to));
    fs.renameSync(from, to);
    logInfo(`Moved directory: ${from} → ${to}`);
  } else {
    logWarning(`Directory not found: ${from}`);
  }
}

function deleteFile(filePath: string) {
  if (DRY_RUN) {
    logDryRun(`Delete: ${filePath}`);
    return;
  }

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    logInfo(`Deleted: ${filePath}`);
  }
}

function deleteDirectory(dirPath: string) {
  if (DRY_RUN) {
    logDryRun(`Delete directory: ${dirPath}`);
    return;
  }

  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    logInfo(`Deleted directory: ${dirPath}`);
  }
}

// Component file mapping
const componentMoves: Record<string, string> = {
  // Route-specific components → app/(playground)/_components/
  'components/playground-page.tsx': 'src/app/(playground)/_components/playground-page.tsx',
  'components/playground-workspace.tsx': 'src/app/(playground)/_components/playground-workspace.tsx',
  'components/preview-viewport.tsx': 'src/app/(playground)/_components/preview-viewport.tsx',
  'components/drag-overlay.tsx': 'src/app/(playground)/_components/drag-overlay.tsx',

  // Layout chrome → components/layout/
  'components/app-header.tsx': 'src/components/layout/app-header.tsx',
  'components/sidebar-tabs.tsx': 'src/components/layout/sidebar-tabs.tsx',
  'components/mobile-actions.tsx': 'src/components/layout/mobile-actions.tsx',

  // Selectors → components/selectors/
  'components/layout-selector.tsx': 'src/components/selectors/layout-selector.tsx',
  'components/font-selector.tsx': 'src/components/selectors/font-selector.tsx',
  'components/font-style-selector.tsx': 'src/components/selectors/font-style-selector.tsx',
  'components/gradient-picker.tsx': 'src/components/selectors/gradient-picker.tsx',
  'components/screenshot-zoom-slider.tsx': 'src/components/selectors/screenshot-zoom-slider.tsx',

  // Config UI → components/config/
  'components/layout-config.tsx': 'src/components/config/layout-config.tsx',

  // Providers → components/providers/
  'components/theme-provider.tsx': 'src/components/providers/theme-provider.tsx',
  'components/theme-toggle.tsx': 'src/components/providers/theme-toggle.tsx',
  'components/umami-provider.tsx': 'src/components/providers/umami-provider.tsx',

  // Shared utility (stays at components root)
  'components/cover-preview.tsx': 'src/components/cover-preview.tsx',
};

// Import path updates
const importUpdates: Array<{ from: RegExp; to: string }> = [
  // Component relocations
  { from: /from ['"]@\/components\/playground-page['"]/g, to: 'from "@/app/(playground)/_components/playground-page"' },
  { from: /from ['"]@\/components\/playground-workspace['"]/g, to: 'from "@/app/(playground)/_components/playground-workspace"' },
  { from: /from ['"]@\/components\/preview-viewport['"]/g, to: 'from "@/app/(playground)/_components/preview-viewport"' },
  { from: /from ['"]@\/components\/drag-overlay['"]/g, to: 'from "@/app/(playground)/_components/drag-overlay"' },

  { from: /from ['"]@\/components\/app-header['"]/g, to: 'from "@/components/layout/app-header"' },
  { from: /from ['"]@\/components\/sidebar-tabs['"]/g, to: 'from "@/components/layout/sidebar-tabs"' },
  { from: /from ['"]@\/components\/mobile-actions['"]/g, to: 'from "@/components/layout/mobile-actions"' },

  { from: /from ['"]@\/components\/layout-selector['"]/g, to: 'from "@/components/selectors/layout-selector"' },
  { from: /from ['"]@\/components\/font-selector['"]/g, to: 'from "@/components/selectors/font-selector"' },
  { from: /from ['"]@\/components\/font-style-selector['"]/g, to: 'from "@/components/selectors/font-style-selector"' },
  { from: /from ['"]@\/components\/gradient-picker['"]/g, to: 'from "@/components/selectors/gradient-picker"' },
  { from: /from ['"]@\/components\/screenshot-zoom-slider['"]/g, to: 'from "@/components/selectors/screenshot-zoom-slider"' },

  { from: /from ['"]@\/components\/layout-config['"]/g, to: 'from "@/components/config/layout-config"' },

  { from: /from ['"]@\/components\/theme-provider['"]/g, to: 'from "@/components/providers/theme-provider"' },
  { from: /from ['"]@\/components\/theme-toggle['"]/g, to: 'from "@/components/providers/theme-toggle"' },
  { from: /from ['"]@\/components\/umami-provider['"]/g, to: 'from "@/components/providers/umami-provider"' },

  // Sidebar rename
  { from: /from ['"]@\/components\/sidebar-sections\//g, to: 'from "@/components/sidebar/' },

  // Utils relocation
  { from: /from ['"]@\/utils['"]/g, to: 'from "@/lib/utils/cn"' },
];

function updateImports(filePath: string) {
  if (DRY_RUN) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let updated = false;

  for (const { from, to } of importUpdates) {
    if (from.test(content)) {
      content = content.replace(from, to);
      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf-8');
    logInfo(`Updated imports in: ${filePath}`);
  }
}

function updateAllImports() {
  logStep('Updating import paths');

  if (DRY_RUN) {
    logDryRun('Would update imports in all .ts and .tsx files');
    return;
  }

  const extensions = ['.ts', '.tsx'];
  const dirsToScan = ['src', 'tests'];

  for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) continue;

    function scanDir(dirPath: string) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and build directories
          if (entry.name === 'node_modules' || entry.name === '.next') continue;
          scanDir(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          updateImports(fullPath);
        }
      }
    }

    scanDir(dir);
  }
}

function updateTsConfig() {
  logStep('Updating tsconfig.json');

  const tsconfigPath = 'tsconfig.json';

  if (DRY_RUN) {
    logDryRun('Would update tsconfig.json paths to "@/*": ["./src/*"]');
    return;
  }

  // Backup original
  const backupPath = 'tsconfig.json.backup';
  fs.copyFileSync(tsconfigPath, backupPath);
  logInfo(`Created backup: ${backupPath}`);

  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
  tsconfig.compilerOptions.paths = {
    '@/*': ['./src/*']
  };

  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n', 'utf-8');
  logSuccess('Updated tsconfig.json');
}

// Main migration steps
async function main() {
  if (DRY_RUN) {
    log('\n' + colors.yellow + colors.bright + '='.repeat(60), colors.yellow);
    log('DRY RUN MODE - No actual changes will be made', colors.yellow);
    log('='.repeat(60) + colors.reset + '\n', colors.yellow);
  } else {
    log('\n' + colors.bright + '='.repeat(60), colors.bright);
    log('Starting Migration to src/ Structure', colors.bright);
    log('='.repeat(60) + colors.reset + '\n', colors.bright);
  }

  // Step 1: Create src/ directory structure
  logStep('Creating src/ directory structure');
  ensureDir('src');
  ensureDir('src/app/(playground)/_components');
  ensureDir('src/components/layout');
  ensureDir('src/components/selectors');
  ensureDir('src/components/config');
  ensureDir('src/components/providers');
  ensureDir('src/lib/utils');
  ensureDir('src/lib/config');
  logSuccess('Created src/ structure');

  // Step 2: Move component files
  logStep('Moving component files to new locations');
  for (const [from, to] of Object.entries(componentMoves)) {
    moveFile(from, to);
  }
  logSuccess('Component files moved');

  // Step 3: Move entire directories
  logStep('Moving source directories to src/');

  // Move app/ directory
  if (fs.existsSync('app') && !DRY_RUN) {
    // First, move the (playground) route group if it doesn't exist in src yet
    if (!fs.existsSync('src/app')) {
      moveDirectory('app', 'src/app');
    } else {
      logWarning('src/app already exists, skipping app/ move');
    }
  } else if (DRY_RUN) {
    logDryRun('Move directory: app → src/app');
  }

  // Move remaining component subdirectories
  if (fs.existsSync('components') && !DRY_RUN) {
    const componentSubdirs = fs.readdirSync('components', { withFileTypes: true })
      .filter(entry => entry.isDirectory());

    for (const dir of componentSubdirs) {
      const from = path.join('components', dir.name);
      let to: string;

      // Special case: rename sidebar-sections to sidebar
      if (dir.name === 'sidebar-sections') {
        to = 'src/components/sidebar';
        logInfo(`Renaming: ${from} → ${to}`);
      } else {
        to = path.join('src/components', dir.name);
      }

      moveDirectory(from, to);
    }

    // Remove empty components directory
    if (fs.existsSync('components')) {
      const remaining = fs.readdirSync('components');
      if (remaining.length === 0) {
        deleteDirectory('components');
      }
    }
  } else if (DRY_RUN) {
    logDryRun('Move components/ subdirectories to src/components/');
    logDryRun('Rename: components/sidebar-sections → src/components/sidebar');
  }

  // Move domain/
  if (fs.existsSync('domain')) {
    moveDirectory('domain', 'src/domain');
  }

  // Move hooks/
  if (fs.existsSync('hooks')) {
    moveDirectory('hooks', 'src/hooks');
  }

  // Move lib/
  if (fs.existsSync('lib')) {
    moveDirectory('lib', 'src/lib');
  }

  logSuccess('Source directories moved');

  // Step 4: Move utils.ts
  logStep('Moving utils.ts to src/lib/utils/cn.ts');
  if (fs.existsSync('utils.ts')) {
    moveFile('utils.ts', 'src/lib/utils/cn.ts');
    logSuccess('utils.ts moved and renamed');
  } else if (!DRY_RUN) {
    logWarning('utils.ts not found');
  }

  // Step 5: Update tsconfig.json
  updateTsConfig();

  // Step 6: Update imports
  updateAllImports();

  // Step 7: Cleanup operations
  logStep('Cleanup operations');

  // Delete bun.lockb
  deleteFile('bun.lockb');

  // Delete empty domain directories
  deleteDirectory('src/domain/layout/entropy');
  deleteDirectory('src/domain/layout-def/interpretation');
  deleteDirectory('src/domain/layout-def/renderers');

  // Move research/ to docs/research/
  if (fs.existsSync('research')) {
    ensureDir('docs/research');
    const researchFiles = fs.readdirSync('research');
    for (const file of researchFiles) {
      moveFile(path.join('research', file), path.join('docs/research', file));
    }
    deleteDirectory('research');
  }

  logSuccess('Cleanup complete');

  // Final summary
  log('\n' + colors.bright + colors.green + '='.repeat(60), colors.green);
  if (DRY_RUN) {
    log('DRY RUN COMPLETE - Review the operations above', colors.green);
    log('Run without --dry-run to execute the migration', colors.green);
  } else {
    log('MIGRATION COMPLETE!', colors.green);
    log('', colors.green);
    log('Next steps:', colors.green);
    log('  1. Run: pnpm typecheck', colors.reset);
    log('  2. Fix any remaining import issues', colors.reset);
    log('  3. Run: pnpm test:ui && pnpm test:e2e', colors.reset);
    log('  4. Start dev server: pnpm dev', colors.reset);
    log('  5. Test key workflows manually', colors.reset);
  }
  log('='.repeat(60) + colors.reset + '\n', colors.green);
}

main().catch((error) => {
  log(`\n${colors.red}${colors.bright}Error:${colors.reset} ${error.message}`, colors.red);
  process.exit(1);
});
