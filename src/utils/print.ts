import { cloneResumeForExport } from "@/utils/resumeLayout";
import { getFontFaceCss, normalizeFontFamily } from "@/utils/fonts";
import { getExportFileBaseName } from "@/utils/export";

/**
 * Browser print / "PDF(备份)" export.
 *
 * Page margins come from #resume-preview padding + box-decoration-break: clone
 * (cloned on every printed page). @page margin is kept at 0 so Chrome's print
 * dialog "Margins: None" cannot wipe spacing, and we never double-up with CSS
 * @page margins when the dialog uses Default.
 */
export const exportResumeToBrowserPrint = async (
  resumeContent: HTMLElement,
  pagePadding: number,
  fontFamily?: string
) => {
  const printFrame = document.createElement("iframe");
  printFrame.style.position = "absolute";
  printFrame.style.width = "210mm";
  printFrame.style.height = "297mm";
  printFrame.style.left = "-10000px";
  printFrame.style.top = "0";
  printFrame.style.border = "0";
  printFrame.style.opacity = "0";
  printFrame.style.pointerEvents = "none";
  printFrame.setAttribute("aria-hidden", "true");
  document.body.appendChild(printFrame);

  const iframeWindow = printFrame.contentWindow;
  if (!iframeWindow) {
    console.error("IFrame window not found");
    document.body.removeChild(printFrame);
    return;
  }

  try {
    iframeWindow.document.open();

    // Keep element padding — print margins are provided by padding +
    // box-decoration-break: clone (not @page), so do not strip them.
    const clonedContent = cloneResumeForExport(resumeContent, false);
    const selectedFontFamily = normalizeFontFamily(fontFamily);
    const marginPx = Math.max(0, Number(pagePadding) || 0);
    clonedContent.style.setProperty("font-family", selectedFontFamily, "important");
    clonedContent.style.setProperty("padding", `${marginPx}px`, "important");
    clonedContent.style.setProperty("margin", "0", "important");
    clonedContent.style.setProperty("width", "210mm", "important");
    clonedContent.style.setProperty("box-sizing", "border-box", "important");
    const fontFaceStyles = await getFontFaceCss(selectedFontFamily);

    const copiedStyles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            // Drop any @page rules from the app so they cannot override our print margins.
            .filter((rule) => rule.constructor.name !== "CSSPageRule")
            .map((rule) => rule.cssText)
            .join("\n");
        } catch (e) {
          console.warn("Could not copy styles from sheet:", e);
          return "";
        }
      })
      .join("\n");

    const exportBaseName = getExportFileBaseName();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${exportBaseName}</title>
          <style>
            ${fontFaceStyles}
            ${copiedStyles}

            /* Print overrides last so they win over copied app styles. */
            @page {
              size: A4;
              margin: 0;
              padding: 0;
            }
            * {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              background: white !important;
              height: auto !important;
              overflow: visible !important;
            }
            body {
              font-family: ${selectedFontFamily};
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            #print-content {
              width: 210mm;
              margin: 0;
              padding: 0;
              background: white;
              box-shadow: none;
            }
            #print-content * {
              box-shadow: none !important;
            }

            /*
             * Padding + box-decoration-break: clone = consistent page margins on
             * every printed page (including page 2+), without relying on @page
             * margins that Chrome's print dialog can set to None.
             */
            #resume-preview {
              margin: 0 !important;
              padding: ${marginPx}px !important;
              width: 210mm !important;
              max-width: 210mm !important;
              box-sizing: border-box !important;
              -webkit-box-decoration-break: clone;
              box-decoration-break: clone;
              font-family: ${selectedFontFamily} !important;
              background: white !important;
            }

            .page-break-line {
              display: none;
            }
          </style>
        </head>
        <body>
          <div id="print-content">
            ${clonedContent.outerHTML}
          </div>
        </body>
      </html>
    `;

    iframeWindow.document.write(htmlContent);
    iframeWindow.document.close();
    // document.write's <title> is not what Chrome's Save as PDF reads.
    // The suggested PDF name comes from the top-level document.title, and
    // only while the print dialog is open. Set both and hold them.
    iframeWindow.document.title = exportBaseName;

    const previousTitle = document.title;
    let cleanedUp = false;
    let titleObserver: MutationObserver | null = null;
    const cleanupPrintFrame = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      titleObserver?.disconnect();
      titleObserver = null;
      document.title = previousTitle;
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
      }
    };

    const printWhenReady = async () => {
      try {
        const doc = iframeWindow.document;

        // 等待字体加载
        if (doc.fonts?.ready) {
          await doc.fonts.ready;
        }

        // 等待所有图片加载完成
        const images = Array.from(doc.images);
        await Promise.all(
          images
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise<void>((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                })
            )
        );

        // 给予额外的渲染帧缓冲
        await new Promise<void>((resolve) => {
          iframeWindow.requestAnimationFrame(() => {
            iframeWindow.requestAnimationFrame(() => resolve());
          });
        });

        document.title = exportBaseName;
        doc.title = exportBaseName;

        // Chrome's Save as PDF name is the top-level document.title, read
        // asynchronously after print() — not the iframe <title>. Next/React
        // can also write the <title> node back. Hold the name until the
        // dialog closes, and do not remove the iframe before then (doing so
        // makes Chrome fall back to the page title).
        const enforceTitle = () => {
          if (document.title !== exportBaseName) {
            document.title = exportBaseName;
          }
        };
        titleObserver = new MutationObserver(enforceTitle);
        titleObserver.observe(document.head, {
          childList: true,
          subtree: true,
          characterData: true
        });

        const startedAt = performance.now();
        const finish = () => {
          // Some browsers emit afterprint as the dialog opens. Ignore that
          // and keep the title until a later afterprint (dialog close).
          if (performance.now() - startedAt < 500) return;
          if (cleanedUp) return;
          iframeWindow.removeEventListener("afterprint", finish);
          window.removeEventListener("afterprint", finish);
          window.removeEventListener("pointerdown", finish, true);
          cleanupPrintFrame();
        };

        iframeWindow.addEventListener("afterprint", finish);
        window.addEventListener("afterprint", finish);
        // Dialog UI doesn't hit the page; the next click means it closed
        // and afterprint never arrived.
        window.addEventListener("pointerdown", finish, true);
        window.setTimeout(finish, 120_000);

        iframeWindow.focus();
        iframeWindow.print();
      } catch (error) {
        console.error("Error print:", error);
        cleanupPrintFrame();
      }
    };

    void printWhenReady();
  } catch (error) {
    console.error("Error setting up print:", error);
    if (document.body.contains(printFrame)) {
      document.body.removeChild(printFrame);
    }
  }
};
