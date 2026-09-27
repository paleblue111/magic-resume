import { createFileRoute } from "@tanstack/react-router";
import {
  sanitizeSpaceCode,
  buildSetSpaceCookie,
} from "@/lib/server/space-code";
import { listResumeData, listResumes } from "@/lib/server/space-storage";

export const Route = createFileRoute("/api/space/enter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { code?: string } = {};
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
        }

        const code = sanitizeSpaceCode(body.code);
        if (!code) {
          return Response.json(
            { ok: false, error: "INVALID_CODE" },
            { status: 400 }
          );
        }

        const [summaries, resumes] = await Promise.all([
          listResumes(code),
          listResumeData(code),
        ]);

        return Response.json(
          { ok: true, code, resumes: summaries, resumeData: resumes },
          {
            headers: {
              "Set-Cookie": buildSetSpaceCookie(code),
            },
          }
        );
      },
    },
  },
});
