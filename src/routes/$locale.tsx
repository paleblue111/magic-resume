import { createFileRoute, redirect } from "@tanstack/react-router";

// Old marketing/locale URLs redirect straight into the app.
export const Route = createFileRoute("/$locale")({
  beforeLoad: () => {
    throw redirect({ to: "/app/dashboard/resumes" });
  }
});
