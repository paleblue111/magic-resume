import { createFileRoute } from "@tanstack/react-router";
import { getSpaceCodeFromRequest } from "@/lib/server/space-code";
import { listResumeData, listResumes } from "@/lib/server/space-storage";

export const Route = createFileRoute("/api/space/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const code = getSpaceCodeFromRequest(request);
        if (!code) {
          return Response.json({ ok: false, entered: false }, { status: 401 });
        }
        const [summaries, resumes] = await Promise.all([
          listResumes(code),
          listResumeData(code),
        ]);
        return Response.json({
          ok: true,
          entered: true,
          code,
          resumes: summaries,
          resumeData: resumes,
        });
      },
    },
  },
});
