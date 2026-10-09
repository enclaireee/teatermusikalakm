/** Render a DOM node to an A4 portrait PDF and download it. Client-side only; libs load on demand. */
export async function downloadReceiptPdf(node: HTMLElement, filename: string): Promise<void> {
  try {
    const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
    await document.fonts.ready;
    const img = await toJpeg(node, { quality: 0.9, backgroundColor: "white", pixelRatio: 2, cacheBust: true });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const h = (node.offsetHeight / node.offsetWidth) * pw;
    for (let y = 0, first = true; y < h - 0.5; y += ph, first = false) {
      if (!first) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, -y, pw, h, undefined, "FAST");
    }
    pdf.save(filename);
  } catch (e) {
    throw new Error("Gagal membuat PDF. Coba lagi.", { cause: e });
  }
}
