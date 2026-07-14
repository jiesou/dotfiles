import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, isAbsolute } from "path";
import { homedir } from "os";

function readFile(path: string): string | null {
  try { return readFileSync(path, "utf-8"); } catch { return null; }
}

function parseConfig(path: string): any {
  const text = readFile(path);
  if (!text) return null;
  try {
    let result = "", inString = false, i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === '"' && (i === 0 || text[i - 1] !== "\\")) { inString = !inString; result += ch; i++; continue; }
      if (!inString && ch === "/" && i + 1 < text.length) {
        if (text[i + 1] === "/") { while (i < text.length && text[i] !== "\n") i++; continue; }
        if (text[i + 1] === "*") { i += 2; while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++; i += 2; continue; }
      }
      result += ch; i++;
    }
    return JSON.parse(result);
  } catch { return null; }
}

function estimateTokens(text: string): number {
  let cn = 0, en = 0;
  for (const ch of text) {
    if (ch > "\u00ff") cn++;
    else if (ch > " " && ch <= "~") en++;
  }
  return Math.max(1, Math.ceil(cn * 0.4 + en * 0.25));
}

function collectFiles(dir: string): { name: string; chars: number; tokens: number }[] {
  if (!existsSync(dir)) return [];
  const items: { name: string; chars: number; tokens: number }[] = [];
  try {
    const entries = readdirSync(dir, { recursive: true }) as string[];
    for (const e of entries) {
      const fp = join(dir, e);
      if (!statSync(fp).isFile()) continue;
      const c = readFile(fp);
      if (c) items.push({ name: e, chars: c.length, tokens: estimateTokens(c) });
    }
  } catch {}
  return items;
}

function collectSkillItems(dirs: string[]): { name: string; chars: number; tokens: number }[] {
  const seen = new Set<string>();
  const agg = new Map<string, { chars: number; tokens: number }>();
  for (const dir of dirs) {
    if (!existsSync(dir) || seen.has(dir)) continue;
    seen.add(dir);
    let entries: string[] = [];
    try { entries = readdirSync(dir); } catch { continue; }
    for (const e of entries) {
      const fp = join(dir, e);
      if (!statSync(fp).isDirectory()) continue;
      const files = collectFiles(fp);
      const c = files.reduce((s, f) => s + f.chars, 0);
      const t = files.reduce((s, f) => s + f.tokens, 0);
      const existing = agg.get(e);
      if (existing) { existing.chars += c; existing.tokens += t; }
      else agg.set(e, { chars: c, tokens: t });
    }
  }
  return [...agg.entries()].map(([name, v]) => ({ name, chars: v.chars, tokens: v.tokens }));
}

function collectMCPItems(config: any): { name: string; chars: number; tokens: number }[] {
  const items: { name: string; chars: number; tokens: number }[] = [];
  if (!config?.mcp) return items;
  for (const [name, mc] of Object.entries(config.mcp)) {
    const m = mc as any;
    if (m?.command) {
      const s = JSON.stringify(m.command);
      items.push({ name, chars: s.length, tokens: estimateTokens(s) });
    } else if (m?.url) {
      items.push({ name, chars: name.length + m.url.length, tokens: estimateTokens(name + m.url) });
    }
  }
  return items;
}

function collectAgentItems(config: any): { name: string; chars: number; tokens: number }[] {
  if (!config?.agent) return [];
  return Object.entries(config.agent).map(([name, ag]) => {
    const s = JSON.stringify(ag);
    return { name, chars: s.length, tokens: estimateTokens(s) };
  });
}

function collectPluginItems(config: any): { name: string; chars: number; tokens: number }[] {
  const items: { name: string; chars: number; tokens: number }[] = [];
  const plugins = config?.plugin || [];
  for (const p of plugins) {
    if (typeof p === "string") {
      const name = p.split("/").pop() || p;
      let c: string | null = null;
      if (p.startsWith("file://")) c = readFile(p.slice(7));
      items.push({ name, chars: c?.length || name.length + 10, tokens: c ? estimateTokens(c) : 5 });
    } else if (Array.isArray(p)) {
      const s = JSON.stringify(p[1] || {});
      items.push({ name: p[0], chars: s.length, tokens: estimateTokens(s) });
    }
  }
  return items;
}

function collectSkillDirs(config: any): string[] {
  const HOME = homedir();
  const dirs: string[] = [];

  const addIfExists = (d: string) => { if (existsSync(d)) dirs.push(d); };

  addIfExists(join(HOME, ".config", "opencode", "skills"));
  addIfExists(join(HOME, ".agents", "skills"));
  addIfExists(join(HOME, ".claude", "skills"));

  if (config?.skills?.paths) {
    const paths = Array.isArray(config.skills.paths) ? config.skills.paths : [config.skills.paths];
    for (const p of paths) {
      if (typeof p === "string") {
        addIfExists(isAbsolute(p) ? p : join(HOME, ".config", "opencode", p));
      }
    }
  }

  if (config?.skill) {
    const oldPaths = Array.isArray(config.skill) ? config.skill : [config.skill];
    for (const s of oldPaths) {
      const p = typeof s === "string" ? s : s?.path;
      if (p) addIfExists(isAbsolute(p) ? p : join(HOME, ".config", "opencode", p));
    }
  }

  return dirs;
}

function collectEnvironmentItems(config: any): { name: string; chars: number; tokens: number }[] {
  const items: { name: string; chars: number; tokens: number }[] = [];
  const HOME = homedir();

  const addIfFile = (name: string, path: string) => {
    const content = readFile(path);
    if (content) items.push({ name, chars: content.length, tokens: estimateTokens(content) });
  };

  addIfFile("opencode.json", join(HOME, ".config", "opencode", "opencode.json"));

  addIfFile("AGENTS.md", join(HOME, "AGENTS.md"));
  addIfFile("CLAUDE.md", join(HOME, "CLAUDE.md"));
  addIfFile(".claude.json", join(HOME, ".claude.json"));
  addIfFile("CLAUDE.md", join(HOME, ".claude", "CLAUDE.md"));
  addIfFile("AGENTS.md", join(HOME, ".config", "opencode", "AGENTS.md"));
  addIfFile("CLAUDE.md", join(HOME, ".config", "opencode", "CLAUDE.md"));

  if (config?.instructions) {
    const paths = Array.isArray(config.instructions) ? config.instructions : [config.instructions];
    for (const p of paths) {
      if (typeof p !== "string") continue;
      const fp = p.startsWith("/") ? p : join(HOME, p);
      const content = readFile(fp);
      if (content) items.push({ name: `instructions: ${p}`, chars: content.length, tokens: estimateTokens(content) });
    }
  }

  if (config?.references) {
    for (const [key, ref] of Object.entries(config.references)) {
      const r = ref as any;
      if (typeof r === "string") {
        items.push({ name: `ref: ${key}`, chars: r.length, tokens: estimateTokens(r) });
        continue;
      }
      if (r?.path && typeof r.path === "string") {
        const fp = isAbsolute(r.path) ? r.path : join(HOME, r.path);
        const sub = collectFiles(fp);
        for (const s of sub) items.push({ name: `ref: ${key}/${s.name}`, chars: s.chars, tokens: s.tokens });
      }
    }
  }

  return items;
}

function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

function dirSize(dir: string): number {
  if (!existsSync(dir)) return 0;
  let total = 0;
  try {
    const entries = readdirSync(dir, { recursive: true }) as string[];
    for (const e of entries) {
      const fp = join(dir, e);
      if (!statSync(fp).isFile()) continue;
      try { total += statSync(fp).size; } catch {}
    }
  } catch {}
  return total;
}

function pluginInstallSize(): string {
  const HOME = homedir();
  const pluginDir = join(HOME, ".config", "opencode", "plugins");
  if (!existsSync(pluginDir)) return "0";
  let total = 0;
  const items = readdirSync(pluginDir);
  for (const item of items) {
    const fp = join(pluginDir, item);
    if (statSync(fp).isDirectory()) {
      total += dirSize(fp);
    } else if (item.endsWith(".ts") || item.endsWith(".js") || item.endsWith(".json")) {
      total += statSync(fp).size;
    }
  }
  return humanSize(total);
}

type Frag = { kind: string; text: string };
type Item = { name: string; chars: number; tokens: number };
type Cat = { name: string; items: Item[]; chars: number; tokens: number };

const ANCHORS: { re: RegExp; kind: string }[] = [
  { re: /<mcp_instructions>[\s\S]*?<\/mcp_instructions>/g, kind: "MCP" },
  { re: /Skills provide specialized instructions[\s\S]*?<\/available_skills>/g, kind: "Skills" },
  { re: /<available_skills>[\s\S]*?<\/available_skills>/g, kind: "Skills" },
  { re: /<env>[\s\S]*?<\/env>/g, kind: "Environment" },
  {
    re: /Instructions from: [^\n]+\n[\s\S]*?(?=Instructions from: |<mcp_instructions>|Skills provide |<available_skills>|<env>|$)/g,
    kind: "Instructions",
  },
];

function splitFragments(full: string): Frag[] {
  // Collect matched ranges
  const ranges: { start: number; end: number; text: string; kind: string }[] = [];
  for (const a of ANCHORS) {
    const re = new RegExp(a.re.source, a.re.flags.includes("g") ? a.re.flags : a.re.flags + "g");
    let m;
    while ((m = re.exec(full))) {
      // Let non-greedy consume until lookahead end. exec gives match end before the lookahead.
      ranges.push({ start: m.index, end: m.index + m[0].length, text: m[0], kind: a.kind });
    }
  }
  // Merge overlapping ranges, prefer earlier-declared categories (ANCHORS order).
  ranges.sort((x, y) => x.start - y.start || ANCHORS.findIndex(ax => ax.kind === x.kind) - ANCHORS.findIndex(ay => ay.kind === y.kind));
  const kept: typeof ranges = [];
  let lastEnd = 0;
  for (const r of ranges) {
    if (r.start < lastEnd) continue;
    kept.push(r);
    lastEnd = r.end;
  }
  // Build frags interleaving leftover (Base) with kept.
  const frags: Frag[] = [];
  let cursor = 0;
  for (const r of kept) {
    if (r.start > cursor) {
      const slice = full.slice(cursor, r.start);
      if (slice.trim()) frags.push({ kind: "Base", text: slice });
    }
    frags.push({ kind: r.kind, text: r.text });
    cursor = r.end;
  }
  if (cursor < full.length) {
    const slice = full.slice(cursor);
    if (slice.trim()) frags.push({ kind: "Base", text: slice });
  }
  return frags;
}

function extractSkillItems(text: string): Item[] {
  const out: Item[] = [];
  const re = /<skill>\s*<name>([^<]+)<\/name>([\s\S]*?)<\/skill>/g;
  let m;
  while ((m = re.exec(text))) {
    out.push({ name: m[1].trim(), chars: m[0].length, tokens: estimateTokens(m[0]) });
  }
  return out;
}

function extractMcpItems(text: string): Item[] {
  const out: Item[] = [];
  const re = /<server name="([^"]+)">([\s\S]*?)<\/server>/g;
  let m;
  while ((m = re.exec(text))) {
    out.push({ name: m[1].trim(), chars: m[0].length, tokens: estimateTokens(m[0]) });
  }
  // wrapper/header overhead
  const serversChars = out.reduce((s, i) => s + i.chars, 0);
  const overhead = text.length - serversChars;
  if (overhead > 0) out.push({ name: "(mcp_instructions wrapper)", chars: overhead, tokens: estimateTokens(text.slice(0, text.length - serversChars)) });
  return out;
}

function extractInstructionItems(text: string): Item[] {
  const out: Item[] = [];
  const re = /Instructions from: ([^\n]+)\n([\s\S]*?)(?=Instructions from: |$)/g;
  let m;
  while ((m = re.exec(text))) {
    const path = m[1].trim();
    const name = path.split("/").pop() || path;
    out.push({ name, chars: m[0].length, tokens: estimateTokens(m[0]) });
  }
  return out;
}

function extractEnvItems(text: string): Item[] {
  const out: Item[] = [];
  const re = /<env>([\s\S]*?)<\/env>/g;
  let m;
  let inner = "";
  while ((m = re.exec(text))) inner += m[1];
  const lines = inner.split("\n").map(l => l.trim()).filter(Boolean);
  for (const l of lines) {
    const label = l.split(":")[0].trim() || "line";
    out.push({ name: label, chars: l.length, tokens: estimateTokens(l) });
  }
  return out;
}

function extractBaseItems(text: string): Item[] {
  return [{ name: "Base prompt", chars: text.length, tokens: estimateTokens(text) }];
}

function extractItems(kind: string, text: string): Item[] {
  switch (kind) {
    case "MCP": return extractMcpItems(text);
    case "Skills": return extractSkillItems(text);
    case "Instructions": return extractInstructionItems(text);
    case "Environment": return extractEnvItems(text);
    case "Base": return extractBaseItems(text);
    default: return [{ name: "(unknown block)", chars: text.length, tokens: estimateTokens(text) }];
  }
}

export function analyzeSystemPrompt(sections: string[]): string {
  const full = sections.join("\n\n");
  const frags = splitFragments(full);

  const catOrder = ["Base", "Environment", "Skills", "MCP", "Instructions"];
  const catIdx = new Map<string, Cat>();
  for (const name of catOrder) catIdx.set(name, { name, items: [], chars: 0, tokens: 0 });
  catIdx.set("Other", { name: "Other", items: [], chars: 0, tokens: 0 });

  for (const f of frags) {
    const c = catIdx.get(f.kind) || catIdx.get("Other")!;
    const items = extractItems(f.kind, f.text);
    c.items.push(...items);
    c.chars += f.text.length;
    c.tokens += estimateTokens(f.text);
  }

  const rows = catOrder
    .concat("Other")
    .map(n => catIdx.get(n)!)
    .filter(c => c.chars > 0);

  if (!rows.length) return "No analyzable system prompt content found.";

  const totalC = rows.reduce((s, r) => s + r.chars, 0);
  const totalT = rows.reduce((s, r) => s + r.tokens, 0);

  const W = 40;
  let out = "System Context Size Breakdown (live captured prompt)\n";
  out += "═══════════════════════════════════════════════════\n\n";

  for (const r of rows) {
    const pct = totalT > 0 ? (r.tokens / totalT) * 100 : 0;
    const barLen = Math.round((pct / 100) * W);
    const bar = "█".repeat(barLen) + "░".repeat(W - barLen);
    out += `${r.name.padEnd(14)} ${String(r.chars).padStart(7)} chars  ${String(r.tokens).padStart(6)} tok  ${bar} ${pct.toFixed(1)}%\n`;

    if (r.items.length > 1) {
      for (const it of r.items) {
        const ip = totalT > 0 ? (it.tokens / totalT) * 100 : 0;
        out += `  ├─ ${it.name.slice(0, 30).padEnd(30)} ${String(it.chars).padStart(6)} chars  ${String(it.tokens).padStart(6)} tok  ${ip.toFixed(1)}%\n`;
      }
    } else if (r.items.length === 1) {
      const it = r.items[0];
      const ip = totalT > 0 ? (it.tokens / totalT) * 100 : 0;
      out += `  └─ ${it.name.slice(0, 30).padEnd(30)} ${String(it.chars).padStart(6)} chars  ${String(it.tokens).padStart(6)} tok  ${ip.toFixed(1)}%\n`;
    }
    out += "\n";
  }

  out += `${"─".repeat(60)}\n`;
  out += `${"Total"}${" ".repeat(11)}${String(totalC).padStart(7)} chars  ${String(totalT).padStart(6)} tok\n`;
  out += `Sections joined: ${sections.length} (concatenated ${full.length} chars)\n`;
  out += `\nHeuristic: CN chars ×0.4 + EN chars ×0.25. Actual values vary by model.\n`;
  return out;
}

export function generateReport(): string {
  const HOME = homedir();
  const configPath = join(HOME, ".config", "opencode", "opencode.json");
  const config = parseConfig(configPath);
  if (!config) return "Error: could not read opencode config.";

  const allSkillItems = collectSkillItems(collectSkillDirs(config));

  const categories = [
    { name: "Skills", items: allSkillItems },
    { name: "MCP", items: collectMCPItems(config) },
    { name: "Agents", items: collectAgentItems(config) },
    { name: "Plugins", items: collectPluginItems(config) },
    { name: "Environment", items: collectEnvironmentItems(config) },
  ];

  const W = 40;
  let totalC = 0, totalT = 0;
  const rows: { name: string; chars: number; tokens: number }[] = [];

  for (const cat of categories) {
    if (!cat.items.length) continue;
    const c = cat.items.reduce((s, i) => s + i.chars, 0);
    const t = cat.items.reduce((s, i) => s + i.tokens, 0);
    totalC += c; totalT += t;
    rows.push({ name: cat.name, chars: c, tokens: t });
  }

  if (!rows.length) return "No system context categories found.";

  let out = "System Context Size Breakdown\n";
  out += "═══════════════════════════════════════════════════\n\n";

  for (const row of rows) {
    const pct = totalT > 0 ? (row.tokens / totalT) * 100 : 0;
    const barLen = Math.round((pct / 100) * W);
    const bar = "█".repeat(barLen) + "░".repeat(W - barLen);
    out += `${row.name.padEnd(12)} ${String(row.chars).padStart(7)} chars  ${String(row.tokens).padStart(6)} tok  ${bar} ${pct.toFixed(1)}%\n`;

    const cat = categories.find((c) => c.name === row.name);
    if (cat && cat.items.length > 1) {
      for (const item of cat.items) {
        const ip = totalT > 0 ? (item.tokens / totalT) * 100 : 0;
        out += `  ├─ ${item.name.slice(0, 30).padEnd(30)} ${String(item.chars).padStart(6)} chars  ${String(item.tokens).padStart(6)} tok  ${ip.toFixed(1)}%\n`;
      }
    }

    out += "\n";
  }

  out += `${"─".repeat(56)}\n`;
  out += `Total${" ".repeat(8)} ${String(totalC).padStart(7)} chars  ${String(totalT).padStart(6)} tok\n`;
  out += `Plugin install size: ${pluginInstallSize()}\n`;
  out += "\nHeuristic: CN chars ×0.4 + EN chars ×0.25. Actual values vary by model.\n";
  return out;
}
