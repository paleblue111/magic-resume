import { useState } from "react";
import { useTranslations } from "@/i18n/compat/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogOut, FolderKey } from "lucide-react";
import { toast } from "sonner";
import { leaveSpace } from "@/lib/space/api";
import { maskSpaceCode, useSpaceStore } from "@/store/useSpaceStore";
import { useResumeStore } from "@/store/useResumeStore";

export function SpaceStatusBar() {
  const t = useTranslations("space");
  const { code, reset } = useSpaceStore();
  const [leaving, setLeaving] = useState(false);

  const handleLeave = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await leaveSpace();
      useResumeStore.setState({
        resumes: {},
        activeResumeId: null,
        activeResume: null,
        history: {},
        future: {},
      });
      reset();
      toast.success(t("leaveSuccess"));
    } catch {
      toast.error(t("leaveFailed"));
    } finally {
      setLeaving(false);
    }
  };

  if (!code) return null;

  return (
    <Alert className="mb-2 w-full max-w-3xl bg-muted/40 border-border/60">
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm text-foreground">
          <FolderKey className="h-4 w-4 text-primary" />
          {t("currentSpace", { code: maskSpaceCode(code) })}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleLeave}
          disabled={leaving}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("leave")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
