import type { ResumeData } from "@/types/resume";

export type SpaceEnterResult = {
  ok: boolean;
  code?: string;
  resumeData?: Record<string, ResumeData>;
  error?: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new Error("INVALID_RESPONSE");
  }
}

export async function enterSpace(code: string): Promise<SpaceEnterResult> {
  const res = await fetch("/api/space/enter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code }),
  });
  const data = await parseJson<SpaceEnterResult>(res);
  if (!res.ok) return { ok: false, error: data.error || "ENTER_FAILED" };
  return data;
}

export async function leaveSpace(): Promise<void> {
  await fetch("/api/space/leave", {
    method: "POST",
    credentials: "include",
  });
}

export async function fetchSession(): Promise<SpaceEnterResult & { entered?: boolean }> {
  const res = await fetch("/api/space/session", {
    method: "GET",
    credentials: "include",
  });
  if (res.status === 401) return { ok: false, entered: false };
  return parseJson(res);
}

export async function putResume(resume: ResumeData): Promise<void> {
  const res = await fetch(`/api/resumes/${encodeURIComponent(resume.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(resume),
  });
  if (!res.ok) throw new Error("SAVE_FAILED");
}

export async function deleteResumeRemote(id: string): Promise<void> {
  const res = await fetch(`/api/resumes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok && res.status !== 404) throw new Error("DELETE_FAILED");
}

export async function createResumeRemote(resume: ResumeData): Promise<string> {
  const res = await fetch("/api/resumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(resume),
  });
  if (!res.ok) throw new Error("CREATE_FAILED");
  const data = await parseJson<{ id: string }>(res);
  return data.id;
}
