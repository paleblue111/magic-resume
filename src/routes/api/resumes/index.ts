import { createFileRoute } from "@tanstack/react-router";
import { getSpaceCodeFromRequest } from "@/lib/server/space-code";
import {
  createResume,
  listResumeData,
  listResumes,
} from "@/lib/server/space-storage";

export const Route = createFileRoute("/api/resumes/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const code = getSpaceCodeFromRequest(request);
        if (!code) {
          return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        }
        const url = new URL(request.url);
        const full = url.searchParams.get("full") === "1";
        if (full) {
          const resumeData = await listResumeData(code);
          return Response.json({ resumes: resumeData });
        }
        const resumes = await listResumes(code);
        return Response.json({ resumes });
      },
      POST: async ({ request }) => {
        const code = getSpaceCodeFromRequest(request);
        if (!code) {
          return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        }
        let body: Record<string, unknown> = {};
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "INVALID_BODY" }, { status: 400 });
        }
        const id = await createResume(code, body);
        return Response.json({ ok: true, id }, { status: 201 });
      },
    },
  },
});
