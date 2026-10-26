/* Trang soạn bài: nhập tay hoặc nạp từ Word/PPT, xem trước, rồi lưu thành thư mục bài trong "web". */
(function () {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BASE = new URL('.', location.href).href;
const DRAFT = 'soan-bai-nhap';

const SHELL = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Bài học</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Noto+Serif:wght@600;700&family=Noto+Serif+SC:wght@500;700&display=swap">
<link rel="stylesheet" href="../khung/giao-an.css">
</head>
<body>
<script src="du-lieu.js"></script>
<script src="../khung/lib/qrcode.min.js"></script>
<script src="../khung/giao-an.js"></script>
</body>
</html>
`;

const MAU = [
  {id: 'ngoc', ten: 'Ngọc bích', mo: 'Xanh ngọc, gọn gàng, hợp mọi lớp.', bg: '#f4f7f5', fg: '#18221e', c: ['#16765b', '#bf3a29', '#e5b4ab']},
  {id: 'son', ten: 'Son mực', mo: 'Nền giấy dó, chữ son đỏ, góc vuông kiểu thư pháp.', bg: '#f6f0e4', fg: '#9e2b1d', c: ['#9e2b1d', '#2f4a6d', '#e0b9a8']},
  {id: 'bien', ten: 'Tươi sáng', mo: 'Xanh dương, bo tròn, hợp học sinh nhỏ tuổi.', bg: '#f2f6fc', fg: '#13203a', c: ['#1f5fd0', '#b45309', '#f0c48f']},
];
const LOAI = {
  vitri: {ten: 'Chọn vị trí', tieude: 'Chọn vị trí đúng cho từ trong ngoặc',
    fmt: 'Câu có các vị trí A B C D | Từ cần đặt | Đáp án (A, B, C hoặc D)', mau: 'A 中午 B 你 C 想吃 D？ | 什么 | D'},
  dien: {ten: 'Điền từ', tieude: 'Chọn từ điền vào chỗ trống',
    fmt: 'Từ: từ 1, từ 2, từ 3   ← dòng mở đầu một nhóm từ để chọn\nCâu có chỗ trống ____ | Đáp án (nhiều đáp án đúng cách nhau bằng /)\nMuốn xuống dòng trong câu thì viết //', mau: 'Từ: 几, 多, 什么\n他家有____口人？ | 几'},
  sapxep: {ten: 'Sắp xếp câu', tieude: 'Sắp xếp thành câu hoàn chỉnh',
    fmt: 'Các từ cách nhau bằng dấu cách | Đáp án | Đáp án khác (nếu có)', mau: '你 做 爸爸 什么 工作 | 你爸爸做什么工作？'},
  tracnghiem: {ten: 'Trắc nghiệm', tieude: 'Đọc và chọn đáp án đúng',
    fmt: 'Đoạn: đoạn văn để đọc (không bắt buộc)\nCâu hỏi | Lựa chọn A | B | *C | D   ← dấu * đánh dấu đáp án đúng', mau: 'Đoạn: 我家有四口人。\n“我”家有几口人？ | 三 | *四 | 五 | 六'},
  tuluan: {ten: 'Đọc và trả lời', tieude: 'Đọc và trả lời câu hỏi',
    fmt: 'Đoạn: đoạn văn để đọc\nCâu hỏi | Gợi ý đáp án', mau: 'Đoạn: 我是大学生。\n“我”做什么工作？ | 我是大学生。'},
};
const guessLoai = t => /vị trí/i.test(t) ? 'vitri' : /điền|chỗ trống/i.test(t) ? 'dien' : /sắp xếp/i.test(t) ? 'sapxep'
  : /trắc nghiệm|đáp án đúng|chọn đáp án/i.test(t) ? 'tracnghiem' : 'tuluan';

/* ---------- state ---------- */
const S = {mau: 'ngoc', exs: [], slideFile: null, slideName: '', goc: '', cu: new Set(), sua: ''};
const IMG = new Map();   // tên ảnh → {url, blob} cho ảnh vừa nạp
let dirty = false;

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 3600);
}

/* ---------- text ⇄ data ---------- */
const L = t => String(t || '').split('\n').map(s => s.trim()).filter(Boolean);
const C = l => l.split('|').map(s => s.trim());
const J = a => { a = a.map(x => x ?? ''); while (a.length && !a[a.length - 1]) a.pop(); return a.join(' | '); };
const nl = s => s.replace(/\s*\/\/\s*/g, '\n'), unnl = s => s.replace(/\n/g, ' // ');
const blank = s => s.replace(/_{2,}|＿{2,}/g, '____');
const norm = s => s.replace(/[，。？！、,.?!\s]/g, '');
const hasImg = n => IMG.has(n) || S.cu.has(n);
const doanRe = /^đoạn\s*[:：]\s*/i;

const PX = {
  vitri(t, w) {
    return {cau: L(t).map((l, i) => {
      const c = C(l), a = (c[2] || '').toUpperCase();
      if (!/^[ABCD]$/.test(a)) w.push(`Dòng ${i + 1}: đáp án phải là A, B, C hoặc D.`);
      else if (!new RegExp(`\\b${a}\\b`).test(c[0])) w.push(`Dòng ${i + 1}: trong câu chưa có vị trí ${a}.`);
      return [c[0], c[1] || '', a];
    })};
  },
  dien(t, w) {
    const nhom = []; let cur = null;
    L(t).forEach((l, i) => {
      const m = l.match(/^từ\s*[:：]\s*(.*)$/i);
      if (m) { cur = {tu: m[1].split(/[,，、;；]/).map(s => s.trim()).filter(Boolean), cau: []}; nhom.push(cur); return; }
      if (!cur) { cur = {tu: [], cau: []}; nhom.push(cur); }
      const c = C(l), s = blank(c[0]);
      const ans = (c[1] || '').split('/').map(s => s.trim()).filter(Boolean);
      if (!s.includes('____')) w.push(`Dòng ${i + 1}: câu chưa có chỗ trống ____.`);
      if (!ans.length) w.push(`Dòng ${i + 1}: chưa có đáp án.`);
      else if (cur.tu.length && !ans.some(a => cur.tu.includes(a))) w.push(`Dòng ${i + 1}: đáp án “${ans[0]}” không có trong dòng “Từ:”.`);
      cur.cau.push([nl(s), ans]);
    });
    return {nhom: nhom.filter(n => n.cau.length)};
  },
  sapxep(t, w) {
    return {cau: L(t).map((l, i) => {
      const c = C(l), toks = c[0].split(/\s+/).filter(Boolean), ans = c.slice(1).filter(Boolean);
      if (!ans.length) w.push(`Dòng ${i + 1}: chưa có đáp án.`);
      else if ([...norm(ans[0])].sort().join('') !== [...norm(toks.join(''))].sort().join('')) w.push(`Dòng ${i + 1}: đáp án không khớp với các từ đã cho.`);
      return [toks, ans];
    })};
  },
  tracnghiem(t, w) {
    let doan = ''; const cau = [];
    L(t).forEach(l => {
      if (doanRe.test(l)) { doan += (doan ? '\n' : '') + l.replace(doanRe, ''); return; }
      const c = C(l), opts = c.slice(1).filter(Boolean);
      const a = opts.findIndex(o => o.startsWith('*'));
      if (a < 0) w.push(`Câu ${cau.length + 1}: chưa đánh dấu * cho đáp án đúng.`);
      if (opts.length < 2) w.push(`Câu ${cau.length + 1}: cần ít nhất 2 lựa chọn.`);
      cau.push([c[0], opts.map(o => o.replace(/^\*\s*/, '')), Math.max(a, 0)]);
    });
    return {doan, cau};
  },
  tuluan(t) {
    const doan = []; let cur = null;
    L(t).forEach(l => {
      if (doanRe.test(l)) { cur = {van: l.replace(doanRe, ''), hoi: []}; doan.push(cur); return; }
      if (!cur) { cur = {van: '', hoi: []}; doan.push(cur); }
      const c = C(l); cur.hoi.push([c[0], c[1] || '']);
    });
    return {doan};
  },
};
const FX = {
  vitri: X => X.cau.map(c => J(c)).join('\n'),
  dien: X => X.nhom.map(n => (n.tu.length ? `Từ: ${n.tu.join(', ')}\n` : '') + n.cau.map(([s, a]) => J([unnl(s), a.join(' / ')])).join('\n')).join('\n'),
  sapxep: X => X.cau.map(([t, a]) => J([t.join(' '), ...a])).join('\n'),
  tracnghiem: X => (X.doan ? `Đoạn: ${X.doan.replace(/\n/g, ' ')}\n` : '') + X.cau.map(([q, o, a]) => J([q, ...o.map((x, k) => k === a ? '*' + x : x)])).join('\n'),
  tuluan: X => X.doan.map(p => (p.van ? `Đoạn: ${p.van}\n` : '') + p.hoi.map(h => J(h)).join('\n')).join('\n'),
};

const val = id => $('#' + id).value.trim();
function model() {
  const W = {tumoi: [], nguphap: [], hoithoai: [], ex: []};
  const so = parseInt(val('so'), 10) || '';
  const dir = val('dir');
  const tumoi = L(val('tumoi')).map((l, i) => {
    const c = C(l);
    if (c.length < 4) W.tumoi.push(`Dòng ${i + 1}: cần ít nhất 4 cột (chữ Hán | pinyin | từ loại | nghĩa).`);
    const v = {w: c[0], p: c[1] || '', t: c[2] || '', m: c[3] || ''};
    if (c[4]) v.g = c[4];
    if (c[5]) v.ex = [c[5], c[6] || '', c[7] || ''];
    if (c[8]) { v.img = c[8]; if (!hasImg(c[8])) W.tumoi.push(`Dòng ${i + 1}: chưa có ảnh “${c[8]}” trong mục 9.`); }
    return v;
  });
  const cachviet = {};
  L(val('cachviet')).forEach((l, i) => {
    const c = C(l); if (!c[0] || !c[1]) return;
    cachviet[c[0]] = c[1];
    if (!hasImg(c[1])) W.tumoi.push(`Cách viết, dòng ${i + 1}: chưa có ảnh “${c[1]}” trong mục 9.`);
  });
  const nguphap = L(val('nguphap')).map((l, i) => {
    const c = C(l);
    if (c.length < 3) W.nguphap.push(`Dòng ${i + 1}: cần ít nhất 3 cột (điểm ngữ pháp | ý nghĩa | mẫu câu).`);
    const ex = (c[3] || '').split(/;(?![^(]*\))/).map(s => s.trim()).filter(Boolean).map(s => {
      const k = s.indexOf('='); return k < 0 ? [s, ''] : [s.slice(0, k).trim(), s.slice(k + 1).trim()];
    });
    return {zh: c[0], vi: c[1] || '', pat: c[2] || '', ex, note: c[4] || ''};
  });
  const cau = L(val('hoithoai')).map((l, i) => {
    const c = C(l);
    if (c.length < 2) W.hoithoai.push(`Dòng ${i + 1}: cần ít nhất 2 cột (người nói | câu).`);
    return [c[0], c[1] || '', c[2] || '', c[3] || ''];
  });
  const baitap = S.exs.map((x, i) => {
    const w = []; const d = PX[x.loai](x.text, w); W.ex[i] = w;
    return {loai: x.loai, tieude: x.tieude.trim() || LOAI[x.loai].tieude, ...d};
  }).filter(x => (x.cau || x.nhom || x.doan || []).length);
  const B = {
    so, dir, mau: S.mau, cap: val('cap'), ten: val('ten'), pinyin: val('pinyin'), nghia: val('nghia'),
    gioithieu: val('gioithieu'), anhbia: $('#anhbia').value,
    slide: S.slideFile ? `${dir}-slide.pptx` : S.slideName,
    muctieu: {kienthuc: L(val('kienthuc')), nangluc: L(val('nangluc')), phamchat: L(val('phamchat'))},
    tientrinh: {tieude: val('tt-tieude'), buoc: L(val('tientrinh')).map(l => { const c = C(l); return c.length > 1 ? [c[0], c.slice(1).join(' | ')] : ['', c[0]]; })},
    tumoi, cachviet, nguphap,
    hoithoai: {gioithieu: val('ht-gioithieu'), cau},
    baitap,
  };
  return [B, W];
}

function fill(B) {
  const set = (id, v) => $('#' + id).value = v ?? '';
  set('so', B.so); set('dir', B.dir); set('cap', B.cap); set('ten', B.ten); set('pinyin', B.pinyin); set('nghia', B.nghia);
  set('gioithieu', B.gioithieu);
  const mt = B.muctieu || {};
  set('kienthuc', (mt.kienthuc || []).join('\n')); set('nangluc', (mt.nangluc || []).join('\n')); set('phamchat', (mt.phamchat || []).join('\n'));
  set('tt-tieude', B.tientrinh?.tieude); set('tientrinh', (B.tientrinh?.buoc || []).map(b => J(b)).join('\n'));
  set('tumoi', (B.tumoi || []).map(v => J([v.w, v.p, v.t, v.m, v.g, ...(v.ex || ['', '', '']), v.img])).join('\n'));
  set('cachviet', Object.entries(B.cachviet || {}).map(e => J(e)).join('\n'));
  set('nguphap', (B.nguphap || []).map(g => J([g.zh, g.vi, g.pat, (g.ex || []).map(([z, v]) => v ? `${z} = ${v}` : z).join('; '), g.note])).join('\n'));
  set('ht-gioithieu', B.hoithoai?.gioithieu); set('hoithoai', (B.hoithoai?.cau || []).map(c => J(c)).join('\n'));
  S.mau = B.mau || 'ngoc';
  S.exs = (B.baitap || []).filter(x => FX[x.loai]).map(x => ({loai: x.loai, tieude: x.tieude || '', text: FX[x.loai](x)}));
  S.slideName = B.slide || ''; S.slideFile = null;
  drawThemes(); drawExs(); drawGallery(B.anhbia || '');
}
const usedImgs = B => new Set([B.anhbia, ...B.tumoi.map(v => v.img), ...Object.values(B.cachviet)].filter(Boolean));

/* ---------- preview ---------- */
let tPrev;
function changed() { dirty = true; clearTimeout(tPrev); tPrev = setTimeout(render, 400); }
function render() {
  const [B, W] = model();
  ['tumoi', 'nguphap', 'hoithoai'].forEach(k => $('#w-' + k).innerHTML = W[k].slice(0, 6).map(x => `<div>${esc(x)}</div>`).join('') + (W[k].length > 6 ? `<div>… và ${W[k].length - 6} lỗi khác</div>` : ''));
  $$('#exs .exi').forEach((el, i) => $('.warns', el).innerHTML = (W.ex[i] || []).slice(0, 6).map(x => `<div>${esc(x)}</div>`).join(''));
  const mtN = ['kienthuc', 'nangluc', 'phamchat'].reduce((n, k) => n + B.muctieu[k].length, 0);
  $('#c-muctieu').textContent = mtN ? `${mtN} ý · ${B.tientrinh.buoc.length} bước` : '';
  $('#c-tumoi').textContent = B.tumoi.length ? `${B.tumoi.length} từ` : '';
  $('#c-nguphap').textContent = B.nguphap.length ? `${B.nguphap.length} điểm` : '';
  $('#c-hoithoai').textContent = B.hoithoai.cau.length ? `${B.hoithoai.cau.length} câu` : '';
  $('#c-baitap').textContent = S.exs.length ? `${S.exs.length} bài` : '';
  $('#slideInfo').value = S.slideFile ? `${S.slideFile.name} (lưu thành ${B.slide})` : S.slideName;
  const used = usedImgs(B);
  $$('#gallery button').forEach(b => b.classList.toggle('used', used.has(b.dataset.n)));
  saveDraft(B);

  const map = {}; IMG.forEach((v, k) => map[k] = v.url);
  const goc = S.goc || (B.dir ? BASE + B.dir + '/anh/' : '');
  const js = o => JSON.stringify(o).replace(/</g, '\\u003c');
  const f = $('#frame');
  let y = 0; try { y = f.contentWindow.scrollY; } catch {}
  f.onload = () => { try { f.contentWindow.scrollTo(0, y); } catch {} };
  f.srcdoc = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Noto+Serif:wght@600;700&family=Noto+Serif+SC:wght@500;700&display=swap">
<link rel="stylesheet" href="${BASE}khung/giao-an.css"></head><body>
<script>window.XEM_TRUOC=1;window.ANH_MAP=${js(map)};window.ANH_GOC=${js(goc)};window.BAI=${js({...B, ten: B.ten || '(Chưa có tên bài)', so: B.so || '?'})};<\/script>
<script src="${BASE}khung/lib/qrcode.min.js"><\/script><script src="${BASE}khung/giao-an.js"><\/script></body></html>`;
}
$$('.ph [data-size]').forEach(b => b.addEventListener('click', () => $('#preview').classList.toggle('phone', b.dataset.size === 'phone')));

/* ---------- draft ---------- */
function saveDraft(B) {
  try { localStorage.setItem(DRAFT, JSON.stringify({B, exs: S.exs, sua: S.sua, slideName: S.slideName, dirty})); } catch {}
}
function readDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT) || 'null'); } catch { return null; }
}

/* ---------- themes ---------- */
function drawThemes() {
  $('#themes').innerHTML = MAU.map(m => `<label class="theme"><input type="radio" name="mau" value="${m.id}"${m.id === S.mau ? ' checked' : ''}>
    <div class="sw" style="background:${m.bg};color:${m.fg}"><b>你好</b><i>${m.c.map(c => `<span style="background:${c}"></span>`).join('')}</i></div>
    <strong>${m.ten}</strong><small>${m.mo}</small></label>`).join('');
}
$('#themes').addEventListener('change', e => { S.mau = e.target.value; changed(); });

/* ---------- exercises ---------- */
function drawExs() {
  $('#exs').innerHTML = S.exs.map((x, i) => `<div class="exi" data-i="${i}">
    <div class="hd"><b>Bài ${i + 1}</b>
      <select data-k="loai" aria-label="Loại bài tập">${Object.entries(LOAI).map(([k, l]) => `<option value="${k}"${k === x.loai ? ' selected' : ''}>${l.ten}</option>`).join('')}</select>
      <input data-k="tieude" value="${esc(x.tieude)}" placeholder="${esc(LOAI[x.loai].tieude)}" aria-label="Tiêu đề bài tập">
      <button class="btn sm" data-act="up" aria-label="Chuyển lên"${i ? '' : ' disabled'}>↑</button>
      <button class="btn sm" data-act="down" aria-label="Chuyển xuống"${i < S.exs.length - 1 ? '' : ' disabled'}>↓</button>
      <button class="btn sm danger" data-act="del">Xóa</button>
    </div>
    <span class="fmt">${esc(LOAI[x.loai].fmt)}</span>
    <textarea data-k="text" placeholder="${esc(LOAI[x.loai].mau)}" aria-label="Nội dung bài ${i + 1}">${esc(x.text)}</textarea>
    <div class="warns"></div>
  </div>`).join('');
}
$('#addEx').innerHTML = Object.entries(LOAI).map(([k, l]) => `<button class="btn sm" data-loai="${k}">+ ${l.ten}</button>`).join('');
$('#addEx').addEventListener('click', e => {
  const b = e.target.closest('[data-loai]'); if (!b) return;
  S.exs.push({loai: b.dataset.loai, tieude: '', text: ''});
  drawExs(); changed();
  $('#exs .exi:last-child textarea').focus();
});
$('#exs').addEventListener('input', e => {
  const k = e.target.dataset.k; if (!k) return;
  const i = +e.target.closest('.exi').dataset.i;
  S.exs[i][k] = e.target.value;
  if (k === 'loai') drawExs();
  changed();
});
$('#exs').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const i = +b.closest('.exi').dataset.i, a = b.dataset.act;
  if (a === 'del') { if (S.exs[i].text.trim() && !confirm(`Xóa Bài ${i + 1}?`)) return; S.exs.splice(i, 1); }
  else { const j = a === 'up' ? i - 1 : i + 1; [S.exs[i], S.exs[j]] = [S.exs[j], S.exs[i]]; }
  drawExs(); changed();
});

/* ---------- images ---------- */
function drawGallery(keep) {
  const names = [...new Set([...IMG.keys(), ...S.cu])].sort();
  const url = n => IMG.get(n)?.url || S.goc + encodeURIComponent(n);
  $('#gallery').innerHTML = names.length ? names.map(n => `<button data-n="${esc(n)}" title="Chép tên ảnh"><img src="${esc(url(n))}" alt="" loading="lazy">${esc(n)}</button>`).join('')
    : '<p class="hint">Chưa có ảnh. Kéo file .pptx hoặc ảnh vào mục 1.</p>';
  $('#c-anh').textContent = names.length ? `${names.length} ảnh` : '';
  const cur = keep ?? ($('#anhbia').dataset.want || $('#anhbia').value);
  $('#anhbia').innerHTML = '<option value="">(không có ảnh bìa)</option>' + names.map(n => `<option${n === cur ? ' selected' : ''}>${esc(n)}</option>`).join('');
}
$('#gallery').addEventListener('click', async e => {
  const b = e.target.closest('[data-n]'); if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.n); toast(`Đã chép tên ảnh “${b.dataset.n}”.`); }
  catch { toast(`Tên ảnh: ${b.dataset.n}`); }
});
const MIME = {jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp'};
async function addImage(name, blob) {
  name = name.replace(/\s+/g, '-').replace(/\.jpeg$/i, '.jpg');
  const ext = name.split('.').pop().toLowerCase();
  if (ext !== 'gif') {
    try {
      const bmp = await createImageBitmap(blob);
      const max = 1200, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
      if (k < 1 || blob.size > 400e3) {
        const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
        c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
        const png = ext === 'png';
        blob = await new Promise(r => c.toBlob(r, png ? 'image/png' : 'image/jpeg', 0.8));
        if (!png) name = name.replace(/\.\w+$/, '.jpg');
      }
    } catch {}
  }
  const old = IMG.get(name); if (old) URL.revokeObjectURL(old.url);
  IMG.set(name, {blob, url: URL.createObjectURL(blob)});
  return name;
}

/* ---------- import ---------- */
const log = (msg, cls = 'ok') => $('#log').insertAdjacentHTML('beforeend', `<div class="${cls}">${esc(msg)}</div>`);
async function nap(files) {
  $('#log').innerHTML = '';
  for (const f of files) {
    const ext = f.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'docx') await napWord(f);
      else if (ext === 'pptx') await napSlide(f);
      else if (MIME[ext]) { const n = await addImage(f.name, f); log(`Đã thêm ảnh ${n}.`); }
      else log(`Bỏ qua ${f.name}: chỉ nhận .docx, .pptx hoặc ảnh.`, 'err');
    } catch (e) { log(`Không đọc được ${f.name}: ${e.message || e}`, 'err'); }
  }
  drawGallery(); render();
}
async function napSlide(file) {
  const zip = await JSZip.loadAsync(file);
  const num = n => +n.match(/(\d+)\.xml/)[1];
  const slides = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b));
  let count = 0;
  for (const s of slides) {
    const n = num(s), rel = zip.file(`ppt/slides/_rels/slide${n}.xml.rels`); if (!rel) continue;
    const xml = new DOMParser().parseFromString(await rel.async('string'), 'application/xml');
    // Đánh số theo thứ tự ảnh xuất hiện trên trang (kể cả ảnh lặp): s02_1.jpg, s02_2.gif…
    const rels = Object.fromEntries([...xml.getElementsByTagName('Relationship')]
      .filter(r => /\/image$/.test(r.getAttribute('Type'))).map(r => [r.getAttribute('Id'), r.getAttribute('Target')]));
    const body = await zip.file(s).async('string');
    const targets = [...body.matchAll(/r:embed="([^"]+)"/g)].map(m => rels[m[1]]).filter(Boolean);
    let k = 0;
    for (const t of targets) {
      const path = t.startsWith('/') ? t.slice(1) : 'ppt/' + t.replace(/^\.\.\//, '');
      const ext = path.split('.').pop().toLowerCase(), f = zip.file(path);
      if (!f || !MIME[ext]) continue;
      k++; count++;
      await addImage(`s${String(n).padStart(2, '0')}_${k}.${ext}`, new Blob([await f.async('uint8array')], {type: MIME[ext]}));
    }
  }
  S.slideFile = file;
  log(`Slide “${file.name}”: ${slides.length} trang, lấy được ${count} ảnh. Slide sẽ dùng cho nút Thuyết trình.`);
}

/* Word: các đề mục (Thông tin, Mục tiêu, Tiến trình, Từ mới, Cách viết, Ngữ pháp, Hội thoại, Bài 1. …) chia phần;
   bảng thành các dòng "cột | cột", đoạn văn thành từng dòng. */
const SEC = [
  ['info', /^thông tin/i], ['muctieu', /^mục tiêu/i], ['tientrinh', /^(tiến trình|các bước lên lớp|hoạt động dạy)/i],
  ['tumoi', /^(từ mới|từ vựng|生词)/i], ['cachviet', /^(cách viết|thứ tự nét)/i], ['nguphap', /^(ngữ pháp|语法|mẫu câu)/i],
  ['hoithoai', /^(hội thoại|会话|对话|课文)/i], ['baitap', /^(bài tập|luyện tập|练习)\s*$/i],
];
const SUB = [['kienthuc', /^kiến thức\s*[:：]?\s*/i], ['nangluc', /^(năng lực|kỹ năng|kĩ năng)\s*[:：]?\s*/i], ['phamchat', /^(phẩm chất|thái độ)\s*[:：]?\s*/i]];
const INFO = [['so', /số bài|bài số/i], ['ten', /tên bài|tiêu đề/i], ['pinyin', /pinyin|phiên âm/i], ['nghia', /nghĩa|dịch/i],
  ['cap', /cấp|trình độ|lớp/i], ['gioithieu', /giới thiệu|mô tả/i], ['mau', /mẫu|giao diện/i], ['anhbia', /ảnh bìa/i]];
const HEAD_RE = /^(stt|chữ hán|hán tự|từ|pinyin|phiên âm|từ loại|nghĩa|nhóm|ví dụ|ảnh|thời gian|nội dung|người nói|nhân vật|câu|mẫu câu|ghi chú|điểm ngữ pháp|ý nghĩa|đáp án|lựa chọn|câu hỏi|gợi ý|hoạt động)(?!\p{L})/iu;
const CJK = /[㐀-鿿]/;

async function napWord(file) {
  const {value: html} = await mammoth.convertToHtml({arrayBuffer: await file.arrayBuffer()});
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out = {info: {}, kienthuc: [], nangluc: [], phamchat: [], tientrinh: [], tumoi: [], cachviet: [], nguphap: [], hoithoai: [], exs: []};
  let sec = null, sub = 'kienthuc', ex = null, ttTitle = '', htIntro = '', seenEx = false;
  const head = txt => {
    const t = txt.replace(/^(\d+|[IVX]+)[.)]\s+/, '').trim();
    // "Bài 10: 你家有几口人？" ở đầu giáo án là tên bài, không phải bài tập.
    const m = t.match(/^bài\s*(?:tập\s*)?\d+\s*[.:：)\-–]?\s*(.*)$/i);
    if (m && t.length < 120 && (seenEx || /chọn|điền|sắp xếp|đọc|trả lời|trắc nghiệm|viết|nối|dịch|hoàn thành/i.test(m[1]))) {
      ex = {tieude: m[1].trim(), lines: []}; out.exs.push(ex); sec = 'ex'; seenEx = true; return true;
    }
    if (t.length > 80) return false;
    for (const [k, re] of SEC) if (re.test(t)) {
      sec = k; ex = null;
      if (k === 'baitap') seenEx = true;
      if (k === 'tientrinh' && /\(/.test(t)) ttTitle = t;
      return true;
    }
    return false;
  };
  const line = txt => {
    if (sec === 'muctieu') {
      for (const [k, re] of SUB) if (re.test(txt)) { sub = k; txt = txt.replace(re, ''); break; }
      if (txt) out[sub].push(txt.replace(/^[-–•]\s*/, ''));
    } else if (sec === 'hoithoai' && !txt.includes('|')) {
      const m = txt.match(/^(\S{1,8})\s*[:：]\s*(.+)$/);
      if (m && CJK.test(m[2])) out.hoithoai.push(J([m[1], m[2]])); else htIntro = txt.replace(/^lời dẫn\s*[:：]\s*/i, '');
    } else if (sec === 'ex') ex.lines.push(txt);
    else if (sec === 'info') { const k = txt.indexOf(':'); if (k > 0) infoKV(txt.slice(0, k), txt.slice(k + 1)); }
    else if (sec && out[sec]) out[sec].push(txt);
  };
  const infoKV = (k, v) => { for (const [f, re] of INFO) if (re.test(k)) { out.info[f] = v.trim(); return; } };
  const cellText = td => {
    const ps = [...td.querySelectorAll('p')].map(p => p.textContent.trim()).filter(Boolean);
    const sep = sec === 'ex' ? ' // ' : sec === 'muctieu' ? '\n' : ' ';
    return (ps.length ? ps.join(sep) : td.textContent.trim()).replace(/\|/g, '/');
  };
  for (const el of doc.body.children) {
    if (el.tagName === 'TABLE') {
      [...el.querySelectorAll('tr')].forEach((tr, r) => {
        const cells = [...tr.children].map(cellText);
        if (!cells.some(Boolean)) return;
        if (sec === 'info') { if (cells.length >= 2) infoKV(cells[0], cells.slice(1).join(' ')); return; }
        if (r === 0 && !cells.some(c => CJK.test(c)) && cells.filter(c => HEAD_RE.test(c)).length >= 2) return;
        if (sec === 'muctieu') {
          const s = cells.length >= 2 && SUB.find(([, re]) => re.test(cells[0]));
          if (s) sub = s[0];
          cells.slice(s ? 1 : 0).join('\n').split('\n').map(x => x.trim()).filter(Boolean).forEach(line);
          return;
        }
        if (sec) line(J(cells));
      });
      continue;
    }
    const items = /^(UL|OL)$/.test(el.tagName) ? [...el.querySelectorAll('li')].map(li => li.textContent) : [el.textContent];
    for (let txt of items) {
      txt = txt.replace(/\s+/g, ' ').trim(); if (!txt) continue;
      if (head(txt)) continue;
      line(txt);
    }
  }

  const I = out.info, got = [];
  if (Object.keys(I).length) {
    if (I.so) { $('#so').value = parseInt(I.so, 10) || ''; $('#dir').value = 'bai' + $('#so').value; }
    ['ten', 'pinyin', 'nghia', 'cap', 'gioithieu'].forEach(k => { if (I[k]) $('#' + k).value = I[k]; });
    const m = I.mau && MAU.find(x => new RegExp(x.ten, 'i').test(I.mau) || x.id === I.mau.toLowerCase());
    if (m) { S.mau = m.id; drawThemes(); }
    if (I.anhbia) $('#anhbia').dataset.want = I.anhbia;
    got.push('thông tin bài');
  }
  ['kienthuc', 'nangluc', 'phamchat'].forEach(k => { if (out[k].length) $('#' + k).value = out[k].join('\n'); });
  if (out.kienthuc.length + out.nangluc.length + out.phamchat.length) got.push('mục tiêu');
  if (out.tientrinh.length) { $('#tientrinh').value = out.tientrinh.join('\n'); if (ttTitle) $('#tt-tieude').value = ttTitle; got.push(`${out.tientrinh.length} bước tiến trình`); }
  if (out.tumoi.length) { $('#tumoi').value = out.tumoi.join('\n'); got.push(`${out.tumoi.length} từ mới`); }
  if (out.cachviet.length) $('#cachviet').value = out.cachviet.join('\n');
  if (out.nguphap.length) { $('#nguphap').value = out.nguphap.join('\n'); got.push(`${out.nguphap.length} điểm ngữ pháp`); }
  if (out.hoithoai.length) { $('#hoithoai').value = out.hoithoai.join('\n'); got.push(`${out.hoithoai.length} câu hội thoại`); }
  if (htIntro) $('#ht-gioithieu').value = htIntro;
  const exs = out.exs.filter(x => x.lines.length);
  if (exs.length) { S.exs = exs.map(x => ({loai: guessLoai(x.tieude), tieude: x.tieude, text: x.lines.join('\n')})); drawExs(); got.push(`${exs.length} bài tập`); }
  if (got.length) log(`Word “${file.name}”: đã nạp ${got.join(', ')}. Kiểm tra lại các ô có cảnh báo màu vàng.`);
  else log(`Word “${file.name}”: không tìm thấy đề mục nào theo mẫu (Từ mới, Ngữ pháp, Hội thoại, Bài 1…). Hãy soạn theo mẫu Word.`, 'err');
  changed();
}

const drop = $('#drop');
$('#pickFile').addEventListener('click', () => $('#file').click());
$('#file').addEventListener('change', e => { nap([...e.target.files]); e.target.value = ''; });
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => nap([...e.dataTransfer.files]));

/* Dán bảng từ Word/Excel: cột cách nhau bằng Tab → " | " */
document.addEventListener('paste', e => {
  const ta = e.target.closest?.('textarea'); if (!ta) return;
  const t = e.clipboardData.getData('text/plain'); if (!t.includes('\t')) return;
  e.preventDefault();
  ta.setRangeText(t.replace(/\r/g, '').replace(/\t/g, ' | ').replace(/\n+$/, ''), ta.selectionStart, ta.selectionEnd, 'end');
  ta.dispatchEvent(new Event('input', {bubbles: true}));
});
$('.editor').addEventListener('input', e => { if (!e.target.closest('#exs')) changed(); });
$('#anhbia').addEventListener('change', changed);
$('#so').addEventListener('input', () => { const d = $('#dir'); if (!d.value || /^bai\d*$/.test(d.value)) d.value = 'bai' + $('#so').value; });

/* ---------- lessons ---------- */
const list = () => [...(window.DANH_SACH || [])].sort((a, b) => a.so - b.so);
function drawPick() {
  $('#pick').innerHTML = '<option value="">+ Bài mới</option>' + list().map(l => `<option value="${esc(l.dir)}"${l.dir === S.sua ? ' selected' : ''}>Sửa Bài ${esc(l.so)} · ${esc(l.ten)}</option>`).join('');
}
function loadScript(src) {
  return new Promise((ok, err) => {
    const s = document.createElement('script'); s.src = src;
    s.onload = () => { s.remove(); ok(); }; s.onerror = () => { s.remove(); err(new Error('Không đọc được ' + src)); };
    document.head.append(s);
  });
}
async function openLesson(dir) {
  IMG.forEach(v => URL.revokeObjectURL(v.url)); IMG.clear();
  S.sua = dir; S.cu = new Set(); S.goc = '';
  if (!dir) {
    const last = list().at(-1), so = last ? last.so + 1 : 1;
    fill({so, dir: 'bai' + so, cap: last ? (await lessonCap(last.dir)) : 'Tiếng Trung HSK 1', mau: S.mau});
  } else {
    delete window.BAI;
    await loadScript(`${dir}/du-lieu.js?v=${Date.now()}`);
    const B = window.BAI;
    S.goc = BASE + dir + '/anh/';
    S.cu = usedImgs({anhbia: B.anhbia, tumoi: B.tumoi || [], cachviet: B.cachviet || {}});
    fill(B);
  }
  dirty = false; drawPick(); render();
}
async function lessonCap(dir) {
  try { delete window.BAI; await loadScript(`${dir}/du-lieu.js?v=${Date.now()}`); return window.BAI.cap || ''; } catch { return ''; }
}
$('#pick').addEventListener('change', async e => {
  const to = e.target.value;
  if (dirty && !confirm('Bài đang soạn chưa lưu sẽ bị thay thế. Tiếp tục?')) { e.target.value = S.sua; return; }
  try { await openLesson(to); } catch (err) { toast(err.message); e.target.value = S.sua; }
});

/* ---------- save ---------- */
function ready(B) {
  const miss = [!B.so && 'Bài số', !/^[a-z0-9_-]+$/.test(B.dir) && 'Thư mục (chữ thường, không dấu, vd. bai11)', !B.ten && 'Tên bài'].filter(Boolean);
  if (!miss.length) return true;
  const box = $('#so').closest('details'); box.open = true; box.scrollIntoView({behavior: 'smooth'});
  toast('Còn thiếu: ' + miss.join(', ') + '.');
  return false;
}
const dataJs = B => '// Dữ liệu bài học. Tạo và sửa bằng trang soan-bai.html (dành cho giáo viên).\nwindow.BAI = ' + JSON.stringify(B, null, 2) + ';\n';
const listJs = L => '// Danh sách bài trên trang mục lục. Trang soan-bai.html tự cập nhật file này khi lưu bài.\nwindow.DANH_SACH = [\n' + L.map(x => '  ' + JSON.stringify(x)).join(',\n') + '\n];\n';
function upsert(L, B) {
  const e = {so: B.so, dir: B.dir, ten: B.ten, nghia: B.nghia}; if (B.slide) e.slide = B.slide;
  return [...L.filter(x => x.dir !== B.dir), e].sort((a, b) => a.so - b.so);
}
function parseList(text) {
  const m = text.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
  try { return m ? JSON.parse(m[1]) : list(); } catch { return list(); }
}
function bundle(B, L) {
  const files = [[`${B.dir}/index.html`, SHELL], [`${B.dir}/du-lieu.js`, dataJs(B)]];
  for (const n of usedImgs(B)) { const im = IMG.get(n); if (im) files.push([`${B.dir}/anh/${n}`, im.blob]); }
  if (S.slideFile) files.push([`${B.dir}/${B.slide}`, S.slideFile]);
  const L2 = upsert(L, B);
  files.push(['danh-sach.js', listJs(L2)]);
  return [files, L2];
}
function saved(B, L2) {
  window.DANH_SACH = L2; S.sua = B.dir; dirty = false;
  if (S.slideFile) { S.slideName = B.slide; S.slideFile = null; }
  drawPick();
}
let root = null;
async function write(path, data) {
  const parts = path.split('/'); let d = root;
  for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p, {create: true});
  const w = await (await d.getFileHandle(parts.at(-1), {create: true})).createWritable();
  await w.write(data); await w.close();
}
$('#save').addEventListener('click', async () => {
  const [B] = model(); if (!ready(B)) return;
  if (!window.showDirectoryPicker) { toast('Trình duyệt này không lưu thẳng vào thư mục được, mình tải gói .zip thay thế. Nên dùng Edge hoặc Chrome trên máy tính.'); return zipIt(B); }
  try {
    if (!root) {
      toast('Chọn thư mục “web” của trang tài liệu (thư mục có file danh-sach.js).');
      root = await window.showDirectoryPicker({id: 'web-tai-lieu', mode: 'readwrite'});
    }
    let L;
    try { L = parseList(await (await (await root.getFileHandle('danh-sach.js')).getFile()).text()); }
    catch { root = null; toast('Thư mục vừa chọn không có danh-sach.js. Hãy chọn đúng thư mục “web”.'); return; }
    if (list().some(x => x.dir === B.dir) && S.sua !== B.dir && !confirm(`Thư mục ${B.dir} đã có bài. Ghi đè?`)) return;
    const [files, L2] = bundle(B, L);
    for (const [p, d] of files) await write(p, d);
    saved(B, L2);
    toast(`Đã lưu Bài ${B.so} vào web/${B.dir}. Mở GitHub Desktop, bấm Commit rồi Push để đưa lên mạng.`);
  } catch (e) {
    if (e.name !== 'AbortError') toast('Không lưu được: ' + e.message);
  }
});
async function zipIt(B) {
  const z = new JSZip();
  const [files, L2] = bundle(B, list());
  files.forEach(([p, d]) => z.file(p, d));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(await z.generateAsync({type: 'blob'}));
  a.download = `${B.dir}.zip`; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  saved(B, L2);
  toast(`Đã tải ${B.dir}.zip. Giải nén vào thư mục web (chép đè danh-sach.js), rồi Commit và Push bằng GitHub Desktop.`);
}
$('#zip').addEventListener('click', () => { const [B] = model(); if (ready(B)) zipIt(B); });
window.addEventListener('beforeunload', e => { if (dirty) e.preventDefault(); });

/* ---------- start ---------- */
(async () => {
  drawThemes(); drawPick();
  const d = readDraft();
  if (d && d.dirty && d.B) {
    if (d.sua) { S.sua = d.sua; S.goc = BASE + d.sua + '/anh/'; S.cu = usedImgs(d.B); }
    fill(d.B); S.exs = d.exs || S.exs; S.slideName = d.slideName || ''; drawExs(); drawPick();
    dirty = true; render();
    toast('Đã mở lại bài đang soạn dở. Ảnh và slide mới nạp cần nạp lại.');
  } else {
    try { await openLesson(d?.sua || ''); } catch { try { await openLesson(''); } catch { render(); } }
  }
})();
})();
