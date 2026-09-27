import { toast } from "sonner";
import { ResumeData } from "@/types/resume";

const INVALID_FILE_NAME_CHAR_REGEX = /[\\/:*?"<>|]/g;

const getSafeFileName = (title?: string) => {
  const normalized = (title || "resume")
    .trim()
    .replace(INVALID_FILE_NAME_CHAR_REGEX, "_")
    .replace(/\s+/g, " ");

  return normalized || "resume";
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};

const downloadTextFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, fileName);
};

interface ExportResumeFileOptions {
  resume?: ResumeData | null;
  title?: string;
  onStart?: () => void;
  onEnd?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

export const exportResumeAsJson = ({
  resume,
  title,
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
    const fileName = `${getSafeFileName(title || resume.title)}.json`;
    downloadTextFile(json, fileName, "application/json;charset=utf-8");
    if (successMessage) toast.success(successMessage);
  } catch (error) {
    console.error("JSON export error:", error);
    if (errorMessage) toast.error(errorMessage);
  } finally {
    onEnd?.();
  }
};
