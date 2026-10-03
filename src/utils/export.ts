import { toast } from "sonner";
import { ResumeData } from "@/types/resume";

/** Browser-local date basename, e.g. Sept 1 → resume-0901 */
export const getExportFileBaseName = (date: Date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `resume-${month}${day}`;
};

/**
 * Trigger a real file download named `fileName`.
 *
 * The anchor must be in the document: Chrome and Firefox ignore `download`
 * on a detached <a>, and the save falls back to a blob UUID or the page title.
 * Revoking the object URL in the same turn as click() races the download and
 * drops the name as well, so cleanup is deferred.
 */
export const downloadBlob = (blob: Blob, fileName: string) => {
  const file = new File([blob], fileName, { type: blob.type || "application/octet-stream" });
  const url = window.URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    window.URL.revokeObjectURL(url);
  }, 1500);
};

const downloadTextFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, fileName);
};

interface ExportResumeFileOptions {
  resume?: ResumeData | null;
  /** @deprecated Filename is always resume-MMDD; kept for call-site compatibility */
  title?: string;
  onStart?: () => void;
  onEnd?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

export const exportResumeAsJson = ({
  resume,
  onStart,
  onEnd,
  successMessage,
  errorMessage
}: ExportResumeFileOptions) => {
  onStart?.();

  try {
    if (!resume) {
      throw new Error("No active resume");
    }

    const json = JSON.stringify(resume, null, 2);
    const fileName = `${getExportFileBaseName()}.json`;
    downloadTextFile(json, fileName, "application/json");
    if (successMessage) toast.success(successMessage);
  } catch (error) {
    console.error("JSON export error:", error);
    if (errorMessage) toast.error(errorMessage);
  } finally {
    onEnd?.();
  }
};
