const COLOR_MAP: Record<string, string> = {
  "slate-50": "rgb(248 250 252)",
  "slate-100": "rgb(241 245 249)",
  "slate-200": "rgb(226 232 240)",
  "slate-300": "rgb(203 213 225)",
  "slate-500": "rgb(100 116 139)",
  "slate-600": "rgb(71 85 105)",
  "slate-800": "rgb(30 41 59)",
  "slate-900": "rgb(15 23 42)",
  "zinc-50": "rgb(250 250 250)",
  "zinc-200": "rgb(228 228 231)",
  "zinc-900": "rgb(24 24 27)",
  "indigo-50": "rgb(238 242 255)",
  "indigo-400": "rgb(129 140 248)",
  "indigo-950": "rgb(23 37 84)",
  "violet-400": "rgb(167 139 250)",
  "violet-500": "rgb(139 92 246)",
};

const TEXT_CLASS_MAP: Record<string, string> = {
  "slate-50": "text-slate-50",
  "slate-100": "text-slate-100",
  "slate-200": "text-slate-200",
  "slate-300": "text-slate-300",
  "slate-500": "text-slate-500",
  "slate-600": "text-slate-600",
  "slate-800": "text-slate-800",
  "slate-900": "text-slate-900",
  "zinc-50": "text-zinc-50",
  "zinc-200": "text-zinc-200",
  "zinc-900": "text-zinc-900",
  "indigo-50": "text-indigo-50",
  "indigo-400": "text-indigo-400",
  "indigo-950": "text-indigo-950",
  "violet-400": "text-violet-400",
  "violet-500": "text-violet-500",
};

export function tokenToCssColor(token: string): string {
  return COLOR_MAP[token] || "rgb(248 250 252)";
}

export function tokenToTextColorClass(token: string): string {
  return TEXT_CLASS_MAP[token] || "text-slate-900";
}
