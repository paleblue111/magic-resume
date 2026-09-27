import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "@/i18n/compat/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { enterSpace, fetchSession } from "@/lib/space/api";
import { useSpaceStore } from "@/store/useSpaceStore";
import {
  hydrateResumesFromServer,
  useResumeServerSync,
} from "@/hooks/useResumeServerSync";

export function AccessCodeGate({ children }: { children: ReactNode }) {
  const t = useTranslations("space");
  const { entered, checking, setSession, setChecking } = useSpaceStore();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useResumeServerSync();

  useEffect(() => {
    // SPA navigation remounts this gate; keep in-memory session to avoid
    // re-hydrating over unsaved edits.
    if (useSpaceStore.getState().entered) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setChecking(true);
      try {
        const session = await fetchSession();
        if (cancelled) return;
        if (session.ok && session.entered && session.code) {
          hydrateResumesFromServer(session.resumeData);
          setSession(true, session.code);
        } else {
          setSession(false, null);
        }
      } catch {
        if (!cancelled) setSession(false, null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setSession, setChecking]);

  const handleEnter = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await enterSpace(code.trim());
      if (!result.ok || !result.code) {
        toast.error(t("invalidCode"));
        return;
      }
      hydrateResumesFromServer(result.resumeData);
      setSession(true, result.code);
      toast.success(t("enterSuccess"));
    } catch {
      toast.error(t("enterFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!entered) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-background to-muted/40 p-4">
        <Card className="w-full max-w-md shadow-lg border-border/60">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {t("description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEnter} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="access-code" className="text-sm font-medium">
                  {t("codeLabel")}
                </label>
                <Input
                  id="access-code"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={t("codePlaceholder")}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">{t("codeHint")}</p>
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !code.trim()}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("entering")}
                  </>
                ) : (
                  t("enter")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
