import { createFileRoute } from "@tanstack/react-router";
import { buildClearSpaceCookie } from "@/lib/server/space-code";

export const Route = createFileRoute("/api/space/leave")({
  server: {
    handlers: {
      POST: async () => {
        return Response.json(
          { ok: true },
          { headers: { "Set-Cookie": buildClearSpaceCookie() } }
        );
      },
    },
  },
});
