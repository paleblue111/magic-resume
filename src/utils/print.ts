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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${getExportFileBaseName()}</title>
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

        iframeWindow.focus();
        iframeWindow.print();

        // 打印完成后清理iframe
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 1000);
      } catch (error) {
        console.error("Error print:", error);
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
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
