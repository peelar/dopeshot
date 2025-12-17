/**
 * Detect programming language from code content
 * Detection order: 1) Fenced code hints, 2) Shebangs, 3) Heuristics
 * Fallback: returns 'text' if no match found
 */
export function detectLanguage(code: string): string {
  const trimmed = code.trim();

  // Priority 1: Fenced code block hints (```typescript or ```ts)
  const fencedMatch = trimmed.match(/^```(\w+)/);
  if (fencedMatch) {
    const hint = fencedMatch[1].toLowerCase();
    const normalized = normalizeFencedHint(hint);
    if (normalized) return normalized;
  }

  // Priority 2: Shebang detection (#!/usr/bin/env python)
  const shebangMatch = trimmed.match(/^#!\s*(?:\/usr\/bin\/env\s+)?(\w+)/);
  if (shebangMatch) {
    const shebang = shebangMatch[1].toLowerCase();
    const normalized = normalizeShebang(shebang);
    if (normalized) return normalized;
  }

  // Priority 3: Heuristic detection

  // JavaScript/TypeScript patterns
  if (/^(import|export)\s/.test(trimmed) || /\b(const|let|var)\s+\w+\s*=/.test(trimmed)) {
    if (/:\s*(string|number|boolean|any|void)/.test(trimmed) || /interface\s+\w+/.test(trimmed)) {
      return 'typescript';
    }
    return 'javascript';
  }

  // Python patterns
  if (/^(def|class|import|from)\s/.test(trimmed) || /^\s{0,4}(if|for|while)\s+.*:/.test(trimmed)) {
    return 'python';
  }

  // HTML patterns
  if (/^<!DOCTYPE html>|^<html|^<\w+[^>]*>/.test(trimmed)) {
    return 'html';
  }

  // CSS patterns
  if (/^[.#\w\s]+\{[\s\S]*\}/.test(trimmed) || /@media|@keyframes/.test(trimmed)) {
    return 'css';
  }

  // JSON patterns
  if (/^\{[\s\S]*\}$|^\[[\s\S]*\]$/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // Markdown patterns
  if (/^#{1,6}\s/.test(trimmed) || /\[.*\]\(.*\)/.test(trimmed)) {
    return 'markdown';
  }

  // Java patterns
  if (/\b(public|private|protected)\s+(class|interface|enum)/.test(trimmed)) {
    return 'java';
  }

  // Go patterns
  if (/^package\s+\w+|func\s+\w+\(/.test(trimmed)) {
    return 'go';
  }

  // Rust patterns
  if (/^(use\s+\w+|fn\s+\w+|pub\s+fn)/.test(trimmed) || /\blet\s+mut\s/.test(trimmed)) {
    return 'rust';
  }

  // SQL patterns
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed)) {
    return 'sql';
  }

  // Shell/Bash patterns
  if (/^#!\/bin\/(ba)?sh|^\$\s+/.test(trimmed) || /^(echo|cd|ls|mkdir)\s/.test(trimmed)) {
    return 'bash';
  }

  // Ruby patterns
  if (/^(require|class|module|def)\s/.test(trimmed) || /\bend\s*$/.test(trimmed)) {
    return 'ruby';
  }

  // PHP patterns
  if (/^<\?php/.test(trimmed)) {
    return 'php';
  }

  // C++ patterns
  if (/#include\s*<|using namespace|std::/.test(trimmed)) {
    return 'cpp';
  }

  // C# patterns
  if (/\b(namespace|using)\s+\w+;/.test(trimmed) || /\[[\w.]+\]/.test(trimmed)) {
    return 'csharp';
  }

  // YAML patterns
  if (/^\w+:\s*$|^\s{2,}\w+:/.test(trimmed)) {
    return 'yaml';
  }

  // Default fallback
  return 'text';
}

/**
 * Normalize fenced code block hints to standard language names
 */
function normalizeFencedHint(hint: string): string | null {
  const mappings: Record<string, string> = {
    'ts': 'typescript',
    'js': 'javascript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'cpp': 'cpp',
    'c++': 'cpp',
    'cs': 'csharp',
    'kt': 'kotlin',
    // Direct matches
    'typescript': 'typescript',
    'javascript': 'javascript',
    'python': 'python',
    'java': 'java',
    'go': 'go',
    'rust': 'rust',
    'php': 'php',
    'ruby': 'ruby',
    'swift': 'swift',
    'kotlin': 'kotlin',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'yaml': 'yaml',
    'markdown': 'markdown',
    'sql': 'sql',
    'bash': 'bash',
    'csharp': 'csharp',
  };
  return mappings[hint] || null;
}

/**
 * Normalize shebang interpreter names to language names
 */
function normalizeShebang(interpreter: string): string | null {
  const mappings: Record<string, string> = {
    'python': 'python',
    'python3': 'python',
    'python2': 'python',
    'node': 'javascript',
    'bash': 'bash',
    'sh': 'bash',
    'zsh': 'bash',
    'ruby': 'ruby',
    'php': 'php',
    'perl': 'perl',
  };
  return mappings[interpreter] || null;
}

/**
 * Extract filename from code hints (fenced blocks with filename or comments)
 * Examples: ```typescript:api.ts, // api.ts, # config.py
 */
export function extractFileName(code: string): string | null {
  const trimmed = code.trim();

  // Check for fenced code block with filename (```typescript:api.ts)
  const fencedWithFile = trimmed.match(/^```\w+:(.+)/);
  if (fencedWithFile) {
    return fencedWithFile[1].trim();
  }

  // Check for leading comment with filename pattern
  const lines = trimmed.split('\n');
  const firstLine = lines[0];

  // JavaScript/TypeScript/CSS style comments: // api.ts
  const slashComment = firstLine.match(/^\/\/\s*(.+\.\w+)\s*$/);
  if (slashComment) {
    const fileName = slashComment[1].trim();
    if (isValidFileName(fileName)) return fileName;
  }

  // Python/Bash/Ruby style comments: # config.py
  const hashComment = firstLine.match(/^#\s*(.+\.\w+)\s*$/);
  if (hashComment) {
    const fileName = hashComment[1].trim();
    if (isValidFileName(fileName)) return fileName;
  }

  return null;
}

/**
 * Validate if a string looks like a filename
 */
function isValidFileName(str: string): boolean {
  // Must have extension, reasonable length, no weird characters
  return /^[\w.-]{1,100}\.[\w]{1,10}$/.test(str);
}
