#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

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
    console.log(`✓ Updated: ${filePath}`);
  }
}

function scanDir(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      scanDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      updateImports(fullPath);
    }
  }
}

console.log('Updating imports...\n');

const dirsToScan = ['src', 'tests'];
for (const dir of dirsToScan) {
  if (fs.existsSync(dir)) {
    scanDir(dir);
  }
}

console.log('\n✅ Import updates complete!');
