/* Vẽ từng slide của file .pptx thành ảnh để đưa nguyên trang slide vào giáo trình, kể cả slide toàn ảnh hoặc chữ không tách được.
   Vẽ gần đúng như PowerPoint: nền (của slide, bố cục, slide cái), ảnh (cắt, xoay, lật), hình khối có màu tô và viền,
   chữ (cỡ, đậm, màu, căn lề, xuống dòng, chữ dọc), bảng. Không vẽ biểu đồ, SmartArt, hiệu ứng.
   Dùng: const ds = await veSlides(zip, {rong: 1600, tienDo: (i, n) => …}) → [{so: số trang, blob: ảnh JPEG, nd: chữ, ảnh, bảng của slide (xem noiDung)}] */
(function () {
const EMU_PT = 12700;
const kids = (el, n) => el ? [...el.children].filter(c => c.localName === n) : [];
const kid = (el, ...ns) => { for (const n of ns) el = el && [...el.children].find(c => c.localName === n); return el || null; };
const num = (el, a, d = 0) => { const v = el && el.getAttribute(a); return v == null || v === '' ? d : +v; };
const parse = s => new DOMParser().parseFromString(s, 'application/xml');
const resolve = (from, t) => {
  if (t.startsWith('/')) return t.slice(1);
  const p = from.split('/'); p.pop();
  for (const s of t.split('/')) s === '..' ? p.pop() : s !== '.' && p.push(s);
  return p.join('/');
};
const MIME = {png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp'};

/* ---------- màu ---------- */
const PRST = {black: '000000', white: 'FFFFFF', red: 'FF0000', green: '008000', blue: '0000FF', yellow: 'FFFF00', gray: '808080', grey: '808080', orange: 'FFA500', purple: '800080'};
const rgbHex = h => [0, 2, 4].map(i => parseInt((h || '000000').slice(i, i + 2), 16) || 0);
function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function rgb([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map(v => (v + m) * 255);
}
/* el là phần tử màu (srgbClr, schemeClr…) hoặc phần tử chứa nó (solidFill, fontRef…). P.scheme đổi tên màu chủ đề ra mã màu. */
function mau(el, P) {
  if (!el) return null;
  const c = /Clr$/.test(el.localName) ? el : [...el.children].find(x => /Clr$/.test(x.localName));
  if (!c) return null;
  const v = c.getAttribute('val'), t = c.localName;
  let m = t === 'srgbClr' ? rgbHex(v) : t === 'schemeClr' ? rgbHex(P.scheme(v)) : t === 'sysClr' ? rgbHex(c.getAttribute('lastClr') || (v === 'window' ? 'FFFFFF' : '000000'))
    : t === 'prstClr' ? rgbHex(PRST[v]) : t === 'scrgbClr' ? ['r', 'g', 'b'].map(a => num(c, a) / 100000 * 255) : [0, 0, 0];
  let a = 1;
  for (const md of c.children) {
    const x = num(md, 'val') / 100000;
    if (md.localName === 'alpha') a = x;
    else if (md.localName === 'tint') m = m.map(z => z + (255 - z) * (1 - x));
    else if (md.localName === 'shade') m = m.map(z => z * x);
    else if (md.localName === 'lumMod' || md.localName === 'lumOff') {
      const q = hsl(m); q[2] = Math.min(1, Math.max(0, md.localName === 'lumMod' ? q[2] * x : q[2] + x)); m = rgb(q);
    }
  }
  return `rgba(${m.map(z => Math.round(Math.min(255, Math.max(0, z)))).join(',')},${a})`;
}

/* ---------- tô, viền ---------- */
function toEl(c, P) {   // một phần tử tô: solidFill, gradFill, blipFill, pattFill
  switch (c && c.localName) {
    case 'solidFill': return {mau: mau(c, P)};
    case 'gradFill': return {grad: c};
    case 'blipFill': return {blip: c};
    case 'pattFill': return {mau: mau(kid(c, 'fgClr'), P)};
    default: return null;
  }
}
function nen(spPr, style, P) {
  for (const c of spPr ? spPr.children : []) {
    if (c.localName === 'noFill') return null;
    if (c.localName === 'grpFill') return P.grpFill || null;
    const f = toEl(c, P); if (f) return f;
  }
  const r = kid(style, 'fillRef');
  return r && num(r, 'idx') > 0 ? {mau: mau(r, P)} : null;
}
function vien(spPr, style, P) {
  const ln = kid(spPr, 'ln');
  if (kid(ln, 'noFill')) return null;
  const f = kid(ln, 'solidFill') || kid(ln, 'gradFill', 'gsLst', 'gs');
  if (f) return {mau: mau(f, P), w: Math.max(1, num(ln, 'w', 9525) * P.k)};
  const r = kid(style, 'lnRef');
  return r && num(r, 'idx') > 0 ? {mau: mau(r, P), w: Math.max(1, num(ln, 'w', 9525 * num(r, 'idx')) * P.k)} : null;
}
function veAnh(g, im, crop, x, y, w, h) {
  const c = a => Math.min(1, Math.max(0, num(crop, a) / 100000));
  const l = c('l'), t = c('t'), r = c('r'), b = c('b');
  const sw = im.width * (1 - l - r), sh = im.height * (1 - t - b);
  if (sw > 0 && sh > 0) g.drawImage(im, im.width * l, im.height * t, sw, sh, x, y, w, h);
}
async function to(g, f, b, P) {   // tô đường viền hình đang có trên g
  if (!f) return;
  if (f.mau) { g.fillStyle = f.mau; g.fill(); return; }
  if (f.grad) {
    const gs = kids(kid(f.grad, 'gsLst'), 'gs').sort((a, z) => num(a, 'pos') - num(z, 'pos'));
    if (!gs.length) return;
    const ang = num(kid(f.grad, 'lin'), 'ang', 5400000) / 60000 * Math.PI / 180;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, dx = Math.cos(ang) * b.w / 2, dy = Math.sin(ang) * b.h / 2;
    const lg = g.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    gs.forEach(s => lg.addColorStop(num(s, 'pos') / 100000, mau(s, P) || '#fff'));
    g.fillStyle = lg; g.fill(); return;
  }
  const im = await P.anh(kid(f.blip, 'blip'));
  if (im) { g.save(); g.clip(); veAnh(g, im, kid(f.blip, 'srcRect'), b.x, b.y, b.w, b.h); g.restore(); }
}
/* Đường bao của hình theo kiểu có sẵn (prstGeom); kiểu lạ thì lấy hình chữ nhật. */
function hinh(g, geom, b) {
  const {x, y, w, h} = b, p = geom && geom.getAttribute('prst') || 'rect', m = Math.min(w, h);
  const adj = n => { const gd = kids(kid(geom, 'avLst'), 'gd').find(d => d.getAttribute('name') === n); return gd ? +(gd.getAttribute('fmla') || '').split(' ')[1] : null; };
  g.beginPath();
  const poly = pts => { g.moveTo(x + pts[0][0] * w, y + pts[0][1] * h); pts.slice(1).forEach(([a, z]) => g.lineTo(x + a * w, y + z * h)); g.closePath(); };
  if (/ellipse|oval|cloud|donut|pie|chord/.test(p)) g.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
  else if (/roundRect|Callout|round/i.test(p) && g.roundRect) g.roundRect(x, y, w, h, m * (adj('adj') ?? 16667) / 100000);
  else if (p === 'triangle') poly([[.5, 0], [1, 1], [0, 1]]);
  else if (p === 'rtTriangle') poly([[0, 0], [1, 1], [0, 1]]);
  else if (p === 'diamond') poly([[.5, 0], [1, .5], [.5, 1], [0, .5]]);
  else if (p === 'parallelogram') poly([[.25, 0], [1, 0], [.75, 1], [0, 1]]);
  else if (p === 'homePlate') poly([[0, 0], [.8, 0], [1, .5], [.8, 1], [0, 1]]);
  else if (p === 'chevron') poly([[0, 0], [.8, 0], [1, .5], [.8, 1], [0, 1], [.2, .5]]);
  else if (p === 'rightArrow') poly([[0, .25], [.7, .25], [.7, 0], [1, .5], [.7, 1], [.7, .75], [0, .75]]);
  else if (p === 'leftArrow') poly([[1, .25], [.3, .25], [.3, 0], [0, .5], [.3, 1], [.3, .75], [1, .75]]);
  else if (p === 'hexagon') poly([[.25, 0], [.75, 0], [1, .5], [.75, 1], [.25, 1], [0, .5]]);
  else if (/line|Connector/.test(p)) { g.moveTo(x, y); g.lineTo(x + w, y + h); return 'line'; }
  else g.rect(x, y, w, h);
  return 'shape';
}

/* ---------- vị trí ---------- */
function khung(xf, T) {
  const o = kid(xf, 'off'), e = kid(xf, 'ext');
  if (!o || !e) return null;
  return {x: T.dx + num(o, 'x') * T.sx, y: T.dy + num(o, 'y') * T.sy, w: num(e, 'cx') * T.sx, h: num(e, 'cy') * T.sy,
    rot: num(xf, 'rot') / 60000, fh: xf.getAttribute('flipH') === '1', fv: xf.getAttribute('flipV') === '1'};
}
async function xoay(g, b, lat, fn) {
  g.save();
  if (b.rot || (lat && (b.fh || b.fv))) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    g.translate(cx, cy); g.rotate(b.rot * Math.PI / 180);
    if (lat) g.scale(b.fh ? -1 : 1, b.fv ? -1 : 1);
    g.translate(-cx, -cy);
  }
  try { await fn(); } finally { g.restore(); }
}

/* ---------- chữ ---------- */
const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/;
const TACH = /[⺀-鿿豈-﫿＀-￯　-〿]|[^\s⺀-鿿豈-﫿＀-￯　-〿]+|\s+/g;
const lv = (s, n) => kid(s, `lvl${n}pPr`);
/* Kiểu của đoạn, chữ: lấy ở chính đoạn trước, rồi các lstStyle của hình (slide → bố cục → slide cái), kiểu chữ chung. */
const pA = (pPr, srcs, n, a) => { if (pPr && pPr.hasAttribute(a)) return pPr.getAttribute(a); for (const s of srcs) { const l = lv(s, n); if (l && l.hasAttribute(a)) return l.getAttribute(a); } return null; };
const pK = (pPr, srcs, n, k) => kid(pPr, k) || srcs.map(s => kid(lv(s, n), k)).find(Boolean) || null;
const rA = (rPr, srcs, n, a) => { if (rPr && rPr.hasAttribute(a)) return rPr.getAttribute(a); for (const s of srcs) { const d = kid(lv(s, n), 'defRPr'); if (d && d.hasAttribute(a)) return d.getAttribute(a); } return null; };
const rK = (rPr, srcs, n, k) => kid(rPr, k) || srcs.map(s => kid(lv(s, n), 'defRPr', k)).find(Boolean) || null;
function chamDau(pPr, srcs, n) {
  for (const s of [pPr, ...srcs.map(x => lv(x, n))]) {
    if (!s) continue;
    if (kid(s, 'buNone')) return '';
    const c = kid(s, 'buChar'); if (c) return c.getAttribute('char') || '•';
    if (kid(s, 'buAutoNum')) return '#';
  }
  return '';
}
/* o: {ins: [trái, trên, phải, dưới], anchor, vert, wrap, fs (thu nhỏ chữ), lr (giảm giãn dòng)}; md: {mau, sz} mặc định. */
function veChu(g, txBody, b, o, srcs, P, md) {
  const k = P.k, ps = kids(txBody, 'p');
  if (!ps.some(p => p.textContent.trim())) return;
  const [L, T, R, B] = o.ins, W = b.w - L - R;
  const font = t => `${t.i ? 'italic ' : ''}${t.b ? 'bold ' : ''}${Math.max(1, t.px).toFixed(1)}px ${t.face}`;
  const lines = [];
  let so = 0;
  ps.forEach(p => {
    const pPr = kid(p, 'pPr'), n = num(pPr, 'lvl', 0) + 1;
    const algn = pA(pPr, srcs, n, 'algn') || 'l';
    const marL = +(pA(pPr, srcs, n, 'marL') || 0) * k, indent = +(pA(pPr, srcs, n, 'indent') || 0) * k;
    const spc = name => { const e = pK(pPr, srcs, n, name); return e ? {pct: num(kid(e, 'spcPct'), 'val', -1), pts: num(kid(e, 'spcPts'), 'val', -1)} : null; };
    const ln = spc('lnSpc'), bef = spc('spcBef'), aft = spc('spcAft');
    const kieu = rPr => {
      const sz = +(rA(rPr, srcs, n, 'sz') || md.sz) / 100;
      const face = f => { const t = f && f.getAttribute('typeface'); return !t ? '' : t[0] === '+' ? P.font(t) : t; };
      const la = face(rK(rPr, srcs, n, 'latin')), ea = face(rK(rPr, srcs, n, 'ea'));
      const cap = rA(rPr, srcs, n, 'cap');
      return {px: sz * EMU_PT * k * o.fs, b: rA(rPr, srcs, n, 'b') === '1', i: rA(rPr, srcs, n, 'i') === '1', u: (rA(rPr, srcs, n, 'u') || 'none') !== 'none',
        mau: mau(rK(rPr, srcs, n, 'solidFill'), P) || md.mau, cap: cap === 'all',
        la: (la ? `"${la}", ` : '') + '"Segoe UI", Arial, sans-serif', ea: (ea && !/^(Times|Arial|Calibri)/i.test(ea) ? `"${ea}", ` : '') + '"Microsoft YaHei", "SimSun", "PingFang SC", sans-serif'};
    };
    const toks = [];
    for (const r of p.children) {
      if (r.localName === 'br') { toks.push({br: 1}); continue; }
      if (r.localName !== 'r' && r.localName !== 'fld') continue;
      const st = kieu(kid(r, 'rPr'));
      let s = (kid(r, 't') || {textContent: ''}).textContent.replace(/\t/g, '    ');
      if (st.cap) s = s.toUpperCase();
      for (const m of s.match(TACH) || []) toks.push({...st, s: m, face: CJK.test(m) ? st.ea : st.la});
    }
    const endSt = kieu(kid(p, 'endParaRPr'));
    const dau = toks.length ? chamDau(pPr, srcs, n) : '';
    if (dau) { so++; const st = toks.find(t => !t.br) || endSt; toks.unshift({...st, s: (dau === '#' ? so + '.' : dau) + ' ', face: st.la}); }
    else so = 0;
    const pxOf = (e, sz) => !e ? 0 : e.pts >= 0 ? e.pts / 100 * EMU_PT * k : e.pct >= 0 ? e.pct / 100000 * sz * 1.2 : 0;
    let cur = null;
    const mo = first => { cur = {toks: [], w: 0, px: 0, x0: first ? marL + indent : marL, algn, bef: 0, aft: 0}; lines.push(cur); };
    mo(true);
    const dau0 = lines.length - 1;
    for (const t of toks) {
      if (t.br) { if (!cur.px) cur.px = endSt.px; mo(false); continue; }
      g.font = font(t); t.w = g.measureText(t.s).width;
      const trang = /^\s+$/.test(t.s);
      // Phông thay thế thường rộng hơn phông gốc một chút: cho lố 6% rồi mới xuống dòng, khỏi vỡ dòng mà PowerPoint vẫn vừa.
      if (o.wrap && cur.toks.length && !trang && cur.x0 + cur.w + t.w > W * 1.06 + 1) mo(false);
      if (trang && !cur.toks.length && lines.length - 1 > dau0) continue;   // dấu cách ở đầu dòng mới xuống
      cur.toks.push(t); cur.w += t.w; cur.px = Math.max(cur.px, t.px);
    }
    if (!cur.px) cur.px = endSt.px;
    lines.slice(dau0).forEach(l => {
      l.h = (ln && ln.pts >= 0 ? ln.pts / 100 * EMU_PT * k : l.px * 1.2 * (ln && ln.pct >= 0 ? ln.pct / 100000 : 1)) * o.lr;
    });
    lines[dau0].bef = pxOf(bef, lines[dau0].px);
    lines[lines.length - 1].aft = pxOf(aft, lines[lines.length - 1].px);
  });
  if (o.vert) return veDoc(g, lines, b, o);
  const H = lines.reduce((s, l, i) => s + l.h + (i ? l.bef : 0) + (i < lines.length - 1 ? l.aft : 0), 0);
  let y = o.anchor === 'ctr' ? b.y + T + (b.h - T - B - H) / 2 : o.anchor === 'b' ? b.y + b.h - B - H : b.y + T;
  g.textBaseline = 'alphabetic';
  lines.forEach((l, i) => {
    if (i) y += l.bef;
    let tw = l.w;   // bề rộng không tính dấu cách cuối dòng, để căn giữa, căn phải cho đúng
    for (let j = l.toks.length - 1; j >= 0 && /^\s+$/.test(l.toks[j].s); j--) tw -= l.toks[j].w;
    let x = b.x + L + (l.algn === 'ctr' ? l.x0 + (W - l.x0 - tw) / 2 : l.algn === 'r' ? W - tw : l.x0);
    const base = y + l.h - l.px * 0.28;
    for (const t of l.toks) {
      g.font = font(t); g.fillStyle = t.mau; g.fillText(t.s, x, base);
      if (t.u && !/^\s+$/.test(t.s)) g.fillRect(x, base + t.px * 0.1, t.w, Math.max(1, t.px / 16));
      x += t.w;
    }
    y += l.h + l.aft;
  });
}
/* Chữ dọc (eaVert): mỗi chữ một ô từ trên xuống, mỗi dòng một cột từ phải sang trái. */
function veDoc(g, lines, b, o) {
  const [L, T, R] = o.ins, cols = lines.filter(l => l.toks.length);
  const cw = cols.map(l => l.px * 1.25), tong = cw.reduce((s, w) => s + w, 0);
  let x = b.x + L + (b.w - L - R + tong) / 2;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  cols.forEach((l, i) => {
    x -= cw[i];
    const cs = l.toks.flatMap(t => [...t.s.trim()].map(c => ({...t, c})));
    let y = b.y + T + l.px * 0.6;
    for (const t of cs) { g.font = `${t.b ? 'bold ' : ''}${t.px.toFixed(1)}px ${t.face}`; g.fillStyle = t.mau; g.fillText(t.c, x + cw[i] / 2, y); y += t.px * 1.1; }
  });
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
function bodyOpt(bps, k) {
  const a = (n, d) => { for (const x of bps) if (x && x.hasAttribute(n)) return x.getAttribute(n); return d; };
  const fit = kid(bps[0], 'normAutofit');
  const vert = a('vert', 'horz');
  return {ins: [+a('lIns', 91440) * k, +a('tIns', 45720) * k, +a('rIns', 91440) * k, +a('bIns', 45720) * k],
    anchor: a('anchor', 't'), wrap: a('wrap', 'square') !== 'none', vert: /vert/i.test(vert) && vert !== 'horz',
    fs: fit ? num(fit, 'fontScale', 100000) / 100000 : 1, lr: fit ? 1 - num(fit, 'lnSpcReduction', 0) / 100000 : 1};
}

/* ---------- các hình trên trang ---------- */
const phOf = el => kid(el, 'nvSpPr', 'nvPr', 'ph') || kid(el, 'nvPicPr', 'nvPr', 'ph') || kid(el, 'nvGraphicFramePr', 'nvPr', 'ph');
const phLoai = p => { const t = p.getAttribute('type') || 'body'; return t === 'ctrTitle' ? 'title' : t === 'obj' ? 'body' : t; };
/* Hình gốc của chỗ dành sẵn (placeholder) trên bố cục / slide cái: cùng idx, không thì cùng loại. */
function timPh(tree, ph, theoIdx) {
  if (!tree || !ph) return null;
  const ds = [...tree.getElementsByTagNameNS('*', 'ph')].map(p => {
    let s = p; while (s && !/^(sp|pic|graphicFrame)$/.test(s.localName)) s = s.parentElement;
    return [p, s];
  }).filter(([, s]) => s);
  const idx = ph.getAttribute('idx'), type = ph.getAttribute('type') || 'body';
  const hit = (theoIdx && idx != null && ds.find(([p]) => p.getAttribute('idx') === idx))
    || ds.find(([p]) => (p.getAttribute('type') || 'body') === type) || ds.find(([p]) => phLoai(p) === phLoai(ph));
  return hit ? hit[1] : null;
}
const an = el => kid(el, 'nvSpPr', 'cNvPr')?.getAttribute('hidden') === '1' || kid(el, 'nvPicPr', 'cNvPr')?.getAttribute('hidden') === '1';

/* Tọa độ các hình bên trong một nhóm hình (grpSp). */
function trongNhom(el, T) {
  const x = kid(el, 'grpSpPr', 'xfrm'), o = kid(x, 'off'), e = kid(x, 'ext'), co = kid(x, 'chOff'), ce = kid(x, 'chExt');
  if (!o || !e) return T;
  const rx = num(ce, 'cx') ? num(e, 'cx') / num(ce, 'cx') : 1, ry = num(ce, 'cy') ? num(e, 'cy') / num(ce, 'cy') : 1;
  return {sx: T.sx * rx, sy: T.sy * ry, dx: T.dx + T.sx * (num(o, 'x') - num(co, 'x') * rx), dy: T.dy + T.sy * (num(o, 'y') - num(co, 'y') * ry)};
}
const xfOf = chain => chain.map(c => kid(c, 'spPr', 'xfrm') || kid(c, 'grpSpPr', 'xfrm') || kid(c, 'xfrm')).find(Boolean);
async function ve(g, tree, P, T, boPh) {
  for (const el of tree ? tree.children : []) {
    if (an(el)) continue;
    const ph = phOf(el);
    if (boPh && ph) continue;   // chỗ dành sẵn trên bố cục / slide cái chỉ là khung mẫu
    const chain = P.laSlide && ph ? [el, timPh(P.L && P.L.tree, ph, true), timPh(P.M && P.M.tree, ph, false)].filter(Boolean) : [el];
    const xf = xfOf(chain);
    switch (el.localName) {
      case 'sp': case 'cxnSp': {
        const b = khung(xf, T); if (!b) break;
        const spPr = kid(el, 'spPr'), style = kid(el, 'style');
        await xoay(g, b, true, async () => {
          const kieu = hinh(g, kid(spPr, 'prstGeom'), b);
          if (kieu === 'shape' && !kid(spPr, 'custGeom')) await to(g, nen(spPr, style, P), b, P);
          const v = vien(spPr, style, P);
          if (v && v.mau) { g.strokeStyle = v.mau; g.lineWidth = v.w; g.stroke(); }
        });
        const tx = kid(el, 'txBody'); if (!tx) break;
        const srcs = [...chain.map(c => kid(c, 'txBody', 'lstStyle')), ph ? P.txStyle(ph) : null, P.defStyle].filter(Boolean);
        const o = bodyOpt(chain.map(c => kid(c, 'txBody', 'bodyPr')), P.k);
        const md = {mau: mau(kid(style, 'fontRef'), P) || P.mauChu, sz: 1800};
        await xoay(g, b, false, () => veChu(g, tx, b, o, srcs, P, md));
        break;
      }
      case 'pic': {
        const b = khung(xf, T); if (!b) break;
        const spPr = kid(el, 'spPr'), bf = kid(el, 'blipFill'), im = await P.anh(kid(bf, 'blip'));
        await xoay(g, b, true, async () => {
          hinh(g, kid(spPr, 'prstGeom'), b);
          await to(g, nen(spPr, null, P), b, P);
          if (im) { g.save(); g.clip(); veAnh(g, im, kid(bf, 'srcRect'), b.x, b.y, b.w, b.h); g.restore(); }
          const v = vien(spPr, null, P);
          if (v && v.mau) { hinh(g, kid(spPr, 'prstGeom'), b); g.strokeStyle = v.mau; g.lineWidth = v.w; g.stroke(); }
        });
        break;
      }
      case 'grpSp':
        await ve(g, el, {...P, grpFill: nen(kid(el, 'grpSpPr'), null, P)}, trongNhom(el, T), boPh);
        break;
      case 'graphicFrame': {
        const tbl = kid(el, 'graphic', 'graphicData', 'tbl'), b = khung(xf, T);
        if (tbl && b) veBang(g, tbl, b, T, P);
        break;
      }
      case 'AlternateContent': {
        const c = kid(el, 'Fallback') || kid(el, 'Choice');
        if (c) await ve(g, c, P, T, boPh);
        break;
      }
    }
  }
}
/* Bảng: ô có màu nền riêng thì tô; bảng dùng kiểu mặc định (hàng đầu đậm màu, các hàng xen kẽ nhạt) thì tô gần giống. */
function veBang(g, tbl, b, T, P) {
  const cols = kids(kid(tbl, 'tblGrid'), 'gridCol').map(c => num(c, 'w') * T.sx);
  const pr = kid(tbl, 'tblPr'), dau = pr && pr.getAttribute('firstRow') === '1', soLe = pr && pr.getAttribute('bandRow') === '1', coKieu = !!kid(pr, 'tableStyleId');
  const nhan = P.scheme('accent1'), [r0, g0, b0] = rgbHex(nhan);
  let y = b.y;
  kids(tbl, 'tr').forEach((tr, ri) => {
    const h = num(tr, 'h') * T.sy;
    let x = b.x, gi = 0;
    for (const tc of kids(tr, 'tc')) {
      const span = num(tc, 'gridSpan', 1), w = cols.slice(gi, gi + span).reduce((s, v) => s + v, 0);
      const tcPr = kid(tc, 'tcPr');
      if (tc.getAttribute('hMerge') !== '1' && tc.getAttribute('vMerge') !== '1') {
        const hh = h * num(tc, 'rowSpan', 1), cb = {x, y, w, h: hh};
        const laDau = coKieu && dau && !ri;
        g.beginPath(); g.rect(x, y, w, hh);
        const f = nen(tcPr, null, P);
        g.fillStyle = f && f.mau ? f.mau : laDau ? `rgb(${r0},${g0},${b0})` : coKieu && soLe && ri % 2 === (dau ? 1 : 0) ? `rgba(${r0},${g0},${b0},.2)` : coKieu ? `rgba(${r0},${g0},${b0},.08)` : 'transparent';
        g.fill();
        g.strokeStyle = coKieu ? '#fff' : 'rgba(0,0,0,.45)'; g.lineWidth = Math.max(1, 12700 * P.k); g.stroke();
        const tx = kid(tc, 'txBody');
        if (tx) {
          const o = {ins: [num(tcPr, 'marL', 91440) * P.k, num(tcPr, 'marT', 45720) * P.k, num(tcPr, 'marR', 91440) * P.k, num(tcPr, 'marB', 45720) * P.k],
            anchor: (tcPr && tcPr.getAttribute('anchor')) || 't', wrap: true, vert: false, fs: 1, lr: 1};
          g.save(); g.beginPath(); g.rect(x, y, w, hh); g.clip();
          veChu(g, tx, cb, o, [kid(tx, 'lstStyle'), P.defStyle].filter(Boolean), P, {mau: laDau ? '#fff' : P.mauChu, sz: 1800});
          g.restore();
        }
      }
      x += w; gi += span;
    }
    y += h;
  });
}
/* ---------- nội dung đọc được của slide, để giáo trình hiện như bài đọc trên web thay vì ảnh chụp ----------
   → {tieude, khoi: [{t: 'p', s (chữ đậm bọc **…**), lv, cham: '•' | '#' | ''}, {t: 'anh', i: thứ tự r:embed trên slide, w: bề rộng / slide},
   {t: 'bang', hang: [[ô…]…]}]}. Chỉ lấy hình của chính slide (khung mẫu ở bố cục, slide cái là trang trí). */
function doanChu(p, srcs, n) {
  let s = '';
  for (const r of p.children) {
    if (r.localName === 'br') { s += '\n'; continue; }
    if (r.localName !== 'r' && r.localName !== 'fld') continue;
    const t = (kid(r, 't') || {textContent: ''}).textContent;
    s += t.trim() && rA(kid(r, 'rPr'), srcs, n, 'b') === '1' ? `**${t.trim()}**${/\s$/.test(t) ? ' ' : ''}` : t;
  }
  return s.replace(/\*\*\*\*/g, '').replace(/[ \t ]+/g, ' ').split('\n').map(x => x.trim()).filter(Boolean).join('\n');
}
/* Câu bị ngắt dòng tay ("Lượng từ chỉ số" / "thành viên trong" / "gia đình.") nối lại thành một đoạn: dòng trước chưa hết câu,
   dòng sau viết thường, cùng cỡ chữ. Không nối dòng có chữ Hán, pinyin hay dấu ngoặc (dòng từ vựng, câu ví dụ). Dùng cả cho chữ PDF. */
const LIEN = /[㐀-鿿(（āēīōūǖǎěǐǒǔǚǜ]/;
const noiDuoc = (a, b) => { a = a.replace(/\*\*/g, ''); b = b.replace(/\*\*/g, ''); return !LIEN.test(a) && !LIEN.test(b) && !/[.!?:;。？！：；]$/.test(a) && /^\p{Ll}/u.test(b); };
window.noiDong = ps => ps.reduce((o, p) => {
  const s = p.s.split('\n').reduce((ls, l) => { if (ls.length && noiDuoc(ls.at(-1), l)) ls[ls.length - 1] += ' ' + l; else ls.push(l); return ls; }, []).join('\n');
  const q = {...p, s}, tr = o.at(-1);
  if (tr && !tr.cham && !q.cham && tr.lv === q.lv && Math.abs((tr.sz || 0) - (q.sz || 0)) <= (tr.sz || 0) * 0.1
    && noiDuoc(tr.s.split('\n').at(-1), q.s.split('\n')[0])) tr.s += ' ' + q.s;
  else o.push(q);
  return o;
}, []);
function noiDung(S, W, H) {
  const embeds = [...S.d.getElementsByTagName('*')].filter(e => e.hasAttribute('r:embed'));
  const ds = [];
  const anh = (blip, b) => {
    const i = blip ? embeds.indexOf(blip) : -1;
    if (i >= 0 && b.w * b.h > W * H * 0.004) ds.push({y: b.y, x: b.x, anh: i, w: b.w / W, nen: b.w * b.h > W * H * 0.8});
  };
  const di = (tree, T) => {
    for (const el of tree ? tree.children : []) {
      if (an(el)) continue;
      const ph = phOf(el), loai = ph ? phLoai(ph) : '';
      if (/^(dt|ftr|sldNum|hdr)$/.test(loai)) continue;
      const chain = ph ? [el, timPh(S.L && S.L.tree, ph, true), timPh(S.M && S.M.tree, ph, false)].filter(Boolean) : [el];
      const b = khung(xfOf(chain), T) || {x: 0, y: 0, w: 0, h: 0};
      switch (el.localName) {
        case 'sp': {
          anh(kid(el, 'spPr', 'blipFill', 'blip'), b);
          const tx = kid(el, 'txBody'); if (!tx) break;
          const srcs = [...chain.map(c => kid(c, 'txBody', 'lstStyle')), ph ? S.txStyle(ph) : null, S.defStyle].filter(Boolean);
          const fs = bodyOpt(chain.map(c => kid(c, 'txBody', 'bodyPr')), 1).fs;
          const ps = kids(tx, 'p').map(p => {
            const pPr = kid(p, 'pPr'), n = num(pPr, 'lvl', 0) + 1, s = doanChu(p, srcs, n);
            return s && {t: 'p', s, lv: n - 1, cham: chamDau(pPr, srcs, n), sz: +(rA(kid(kids(p, 'r')[0], 'rPr'), srcs, n, 'sz') || 1800) * fs};
          }).filter(Boolean);
          if (ps.length) ds.push({y: b.y, x: b.x, tieu: loai === 'title', ps: noiDong(ps)});
          break;
        }
        case 'pic': anh(kid(el, 'blipFill', 'blip'), b); break;
        case 'grpSp': di(el, trongNhom(el, T)); break;
        case 'graphicFrame': {
          const tbl = kid(el, 'graphic', 'graphicData', 'tbl'); if (!tbl) break;
          const o = tc => { const tx = kid(tc, 'txBody'); return kids(tx, 'p').map(p => doanChu(p, [kid(tx, 'lstStyle'), S.defStyle].filter(Boolean), 1)).filter(Boolean).join('\n'); };
          const hang = kids(tbl, 'tr').map(tr => kids(tr, 'tc').filter(tc => tc.getAttribute('hMerge') !== '1').map(o)).filter(r => r.some(Boolean));
          if (hang.length) ds.push({y: b.y, x: b.x, bang: hang});
          break;
        }
        case 'AlternateContent': di(kid(el, 'Fallback') || kid(el, 'Choice'), T); break;
      }
    }
  };
  di(S.tree, {sx: 1, sy: 1, dx: 0, dy: 0});
  // Đọc từ trên xuống; cùng hàng (lệch nhau dưới 4% chiều cao) thì từ trái sang.
  ds.sort((a, b) => Math.abs(a.y - b.y) < H * 0.04 ? a.x - b.x : a.y - b.y);
  const ps = ds.flatMap(d => d.ps || []), coChu = ps.length || ds.some(d => d.bang);
  let tieude = ds.filter(d => d.tieu).flatMap(d => d.ps).map(p => p.s).join(' ');
  if (!tieude && ps.length > 1) {   // không có ô tiêu đề: dòng chữ to hẳn, ngắn, ở phần trên slide
    const sz = ps.map(p => p.sz).sort((a, b) => a - b), to = ps.reduce((m, p) => p.sz > m.sz ? p : m);
    const d = ds.find(d => d.ps && d.ps.includes(to));
    const cung = d.ps.filter(p => p.sz >= to.sz * 0.85);   // tiêu đề xuống dòng ("Từ" / "mới") cùng một ô chữ
    tieude = cung.map(p => p.s).join(' ');
    if (to.sz >= sz[sz.length >> 1] * 1.3 && tieude.length <= 40 && d.y < H * 0.35) d.ps = d.ps.filter(p => !cung.includes(p));
    else tieude = '';
  }
  // Ảnh phủ gần kín slide có chữ đè lên là ảnh nền, bỏ.
  const khoi = ds.filter(d => !d.tieu).flatMap(d => d.ps ? d.ps.map(({sz, ...p}) => p) : d.bang ? [{t: 'bang', hang: d.bang}]
    : d.nen && coChu ? [] : [{t: 'anh', i: d.anh, w: +d.w.toFixed(2)}]);
  return {tieude: tieude.replace(/\*\*/g, '').replace(/\n/g, ' '), khoi};
}
async function veNen(g, parts, W, H) {
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  for (const P of parts) {
    const bg = kid(P.root, 'cSld', 'bg'); if (!bg) continue;
    const pr = kid(bg, 'bgPr'), ref = kid(bg, 'bgRef');
    let f = null, Q = P;
    if (pr) f = nen(pr, null, P);
    else if (ref) {
      const c = mau(ref, P), i = num(ref, 'idx');
      const lst = i > 1000 ? [...(P.bgStyles ? P.bgStyles.children : [])] : [];
      Q = {...P, scheme: v => v === 'phClr' ? (kid(ref, 'schemeClr') ? P.scheme(kid(ref, 'schemeClr').getAttribute('val')) : kid(ref, 'srgbClr')?.getAttribute('val') || 'FFFFFF') : P.scheme(v)};
      f = toEl(lst[i - 1001], Q) || (c ? {mau: c} : null);
      if (f && f.blip) f = c ? {mau: c} : null;   // ảnh nền trong chủ đề nằm ở file khác, bỏ qua
    }
    g.beginPath(); g.rect(0, 0, W, H);
    await to(g, f, {x: 0, y: 0, w: W, h: H}, Q);
    return;
  }
}

window.veSlides = async function (zip, {rong = 1600, chat = 0.85, tienDo} = {}) {
  const cache = new Map(), bmp = new Map();
  const doc = p => {
    if (!cache.has(p)) cache.set(p, zip.file(p) ? zip.file(p).async('string').then(parse) : Promise.resolve(null));
    return cache.get(p);
  };
  const relsOf = async p => {
    const d = await doc(p.replace(/[^/]+$/, m => '_rels/' + m + '.rels')), o = {};
    if (d) for (const r of d.getElementsByTagName('Relationship'))
      o[r.getAttribute('Id')] = {type: r.getAttribute('Type') || '', to: r.getAttribute('TargetMode') === 'External' ? null : resolve(p, r.getAttribute('Target'))};
    return o;
  };
  const relTo = (rels, re) => (Object.values(rels).find(r => re.test(r.type)) || {}).to;
  const pres = await doc('ppt/presentation.xml'); if (!pres) return [];
  const pr = pres.documentElement, presRels = await relsOf('ppt/presentation.xml');
  const sz = kid(pr, 'sldSz'), cx = num(sz, 'cx', 12192000), cy = num(sz, 'cy', 6858000);
  const k = rong / cx, W = rong, H = Math.round(cy * k);
  const ids = kids(kid(pr, 'sldIdLst'), 'sldId').map(s => (presRels[s.getAttribute('r:id')] || {}).to).filter(Boolean);
  const themes = new Map();
  const theme = async (tp, M) => {
    if (!themes.has(tp)) {
      const th = tp && await doc(tp), cs = th && th.getElementsByTagNameNS('*', 'clrScheme')[0], fs = th && th.getElementsByTagNameNS('*', 'fontScheme')[0];
      const mauCt = {};
      for (const c of cs ? cs.children : []) { const v = c.firstElementChild; if (v) mauCt[c.localName] = v.getAttribute('lastClr') || v.getAttribute('val'); }
      const map = kid(M && M.root, 'clrMap'), ten = v => (map && map.getAttribute(v)) || {bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2'}[v] || v;
      const fface = (kind, s) => kid(fs, kind === 'mj' ? 'majorFont' : 'minorFont', s === 'ea' ? 'ea' : 'latin')?.getAttribute('typeface') || '';
      themes.set(tp, {
        scheme: v => mauCt[ten(v)] || mauCt[v] || '000000',
        font: t => { const m = t.match(/^\+(mj|mn)-(lt|ea|cs)/); return m ? fface(m[1], m[2]) : t; },
        bgStyles: th && th.getElementsByTagNameNS('*', 'bgFillStyleLst')[0],
      });
    }
    return themes.get(tp);
  };
  const part = async path => {
    const d = await doc(path); if (!d) return null;
    const rels = await relsOf(path);
    return {d, rels, root: d.documentElement, tree: kid(d.documentElement, 'cSld', 'spTree'),
      anh: async blip => {
        const r = blip && rels[blip.getAttribute('r:embed')], p = r && r.to;
        if (!p) return null;
        if (!bmp.has(p)) bmp.set(p, (async () => {
          const f = zip.file(p), ext = p.split('.').pop().toLowerCase();
          if (!f || !MIME[ext]) return null;
          try { return await createImageBitmap(new Blob([await f.async('uint8array')], {type: MIME[ext]})); } catch { return null; }
        })());
        return bmp.get(p);
      }};
  };
  const out = [];
  for (const [i, sp] of ids.entries()) {
    if (tienDo) tienDo(i, ids.length);
    const S = await part(sp); if (!S || S.root.getAttribute('show') === '0') continue;
    const lp = relTo(S.rels, /slideLayout$/), L = lp && await part(lp);
    const mp = L && relTo(L.rels, /slideMaster$/), M = mp && await part(mp);
    const C = await theme(M && relTo(M.rels, /\/theme$/), M);
    const txs = M && kid(M.root, 'txStyles');
    const chung = {...C, k, L, M, defStyle: kid(pr, 'defaultTextStyle'), mauChu: '#' + C.scheme('tx1'),
      txStyle: ph => { const t = phLoai(ph); return kid(txs, t === 'title' ? 'titleStyle' : /^(body|subTitle)$/.test(t) ? 'bodyStyle' : 'otherStyle'); }};
    [S, L, M].forEach(P => P && Object.assign(P, chung));
    S.laSlide = true;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const T0 = {sx: k, sy: k, dx: 0, dy: 0};
    try {
      await veNen(g, [S, L, M].filter(Boolean), W, H);
      const hien = S.root.getAttribute('showMasterSp') !== '0';
      if (M && hien && (!L || L.root.getAttribute('showMasterSp') !== '0')) await ve(g, M.tree, M, T0, true);
      if (L && hien) await ve(g, L.tree, L, T0, true);
      await ve(g, S.tree, S, T0, false);
    } catch (e) { console.warn('Không vẽ hết được slide', sp, e); }
    let nd = null;
    try { nd = noiDung(S, cx, cy); } catch (e) { console.warn('Không đọc được chữ của slide', sp, e); }
    out.push({so: +((sp.match(/(\d+)\.xml$/) || [])[1] || i + 1), thu: i + 1, nd, blob:await new Promise(r => c.toBlob(r, 'image/jpeg', chat))});
  }
  return out;
};
})();
