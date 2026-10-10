/** Render a DOM node to an A4 portrait PDF and download it. Client-side only; libs load on demand. */
export async function downloadReceiptPdf(node: HTMLElement, filename: string): Promise<void> {
  const imgs = [...node.querySelectorAll("img")];
  try {
    const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
    await document.fonts.ready;
    // Safari often drops <img>s from html-to-image's SVG snapshot (the logo vanished from the PDF), so images are
    // hidden during the capture and drawn onto the PDF directly instead.
    const origin = node.getBoundingClientRect();
    const pics = (await Promise.all(imgs.map((i) => snapshot(i, origin)))).filter((p) => p !== null);
    imgs.forEach((i) => (i.style.visibility = "hidden"));
    let img: string;
    try {
      img = await toJpeg(node, { quality: 0.9, backgroundColor: "white", pixelRatio: 2, cacheBust: true });
    } finally {
      imgs.forEach((i) => (i.style.visibility = ""));
    }
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const mm = pw / node.offsetWidth;
    const h = node.offsetHeight * mm;
    for (let y = 0, first = true; y < h - 0.5; y += ph, first = false) {
      if (!first) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, -y, pw, h, undefined, "FAST");
      for (const p of pics) pdf.addImage(p.data, "PNG", p.x * mm, p.y * mm - y, p.w * mm, p.h * mm, undefined, "FAST");
    }
    pdf.save(filename);
  } catch (e) {
    throw new Error("Gagal membuat PDF. Coba lagi.", { cause: e });
  }
}

/** The image as a PNG plus its box relative to `origin`, in CSS px. null if it failed to load (left out of the PDF). */
async function snapshot(img: HTMLImageElement, origin: DOMRect) {
  await img.decode().catch(() => {});
  if (!img.naturalWidth) return null;
  const r = img.getBoundingClientRect();
  const c = document.createElement("canvas");
  c.width = Math.min(img.naturalWidth, Math.round(r.width * 3)); // 3× the printed size: sharp, but a small PDF
  c.height = Math.round((c.width * r.height) / r.width);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return { data: c.toDataURL("image/png"), x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
}
