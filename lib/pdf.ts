/** Render a DOM node to an A4 portrait PDF and download it. Client-side only; libs load on demand. */
export async function downloadReceiptPdf(node: HTMLElement, filename: string): Promise<void> {
  const imgs = [...node.querySelectorAll("img")];
  try {
    const [{ toSvg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
    await document.fonts.ready;
    // Safari often drops <img>s from html-to-image's SVG snapshot (the logo vanished from the PDF), so images are
    // hidden during the capture and drawn onto the PDF directly instead.
    const origin = node.getBoundingClientRect();
    const pics = (await Promise.all(imgs.map((i) => snapshot(i, origin)))).filter((p) => p !== null);
    imgs.forEach((i) => (i.style.visibility = "hidden"));
    let svg: string;
    try {
      svg = await toSvg(node, { backgroundColor: "white", cacheBust: true });
    } finally {
      imgs.forEach((i) => (i.style.visibility = ""));
    }
    const img = await rasterize(svg, node.offsetWidth, node.offsetHeight);
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

/** The SVG snapshot as a 2× JPEG data URL. */
async function rasterize(svg: string, w: number, h: number): Promise<string> {
  const img = new Image();
  img.src = svg;
  await img.decode();
  // Safari can finish decode() before the snapshot's embedded web fonts are in: drawn right away, the text fell back
  // to the wider system font and wrapped over itself. A draw, a short wait, then the real draw gives it time.
  // ponytail: fixed 600 ms wait, no way to observe fonts inside an SVG image; raise it if a slow phone still misses them.
  const c = document.createElement("canvas");
  c.width = w * 2;
  c.height = h * 2;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  await new Promise((r) => setTimeout(r, 600));
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.9);
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
