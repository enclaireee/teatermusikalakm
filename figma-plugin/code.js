// AKM Website Builder — local Figma plugin for the "Musikal Aku, Kau & Musik" file.
// Builds the remaining design-system components, every screen (desktop + mobile) and the e-receipt
// on the "website" page. Re-running rebuilds only what this plugin generated (matched by name);
// nothing outside the "website" page is touched.

const LOGO_HASH = 'ffd5a8f97ff38c1218ad95a30170c8aac730136d';
const GENERATED_SECTIONS = ['01 · Desktop Flow', '02 · Mobile Flow', '03 · E-Receipt'];
const BODY_STYLES = ['Body/L', 'Body/M', 'Body/S', 'Label/Button', 'Label/M', 'Caption'];

let page, DS, VARS, TS, ES;
const ICONS = {};
const C = {};

// ---------- token helpers ----------
function paint(n) {
  const v = VARS['color/' + n];
  if (!v) throw new Error('Token warna tidak ada: ' + n);
  return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v);
}
function fill(node, n) { node.fills = n ? [paint(n)] : []; }
function stroke(node, n, w) {
  if (!n) { node.strokes = []; return; }
  node.strokes = [paint(n)];
  node.strokeAlign = 'INSIDE';
  node.setBoundVariable('strokeWeight', VARS[w || 'stroke/default']);
}
function sp(node, key, n) { const v = VARS['space/' + n]; if (v) node.setBoundVariable(key, v); else node[key] = n; }
function pad(node, y, x) {
  if (x === undefined) x = y;
  sp(node, 'paddingTop', y); sp(node, 'paddingBottom', y); sp(node, 'paddingLeft', x); sp(node, 'paddingRight', x);
}
function gap(node, n) { sp(node, 'itemSpacing', n); }
function rawPad(node, key, v) { node.setBoundVariable(key, null); node[key] = v; }
// Fixed width, hug height (resize() would otherwise freeze both axes).
function fixW(node, w) {
  node.resize(w, Math.max(node.height, 1));
  if (node.layoutMode === 'VERTICAL') { node.counterAxisSizingMode = 'FIXED'; node.primaryAxisSizingMode = 'AUTO'; }
  else { node.primaryAxisSizingMode = 'FIXED'; node.counterAxisSizingMode = 'AUTO'; }
}
function rad(node, n) { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) node.setBoundVariable(k, VARS['radius/' + n]); }
async function effect(node, name) { await node.setEffectStyleIdAsync(ES[name].id); }

// ---------- node helpers ----------
function frame(dir, name) {
  const f = figma.createFrame();
  f.name = name; f.fills = []; f.clipsContent = false;
  if (dir) { f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; }
  return f;
}
function fixedBox(name, w, h) {
  const f = frame('HORIZONTAL', name);
  f.resize(w, h); f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED';
  f.primaryAxisAlignItems = 'CENTER'; f.counterAxisAlignItems = 'CENTER';
  return f;
}
function add(parent, child, w, h) {
  parent.appendChild(child);
  if (w) child.layoutSizingHorizontal = w;
  if (h) child.layoutSizingVertical = h;
  return child;
}
function absolute(parent, child, x, y, behind) {
  if (behind) parent.insertChild(0, child); else parent.appendChild(child);
  child.layoutPositioning = 'ABSOLUTE';
  child.x = x; child.y = y;
  return child;
}
async function text(chars, style, color, name) {
  const t = figma.createText();
  await t.setTextStyleIdAsync(TS[style].id);
  t.characters = chars;
  fill(t, color || 'text/primary');
  t.name = name || chars.slice(0, 32);
  return t;
}
// Wrapping text that fills its auto-layout parent.
function wrap(t, align) {
  t.textAutoResize = 'HEIGHT';
  t.layoutSizingHorizontal = 'FILL';
  if (align) t.textAlignHorizontal = align;
  return t;
}
async function para(parent, chars, style, color, align, name) {
  const t = await text(chars, style, color, name);
  parent.appendChild(t);
  return wrap(t, align);
}
function comp(name, dir) {
  const c = figma.createComponent();
  c.name = name; c.fills = [];
  c.layoutMode = dir || 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  return c;
}
function divider(parent, color, dashed) {
  const l = figma.createLine();
  l.name = 'Divider'; l.resize(100, 0);
  l.strokes = [paint(color || 'border/subtle')]; l.strokeWeight = 2;
  if (dashed) l.dashPattern = [8, 6];
  parent.appendChild(l); l.layoutSizingHorizontal = 'FILL';
  return l;
}
function icon(name, color, size) {
  const c = ICONS[name];
  if (!c) throw new Error('Ikon tidak ada: ' + name);
  const i = c.createInstance();
  recolor(i, color);
  if (size && size !== 24) i.rescale(size / 24);
  i.name = 'Icon/' + name;
  return i;
}
function recolor(node, color) { for (const v of node.findAll(n => 'strokes' in n && n.strokes.length)) v.strokes = [paint(color)]; }
function logo(w) {
  const r = figma.createRectangle();
  r.name = 'Logo AKM'; r.resize(w, Math.round(w * 510 / 624));
  if (figma.getImageByHash(LOGO_HASH)) r.fills = [{ type: 'IMAGE', imageHash: LOGO_HASH, scaleMode: 'FIT' }];
  else fill(r, 'bg/accent');
  return r;
}

// ---------- instance helpers ----------
function variant(setName, vp) {
  const set = C[setName];
  if (!set) throw new Error('Komponen tidak ada: ' + setName);
  const c = set.children.find(ch => Object.entries(vp).every(([k, v]) => ch.variantProperties[k] === v));
  if (!c) throw new Error(`Varian tidak ada: ${setName} ${JSON.stringify(vp)}`);
  return c;
}
function setProps(inst, obj) {
  const p = {};
  for (const k of Object.keys(inst.componentProperties)) { const base = k.split('#')[0]; if (base in obj) p[k] = obj[base]; }
  inst.setProperties(p);
  return inst;
}
function inst(setName, vp, props) { const i = variant(setName, vp).createInstance(); if (props) setProps(i, props); return i; }
function setText(node, name, chars) {
  const t = node.findOne(n => n.type === 'TEXT' && n.name === name);
  if (!t) throw new Error('Teks tidak ada: ' + name + ' di ' + node.name);
  t.characters = chars;
  return t;
}
const BTN_TEXT = { Primary: 'text/on-brand', Accent: 'text/on-accent', Secondary: 'text/primary', Ghost: 'text/brand' };
function button(v, label, o) {
  o = o || {};
  const state = o.state || 'Default';
  const b = inst('Button', { Variant: v, State: state });
  if (state === 'Loading') setText(b, 'Label', label);
  else setProps(b, { Label: label, 'Show icon': !!o.icon });
  if (o.icon && state !== 'Loading') {
    const ic = b.findOne(n => n.type === 'INSTANCE' && n.name === 'Icon');
    ic.swapComponent(ICONS[o.icon]);
    if (Math.round(ic.width) !== 20) ic.rescale(20 / ic.width);
    recolor(ic, state === 'Disabled' ? 'text/disabled' : BTN_TEXT[v]);
  }
  b.name = 'Button/' + label;
  return b;
}
function field(state, label, value, helper, required) {
  const f = inst('Field', { State: state }, { Label: label, Value: value, Helper: helper || '', Required: required !== false, 'Show helper': !!helper });
  f.name = 'Field/' + label;
  return f;
}

// ---------- decoration ----------
function vecColor(node, fillTok, strokeTok) {
  for (const v of node.findAll(n => n.type === 'VECTOR')) {
    v.fills = fillTok ? [paint(fillTok)] : [];
    if (strokeTok) v.strokes = [paint(strokeTok)];
  }
  return node;
}
function graph(w, h, step) {
  step = step || 32;
  let d = '';
  for (let x = step; x < w; x += step) d += `M${x} 0V${h}`;
  for (let y = step; y < h; y += step) d += `M0 ${y}H${w}`;
  const n = figma.createNodeFromSvg(`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${d}" stroke="#404040" stroke-width="1"/></svg>`);
  n.name = 'Texture/Graph paper'; n.fills = []; n.opacity = 0.07; n.locked = true;
  vecColor(n, null, 'border/default');
  return n;
}
function star(size, points, inner, fillTok) {
  let d = '';
  const c = size / 2, R = size / 2 - 3, r = R * inner;
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 ? r : R, a = Math.PI * i / points - Math.PI / 2;
    d += (i ? 'L' : 'M') + (c + rr * Math.cos(a)).toFixed(1) + ' ' + (c + rr * Math.sin(a)).toFixed(1);
  }
  const n = figma.createNodeFromSvg(`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><path d="${d}Z" fill="#FAF015" stroke="#404040" stroke-width="3" stroke-linejoin="round"/></svg>`);
  n.name = 'Deco/Star'; n.fills = [];
  return vecColor(n, fillTok || 'bg/accent', 'border/default');
}
// Red scalloped curtain valance, like the announcement posts.
function valance(w, h, n) {
  const s = w / n, r = Math.min(h * 0.45, s / 2);
  let d = `M0 0H${w}V${h - r}`;
  for (let i = n; i > 0; i--) d += `A${(s / 2).toFixed(1)} ${r.toFixed(1)} 0 0 1 ${((i - 1) * s).toFixed(1)} ${h - r}`;
  const node = figma.createNodeFromSvg(`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><path d="${d}Z" fill="#C10000" stroke="#404040" stroke-width="3"/></svg>`);
  node.name = 'Deco/Curtain valance'; node.fills = [];
  return vecColor(node, 'bg/danger', 'border/default');
}
function drape(h, w) {
  const f = figma.createRectangle();
  f.name = 'Deco/Curtain drape'; f.resize(w, h);
  fill(f, 'bg/danger');
  f.strokes = [paint('border/default')]; f.strokeWeight = 3;
  return f;
}
function tape(w) {
  const t = figma.createRectangle();
  t.name = 'Deco/Tape'; t.resize(w || 72, 22);
  t.fills = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 }, opacity: 0.85 }];
  return t;
}
async function placeholderPhoto(w, h, caption) {
  const p = frame('VERTICAL', 'Photo placeholder');
  p.resize(w, h); p.primaryAxisSizingMode = 'FIXED'; p.counterAxisSizingMode = 'FIXED';
  p.primaryAxisAlignItems = 'CENTER'; p.counterAxisAlignItems = 'CENTER'; p.itemSpacing = 8;
  fill(p, 'bg/muted');
  p.appendChild(icon('users', 'text/secondary', 32));
  const t = await text(caption || 'Foto (placeholder)', 'Caption', 'text/secondary');
  p.appendChild(t);
  return p;
}
async function polaroid(w, h, caption, rotation) {
  const p = frame('VERTICAL', 'Polaroid');
  fill(p, 'bg/surface'); stroke(p, 'border/default'); p.paddingTop = p.paddingLeft = p.paddingRight = 12; p.paddingBottom = 16; p.itemSpacing = 10;
  await effect(p, 'Shadow/Sticker');
  p.appendChild(await placeholderPhoto(w, h));
  p.appendChild(await text(caption, 'Heading/H4', 'text/primary', 'Caption'));
  p.rotation = rotation || 0;
  return p;
}

// ---------- shelf placement inside the design-system section ----------
let shelf;
function place(node) {
  const maxW = 3800;
  if (shelf.x + node.width > maxW) { shelf.x = 80; shelf.y += shelf.rowH + 80; shelf.rowH = 0; }
  node.x = shelf.x; node.y = shelf.y;
  shelf.x += node.width + 80; shelf.rowH = Math.max(shelf.rowH, node.height);
}
function finishSet(set, name, desc, cols, cw, ch) {
  set.name = name;
  if (desc) set.description = desc;
  if (cols === 1) { let y = 32; for (const c of set.children) { c.x = 32; c.y = y; y += c.height + 32; } }
  else set.children.forEach((c, i) => { c.x = 32 + (i % cols) * cw; c.y = 32 + Math.floor(i / cols) * ch; });
  let w = 0, h = 0;
  for (const c of set.children) { w = Math.max(w, c.x + c.width); h = Math.max(h, c.y + c.height); }
  set.resizeWithoutConstraints(w + 32, h + 32);
  fill(set, 'bg/surface'); set.cornerRadius = 20;
  place(set);
  C[name] = set;
  return set;
}
function propKey(set, base) { return Object.keys(set.componentPropertyDefinitions).find(k => k.split('#')[0] === base); }
function bindText(set, nodeName, propBase) {
  const k = propKey(set, propBase);
  for (const c of set.children) { const n = c.findOne(x => x.type === 'TEXT' && x.name === nodeName); if (n) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences, { characters: k }); }
}
function bindVisible(set, nodeName, propBase) {
  const k = propKey(set, propBase);
  for (const c of set.children) { const n = c.findOne(x => x.name === nodeName); if (n) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences, { visible: k }); }
}

// =====================================================================
// COMPONENTS
// =====================================================================
async function buildStep() {
  const defs = { Done: ['bg/brand', 'border/default', 'text/on-brand', 'text/primary'], Current: ['bg/accent', 'border/default', 'text/strong', 'text/strong'], Upcoming: ['bg/surface', 'border/subtle', 'text/secondary', 'text/secondary'] };
  const comps = [];
  for (const [st, [bg, bd, numC, labC]] of Object.entries(defs)) {
    const c = comp('State=' + st); c.counterAxisAlignItems = 'CENTER'; gap(c, 8);
    const dot = fixedBox('Dot', 32, 32); rad(dot, 'full'); fill(dot, bg); stroke(dot, bd);
    if (st === 'Done') dot.appendChild(icon('check', 'text/on-brand', 18));
    else dot.appendChild(await text('2', 'Label/M', numC, 'Number'));
    c.appendChild(dot);
    c.appendChild(await text('Pilih Kursi', 'Label/M', labC, 'Label'));
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, DS);
  set.addComponentProperty('Number', 'TEXT', '2');
  set.addComponentProperty('Label', 'TEXT', 'Pilih Kursi');
  bindText(set, 'Number', 'Number'); bindText(set, 'Label', 'Label');
  finishSet(set, 'Step', 'Satu langkah di stepper checkout.', 3, 180, 60);
}

async function buildStepper() {
  const labels = ['Data Diri', 'Pilih Kursi', 'Pembayaran', 'E-Receipt'];
  const comps = [];
  for (let cur = 1; cur <= 4; cur++) {
    const c = comp(`Device=Desktop, Step=${cur}`); c.counterAxisAlignItems = 'CENTER'; gap(c, 12);
    for (let i = 1; i <= 4; i++) {
      const st = i < cur ? 'Done' : i === cur ? 'Current' : 'Upcoming';
      const s = inst('Step', { State: st }, st === 'Done' ? { Label: labels[i - 1] } : { Label: labels[i - 1], Number: String(i) });
      s.name = 'Step ' + i; c.appendChild(s);
      if (i < 4) { const ln = figma.createRectangle(); ln.name = 'Connector'; ln.resize(48, 2); fill(ln, i < cur ? 'bg/brand' : 'bg/disabled'); c.appendChild(ln); }
    }
    comps.push(c);
  }
  for (let cur = 1; cur <= 4; cur++) {
    const c = comp(`Device=Mobile, Step=${cur}`, 'VERTICAL'); c.counterAxisSizingMode = 'FIXED'; fixW(c, 358); gap(c, 8);
    const row = add(c, frame('HORIZONTAL', 'Row'), 'FILL'); row.primaryAxisAlignItems = 'SPACE_BETWEEN'; row.counterAxisAlignItems = 'CENTER';
    row.appendChild(await text(labels[cur - 1], 'Heading/H4', 'text/strong', 'Label'));
    row.appendChild(await text(`Langkah ${cur} dari 4`, 'Caption', 'text/secondary', 'Count'));
    const bar = add(c, frame('HORIZONTAL', 'Progress'), 'FILL'); bar.itemSpacing = 4;
    for (let i = 1; i <= 4; i++) {
      const seg = figma.createRectangle(); seg.name = 'Seg ' + i; seg.resize(10, 6); seg.cornerRadius = 3;
      fill(seg, i < cur ? 'bg/brand' : i === cur ? 'bg/accent' : 'bg/disabled');
      add(bar, seg, 'FILL');
    }
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, DS);
  finishSet(set, 'Stepper', 'Progress checkout: Data Diri → Pilih Kursi → Pembayaran → E-Receipt. Desktop: step bernomor; mobile: judul langkah + progress bar.', 1, 0, 70);
}

async function buildAlert() {
  const defs = {
    Info: ['bg/brand-soft', 'border/brand', 'info', 'text/brand', 'Kursi ditahan 10 menit', 'Selesaikan pembayaran sebelum waktu habis.'],
    Success: ['bg/brand-soft', 'border/brand', 'check-circle', 'text/brand', 'Bukti pembayaran terkirim', 'Kami verifikasi maksimal 1×24 jam.'],
    Warning: ['bg/accent-soft', 'border/default', 'clock', 'text/primary', 'Sisa waktu 09:41', 'Kursi dilepas lagi kalau waktu habis.'],
    Error: ['bg/danger-soft', 'border/danger', 'alert-circle', 'text/danger', 'Kode undangan tidak valid', 'Cek lagi huruf dan angkanya.'],
  };
  const comps = [];
  for (const [t, [bg, bd, ic, ac, title, msg]] of Object.entries(defs)) {
    const c = comp('Type=' + t); c.primaryAxisSizingMode = 'FIXED'; fixW(c, 400); pad(c, 12, 16); gap(c, 12); rad(c, 'md'); fill(c, bg); stroke(c, bd);
    c.appendChild(icon(ic, ac, 20));
    const col = add(c, frame('VERTICAL', 'Text'), 'FILL'); col.itemSpacing = 2;
    await para(col, title, 'Label/M', 'text/strong', null, 'Title');
    await para(col, msg, 'Body/S', 'text/primary', null, 'Message');
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, DS);
  set.addComponentProperty('Title', 'TEXT', 'Judul'); set.addComponentProperty('Message', 'TEXT', 'Pesan');
  bindText(set, 'Title', 'Title'); bindText(set, 'Message', 'Message');
  finishSet(set, 'Alert', 'Pesan inline: Info, Success, Warning (countdown), Error.', 2, 440, 100);
}

async function buildPaymentOption() {
  const defs = { Default: ['bg/surface', 'border/default', 'stroke/default', false], Hover: ['bg/accent-soft', 'border/default', 'stroke/default', false], Selected: ['bg/brand-soft', 'border/brand', 'stroke/bold', true], Disabled: ['bg/disabled', 'border/subtle', 'stroke/default', false] };
  const comps = [];
  for (const [st, [bg, bd, w, sel]] of Object.entries(defs)) {
    const dis = st === 'Disabled';
    const c = comp('State=' + st); c.primaryAxisSizingMode = 'FIXED'; fixW(c, 480); c.counterAxisAlignItems = 'CENTER'; pad(c, 16, 20); gap(c, 16); rad(c, 'md'); fill(c, bg); stroke(c, bd, w);
    if (st === 'Hover' || sel) await effect(c, 'Shadow/Sticker');
    const radio = fixedBox('Radio', 22, 22); rad(radio, 'full'); fill(radio, 'bg/surface'); stroke(radio, sel ? 'border/brand' : dis ? 'border/subtle' : 'border/default');
    if (sel) { const d = figma.createEllipse(); d.name = 'Dot'; d.resize(10, 10); fill(d, 'bg/brand'); radio.appendChild(d); }
    c.appendChild(radio);
    const ib = fixedBox('Icon box', 44, 44); rad(ib, 'sm'); fill(ib, dis ? 'bg/muted' : 'bg/accent'); stroke(ib, dis ? 'border/subtle' : 'border/default');
    const ic = icon('qr-code', dis ? 'text/disabled' : 'text/primary'); ic.name = 'Icon'; ib.appendChild(ic); c.appendChild(ib);
    const col = add(c, frame('VERTICAL', 'Text'), 'FILL'); col.itemSpacing = 2;
    col.appendChild(await text('QRIS', 'Body/M', dis ? 'text/disabled' : 'text/strong', 'Title'));
    await para(col, 'Scan pakai e-wallet atau m-banking apa saja', 'Caption', dis ? 'text/disabled' : 'text/secondary', null, 'Description');
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, DS);
  set.addComponentProperty('Title', 'TEXT', 'QRIS'); set.addComponentProperty('Description', 'TEXT', 'Scan pakai e-wallet atau m-banking apa saja');
  set.addComponentProperty('Icon', 'INSTANCE_SWAP', ICONS['qr-code'].id);
  bindText(set, 'Title', 'Title'); bindText(set, 'Description', 'Description');
  const k = propKey(set, 'Icon');
  for (const c of set.children) c.findOne(n => n.name === 'Icon').componentPropertyReferences = { mainComponent: k };
  finishSet(set, 'Payment Option', 'Radio card metode pembayaran (QRIS / Transfer Bank). Seluruh kartu bisa diklik.', 2, 520, 110);
}

async function buildUpload() {
  const comps = [];
  for (const st of ['Default', 'Hover', 'Uploading', 'Uploaded', 'Error']) {
    const err = st === 'Error';
    const c = comp('State=' + st, 'VERTICAL'); c.counterAxisSizingMode = 'FIXED'; fixW(c, 480); c.counterAxisAlignItems = 'CENTER'; pad(c, 24); gap(c, 12); rad(c, 'md');
    fill(c, err ? 'bg/danger-soft' : st === 'Hover' ? 'bg/accent-soft' : 'bg/surface');
    stroke(c, err ? 'border/danger' : st === 'Hover' || st === 'Uploaded' ? 'border/brand' : 'border/default');
    if (st !== 'Uploaded') c.dashPattern = [8, 6];
    if (st === 'Uploaded') {
      c.counterAxisAlignItems = 'MIN';
      const row = add(c, frame('HORIZONTAL', 'File row'), 'FILL'); row.counterAxisAlignItems = 'CENTER'; row.itemSpacing = 12;
      const th = fixedBox('Thumb', 48, 48); rad(th, 'sm'); fill(th, 'bg/brand-soft'); stroke(th, 'border/brand');
      th.appendChild(icon('file', 'text/brand')); row.appendChild(th);
      const col = add(row, frame('VERTICAL', 'Text'), 'FILL'); col.itemSpacing = 2;
      col.appendChild(await text('bukti-transfer.jpg', 'Body/M', 'text/strong', 'File name'));
      col.appendChild(await text('1,2 MB · Siap dikirim', 'Caption', 'text/brand', 'File meta'));
      row.appendChild(button('Ghost', 'Ganti'));
    } else {
      c.appendChild(icon(err ? 'alert-circle' : 'upload', err ? 'text/danger' : 'text/brand', 32));
      c.appendChild(await text(err ? 'File terlalu besar' : st === 'Uploading' ? 'Mengunggah…' : 'Upload bukti pembayaran', 'Body/M', 'text/strong', 'Title'));
      await para(c, err ? 'Maksimal 5 MB. Kompres foto atau pilih file lain.' : st === 'Uploading' ? 'bukti-transfer.jpg · 60%' : 'Tarik file ke sini atau pilih dari perangkat · JPG, PNG, PDF, maks. 5 MB', 'Caption', err ? 'text/danger' : 'text/secondary', 'CENTER', 'Description');
      if (st === 'Uploading') {
        const track = add(c, frame('HORIZONTAL', 'Progress'), 'FILL'); rad(track, 'full'); fill(track, 'bg/disabled');
        const bar = figma.createRectangle(); bar.name = 'Bar'; bar.resize(250, 8); bar.cornerRadius = 4; fill(bar, 'bg/brand'); track.appendChild(bar);
      } else c.appendChild(button('Secondary', err ? 'Pilih file lain' : 'Pilih file'));
    }
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, DS);
  finishSet(set, 'Upload', 'Dropzone bukti pembayaran: JPG/PNG/PDF maks. 5 MB. State Default, Hover (drag), Uploading, Uploaded, Error.', 3, 520, 230);
}

async function buildCheckbox() {
  const defs = { Unchecked: ['bg/surface', 'border/default'], Checked: ['bg/brand', 'border/default'], Focus: ['bg/surface', 'border/focus'], Error: ['bg/danger-soft', 'border/danger'], Disabled: ['bg/disabled', 'border/subtle'] };
  const comps = [];
  for (const [st, [bg, bd]] of Object.entries(defs)) {
    const c = comp('State=' + st); c.primaryAxisSizingMode = 'FIXED'; fixW(c, 420); gap(c, 12);
    const box = fixedBox('Box', 22, 22); rad(box, 'sm'); fill(box, bg); stroke(box, bd);
    if (st === 'Checked') box.appendChild(icon('check', 'text/on-brand', 16));
    if (st === 'Focus') await effect(box, 'Focus/Ring');
    c.appendChild(box);
    const col = add(c, frame('VERTICAL', 'Text'), 'FILL'); col.itemSpacing = 4;
    await para(col, 'Aku setuju dengan Syarat & Ketentuan pembelian tiket.', 'Body/S', st === 'Disabled' ? 'text/disabled' : 'text/primary', null, 'Label');
    if (st === 'Error') await para(col, 'Centang dulu untuk lanjut.', 'Caption', 'text/danger', null, 'Error');
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, DS);
  set.addComponentProperty('Label', 'TEXT', 'Aku setuju dengan Syarat & Ketentuan pembelian tiket.');
  bindText(set, 'Label', 'Label');
  finishSet(set, 'Checkbox', 'Checkbox persetujuan. Error muncul kalau belum dicentang saat submit.', 3, 460, 80);
}

async function buildQuantity() {
  const comps = [];
  for (const st of ['Default', 'Min', 'Max']) {
    const c = comp('State=' + st); c.counterAxisAlignItems = 'CENTER'; gap(c, 8);
    const mk = async (sym, off, name) => {
      const b = fixedBox(name, 44, 44); rad(b, 'md');
      fill(b, off ? 'bg/disabled' : 'bg/surface'); stroke(b, off ? 'border/subtle' : 'border/default');
      if (!off) await effect(b, 'Shadow/Sticker');
      b.appendChild(await text(sym, 'Heading/H3', off ? 'text/disabled' : 'text/strong', 'Symbol'));
      return b;
    };
    c.appendChild(await mk('−', st === 'Min', 'Minus'));
    const v = fixedBox('Value box', 56, 44); v.appendChild(await text(st === 'Min' ? '1' : st === 'Max' ? '4' : '2', 'Heading/H2', 'text/strong', 'Value')); c.appendChild(v);
    c.appendChild(await mk('+', st === 'Max', 'Plus'));
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, DS);
  finishSet(set, 'Quantity', 'Jumlah tiket 1–4. Min: tombol − nonaktif. Max (4): tombol + nonaktif.', 3, 220, 70);
}

async function buildStamp() {
  const comps = [];
  for (const [cl, tok] of [['Red', 'danger'], ['Green', 'brand']]) {
    const c = comp('Color=' + cl); c.counterAxisAlignItems = 'CENTER'; pad(c, 6, 16); rad(c, 'sm');
    c.strokes = [paint('border/' + tok)]; c.strokeWeight = 4; c.strokeAlign = 'INSIDE';
    const t = await text('CONFIRMED', 'Heading/H3', 'text/' + tok, 'Text'); t.textCase = 'UPPER'; c.appendChild(t);
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, DS);
  set.addComponentProperty('Text', 'TEXT', 'CONFIRMED');
  bindText(set, 'Text', 'Text');
  finishSet(set, 'Stamp', 'Stempel ala stylescape (CONFIRMED, APPROVED, dll). Putar −6° s/d −10° saat dipakai.', 2, 260, 80);
}

const TIERS = {
  'Tipe 1': ['Tengah depan', 'Baris A–D & G'],
  'Tipe 2': ['Tengah belakang', 'Baris H–O'],
  'Tipe 3': ['Sayap depan', 'Baris A–G kiri & kanan'],
  'Tipe 4': ['Sayap belakang', 'Baris H–O kiri & kanan'],
};
async function buildTierCard() {
  const comps = [];
  for (const [t, [title, rows]] of Object.entries(TIERS)) {
    const c = comp('Tier=' + t, 'VERTICAL'); c.counterAxisSizingMode = 'FIXED'; fixW(c, 280); pad(c, 20); gap(c, 8); rad(c, 'md'); fill(c, 'bg/surface'); stroke(c, 'border/default');
    await effect(c, 'Shadow/Sticker');
    const sw = add(c, frame('HORIZONTAL', 'Swatch'), 'FILL'); sw.itemSpacing = 4;
    for (let i = 0; i < 3; i++) sw.appendChild(inst('Seat', { Tier: t, State: 'Available' }));
    c.appendChild(await text(t, 'Heading/H3', 'text/strong', 'Tier'));
    await para(c, `${title} · ${rows}`, 'Caption', 'text/secondary', null, 'Description');
    const pr = add(c, frame('HORIZONTAL', 'Price row'), 'FILL'); pr.itemSpacing = 6; pr.counterAxisAlignItems = 'BASELINE';
    pr.appendChild(await text('Rp XX.XXX', 'Heading/H3', 'text/brand', 'Price'));
    pr.appendChild(await text('/ kursi', 'Caption', 'text/secondary', 'Unit'));
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, DS);
  set.addComponentProperty('Price', 'TEXT', 'Rp XX.XXX');
  bindText(set, 'Price', 'Price');
  finishSet(set, 'Tier Card', 'Kategori kursi + harga (placeholder Rp XX.XXX).', 4, 312, 220);
}

async function buildShowCard() {
  const comps = [];
  for (const st of ['Default', 'Hover', 'Sold Out']) {
    const sold = st === 'Sold Out';
    const c = comp('State=' + st, 'VERTICAL'); c.counterAxisSizingMode = 'FIXED'; fixW(c, 420); pad(c, 24); gap(c, 16); rad(c, 'lg');
    fill(c, st === 'Hover' ? 'bg/accent-soft' : 'bg/surface'); stroke(c, st === 'Hover' ? 'border/brand' : 'border/default', st === 'Hover' ? 'stroke/bold' : 'stroke/default');
    await effect(c, st === 'Hover' ? 'Shadow/Sticker-L' : 'Shadow/Sticker');
    const top = add(c, frame('HORIZONTAL', 'Top row'), 'FILL'); top.primaryAxisAlignItems = 'SPACE_BETWEEN'; top.counterAxisAlignItems = 'CENTER';
    const tag = frame('HORIZONTAL', 'Tag'); pad(tag, 4, 12); rad(tag, 'sm'); fill(tag, sold ? 'bg/disabled' : 'bg/accent'); stroke(tag, 'border/default');
    tag.appendChild(await text('SHOW 1', 'Heading/H4', 'text/strong', 'Show')); top.appendChild(tag);
    const chip = frame('HORIZONTAL', 'Seats chip'); pad(chip, 4, 12); rad(chip, 'full'); fill(chip, sold ? 'bg/danger-soft' : 'bg/brand-soft');
    chip.appendChild(await text(sold ? 'Habis' : 'Sisa 312 kursi', 'Caption', sold ? 'text/danger' : 'text/brand', 'Seats')); top.appendChild(chip);
    const time = add(c, frame('HORIZONTAL', 'Time'), 'FILL'); time.itemSpacing = 8; time.counterAxisAlignItems = 'BASELINE';
    time.appendChild(await text('15.00 – 17.00', 'Heading/H1', sold ? 'text/secondary' : 'text/strong', 'Time'));
    time.appendChild(await text('WIB', 'Heading/H4', 'text/secondary', 'Zone'));
    for (const [ic, label, nm] of [['calendar', 'Kamis, 29 Oktober 2026', 'Date'], ['map-pin', 'Makara Art Center UI, Depok', 'Venue']]) {
      const r = add(c, frame('HORIZONTAL', nm + ' row'), 'FILL'); r.itemSpacing = 8; r.counterAxisAlignItems = 'CENTER';
      r.appendChild(icon(ic, 'text/secondary', 20));
      r.appendChild(await text(label, 'Body/M', 'text/primary', nm));
    }
    divider(c, 'border/subtle', true);
    const b = button('Primary', sold ? 'Tiket Habis' : 'Pilih Show 1', { icon: sold ? null : 'arrow-right', state: sold ? 'Disabled' : st === 'Hover' ? 'Hover' : 'Default' });
    b.name = 'CTA'; add(c, b, 'FILL');
    if (sold) {
      const s = inst('Stamp', { Color: 'Red' }, { Text: 'SOLD OUT' }); s.rotation = -8;
      absolute(c, s, 230, 70);
    }
    comps.push(c);
  }
  const set = figma.combineAsVariants(comps, DS);
  set.addComponentProperty('Show', 'TEXT', 'SHOW 1'); set.addComponentProperty('Time', 'TEXT', '15.00 – 17.00'); set.addComponentProperty('Seats', 'TEXT', 'Sisa 312 kursi');
  bindText(set, 'Show', 'Show'); bindText(set, 'Time', 'Time');
  const k = propKey(set, 'Seats');
  for (const c of set.children) if (!c.name.includes('Sold')) c.findOne(n => n.type === 'TEXT' && n.name === 'Seats').componentPropertyReferences = { characters: k };
  finishSet(set, 'Show Card', 'Kartu jadwal show di landing. Klik langsung ke form Data Diri. State Default, Hover, Sold Out.', 3, 460, 420);
}

async function buildOrderSummary() {
  const c = comp('Device=Desktop', 'VERTICAL'); c.counterAxisSizingMode = 'FIXED'; fixW(c, 320); pad(c, 24); gap(c, 16); rad(c, 'lg'); fill(c, 'bg/surface'); stroke(c, 'border/default');
  await effect(c, 'Shadow/Sticker');
  c.appendChild(await text('Ringkasan Pesanan', 'Heading/H3', 'text/brand', 'Title'));
  const ev = add(c, frame('HORIZONTAL', 'Event'), 'FILL'); ev.itemSpacing = 12; ev.counterAxisAlignItems = 'CENTER';
  const tile = fixedBox('Logo tile', 64, 64); rad(tile, 'md'); fill(tile, 'bg/brand'); stroke(tile, 'border/default'); tile.appendChild(logo(52)); ev.appendChild(tile);
  const evc = add(ev, frame('VERTICAL', 'Event text'), 'FILL'); evc.itemSpacing = 2;
  await para(evc, 'Aku, Kau & Musik', 'Body/M', 'text/strong', null, 'Event name');
  await para(evc, 'Show 1 · 15.00–17.00 WIB', 'Caption', 'text/secondary', null, 'Show value');
  divider(c);
  for (const [label, value, nm] of [['Tanggal', 'Kamis, 29 Okt 2026', 'Date value'], ['Lokasi', 'Makara Art Center UI', 'Venue value'], ['Pemesan', 'Dinda Aulia', 'Buyer value'], ['Kursi', 'C9, C10', 'Seats value']]) {
    const r = add(c, frame('HORIZONTAL', label + ' row'), 'FILL'); r.primaryAxisAlignItems = 'SPACE_BETWEEN'; r.itemSpacing = 12;
    r.appendChild(await text(label, 'Body/S', 'text/secondary', label + ' label'));
    const v = await text(value, 'Body/S', 'text/strong', nm); v.textAlignHorizontal = 'RIGHT'; r.appendChild(v);
  }
  divider(c, 'border/subtle', true);
  const line = add(c, frame('HORIZONTAL', 'Line row'), 'FILL'); line.primaryAxisAlignItems = 'SPACE_BETWEEN';
  line.appendChild(await text('Tipe 1 × 2', 'Body/S', 'text/primary', 'Line label'));
  line.appendChild(await text('Rp XX.XXX', 'Body/S', 'text/primary', 'Line value'));
  const tot = add(c, frame('HORIZONTAL', 'Total row'), 'FILL'); tot.primaryAxisAlignItems = 'SPACE_BETWEEN'; tot.counterAxisAlignItems = 'CENTER';
  tot.appendChild(await text('Total', 'Heading/H4', 'text/strong', 'Total label'));
  tot.appendChild(await text('Rp XX.XXX', 'Heading/H3', 'text/brand', 'Total value'));
  const b = button('Primary', 'Lanjut ke Pembayaran', { icon: 'arrow-right' }); b.name = 'CTA'; add(c, b, 'FILL');
  await para(c, 'Kursi ditahan 10 menit setelah kamu lanjut.', 'Caption', 'text/secondary', 'CENTER', 'Note');
  const set = figma.combineAsVariants([c], DS);
  set.addComponentProperty('Show CTA', 'BOOLEAN', true); set.addComponentProperty('Show note', 'BOOLEAN', true);
  bindVisible(set, 'CTA', 'Show CTA'); bindVisible(set, 'Note', 'Show note');
  finishSet(set, 'Order Summary', 'Ringkasan pesanan sticky di kolom kanan desktop. Teks diisi per layar (Show value, Buyer value, Seats value, Line, Total).', 1, 0, 0);
}

async function buildBottomBar() {
  const c = comp('Device=Mobile'); c.primaryAxisSizingMode = 'FIXED'; fixW(c, 390); c.counterAxisAlignItems = 'CENTER'; pad(c, 12, 16); gap(c, 12); fill(c, 'bg/surface');
  c.strokes = [paint('border/default')]; c.strokeTopWeight = 2; c.strokeBottomWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0;
  const col = add(c, frame('VERTICAL', 'Info'), 'FILL'); col.itemSpacing = 0;
  await para(col, '2 kursi · C9, C10', 'Caption', 'text/secondary', null, 'Info value');
  col.appendChild(await text('Rp XX.XXX', 'Heading/H3', 'text/brand', 'Total value'));
  const b = button('Primary', 'Lanjut', { icon: 'arrow-right' }); b.name = 'CTA'; c.appendChild(b);
  const set = figma.combineAsVariants([c], DS);
  finishSet(set, 'Bottom Bar', 'Bar CTA sticky di bawah layar mobile (ringkasan + tombol utama).', 1, 0, 0);
}

async function buildNavbar() {
  const d = comp('Device=Desktop'); d.primaryAxisSizingMode = 'FIXED'; fixW(d, 1440); d.primaryAxisAlignItems = 'SPACE_BETWEEN'; d.counterAxisAlignItems = 'CENTER'; pad(d, 12, 80); fill(d, 'bg/brand');
  d.strokes = [paint('border/default')]; d.strokeTopWeight = 0; d.strokeLeftWeight = 0; d.strokeRightWeight = 0; d.strokeBottomWeight = 3;
  d.appendChild(logo(80));
  const right = frame('HORIZONTAL', 'Right'); right.itemSpacing = 40; right.counterAxisAlignItems = 'CENTER'; d.appendChild(right);
  const links = frame('HORIZONTAL', 'Links'); links.itemSpacing = 32; right.appendChild(links);
  links.appendChild(await text('Beranda', 'Label/M', 'text/accent', 'Link Beranda'));
  links.appendChild(await text('About Us', 'Label/M', 'text/on-brand', 'Link About'));
  const b = button('Accent', 'Beli Tiket', { icon: 'ticket' }); b.name = 'CTA'; right.appendChild(b);
  const m = comp('Device=Mobile'); m.primaryAxisSizingMode = 'FIXED'; fixW(m, 390); m.primaryAxisAlignItems = 'SPACE_BETWEEN'; m.counterAxisAlignItems = 'CENTER'; pad(m, 8, 16); fill(m, 'bg/brand');
  m.strokes = [paint('border/default')]; m.strokeTopWeight = 0; m.strokeLeftWeight = 0; m.strokeRightWeight = 0; m.strokeBottomWeight = 3;
  m.appendChild(logo(60));
  const mr = frame('HORIZONTAL', 'Right'); mr.itemSpacing = 12; mr.counterAxisAlignItems = 'CENTER'; m.appendChild(mr);
  const mlinks = frame('HORIZONTAL', 'Links'); mr.appendChild(mlinks);
  mlinks.appendChild(await text('About Us', 'Label/M', 'text/on-brand', 'Link About'));
  const mb = fixedBox('Menu', 44, 44); mb.appendChild(icon('menu', 'text/on-brand')); mr.appendChild(mb); mb.name = 'Menu';
  const set = figma.combineAsVariants([d, m], DS);
  set.addComponentProperty('Show CTA', 'BOOLEAN', true); set.addComponentProperty('Show links', 'BOOLEAN', true);
  bindVisible(set, 'CTA', 'Show CTA'); bindVisible(set, 'Links', 'Show links');
  finishSet(set, 'Navbar', 'Navbar hijau. Halaman checkout: Show CTA = off.', 1, 0, 120);
}

async function buildFooter() {
  const make = async (dev) => {
    const D = dev === 'Desktop';
    const c = comp('Device=' + dev, 'VERTICAL'); c.counterAxisSizingMode = 'FIXED'; fixW(c, D ? 1440 : 390); pad(c, D ? 64 : 40, D ? 80 : 16); gap(c, D ? 40 : 32); fill(c, 'bg/brand-strong');
    const top = add(c, frame(D ? 'HORIZONTAL' : 'VERTICAL', 'Top'), 'FILL'); top.itemSpacing = D ? 80 : 32;
    const brand = frame('VERTICAL', 'Brand'); brand.itemSpacing = 16; top.appendChild(brand);
    if (D) { brand.counterAxisSizingMode = 'FIXED'; fixW(brand, 420); } else brand.layoutSizingHorizontal = 'FILL';
    brand.appendChild(logo(120));
    await para(brand, 'Teater musikal karya mahasiswa Stage Performing Arts, Produksi Media, Sekolah Vokasi UI, berkolaborasi dengan Juzzer.', 'Body/S', 'text/on-brand');
    const cols = [
      ['Jadwal', [['calendar', 'Kamis, 29 Oktober 2026'], ['clock', 'Show 1 · 15.00–17.00 WIB'], ['clock', 'Show 2 · 19.00–21.00 WIB'], ['map-pin', 'Makara Art Center UI, Depok']]],
      ['Kontak', [['instagram', '@stage.ui (Instagram & TikTok)'], ['mail', 'stagepromedui@gmail.com'], ['phone', 'Hana · 0859-0001-8942']]],
    ];
    for (const [title, rows] of cols) {
      const col = frame('VERTICAL', title); col.itemSpacing = 12; top.appendChild(col);
      if (D) col.layoutGrow = 1; else col.layoutSizingHorizontal = 'FILL';
      col.appendChild(await text(title, 'Heading/H3', 'text/accent'));
      for (const [ic, label] of rows) {
        const r = frame('HORIZONTAL', label); r.itemSpacing = 8; r.counterAxisAlignItems = 'CENTER'; col.appendChild(r);
        r.appendChild(icon(ic, 'text/on-brand', 18));
        r.appendChild(await text(label, 'Body/S', 'text/on-brand'));
      }
    }
    const l = figma.createLine(); l.resize(100, 0); l.strokes = [paint('text/on-brand')]; l.opacity = 0.3; l.strokeWeight = 1; add(c, l, 'FILL');
    await para(c, '© 2026 Stage UI · Presented by Juzzer × Stage Universitas Indonesia', 'Caption', 'text/on-brand', D ? null : 'CENTER');
    return c;
  };
  const set = figma.combineAsVariants([await make('Desktop'), await make('Mobile')], DS);
  finishSet(set, 'Footer', 'Footer hijau tua: info jadwal & kontak panitia.', 1, 0, 400);
}

async function buildFoundations() {
  const f = frame('VERTICAL', 'Foundations'); pad(f, 32); gap(f, 32); fill(f, 'bg/surface'); f.cornerRadius = 20;
  DS.appendChild(f);
  f.appendChild(await text('Foundations', 'Heading/H1', 'text/brand'));
  f.appendChild(await text('Warna (AKM Color → alias ke Hijau / Kuning / Merah / Item / Abu)', 'Heading/H4', 'text/strong'));
  const sw = frame('HORIZONTAL', 'Swatches'); sw.layoutWrap = 'WRAP'; sw.itemSpacing = 16; sw.counterAxisSpacing = 16; f.appendChild(sw);
  sw.primaryAxisSizingMode = 'FIXED'; fixW(sw, 1100);
  const toks = ['bg/brand', 'bg/brand-strong', 'bg/brand-soft', 'bg/accent', 'bg/accent-strong', 'bg/accent-soft', 'bg/danger', 'bg/danger-soft', 'bg/page', 'bg/surface', 'bg/muted', 'bg/disabled', 'bg/inverse', 'seat/tipe1', 'seat/tipe2', 'seat/tipe3', 'seat/tipe4', 'seat/vip', 'seat/selected', 'seat/taken', 'seat/stage'];
  for (const t of toks) {
    const s = frame('VERTICAL', t); s.itemSpacing = 6; sw.appendChild(s);
    const r = figma.createRectangle(); r.resize(120, 64); r.cornerRadius = 8; fill(r, t); r.strokes = [paint('border/default')]; r.strokeWeight = 1; s.appendChild(r);
    s.appendChild(await text(t, 'Caption', 'text/primary'));
  }
  f.appendChild(await text('Tipografi (Kirang Haerang untuk heading, Bootzy TM untuk body)', 'Heading/H4', 'text/strong'));
  const ty = frame('VERTICAL', 'Type scale'); ty.itemSpacing = 12; f.appendChild(ty);
  for (const name of Object.keys(TS)) {
    const r = frame('HORIZONTAL', name); r.itemSpacing = 24; r.counterAxisAlignItems = 'BASELINE'; ty.appendChild(r);
    const l = await text(name, 'Caption', 'text/secondary'); l.textAutoResize = 'HEIGHT'; l.resize(120, l.height); r.appendChild(l);
    r.appendChild(await text(name.startsWith('Display') ? 'Aku Kau & Musik' : 'Harmoni Asa dan Musik', name, 'text/strong'));
  }
  f.appendChild(await text('Spacing 4–128 · Radius 6 / 12 / 20 / 32 / full · Stroke 1 / 2 / 3 · Shadow/Sticker = 4px offset tanpa blur', 'Body/S', 'text/secondary'));
  place(f);
}

// =====================================================================
// SEAT MAP
// =====================================================================
const CENTER = { A: 10, B: 13, C: 13, D: 13, E: 12, F: 13, G: 13, H: 14, I: 15, J: 16, K: 16, L: 17, M: 18, N: 20, O: 19 };
const SIDE = { A: 6, B: 6, C: 6, D: 6, E: 6, F: 7, G: 7, H: 7, I: 7, J: 6, K: 6, L: 6, M: 5, N: 5, O: 3 };
const ROWS = 'ABCDEFGHIJKLMNO'.split('');
const centerTier = r => 'ABCDG'.includes(r) ? 'Tipe 1' : 'EF'.includes(r) ? 'VIP' : 'Tipe 2';
const sideTier = r => 'ABCDEFG'.includes(r) ? 'Tipe 3' : 'Tipe 4';
// ponytail: deterministic fake occupancy for the mockup; real data comes from the backend.
const isTaken = (r, n) => (r.charCodeAt(0) * 131 + n * 977) % 101 < 23;

async function seatMap(o) {
  o = o || {};
  const selected = o.selected || [];
  const map = frame('VERTICAL', 'Seat map'); map.counterAxisAlignItems = 'CENTER'; map.itemSpacing = 6;
  const stage = fixedBox('Stage', 600, 36); rad(stage, 'md'); fill(stage, 'seat/stage'); stroke(stage, 'border/default', 'stroke/thin');
  stage.appendChild(await text('PANGGUNG', 'Label/M', 'text/strong')); map.appendChild(stage);
  const spacer = fixedBox('Spacer', 10, 10); map.appendChild(spacer);
  for (const r of ROWS) {
    const row = frame('HORIZONTAL', 'Row ' + r); row.itemSpacing = 16; row.counterAxisAlignItems = 'CENTER'; map.appendChild(row);
    const label = async () => { const t = await text(r, 'Caption', 'text/secondary', 'Row label'); t.textAutoResize = 'HEIGHT'; t.resize(20, t.height); t.textAlignHorizontal = 'CENTER'; return t; };
    row.appendChild(await label());
    const L = SIDE[r], M = CENTER[r];
    const block = (count, start, tier, align, slots, name) => {
      const b = frame('HORIZONTAL', name); b.itemSpacing = 4; b.primaryAxisSizingMode = 'FIXED'; b.resize(slots * 20 + (slots - 1) * 4, 20); b.primaryAxisAlignItems = align; row.appendChild(b);
      for (let i = 0; i < count; i++) {
        const num = start - i, id = r + num;
        let st = 'Available';
        if (selected.includes(id)) st = 'Selected';
        else if (o.hover === id) st = 'Hover';
        else if (tier === 'VIP') st = o.invUnlocked ? 'Available' : 'Locked';
        else if (isTaken(r, num)) st = 'Taken';
        const s = inst('Seat', { Tier: tier, State: st }); s.name = id; b.appendChild(s);
      }
    };
    // Numbered right to left: rightmost seat of the right wing is 1, leftmost seat of the left wing is last.
    block(L, 2 * L + M, sideTier(r), 'MAX', 7, 'Left');
    block(M, L + M, centerTier(r), 'CENTER', 20, 'Center');
    block(L, L, sideTier(r), 'MIN', 7, 'Right');
    row.appendChild(await label());
  }
  return map;
}

async function legendRow(D) {
  const l = frame('HORIZONTAL', 'Legend'); l.layoutWrap = 'WRAP'; l.itemSpacing = D ? 20 : 12; l.counterAxisSpacing = 8;
  for (const t of ['Tipe 1', 'Tipe 2', 'Tipe 3', 'Tipe 4', 'VIP', 'Dipilih', 'Terisi']) l.appendChild(inst('Seat Legend', { Type: t }));
  return l;
}

// =====================================================================
// SCREENS
// =====================================================================
function screen(name, D) {
  const s = frame('VERTICAL', name);
  s.counterAxisSizingMode = 'FIXED'; fixW(s, D ? 1440 : 390); s.primaryAxisSizingMode = 'AUTO';
  fill(s, 'bg/page'); s.clipsContent = true;
  return s;
}
function nav(s, D, cta) { const n = inst('Navbar', { Device: D ? 'Desktop' : 'Mobile' }, { 'Show CTA': cta !== false, 'Show links': true }); add(s, n, 'FILL'); return n; }
function footer(s, D) { add(s, inst('Footer', { Device: D ? 'Desktop' : 'Mobile' }), 'FILL'); }
function section(parent, name, D, py, bg) {
  const f = add(parent, frame('VERTICAL', name), 'FILL');
  pad(f, py === undefined ? (D ? 96 : 48) : py, D ? 80 : 16); gap(f, D ? 40 : 24);
  if (bg) fill(f, bg);
  return f;
}
function addGraph(f, w, h) { absolute(f, graph(Math.ceil(w), Math.ceil(h)), 0, 0, true); }
async function card(parent, name, D) {
  const c = frame('VERTICAL', name); pad(c, D ? 32 : 20); gap(c, D ? 24 : 20); rad(c, 'lg'); fill(c, 'bg/surface'); stroke(c, 'border/default');
  await effect(c, 'Shadow/Sticker');
  add(parent, c, 'FILL');
  return c;
}
async function infoChip(parent, ic, label) {
  const c = frame('HORIZONTAL', 'Chip/' + label); c.itemSpacing = 8; c.counterAxisAlignItems = 'CENTER'; pad(c, 8, 16); rad(c, 'full'); fill(c, 'bg/surface'); stroke(c, 'border/default');
  c.appendChild(icon(ic, 'text/brand', 20));
  c.appendChild(await text(label, 'Label/M', 'text/strong'));
  parent.appendChild(c);
  return c;
}

async function marquee(D) {
  const b = frame('VERTICAL', 'Marquee board');
  b.counterAxisSizingMode = 'FIXED'; fixW(b, D ? 880 : 358); b.counterAxisAlignItems = 'CENTER'; b.clipsContent = true;
  pad(b, D ? 56 : 36, D ? 64 : 20); gap(b, D ? 8 : 4); fill(b, 'bg/surface'); rad(b, 'xl');
  b.strokes = [paint('border/danger')]; b.strokeWeight = D ? 12 : 8; b.strokeAlign = 'INSIDE';
  await effect(b, 'Shadow/Sticker-L');
  b.appendChild(await text('TEATER MUSIKAL', 'Heading/H3', 'text/primary'));
  await para(b, D ? 'AKU KAU & MUSIK' : 'AKU KAU\n& MUSIK', D ? 'Display/XL' : 'Display/L', 'text/danger', 'CENTER', 'Title');
  b.appendChild(await text('Harmoni Asa dan Musik', D ? 'Heading/H2' : 'Heading/H3', 'text/brand'));
  addGraph(b, b.width, b.height);
  const n = D ? 24 : 11, inset = D ? 22 : 16, step = (b.width - inset * 2) / (n - 1);
  for (const y of [D ? 18 : 12, b.height - (D ? 30 : 22)]) for (let i = 0; i < n; i++) {
    const e = figma.createEllipse(); e.name = 'Light'; e.resize(D ? 12 : 9, D ? 12 : 9); fill(e, 'bg/accent'); e.strokes = [paint('border/default')]; e.strokeWeight = 1;
    absolute(b, e, inset + i * step - 6, y);
  }
  return b;
}

async function landing(D) {
  const s = screen(`01 Landing — ${D ? 'Desktop' : 'Mobile'}`, D);
  nav(s, D);
  const hero = section(s, 'Hero', D, D ? 64 : 40, 'bg/brand');
  rawPad(hero, 'paddingTop', D ? 168 : 104); hero.counterAxisAlignItems = 'CENTER'; hero.clipsContent = true; gap(hero, D ? 32 : 24);
  await para(hero, 'Presented by Juzzer × Stage Universitas Indonesia', 'Label/M', 'text/accent', 'CENTER');
  hero.appendChild(await marquee(D));
  const chips = frame(D ? 'HORIZONTAL' : 'VERTICAL', 'Info chips'); chips.itemSpacing = 12; chips.counterAxisAlignItems = 'CENTER'; hero.appendChild(chips);
  await infoChip(chips, 'calendar', 'Kamis, 29 Oktober 2026');
  await infoChip(chips, 'map-pin', 'Makara Art Center UI, Depok');
  await infoChip(chips, 'clock', '2 show · 15.00 & 19.00 WIB');
  const ctas = frame(D ? 'HORIZONTAL' : 'VERTICAL', 'CTAs'); ctas.itemSpacing = 16; hero.appendChild(ctas);
  if (!D) ctas.layoutSizingHorizontal = 'FILL';
  const b1 = button('Accent', 'Pilih Jadwal Show', { icon: 'arrow-right' }); ctas.appendChild(b1); if (!D) b1.layoutSizingHorizontal = 'FILL';
  const b2 = button('Secondary', 'Tentang Pertunjukan'); ctas.appendChild(b2); if (!D) b2.layoutSizingHorizontal = 'FILL';
  addGraph(hero, hero.width, hero.height);
  const val = valance(D ? 1440 : 390, D ? 120 : 64, D ? 12 : 5); absolute(hero, val, 0, 0);
  absolute(hero, drape(hero.height, D ? 48 : 14), 0, 0); absolute(hero, drape(hero.height, D ? 48 : 14), (D ? 1440 : 390) - (D ? 48 : 14), 0);
  if (D) { absolute(hero, star(120, 12, 0.6), 1180, 260); absolute(hero, star(80, 10, 0.55), 150, 520); }
  else absolute(hero, star(64, 12, 0.6), 300, 92);

  const shows = section(s, 'Pilih Show', D); shows.counterAxisAlignItems = 'CENTER';
  const head = add(shows, frame('VERTICAL', 'Heading'), 'FILL'); head.itemSpacing = 8; head.counterAxisAlignItems = 'CENTER';
  await para(head, 'Pilih jadwal nontonmu', D ? 'Heading/H1' : 'Heading/H2', 'text/brand', 'CENTER');
  await para(head, 'Pilih show, isi data, pilih kursi, bayar. Maks. 4 tiket per transaksi.', 'Body/L', 'text/secondary', 'CENTER');
  const row = frame(D ? 'HORIZONTAL' : 'VERTICAL', 'Show cards'); row.itemSpacing = D ? 32 : 16; shows.appendChild(row);
  if (!D) row.layoutSizingHorizontal = 'FILL';
  for (const [n, time, seats] of [['1', '15.00 – 17.00', 'Sisa 312 kursi'], ['2', '19.00 – 21.00', 'Sisa 248 kursi']]) {
    const c = inst('Show Card', { State: 'Default' }, { Show: 'SHOW ' + n, Time: time, Seats: seats });
    setProps(c.findOne(x => x.name === 'CTA'), { Label: 'Pilih Show ' + n });
    row.appendChild(c); if (!D) c.layoutSizingHorizontal = 'FILL';
  }
  const tiers = add(shows, frame('VERTICAL', 'Kategori'), 'FILL'); tiers.itemSpacing = 16; tiers.counterAxisAlignItems = 'CENTER';
  await para(tiers, 'Kategori & harga tiket', D ? 'Heading/H2' : 'Heading/H3', 'text/strong', 'CENTER');
  const grid = frame('HORIZONTAL', 'Tier grid'); grid.layoutWrap = 'WRAP'; grid.itemSpacing = D ? 24 : 16; grid.counterAxisSpacing = 16; tiers.appendChild(grid);
  if (!D) { grid.layoutSizingHorizontal = 'FILL'; }
  for (const t of Object.keys(TIERS)) { const tc = inst('Tier Card', { Tier: t }); grid.appendChild(tc); if (!D) fixW(tc, 171); }
  await para(tiers, 'Harga masih placeholder. Kursi VIP (baris E–F tengah) khusus tamu undangan dengan kode.', 'Caption', 'text/secondary', 'CENTER');
  addGraph(shows, shows.width, shows.height);
  footer(s, D);
  return s;
}

async function about(D) {
  const s = screen(`02 About Us — ${D ? 'Desktop' : 'Mobile'}`, D);
  nav(s, D);
  const head = section(s, 'Header', D, D ? 80 : 48, 'bg/brand'); rawPad(head, 'paddingTop', D ? 140 : 88); head.clipsContent = true; gap(head, 12);
  head.appendChild(await text('About Us', D ? 'Display/L' : 'Heading/H1', 'text/accent'));
  await para(head, 'Kenalan dulu sama pertunjukan, tim, dan cerita di balik Aku, Kau & Musik.', 'Body/L', 'text/on-brand');
  absolute(head, valance(D ? 1440 : 390, D ? 96 : 56, D ? 12 : 5), 0, 0);
  addGraph(head, head.width, head.height);

  // What is it
  const what = section(s, 'Apa itu AKM', D);
  const wrow = add(what, frame(D ? 'HORIZONTAL' : 'VERTICAL', 'Row'), 'FILL'); wrow.itemSpacing = D ? 64 : 32; wrow.counterAxisAlignItems = 'CENTER';
  const wcol = add(wrow, frame('VERTICAL', 'Text'), 'FILL'); wcol.itemSpacing = 16;
  await para(wcol, 'Apa itu Aku, Kau & Musik?', D ? 'Heading/H1' : 'Heading/H2', 'text/brand');
  await para(wcol, 'Aku, Kau & Musik adalah IP karya mahasiswa peminatan Stage Performing Arts, Produksi Media UI angkatan 2024, berkolaborasi dengan Juzzer, band asal UI. Proyek ini jadi tugas akhir sekaligus penilaian magang di Jakarta Movin.', 'Body/L', 'text/primary');
  await para(wcol, 'Ceritanya tentang perjuangan mahasiswa meraih beasiswa penuh lewat bakat dan kerja keras, di tengah beratnya beban UKT. Lewat akting dan live music, kami mau bilang: keterbatasan biaya nggak boleh memadamkan mimpi.', 'Body/L', 'text/primary');
  const pics = frame('HORIZONTAL', 'Polaroids'); pics.itemSpacing = D ? -24 : -16; pics.counterAxisAlignItems = 'CENTER'; wrow.appendChild(pics);
  pics.appendChild(await polaroid(D ? 240 : 150, D ? 280 : 170, 'Latihan perdana', -4));
  pics.appendChild(await polaroid(D ? 240 : 150, D ? 280 : 170, 'Live with Juzzer', 3));

  // Theme sticky note
  const theme = section(s, 'Tema', D, D ? 48 : 32); theme.counterAxisAlignItems = 'CENTER';
  const note = frame('VERTICAL', 'Sticky note'); note.counterAxisSizingMode = 'FIXED'; fixW(note, D ? 760 : 340); pad(note, D ? 40 : 24); gap(note, 12); fill(note, 'bg/accent-soft'); stroke(note, 'border/default');
  await effect(note, 'Shadow/Sticker-L'); note.rotation = -1.5; theme.appendChild(note);
  note.appendChild(await text('TEMA UTAMA', 'Label/M', 'text/danger'));
  await para(note, 'Harmoni Asa dan Musik', D ? 'Heading/H1' : 'Heading/H2', 'text/brand');
  await para(note, 'Nyatuin harapan, cerita hidup, dan alunan musik jadi satu pementasan utuh, sebuah ruang bebas buat seniman dan penonton untuk saling connect dan berekspresi.', 'Body/L', 'text/primary');
  absolute(note, tape(96), D ? 332 : 122, -10);

  // Vision & mission
  const vm = section(s, 'Visi Misi', D);
  const vrow = add(vm, frame(D ? 'HORIZONTAL' : 'VERTICAL', 'Row'), 'FILL'); vrow.itemSpacing = 24;
  const visi = frame('VERTICAL', 'Visi'); pad(visi, D ? 32 : 24); gap(visi, 12); rad(visi, 'lg'); fill(visi, 'bg/brand'); stroke(visi, 'border/default'); await effect(visi, 'Shadow/Sticker'); add(vrow, visi, 'FILL');
  visi.appendChild(await text('Visi', 'Heading/H2', 'text/accent'));
  await para(visi, 'Menjadikan teater musikal seni yang terbuka dan dekat dengan anak muda, sekaligus menyuarakan realita perjuangan mahasiswa yang terhalang biaya pendidikan.', 'Body/L', 'text/on-brand');
  const misi = frame('VERTICAL', 'Misi'); pad(misi, D ? 32 : 24); gap(misi, 12); rad(misi, 'lg'); fill(misi, 'bg/surface'); stroke(misi, 'border/default'); await effect(misi, 'Shadow/Sticker'); add(vrow, misi, 'FILL');
  misi.appendChild(await text('Misi', 'Heading/H2', 'text/brand'));
  for (const [i, m] of ['Jadi wadah solusi lewat pementasan yang menjawab keresahan soal UKT.', 'Menyuarakan harapan lewat kisah perjuangan meraih beasiswa.', 'Mengajak publik dan mitra mendukung pendidikan generasi muda.'].entries()) {
    const r = add(misi, frame('HORIZONTAL', 'Misi ' + (i + 1)), 'FILL'); r.itemSpacing = 12;
    const n = fixedBox('Num', 28, 28); rad(n, 'full'); fill(n, 'bg/accent'); stroke(n, 'border/default'); n.appendChild(await text(String(i + 1), 'Label/M', 'text/strong')); r.appendChild(n);
    await para(r, m, 'Body/M', 'text/primary');
  }

  // Cast
  const cast = section(s, 'Cast', D, undefined, 'bg/inverse'); cast.counterAxisAlignItems = 'CENTER';
  await para(cast, 'Meet Our Cast!', D ? 'Display/L' : 'Heading/H1', 'text/accent', 'CENTER');
  const crow = frame(D ? 'HORIZONTAL' : 'VERTICAL', 'Main cast'); crow.itemSpacing = D ? 48 : 24; crow.counterAxisAlignItems = 'CENTER'; cast.appendChild(crow);
  for (const [role, name, rot] of [['Athar', 'Albian Athaya Putra', -3], ['Dinda', 'Yokhebed Chelsee Radeyla', 3]]) {
    const p = await polaroid(D ? 260 : 220, D ? 300 : 240, `${name} as ${role}`, rot); crow.appendChild(p);
  }
  cast.appendChild(await text('ENSEMBLE', 'Heading/H3', 'text/accent'));
  const ens = add(cast, frame('HORIZONTAL', 'Ensemble'), 'FILL'); ens.layoutWrap = 'WRAP'; ens.itemSpacing = 12; ens.counterAxisSpacing = 12; ens.primaryAxisAlignItems = 'CENTER';
  for (const n of ['Nallegra Linggar', 'Kinara Syahla Naura', 'Chella Ernawati', 'M. Putra Januar', 'Rifano Chandra Kurniawan', 'Nathaniel Hans Gunawan']) {
    const c = frame('HORIZONTAL', n); pad(c, 8, 16); rad(c, 'full'); fill(c, 'bg/surface'); stroke(c, 'border/default'); c.appendChild(await text(n, 'Label/M', 'text/strong')); ens.appendChild(c);
  }
  absolute(cast, star(D ? 96 : 56, 12, 0.6), D ? 1240 : 320, D ? 60 : 24);

  // Collaborators
  const col = section(s, 'Kolaborasi', D);
  await para(col, 'Di balik panggung', D ? 'Heading/H1' : 'Heading/H2', 'text/brand');
  const grid = add(col, frame(D ? 'HORIZONTAL' : 'VERTICAL', 'Partners'), 'FILL'); grid.itemSpacing = 24;
  for (const [t, d, ic] of [['Stage UI', 'Peminatan Stage Performing Arts, Produksi Media, Sekolah Vokasi UI. Penggagas dan produksi pertunjukan.', 'ticket'], ['Juzzer', 'Band asal UI. Lagu-lagunya jadi tulang punggung cerita, dibawakan live di panggung.', 'music'], ['Jakarta Movin', 'Rumah produksi teater musikal (Musikal Petualangan Sherina) yang mensupervisi produksi ini.', 'users']]) {
    const c = frame('VERTICAL', t); pad(c, 24); gap(c, 12); rad(c, 'lg'); fill(c, 'bg/surface'); stroke(c, 'border/default'); await effect(c, 'Shadow/Sticker'); add(grid, c, 'FILL');
    const ib = fixedBox('Icon', 48, 48); rad(ib, 'md'); fill(ib, 'bg/accent'); stroke(ib, 'border/default'); ib.appendChild(icon(ic, 'text/strong')); c.appendChild(ib);
    c.appendChild(await text(t, 'Heading/H3', 'text/strong'));
    await para(c, d, 'Body/M', 'text/secondary');
  }

  // Contact chalkboard + CTA
  const cta = section(s, 'CTA', D, D ? 80 : 48, 'bg/accent'); cta.counterAxisAlignItems = 'CENTER';
  await para(cta, 'Udah siap nonton?', D ? 'Display/L' : 'Heading/H1', 'text/brand', 'CENTER');
  await para(cta, 'Kamis, 29 Oktober 2026 · Makara Art Center UI · 2 show', 'Body/L', 'text/primary', 'CENTER');
  const b = button('Primary', 'Pilih Jadwal Show', { icon: 'arrow-right' }); cta.appendChild(b); if (!D) b.layoutSizingHorizontal = 'FILL';
  footer(s, D);
  return s;
}

// --- checkout scaffolding ---
async function checkout(name, D, step) {
  const s = screen(name, D);
  nav(s, D, false);
  const top = section(s, 'Top bar', D, D ? 24 : 16);
  sp(top, 'paddingBottom', 0);
  if (D) {
    top.layoutMode = 'HORIZONTAL'; top.layoutSizingHorizontal = 'FILL'; top.primaryAxisAlignItems = 'SPACE_BETWEEN'; top.counterAxisAlignItems = 'CENTER';
    const back = button('Ghost', 'Kembali', { icon: 'arrow-left' }); top.appendChild(back);
    top.appendChild(inst('Stepper', { Device: 'Desktop', Step: String(step) }));
    const sp2 = fixedBox('Spacer', back.width, 10); top.appendChild(sp2);
  } else {
    const st = inst('Stepper', { Device: 'Mobile', Step: String(step) }); add(top, st, 'FILL');
  }
  const main = add(s, frame(D ? 'HORIZONTAL' : 'VERTICAL', 'Main'), 'FILL');
  pad(main, D ? 32 : 16, D ? 80 : 16); sp(main, 'paddingBottom', D ? 96 : 24); gap(main, D ? 24 : 16);
  const left = add(main, frame('VERTICAL', 'Content'), 'FILL'); gap(left, D ? 24 : 16);
  let right = null;
  if (D) { right = frame('VERTICAL', 'Aside'); gap(right, 16); right.counterAxisSizingMode = 'FIXED'; fixW(right, 320); main.appendChild(right); }
  return { s, left, right, main };
}
function summary(o) {
  const sm = inst('Order Summary', { Device: 'Desktop' }, { 'Show CTA': !!o.cta, 'Show note': !!o.note });
  setText(sm, 'Show value', o.show || 'Show 1 · 15.00–17.00 WIB');
  setText(sm, 'Buyer value', o.buyer || 'Dinda Aulia');
  setText(sm, 'Seats value', o.seats || 'C9, C10');
  setText(sm, 'Line label', o.lineLabel || 'Tipe 1 × 2');
  setText(sm, 'Line value', o.lineValue || 'Rp XX.XXX');
  setText(sm, 'Total value', o.total || 'Rp XX.XXX');
  if (o.cta) setProps(sm.findOne(n => n.name === 'CTA'), { Label: o.cta });
  return sm;
}
function bottomBar(s, info, total, cta, state) {
  const bb = inst('Bottom Bar', { Device: 'Mobile' });
  setText(bb, 'Info value', info); setText(bb, 'Total value', total);
  const b = bb.findOne(n => n.name === 'CTA');
  if (state) setProps(b, { State: state });
  setProps(b, { Label: cta });
  add(s, bb, 'FILL');
  return bb;
}

async function dataDiri(D, err) {
  const { s, left, right } = await checkout(`03${err ? 'b' : ''} Data Diri${err ? ' (Error)' : ''} — ${D ? 'Desktop' : 'Mobile'}`, D, 1);
  const c = await card(left, 'Form card', D);
  const h = add(c, frame('VERTICAL', 'Header'), 'FILL'); h.itemSpacing = 8;
  await para(h, 'Data pemesan', 'Heading/H2', 'text/brand');
  await para(h, 'E-receipt dan e-tiket dikirim ke email & WhatsApp ini, jadi pastikan benar ya.', 'Body/M', 'text/secondary');
  if (err) add(c, inst('Alert', { Type: 'Error' }, { Title: 'Ada 3 data yang perlu dicek', Message: 'Perbaiki kolom bertanda merah, lalu lanjut lagi.' }), 'FILL');
  const fields = [
    err ? field('Error', 'Nama lengkap', 'Contoh: Dinda Aulia', 'Nama wajib diisi') : field('Filled', 'Nama lengkap', 'Dinda Aulia', 'Sesuai kartu identitas (KTP/KTM)'),
    err ? field('Error', 'Email', 'dinda.aulia@ui', 'Format email belum benar, contoh: nama@email.com') : field('Filled', 'Email', 'dinda.aulia@ui.ac.id', 'E-receipt dikirim ke sini'),
    err ? field('Filled', 'No. WhatsApp', '0812-3456-7890', 'Untuk info show & e-tiket') : field('Focus', 'No. WhatsApp', '0812-3456-78|', 'Untuk info show & e-tiket'),
    field('Default', 'Asal instansi', 'Contoh: Universitas Indonesia', 'Opsional', false),
  ];
  for (const f of fields) add(c, f, 'FILL');
  const q = add(c, frame('VERTICAL', 'Jumlah tiket'), 'FILL'); q.itemSpacing = 8;
  const ql = frame('HORIZONTAL', 'Label row'); ql.itemSpacing = 4; q.appendChild(ql);
  ql.appendChild(await text('Jumlah tiket', 'Label/M', 'text/strong')); ql.appendChild(await text('*', 'Label/M', 'text/danger'));
  q.appendChild(inst('Quantity', { State: 'Default' }));
  q.appendChild(await text('Maks. 4 tiket per transaksi. Kursinya kamu pilih di langkah berikutnya.', 'Caption', 'text/secondary'));
  divider(c);
  add(c, inst('Checkbox', { State: err ? 'Error' : 'Checked' }, { Label: 'Aku setuju dengan Syarat & Ketentuan pembelian tiket dan kebijakan refund.' }), 'FILL');
  if (D) {
    const act = add(c, frame('HORIZONTAL', 'Actions'), 'FILL'); act.primaryAxisAlignItems = 'MAX';
    act.appendChild(button('Primary', 'Lanjut Pilih Kursi', { icon: 'arrow-right' }));
    right.appendChild(summary({ buyer: err ? '—' : 'Dinda Aulia', seats: 'Dipilih di langkah 2', lineLabel: '2 tiket', lineValue: '—', total: 'Rp —' }));
  } else bottomBar(s, 'Show 1 · 2 tiket', 'Rp —', 'Lanjut Pilih Kursi');
  return s;
}

async function kursi(D) {
  const { s, left, right } = await checkout(`04 Pilih Kursi — ${D ? 'Desktop' : 'Mobile'}`, D, 2);
  const c = await card(left, 'Seat card', D);
  if (D) { rawPad(c, 'paddingLeft', 18); rawPad(c, 'paddingRight', 18); }
  const h = add(c, frame('HORIZONTAL', 'Header'), 'FILL'); h.primaryAxisAlignItems = 'SPACE_BETWEEN'; h.counterAxisAlignItems = 'CENTER'; h.itemSpacing = 12;
  const hc = add(h, frame('VERTICAL', 'Title'), 'FILL'); hc.itemSpacing = 4;
  await para(hc, 'Pilih 2 kursi', 'Heading/H2', 'text/brand');
  await para(hc, 'Show 1 · Kamis, 29 Okt 2026 · 15.00 WIB', 'Body/S', 'text/secondary');
  const chip = frame('HORIZONTAL', 'Counter'); pad(chip, 6, 14); rad(chip, 'full'); fill(chip, 'bg/brand'); stroke(chip, 'border/default'); chip.appendChild(await text('2/2 dipilih', 'Label/M', 'text/on-brand')); h.appendChild(chip);
  add(c, await legendRow(D), 'FILL');
  const map = await seatMap({ selected: ['C9', 'C10'], hover: D ? 'D12' : null });
  if (D) {
    c.appendChild(map); c.counterAxisAlignItems = 'CENTER';
  } else {
    map.rescale(1.2);
    const vp = frame(null, 'Map viewport (scroll horizontal)'); vp.resize(318, Math.ceil(map.height) + 8); vp.clipsContent = true; fill(vp, 'bg/muted'); vp.cornerRadius = 12;
    add(c, vp, 'FILL');
    vp.appendChild(map); map.x = -Math.round((map.width - vp.width) / 2); map.y = 4;
    const tools = add(c, frame('HORIZONTAL', 'Map tools'), 'FILL'); tools.primaryAxisAlignItems = 'SPACE_BETWEEN'; tools.counterAxisAlignItems = 'CENTER';
    tools.appendChild(await text('← Geser untuk lihat semua kursi →', 'Caption', 'text/secondary'));
    const z = frame('HORIZONTAL', 'Zoom'); z.itemSpacing = 8; tools.appendChild(z);
    for (const sym of ['−', '+']) { const b = fixedBox('Zoom ' + sym, 44, 44); rad(b, 'md'); fill(b, 'bg/surface'); stroke(b, 'border/default'); b.appendChild(await text(sym, 'Heading/H3', 'text/strong')); z.appendChild(b); }
  }
  // VIP unlock via invitation code
  const inv = add(c, frame(D ? 'HORIZONTAL' : 'VERTICAL', 'VIP unlock'), 'FILL'); inv.itemSpacing = 16; inv.counterAxisAlignItems = D ? 'CENTER' : 'MIN';
  pad(inv, 16, 20); rad(inv, 'md'); fill(inv, 'bg/muted'); stroke(inv, 'border/subtle'); inv.dashPattern = [8, 6];
  inv.appendChild(icon('key', 'text/primary'));
  const it = add(inv, frame('VERTICAL', 'Text'), 'FILL'); it.itemSpacing = 2;
  await para(it, 'Punya kode undangan?', 'Body/M', 'text/strong');
  await para(it, 'Masukkan kode untuk membuka kursi VIP (baris E–F tengah).', 'Body/S', 'text/secondary');
  const ib = button('Secondary', 'Masukkan kode', { icon: 'key' }); inv.appendChild(ib); if (!D) ib.layoutSizingHorizontal = 'FILL';
  if (D) {
    right.appendChild(summary({ cta: 'Lanjut ke Pembayaran', note: true }));
    // hover tooltip near D12
    const seat = map.findOne(n => n.name === 'D12');
    const sb = seat.absoluteBoundingBox, cb = c.absoluteBoundingBox;
    const tip = frame('HORIZONTAL', 'Tooltip'); pad(tip, 8, 12); rad(tip, 'sm'); fill(tip, 'bg/inverse'); tip.appendChild(await text('D12 · Tipe 1 · Rp XX.XXX', 'Caption', 'text/on-brand'));
    absolute(c, tip, sb.x - cb.x - 80, sb.y - cb.y - 40);
  } else bottomBar(s, '2 kursi · C9, C10', 'Rp XX.XXX', 'Lanjut');
  return s;
}

async function kursiModal(base) {
  const s = base.clone(); s.name = '04b Kode Undangan (Modal) — Desktop';
  const ov = figma.createRectangle(); ov.name = 'Overlay'; ov.resize(s.width, s.height); fill(ov, 'bg/inverse'); ov.opacity = 0.6;
  absolute(s, ov, 0, 0);
  const m = frame('VERTICAL', 'Modal'); m.counterAxisSizingMode = 'FIXED'; fixW(m, 480); pad(m, 32); gap(m, 20); rad(m, 'lg'); fill(m, 'bg/surface'); stroke(m, 'border/default');
  await effect(m, 'Shadow/Sticker-L');
  const h = add(m, frame('HORIZONTAL', 'Header'), 'FILL'); h.primaryAxisAlignItems = 'SPACE_BETWEEN'; h.counterAxisAlignItems = 'CENTER';
  h.appendChild(await text('Masukkan kode undangan', 'Heading/H3', 'text/brand'));
  const x = fixedBox('Close', 44, 44); x.appendChild(icon('x', 'text/primary')); h.appendChild(x);
  await para(m, 'Kode ada di undangan dari panitia. Setelah valid, kursi VIP bisa dipilih.', 'Body/S', 'text/secondary');
  add(m, field('Error', 'Kode undangan', 'AKM-INV-12', 'Kode tidak ditemukan. Cek lagi huruf & angkanya.'), 'FILL');
  const act = add(m, frame('HORIZONTAL', 'Actions'), 'FILL'); act.primaryAxisAlignItems = 'MAX'; act.itemSpacing = 12;
  act.appendChild(button('Secondary', 'Batal')); act.appendChild(button('Primary', 'Buka Kursi', { icon: 'lock' }));
  absolute(s, m, (s.width - 480) / 2, 300);
  return s;
}

async function bayar(D, method) {
  const q = method === 'qris';
  const { s, left, right } = await checkout(`05${q ? '' : 'b'} Pembayaran ${q ? 'QRIS' : 'Transfer'} — ${D ? 'Desktop' : 'Mobile'}`, D, 3);
  add(left, inst('Alert', { Type: 'Warning' }, { Title: 'Selesaikan dalam 09:41', Message: 'Kalau waktu habis, kursi C9 & C10 dilepas lagi.' }), 'FILL');
  const c = await card(left, 'Payment card', D);
  await para(c, 'Pilih metode pembayaran', 'Heading/H2', 'text/brand');
  const opts = add(c, frame(D ? 'HORIZONTAL' : 'VERTICAL', 'Options'), 'FILL'); opts.itemSpacing = 16;
  const o1 = inst('Payment Option', { State: q ? 'Selected' : 'Default' }, { Title: 'QRIS', Description: 'Scan pakai e-wallet atau m-banking apa saja' });
  const o2 = inst('Payment Option', { State: q ? 'Default' : 'Selected' }, { Title: 'Transfer Bank', Description: 'Blu by BCA · dicek manual oleh panitia', Icon: ICONS['bank'].id });
  add(opts, o1, 'FILL'); add(opts, o2, 'FILL');
  const panel = add(c, frame(D && q ? 'HORIZONTAL' : 'VERTICAL', q ? 'QRIS panel' : 'Transfer panel'), 'FILL');
  pad(panel, 24); gap(panel, 24); rad(panel, 'md'); fill(panel, 'bg/brand-soft'); stroke(panel, 'border/brand');
  if (q) {
    const qr = fixedBox('QR', 200, 200); qr.layoutMode = 'VERTICAL'; qr.itemSpacing = 8; rad(qr, 'md'); fill(qr, 'bg/surface'); stroke(qr, 'border/default');
    qr.appendChild(icon('qr-code', 'text/strong', 120)); qr.appendChild(await text('QR placeholder', 'Caption', 'text/secondary'));
    panel.appendChild(qr); if (!D) panel.counterAxisAlignItems = 'CENTER';
    const col = add(panel, frame('VERTICAL', 'Steps'), 'FILL'); col.itemSpacing = 12;
    col.appendChild(await text('Total bayar', 'Caption', 'text/secondary'));
    col.appendChild(await text('Rp XX.XXX', 'Heading/H1', 'text/strong'));
    for (const [i, st] of ['Buka e-wallet atau m-banking kamu.', 'Scan QR, bayar persis sesuai total.', 'Screenshot bukti bayar, lalu upload di bawah.'].entries()) {
      const r = add(col, frame('HORIZONTAL', 'Step ' + (i + 1)), 'FILL'); r.itemSpacing = 12; r.counterAxisAlignItems = 'CENTER';
      const n = fixedBox('Num', 28, 28); rad(n, 'full'); fill(n, 'bg/accent'); stroke(n, 'border/default'); n.appendChild(await text(String(i + 1), 'Label/M', 'text/strong')); r.appendChild(n);
      await para(r, st, 'Body/M', 'text/primary');
    }
  } else {
    for (const [label, value, copy] of [['Bank', 'Blu by BCA', false], ['No. rekening', '0024 2879 9648', true], ['Atas nama', 'Hana Dwi Lathifah', false], ['Total transfer', 'Rp XX.XXX', true]]) {
      const r = add(panel, frame('HORIZONTAL', label), 'FILL'); r.primaryAxisAlignItems = 'SPACE_BETWEEN'; r.counterAxisAlignItems = 'CENTER';
      const col = frame('VERTICAL', 'Text'); col.itemSpacing = 2; r.appendChild(col);
      col.appendChild(await text(label, 'Caption', 'text/secondary'));
      col.appendChild(await text(value, label === 'Total transfer' ? 'Heading/H2' : 'Body/L', 'text/strong'));
      if (copy) r.appendChild(button('Ghost', 'Salin', { icon: 'copy' }));
    }
    await para(panel, 'Transfer persis sesuai total supaya verifikasi lebih cepat.', 'Caption', 'text/secondary');
  }
  await para(c, 'Upload bukti pembayaran', 'Heading/H4', 'text/strong');
  add(c, inst('Upload', { State: q ? 'Default' : 'Uploaded' }), 'FILL');
  if (D) {
    const act = add(c, frame('HORIZONTAL', 'Actions'), 'FILL'); act.primaryAxisAlignItems = 'MAX';
    act.appendChild(button('Primary', 'Kirim Bukti Pembayaran', { icon: 'arrow-right', state: q ? 'Disabled' : 'Default' }));
    right.appendChild(summary({}));
    add(right, inst('Alert', { Type: 'Info' }, { Title: 'Verifikasi manual', Message: 'Panitia cek pembayaranmu maks. 1×24 jam. E-tiket dikirim setelah terverifikasi.' }), 'FILL');
  } else bottomBar(s, 'Total · 2 kursi', 'Rp XX.XXX', 'Kirim Bukti', q ? 'Disabled' : 'Default');
  return s;
}

async function sukses(D) {
  const { s, left } = await checkout(`06 Sukses & Download E-Receipt — ${D ? 'Desktop' : 'Mobile'}`, D, 4);
  left.counterAxisAlignItems = 'CENTER';
  const c = frame('VERTICAL', 'Success card'); pad(c, D ? 48 : 24); gap(c, 24); rad(c, 'lg'); fill(c, 'bg/surface'); stroke(c, 'border/default'); c.counterAxisAlignItems = 'CENTER';
  await effect(c, 'Shadow/Sticker-L');
  left.appendChild(c);
  if (D) { c.counterAxisSizingMode = 'FIXED'; fixW(c, 720); } else c.layoutSizingHorizontal = 'FILL';
  const badge = fixedBox('Badge', 112, 112); rad(badge, 'full'); fill(badge, 'bg/accent'); stroke(badge, 'border/default', 'stroke/bold'); await effect(badge, 'Shadow/Sticker');
  badge.appendChild(icon('check-circle', 'text/brand', 64)); c.appendChild(badge);
  await para(c, 'Yeay, pesananmu tercatat!', D ? 'Heading/H1' : 'Heading/H2', 'text/brand', 'CENTER');
  await para(c, 'Bukti pembayaranmu sudah kami terima. Download e-receipt sekarang. E-tiket ber-QR dikirim ke email & WhatsApp setelah pembayaran terverifikasi (maks. 1×24 jam).', 'Body/L', 'text/primary', 'CENTER');
  const code = add(c, frame('HORIZONTAL', 'Booking code'), 'FILL'); code.primaryAxisAlignItems = 'SPACE_BETWEEN'; code.counterAxisAlignItems = 'CENTER';
  pad(code, 16, 20); rad(code, 'md'); fill(code, 'bg/accent-soft'); stroke(code, 'border/default'); code.dashPattern = [8, 6];
  const cc = frame('VERTICAL', 'Text'); cc.itemSpacing = 2; code.appendChild(cc);
  cc.appendChild(await text('Kode booking', 'Caption', 'text/secondary'));
  cc.appendChild(await text('AKM-291015-7F3K', D ? 'Heading/H2' : 'Heading/H3', 'text/strong'));
  code.appendChild(button('Ghost', 'Salin', { icon: 'copy' }));
  const rows = add(c, frame('VERTICAL', 'Details'), 'FILL'); rows.itemSpacing = 10;
  for (const [l, v] of [['Show', 'Show 1 · Kamis, 29 Okt 2026 · 15.00 WIB'], ['Kursi', 'C9, C10 (Tipe 1)'], ['Total', 'Rp XX.XXX']]) {
    const r = add(rows, frame('HORIZONTAL', l), 'FILL'); r.primaryAxisAlignItems = 'SPACE_BETWEEN'; r.itemSpacing = 12;
    r.appendChild(await text(l, 'Body/S', 'text/secondary')); const t = await text(v, 'Body/S', 'text/strong'); t.textAlignHorizontal = 'RIGHT'; r.appendChild(t);
  }
  const sr = add(rows, frame('HORIZONTAL', 'Status'), 'FILL'); sr.primaryAxisAlignItems = 'SPACE_BETWEEN'; sr.counterAxisAlignItems = 'CENTER';
  sr.appendChild(await text('Status', 'Body/S', 'text/secondary'));
  const chip = frame('HORIZONTAL', 'Status chip'); pad(chip, 4, 12); rad(chip, 'full'); fill(chip, 'bg/accent'); stroke(chip, 'border/default', 'stroke/thin');
  chip.appendChild(await text('Menunggu verifikasi', 'Caption', 'text/strong')); sr.appendChild(chip);
  const act = add(c, frame(D ? 'HORIZONTAL' : 'VERTICAL', 'Actions'), 'FILL'); act.itemSpacing = 12; act.primaryAxisAlignItems = 'CENTER';
  const b1 = button('Primary', 'Download E-Receipt (PDF)', { icon: 'download' }); act.appendChild(b1);
  const b2 = button('Secondary', 'Kirim ulang ke email', { icon: 'mail' }); act.appendChild(b2);
  if (!D) { b1.layoutSizingHorizontal = 'FILL'; b2.layoutSizingHorizontal = 'FILL'; }
  c.appendChild(button('Ghost', 'Kembali ke Beranda'));
  const stp = inst('Stamp', { Color: 'Red' }, { Text: 'TERKIRIM!' }); stp.rotation = -10; absolute(c, stp, D ? 500 : 210, D ? 40 : 24);
  absolute(c, star(D ? 72 : 48, 10, 0.55), D ? 80 : 16, D ? 48 : 24);
  return s;
}

async function receipt() {
  const r = frame('VERTICAL', '07 E-Receipt (PDF, A4)'); r.counterAxisSizingMode = 'FIXED'; fixW(r, 800); fill(r, 'bg/surface'); r.clipsContent = true;
  stroke(r, 'border/default');
  const head = add(r, frame('HORIZONTAL', 'Header'), 'FILL'); pad(head, 32, 40); head.primaryAxisAlignItems = 'SPACE_BETWEEN'; head.counterAxisAlignItems = 'CENTER'; fill(head, 'bg/brand');
  const hl = frame('HORIZONTAL', 'Brand'); hl.itemSpacing = 16; hl.counterAxisAlignItems = 'CENTER'; head.appendChild(hl);
  hl.appendChild(logo(104));
  const hc = frame('VERTICAL', 'Title'); hc.itemSpacing = 0; hl.appendChild(hc);
  hc.appendChild(await text('E-RECEIPT', 'Heading/H1', 'text/accent'));
  hc.appendChild(await text('Teater Musikal Aku, Kau & Musik', 'Body/M', 'text/on-brand'));
  const hr = frame('VERTICAL', 'Booking'); hr.itemSpacing = 2; hr.counterAxisAlignItems = 'MAX'; head.appendChild(hr);
  hr.appendChild(await text('Kode booking', 'Caption', 'text/on-brand'));
  hr.appendChild(await text('AKM-291015-7F3K', 'Heading/H3', 'text/accent'));
  hr.appendChild(await text('Diterbitkan 10 Okt 2026, 14.32 WIB', 'Caption', 'text/on-brand'));
  add(r, valance(800, 40, 10), null);
  const body = add(r, frame('VERTICAL', 'Body'), 'FILL'); pad(body, 32, 40); gap(body, 24);
  const status = add(body, frame('HORIZONTAL', 'Status'), 'FILL'); status.itemSpacing = 12; status.counterAxisAlignItems = 'CENTER';
  status.appendChild(await text('Status pembayaran:', 'Body/M', 'text/secondary'));
  const chip = frame('HORIZONTAL', 'Status chip'); pad(chip, 4, 12); rad(chip, 'full'); fill(chip, 'bg/brand-soft'); stroke(chip, 'border/brand', 'stroke/thin');
  chip.appendChild(await text('Terverifikasi', 'Label/M', 'text/brand')); status.appendChild(chip);
  const two = add(body, frame('HORIZONTAL', 'Details'), 'FILL'); two.itemSpacing = 24;
  for (const [title, rows] of [['Detail Pemesan', [['Nama', 'Dinda Aulia'], ['Email', 'dinda.aulia@ui.ac.id'], ['WhatsApp', '0812-3456-7890']]], ['Detail Acara', [['Show', 'Show 1'], ['Tanggal', 'Kamis, 29 Okt 2026'], ['Jam', '15.00–17.00 WIB'], ['Lokasi', 'Makara Art Center UI, Depok']]]]) {
    const b = frame('VERTICAL', title); pad(b, 20); gap(b, 10); rad(b, 'md'); stroke(b, 'border/default'); fill(b, 'bg/page'); add(two, b, 'FILL');
    b.appendChild(await text(title, 'Heading/H4', 'text/brand'));
    for (const [l, v] of rows) {
      const row = add(b, frame('HORIZONTAL', l), 'FILL'); row.primaryAxisAlignItems = 'SPACE_BETWEEN'; row.itemSpacing = 8;
      row.appendChild(await text(l, 'Body/S', 'text/secondary')); const t = await text(v, 'Body/S', 'text/strong'); t.textAlignHorizontal = 'RIGHT'; row.appendChild(t);
    }
  }
  // seat table
  const table = add(body, frame('VERTICAL', 'Seat table'), 'FILL'); rad(table, 'md'); stroke(table, 'border/default'); table.clipsContent = true;
  const trow = async (cells, header, total) => {
    const row = add(table, frame('HORIZONTAL', header ? 'Header' : cells[0]), 'FILL'); pad(row, 12, 20);
    if (header) fill(row, 'bg/brand-soft'); if (total) fill(row, 'bg/accent-soft');
    for (const [i, cell] of cells.entries()) { const t = await text(cell, header || total ? 'Label/M' : 'Body/S', header ? 'text/brand' : 'text/strong'); row.appendChild(t); wrap(t, i === 2 ? 'RIGHT' : 'LEFT'); }
  };
  await trow(['Kursi', 'Kategori', 'Harga'], true);
  await trow(['C9', 'Tipe 1', 'Rp XX.XXX']);
  await trow(['C10', 'Tipe 1', 'Rp XX.XXX']);
  await trow(['Total', '2 tiket', 'Rp XX.XXX'], false, true);
  const pm = add(body, frame('HORIZONTAL', 'Payment'), 'FILL'); pm.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pm.appendChild(await text('Metode: QRIS', 'Body/S', 'text/secondary')); pm.appendChild(await text('Dibayar 10 Okt 2026, 14.30 WIB', 'Body/S', 'text/secondary'));
  // stub
  const stub = add(r, frame('HORIZONTAL', 'Stub'), 'FILL'); pad(stub, 28, 40); gap(stub, 24); stub.counterAxisAlignItems = 'CENTER'; fill(stub, 'bg/accent-soft');
  stub.strokes = [paint('border/default')]; stub.strokeTopWeight = 2; stub.strokeBottomWeight = 0; stub.strokeLeftWeight = 0; stub.strokeRightWeight = 0; stub.dashPattern = [10, 8];
  const qr = fixedBox('QR', 120, 120); rad(qr, 'sm'); fill(qr, 'bg/surface'); stroke(qr, 'border/default'); qr.appendChild(icon('qr-code', 'text/strong', 88)); stub.appendChild(qr);
  const sc = add(stub, frame('VERTICAL', 'Notes'), 'FILL'); sc.itemSpacing = 6;
  await para(sc, 'Scan untuk cek status pesanan', 'Label/M', 'text/strong');
  await para(sc, 'E-receipt ini bukti pembayaran, bukan tiket masuk. E-tiket ber-QR dikirim via email & WhatsApp setelah verifikasi. Datang lebih awal ya, biar nggak buru-buru!', 'Body/S', 'text/primary');
  const foot = add(r, frame('HORIZONTAL', 'Footer'), 'FILL'); pad(foot, 16, 40); foot.primaryAxisAlignItems = 'SPACE_BETWEEN'; fill(foot, 'bg/brand-strong');
  foot.appendChild(await text('@stage.ui · stagepromedui@gmail.com · WA 0859-0001-8942', 'Caption', 'text/on-brand'));
  foot.appendChild(await text('Presented by Juzzer × Stage UI', 'Caption', 'text/accent'));
  // notches + stamp + texture
  for (const x of [-14, 786]) { const n = figma.createEllipse(); n.name = 'Notch'; n.resize(28, 28); fill(n, 'bg/muted'); n.strokes = [paint('border/default')]; n.strokeWeight = 2; absolute(r, n, x, stub.y - 14); }
  const st = inst('Stamp', { Color: 'Green' }, { Text: 'CONFIRMED' }); st.rotation = -8; absolute(r, st, 560, body.y + 16);
  addGraph(r, 800, r.height);
  return r;
}


// Seat categories follow the hand-drawn plan: E–F centre is "VIP" (was "Invitation"),
// colours Tipe 1 green, VIP yellow, Tipe 2 blue, Tipe 3 pink, Tipe 4 purple. Idempotent.
const SEAT_COLORS = { 'seat-tipe1': '#8FD9A8', 'seat-vip': '#FFF27A', 'seat-tipe2': '#8EC5F5', 'seat-tipe3': '#F59FC4', 'seat-tipe4': '#C3A6F2' };
async function migrateSeats() {
  const vars = await figma.variables.getLocalVariablesAsync();
  const byName = n => vars.find(v => v.name === n);
  const rename = (from, to, css) => { const v = byName(from); if (v) { v.name = to; v.setVariableCodeSyntax('WEB', css); } };
  rename('color/seat-invitation', 'color/seat-vip', 'var(--akm-seat-vip)');
  rename('color/seat/invitation', 'color/seat/vip', 'var(--color-seat-vip)');
  for (const [k, hex] of Object.entries(SEAT_COLORS)) {
    const v = byName('color/' + k);
    if (!v) throw new Error('Token kursi tidak ada: color/' + k);
    const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
    const h = hex.slice(1);
    v.setValueForMode(col.modes[0].modeId, { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: 1 });
  }
  const seat = DS.children.find(n => n.type === 'COMPONENT_SET' && n.name === 'Seat');
  for (const c of seat.children) if (c.name.includes('Tier=Invitation')) c.name = c.name.replace('Tier=Invitation', 'Tier=VIP');
  seat.description = 'Kursi di denah. Warna = kategori (Tipe 1 hijau, VIP kuning, Tipe 2 biru, Tipe 3 pink, Tipe 4 ungu). State: Available, Hover, Selected (hijau tua + centang), Taken (abu + silang), Locked (khusus VIP, terbuka setelah kode undangan valid). Penomoran dari kanan ke kiri.';
  const legend = DS.children.find(n => n.type === 'COMPONENT_SET' && n.name === 'Seat Legend');
  for (const c of legend.children) if (c.name === 'Type=Invitation') {
    c.name = 'Type=VIP';
    const t = c.findOne(n => n.type === 'TEXT' && n.name === 'Label');
    if (t) t.characters = 'VIP';
  }
}

// =====================================================================
// MAIN
// =====================================================================
function lay(sec, frames, gapX, gapY, perRow) {
  let x = 80, y = 120, rowH = 0;
  frames.forEach((f, i) => {
    if (i && i % perRow === 0) { x = 80; y += rowH + gapY; rowH = 0; }
    sec.appendChild(f); f.x = x; f.y = y; x += f.width + gapX; rowH = Math.max(rowH, f.height);
  });
  let w = 0, h = 0;
  for (const f of frames) { w = Math.max(w, f.x + f.width); h = Math.max(h, f.y + f.height); }
  sec.resizeWithoutConstraints(w + 80, h + 80);
}

async function main() {
  page = figma.root.children.find(p => p.name === 'website');
  if (!page) throw new Error('Page "website" tidak ditemukan');
  await figma.setCurrentPageAsync(page);
  DS = page.children.find(n => n.type === 'SECTION' && n.name === '00 · Design System');
  if (!DS) throw new Error('Section "00 · Design System" tidak ditemukan');

  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Plus Jakarta Sans', style: 'SemiBold' });
  await migrateSeats();
  VARS = Object.fromEntries((await figma.variables.getLocalVariablesAsync()).map(v => [v.name, v]));
  TS = Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s => [s.name, s]));
  ES = Object.fromEntries((await figma.getLocalEffectStylesAsync()).map(s => [s.name, s]));
  await figma.loadFontAsync({ family: 'Kirang Haerang', style: 'Regular' });

  // Swap body styles to Bootzy TM once it is installed.
  const fonts = await figma.listAvailableFontsAsync();
  const bootzy = fonts.find(f => f.fontName.family === 'Bootzy TM');
  let bodyFont = 'Plus Jakarta Sans SemiBold (sementara)';
  if (bootzy) {
    await figma.loadFontAsync(bootzy.fontName);
    for (const n of BODY_STYLES) if (TS[n]) { TS[n].fontName = bootzy.fontName; TS[n].description = 'Body font: Bootzy TM'; }
    bodyFont = 'Bootzy TM';
  }

  // Clean previous output of this plugin (by exact name, website page only).
  for (const n of page.children.filter(n => n.type === 'SECTION' && GENERATED_SECTIONS.includes(n.name))) n.remove();
  // Any component set in the design-system section other than the base ones was made by this plugin
  // (including half-built, unnamed sets left by a failed run).
  const BASE_SETS = ['Button', 'Field', 'Seat', 'Seat Legend'];
  for (const n of DS.children.filter(n => (n.type === 'COMPONENT_SET' && !BASE_SETS.includes(n.name)) || (n.type === 'FRAME' && n.name === 'Foundations'))) n.remove();

  // Existing assets built earlier via MCP.
  for (const n of DS.findAll(n => n.type === 'COMPONENT' && n.name.startsWith('Icon/'))) ICONS[n.name.slice(5)] = n;
  for (const name of ['Button', 'Field', 'Seat', 'Seat Legend']) {
    C[name] = DS.children.find(n => n.type === 'COMPONENT_SET' && n.name === name);
    if (!C[name]) throw new Error('Komponen dasar hilang: ' + name);
  }
  let bottom = 0;
  for (const n of DS.children) bottom = Math.max(bottom, n.y + n.height);
  shelf = { x: 80, y: bottom + 120, rowH: 0 };

  figma.notify('Membangun komponen…', { timeout: 2000 });
  await buildStep(); await buildStepper(); await buildAlert(); await buildPaymentOption(); await buildCheckbox(); await buildQuantity();
  await buildStamp(); await buildUpload(); await buildTierCard(); await buildShowCard(); await buildOrderSummary(); await buildBottomBar();
  await buildNavbar(); await buildFooter(); await buildFoundations();
  let w = 0, h = 0;
  for (const n of DS.children) { w = Math.max(w, n.x + n.width); h = Math.max(h, n.y + n.height); }
  DS.resizeWithoutConstraints(w + 80, h + 80);

  figma.notify('Membangun layar…', { timeout: 2000 });
  const desk = figma.createSection(); desk.name = GENERATED_SECTIONS[0]; desk.x = 0; desk.y = DS.y + DS.height + 400; fill(desk, 'bg/muted');
  const kD = await kursi(true);
  const desktopFrames = [await landing(true), await about(true), await dataDiri(true, false), await dataDiri(true, true), kD, await kursiModal(kD), await bayar(true, 'qris'), await bayar(true, 'transfer'), await sukses(true)];
  lay(desk, desktopFrames, 160, 200, 9);

  const mob = figma.createSection(); mob.name = GENERATED_SECTIONS[1]; mob.x = 0; mob.y = desk.y + desk.height + 400; fill(mob, 'bg/muted');
  const mobileFrames = [await landing(false), await about(false), await dataDiri(false, false), await dataDiri(false, true), await kursi(false), await bayar(false, 'qris'), await bayar(false, 'transfer'), await sukses(false)];
  lay(mob, mobileFrames, 120, 200, 8);

  const rec = figma.createSection(); rec.name = GENERATED_SECTIONS[2]; rec.x = mob.x + mob.width + 400; rec.y = mob.y; fill(rec, 'bg/muted');
  lay(rec, [await receipt()], 0, 0, 1);

  figma.viewport.scrollAndZoomIntoView([desk]);
  return `Selesai: ${desktopFrames.length} layar desktop, ${mobileFrames.length} mobile, 1 e-receipt. Font body: ${bodyFont}.`;
}

main()
  .then(msg => figma.closePlugin(msg))
  .catch(e => { console.error(e); figma.closePlugin('Gagal: ' + (e && e.message ? e.message : e)); });
