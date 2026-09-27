import { createFileRoute } from "@tanstack/react-router";
import { getSpaceCodeFromRequest } from "@/lib/server/space-code";
import {
  deleteResume,
  getResume,
  upsertResume,
} from "@/lib/server/space-storage";

export const Route = createFileRoute("/api/resumes/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const code = getSpaceCodeFromRequest(request);
        if (!code) {
          return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        }
        try {
          const resume = await getResume(code, params.id);
          if (!resume) {
            return Response.json({ error: "NOT_FOUND" }, { status: 404 });
          }
          return Response.json({ resume });
        } catch {
          return Response.json({ error: "INVALID_ID" }, { status: 400 });
        }
      },
      PUT: async ({ request, params }) => {
        const code = getSpaceCodeFromRequest(request);
        if (!code) {
          return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "INVALID_BODY" }, { status: 400 });
        }
        try {
          await upsertResume(code, params.id, body);
          return Response.json({ ok: true, id: params.id });
        } catch (e: any) {
          const msg = e?.message === "INVALID_RESUME_ID" ? "INVALID_ID" : "WRITE_FAILED";
          return Response.json({ error: msg }, { status: 400 });
        }
      },
      DELETE: async ({ request, params }) => {
        const code = getSpaceCodeFromRequest(request);
        if (!code) {
          return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
        }
        try {
          const removed = await deleteResume(code, params.id);
          if (!removed) {
            return Response.json({ error: "NOT_FOUND" }, { status: 404 });
          }
          return Response.json({ ok: true });
        } catch {
          return Response.json({ error: "INVALID_ID" }, { status: 400 });
        }
      },
    },
  },
});
