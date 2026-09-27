import { mkdir, readdir, readFile, writeFile, unlink, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { sanitizeSpaceCode } from "./space-code";

const DATA_ROOT = resolve(process.cwd(), "data", "spaces");

export type ResumeSummary = {
  id: string;
  title: string;
  templateId?: string;
  createdAt?: string;
  updatedAt?: string;
};

function assertSafeId(id: string): string {
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(id)) {
    throw new Error("INVALID_RESUME_ID");
  }
  return id;
}

function spaceDir(code: string): string {
  const safe = sanitizeSpaceCode(code);
  if (!safe) throw new Error("INVALID_SPACE_CODE");
  const dir = resolve(DATA_ROOT, safe);
  if (!dir.startsWith(DATA_ROOT)) throw new Error("INVALID_SPACE_CODE");
  return dir;
}

function resumePath(code: string, id: string): string {
  return join(spaceDir(code), `${assertSafeId(id)}.json`);
}

async function ensureSpace(code: string): Promise<string> {
  const dir = spaceDir(code);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function listResumes(code: string): Promise<ResumeSummary[]> {
  const dir = await ensureSpace(code);
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  const summaries: ResumeSummary[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await readFile(join(dir, file), "utf8");
      const data = JSON.parse(raw);
      summaries.push({
        id: data.id || file.replace(/\.json$/, ""),
        title: data.title || "Untitled",
        templateId: data.templateId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    } catch {
      // skip corrupt files
    }
  }
  summaries.sort((a, b) => {
    const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return tb - ta;
  });
  return summaries;
}

export async function listResumeData(code: string): Promise<Record<string, unknown>> {
  const dir = await ensureSpace(code);
  const files = await readdir(dir);
  const map: Record<string, unknown> = {};
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await readFile(join(dir, file), "utf8");
      const data = JSON.parse(raw);
      if (data && typeof data === "object" && data.id) {
        map[data.id] = data;
      }
    } catch {
      // skip
    }
  }
  return map;
}

export async function getResume(code: string, id: string): Promise<unknown | null> {
  const path = resumePath(code, id);
  if (!existsSync(path)) return null;
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

export async function upsertResume(code: string, id: string, data: unknown): Promise<void> {
  await ensureSpace(code);
  const path = resumePath(code, id);
  const payload =
    data && typeof data === "object"
      ? { ...(data as object), id, updatedAt: new Date().toISOString() }
      : { id, updatedAt: new Date().toISOString() };
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(payload, null, 2), "utf8");
  await rename(tmp, path);
}

export async function deleteResume(code: string, id: string): Promise<boolean> {
  const path = resumePath(code, id);
  if (!existsSync(path)) return false;
  await unlink(path);
  return true;
}

export async function createResume(code: string, data: Record<string, unknown>): Promise<string> {
  const id =
    typeof data.id === "string" && /^[a-zA-Z0-9_-]{8,128}$/.test(data.id)
      ? data.id
      : crypto.randomUUID();
  const now = new Date().toISOString();
  await upsertResume(code, id, {
    ...data,
    id,
    createdAt: data.createdAt || now,
    updatedAt: now,
  });
  return id;
}
