/**
 * Detect programming language from code content using simple heuristics
 * Fallback: returns 'text' if no match found
 */
export function detectLanguage(code: string): string {
  const trimmed = code.trim();

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
