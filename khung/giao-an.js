/* Hiển thị một bài học từ window.BAI (file du-lieu.js của từng bài).
   Trang soạn bài dùng lại file này để xem trước: khi đó có window.XEM_TRUOC, window.ANH_MAP (ảnh mới nạp) và window.ANH_GOC (thư mục ảnh của bài). */
(function () {
const B = window.BAI;
const SPK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';
const PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
const QRI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4z"/></svg>';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const anh = name => (window.ANH_MAP && window.ANH_MAP[name]) || (window.ANH_GOC || 'anh/') + encodeURIComponent(name);
const norm = s => s.replace(/[，。？！、,.?!\s]/g, '');
const preview = !!window.XEM_TRUOC;

document.documentElement.lang = 'vi';
document.documentElement.dataset.mau = B.mau || 'ngoc';

/* Cách xuất (B.xuat): full = một trang đủ cả; rieng = index.html là giáo trình, bai-tap.html là bài tập;
   giaotrinh / baitap = chỉ một phần. window.TRANG (do bai-tap.html hoặc khung xem trước đặt) chọn trang đang mở. */
const XUAT = B.xuat || 'full';
const TRANG = window.TRANG || (XUAT === 'full' ? 'full' : XUAT === 'baitap' ? 'baitap' : 'giaotrinh');
const coGT = TRANG !== 'baitap', coBT = TRANG !== 'giaotrinh';
document.title = `Bài ${B.so} · ${B.ten}${TRANG === 'baitap' ? ' · Bài tập' : ''}`;
const V = coGT && B.tumoi || [], G = coGT && B.nguphap || [], D = coGT && B.hoithoai && B.hoithoai.cau || [], EX = coBT && B.baitap || [];
const mt = coGT && B.muctieu || {}, plan = coGT && B.tientrinh && B.tientrinh.buoc || [];
const TR = coGT && B.hienTrang !== false && B.trang || [];   // ảnh chụp từng trang slide / PDF bài giảng
/* Bài giảng thành bài đọc: mỗi trang một mục (tiêu đề, chữ, ảnh, bảng từ B.noidung); trang không có chữ thì hiện ảnh chụp trang.
   Trang liền sau cùng tiêu đề hoặc không có tiêu đề thì nối vào mục trước. */
const BG = [];
TR.forEach((ten, i) => {
  const nd = (B.noidung || [])[i], coChu = nd && nd.khoi.some(k => k.t === 'p' || k.t === 'bang');
  const khoi = (coChu ? nd.khoi : [{t: 'chup'}]).map(k => k.t === 'goc' || k.t === 'chup' ? {...k, ten} : k);
  khoi.ten = ten;
  const tieude = coChu && nd.tieude || '', truoc = BG.at(-1);
  if (truoc && (!tieude || tieude === truoc.tieude)) truoc.phan.push(khoi);
  else BG.push({tieude, phan: [khoi]});
});
const hasGoals = ['kienthuc', 'nangluc', 'phamchat'].some(k => (mt[k] || []).length) || plan.length;
const secs = [
  hasGoals && ['muc-tieu', 'Mục tiêu'], TR.length && ['bai-giang', 'Bài giảng'], V.length && ['tu-moi', 'Từ mới'], G.length && ['ngu-phap', 'Ngữ pháp'],
  D.length && ['hoi-thoai', 'Hội thoại'], EX.length && ['bai-tap', 'Bài tập'],
].filter(Boolean);
const groups = [...new Set(V.map(v => v.g).filter(Boolean))];
const chips = [BG.length && `${BG.length} mục bài giảng`, V.length && `${V.length} từ mới`, G.length && `${G.length} điểm ngữ pháp`, EX.length && `${EX.length} bài tập tự chấm`].filter(Boolean);
// Xuất riêng: thêm link sang trang còn lại (trừ khi đang xem trước trong trang soạn bài).
const sang = XUAT !== 'rieng' || preview ? '' : TRANG === 'baitap' ? '<a href="./">← Giáo trình</a>' : (B.baitap || []).length ? '<a href="bai-tap.html">Bài tập →</a>' : '';
/* Mã QR: [đường dẫn tương đối, tên nút, đuôi tên file ảnh] */
const QRT = XUAT === 'full' ? [['', 'Cả bài', ''], ...(EX.length ? [['#bai-tap', 'Phần bài tập', '-bai-tap']] : [])]
  : XUAT !== 'rieng' ? [['', TRANG === 'baitap' ? 'Bài tập' : 'Giáo trình', TRANG === 'baitap' ? '-bai-tap' : '']]
  : TRANG === 'baitap' ? [['', 'Bài tập', '-bai-tap'], ['./', 'Giáo trình', '']]
  : [['', 'Giáo trình', ''], ...((B.baitap || []).length ? [['bai-tap.html', 'Bài tập', '-bai-tap']] : [])];

document.body.innerHTML = `
<header class="hero"><div class="wrap">
  <div class="topbar">
    <span></span>
    <button class="btn" id="qrBtn">${QRI}Mã QR</button>
  </div>
  <div class="grid">
    <div>
      <div class="eyebrow">Bài ${esc(B.so)} · ${TRANG === 'baitap' ? 'Bài tập' : esc(B.cap)}</div>
      <h1>${esc(B.ten)}</h1>
      <div class="py-big">${esc(B.pinyin)}${B.nghia ? ' · ' + esc(B.nghia) : ''}</div>
      ${B.gioithieu ? `<p class="lead">${md(B.gioithieu)}</p>` : ''}
      <div class="meta">${chips.map(c => `<span class="chip">${c}</span>`).join('')}</div>
    </div>
    ${B.anhbia ? `<figure style="margin:0"><img src="${anh(B.anhbia)}" alt="${esc(B.nghia || B.ten)}"></figure>` : ''}
  </div>
</div></header>
<nav class="tabs" aria-label="Các phần của bài học"><div class="wrap">${secs.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('')}${sang}</div></nav>
<main>
${hasGoals ? `<section id="muc-tieu"><div class="wrap">
  <div class="sec-head"><h2>Mục tiêu bài học</h2><span class="zh">学习目标</span></div>
  <div class="goals">${[['kienthuc', 'Kiến thức'], ['nangluc', 'Năng lực'], ['phamchat', 'Phẩm chất']].filter(([k]) => (mt[k] || []).length)
    .map(([k, t]) => `<div class="goal"><h3>${t}</h3><ul>${mt[k].map(x => `<li>${md(x)}</li>`).join('')}</ul></div>`).join('')}</div>
  ${plan.length ? `<details class="plan"><summary>${esc(B.tientrinh.tieude || 'Tiến trình dạy học (dành cho giáo viên)')}</summary>
    <ol class="steps">${plan.map(([t, s]) => `<li><span class="t">${esc(t)}</span><div>${md(s)}</div></li>`).join('')}</ol></details>` : ''}
</div></section>` : ''}
${TR.length ? `<section id="bai-giang"><div class="wrap">
  <div class="sec-head"><h2>Bài giảng</h2><span class="zh">课件</span></div>
  <div class="bg" id="bg"></div>
</div></section>` : ''}
${V.length ? `<section id="tu-moi"><div class="wrap">
  <div class="sec-head"><h2>Từ mới</h2><span class="zh">生词</span></div>
  <div class="toolbar" role="group" aria-label="Lọc từ mới">
    ${groups.length > 1 ? `<button class="filter" data-g="" aria-pressed="true">Tất cả</button>${groups.map(g => `<button class="filter" data-g="${esc(g)}" aria-pressed="false">${esc(g)}</button>`).join('')}` : ''}
    <label class="switch"><input type="checkbox" id="hideMean"> Ẩn nghĩa để tự kiểm tra</label>
  </div>
  <div class="cards" id="cards"></div>
</div></section>` : ''}
${G.length ? `<section id="ngu-phap"><div class="wrap">
  <div class="sec-head"><h2>Ngữ pháp và mẫu câu</h2><span class="zh">语法</span></div>
  <div class="gram" id="gram"></div>
</div></section>` : ''}
${D.length ? `<section id="hoi-thoai"><div class="wrap">
  <div class="sec-head"><h2>Hội thoại luyện tập</h2><button class="btn primary" id="playAll"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>Nghe cả bài</button></div>
  ${B.hoithoai.gioithieu ? `<p class="sub" style="margin-bottom:12px">${md(B.hoithoai.gioithieu)}</p>` : ''}
  <div class="dlg" id="dlg"></div>
</div></section>` : ''}
${EX.length ? `<section id="bai-tap"><div class="wrap">
  <div class="sec-head"><h2>Bài tập</h2><span class="zh">练习</span></div>
  <div id="exs"></div>
</div></section>` : ''}
</main>
<footer><div class="wrap"><b style="color:var(--ink)">Bài ${esc(B.so)} · ${esc(B.ten)}</b><br>Phát âm dùng giọng đọc tiếng Trung có sẵn trên thiết bị. Nếu không nghe được, hãy kiểm tra âm lượng hoặc cài giọng tiếng Trung (zh-CN) trong cài đặt máy.</div></footer>
<div class="toast" id="toast" hidden></div>
<dialog class="qr" id="qrDlg" aria-labelledby="qrTitle">
  <h2 id="qrTitle">Quét mã để mở bài</h2>
  <div class="sub">Bài ${esc(B.so)} · <span class="zh">${esc(B.ten)}</span></div>
  ${QRT.length > 1 ? `<div class="seg" role="group" aria-label="Mã QR dẫn tới">
    ${QRT.map(([, t], k) => `<button data-k="${k}" aria-pressed="${!k}">${t}</button>`).join('')}
  </div>` : ''}
  <div class="qr-box"><img id="qrImg" alt="Mã QR mở bài học"></div>
  <div class="qr-link" id="qrLink"></div>
  <div class="qr-warn" id="qrWarn" hidden></div>
  <div class="qr-actions">
    <button class="btn primary" id="qrSave">Tải ảnh QR</button>
    <button class="btn" id="qrCopy">Sao chép link</button>
    <button class="btn" id="qrClose">Đóng</button>
  </div>
</dialog>`;

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 3200);
}

/* ---------- speech ---------- */
let zhVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  zhVoice = vs.find(v => /zh[-_]CN/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function utter(text, onstart, onend) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN'; u.rate = 0.8;
  if (zhVoice) u.voice = zhVoice;
  if (onstart) u.onstart = onstart;
  if (onend) u.onend = u.onerror = onend;
  return u;
}
function speak(text) {
  if (!('speechSynthesis' in window)) { toast('Thiết bị này không hỗ trợ đọc tiếng Trung.'); return; }
  speechSynthesis.cancel();
  speechSynthesis.speak(utter(text));
  if (!zhVoice) setTimeout(() => { pickVoice(); if (!zhVoice) toast('Chưa thấy giọng tiếng Trung trên máy, phát âm có thể không chuẩn.'); }, 400);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-say]');
  if (b) { e.stopPropagation(); speak(b.dataset.say); }
});
const sayBtn = t => `<button class="say" data-say="${esc(t)}" aria-label="Nghe">${SPK}</button>`;

/* ---------- bài giảng: đọc như bài viết trên web, mục lục ở đầu, ảnh chụp slide gốc gập lại ở cuối mỗi mục ---------- */
if (BG.length) {
  const HAN = /[㐀-鿿]/, doc = s => (s.replace(/\*\*/g, '').match(/[㐀-鿿，。？！、]+/g) || []).join('');
  const dong = s => md(s).replace(/\n/g, '<br>').replace(/[㐀-鿿][㐀-鿿，。？！、 ]*/g, m => `<span class="zh">${m}</span>`)
    + (HAN.test(s) ? sayBtn(doc(s)) : '');
  const hinh = (n, alt, cls) => `<figure class="${cls}"><img src="${anh(n)}" alt="${esc(alt)}" loading="lazy"></figure>`;
  const than = ks => {
    let h = '';
    for (let i = 0; i < ks.length;) {
      const k = ks[i];
      if (k.t === 'p' && k.cham) {   // các ý gạch đầu dòng liền nhau thành một danh sách
        const tag = k.cham === '#' ? 'ol' : 'ul'; let li = '';
        for (; i < ks.length && ks[i].t === 'p' && ks[i].cham; i++) li += `<li${ks[i].lv ? ` style="margin-left:${ks[i].lv * 1.2}em"` : ''}>${dong(ks[i].s)}</li>`;
        h += `<${tag}>${li}</${tag}>`; continue;
      }
      if (k.t === 'anh') {   // ảnh liền nhau xếp cạnh nhau, giữ tỉ lệ to nhỏ như trên slide
        let a = '';
        for (; i < ks.length && ks[i].t === 'anh'; i++) a += `<img src="${anh(ks[i].ten)}" alt="" loading="lazy" style="width:${Math.max(18, Math.min(100, Math.round(ks[i].w * 100)))}%">`;
        h += `<div class="bg-anh">${a}</div>`; continue;
      }
      if (k.t === 'p') h += `<p>${dong(k.s)}</p>`;
      else if (k.t === 'bang') h += `<div class="bg-bang"><table>${k.hang.map(r => `<tr>${r.map(c => `<td>${dong(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
      else if (k.t === 'chup') h += hinh(k.ten, 'Trang slide', 'bg-chup');
      i++;
    }
    return h;
  };
  const coTen = BG.filter(m => m.tieude);
  $('#bg').innerHTML = (coTen.length >= 3 ? `<nav class="bg-ml" aria-label="Mục lục bài giảng"><ol>${BG.map((m, i) => m.tieude ? `<li><a href="#bg-${i + 1}">${md(m.tieude)}</a></li>` : '').join('')}</ol></nav>` : '')
    + BG.map((m, i) => {
      // Mỗi trang một khối: chữ bên trái, ảnh chụp trang PDF (nếu có) bên phải, để chữ luôn nằm cạnh hình của chính trang đó.
      const an = m.phan.filter(ks => !ks.some(k => k.t === 'goc' || k.t === 'chup')).map(ks => ks.ten);   // trang chưa hiện ảnh chụp: để ở "Xem slide gốc"
      return `<article class="bg-muc" id="bg-${i + 1}">
        ${m.tieude ? `<h3>${dong(m.tieude)}</h3>` : ''}
        ${m.phan.map(ks => {
          const goc = ks.find(k => k.t === 'goc');
          return `<div class="bg-than${goc ? ' co-hinh' : ''}"><div class="bg-chu">${than(ks)}</div>${goc ? hinh(goc.ten, 'Hình trong trang', 'bg-hinh') : ''}</div>`;
        }).join('')}
        ${an.length ? `<details class="bg-goc"><summary>Xem slide gốc${an.length > 1 ? ` (${an.length} trang)` : ''}</summary>${an.map(n => hinh(n, 'Slide gốc', '')).join('')}</details>` : ''}
      </article>`;
    }).join('');
}

/* ---------- vocabulary ---------- */
const ST = B.cachviet || {};
if (V.length) {
  $('#cards').innerHTML = V.map((v, i) => {
    const chars = [...v.w];
    const gifs = [...new Set(chars)].filter(c => ST[c]);
    const ex = v.ex || [];
    return `<article class="card" data-g="${esc(v.g)}" data-i="${i}">
      <div class="card-top">
        <button class="cells" data-say="${esc(v.w)}" aria-label="Nghe ${esc(v.w)}">${chars.map(c => `<span class="cell">${esc(c)}</span>`).join('')}</button>
        ${v.img ? `<img class="thumb" src="${anh(v.img)}" alt="${esc(v.m)}" loading="lazy">` : ''}
      </div>
      <div class="py">${esc(v.p)}${v.t ? `<span class="pos">${esc(v.t)}</span>` : ''}</div>
      <div class="mean">${esc(v.m)}</div>
      ${ex[0] ? `<p class="ex"><span class="zh">${esc(ex[0])}</span>${sayBtn(ex[0])}${ex[1] ? '<br>' + esc(ex[1]) : ''}${ex[2] ? '<br>' + esc(ex[2]) : ''}</p>` : ''}
      <div class="actions">
        <button class="btn" data-say="${esc(v.w)}">${SPK}Nghe</button>
        ${gifs.length ? `<button class="btn tgl-stroke" aria-expanded="false">${PEN}Cách viết</button>` : ''}
      </div>
      ${gifs.length ? `<div class="strokes" hidden>${gifs.map(c => `<img alt="Thứ tự nét chữ ${esc(c)}" data-src="${anh(ST[c])}">`).join('')}</div>` : ''}
    </article>`;
  }).join('');
  $('#cards').addEventListener('click', e => {
    const card = e.target.closest('.card'); if (!card) return;
    const t = e.target.closest('.tgl-stroke');
    if (t) {
      const box = $('.strokes', card); const open = box.hidden;
      if (open) $$('img', box).forEach(im => { if (!im.src) im.src = im.dataset.src; });
      box.hidden = !open; t.setAttribute('aria-expanded', open);
      return;
    }
    if (e.target.closest('button')) return;
    if (document.body.classList.contains('hide-mean')) card.classList.toggle('shown');
  });
  $$('.filter').forEach(b => b.addEventListener('click', () => {
    $$('.filter').forEach(x => x.setAttribute('aria-pressed', x === b));
    $$('.card').forEach(c => c.hidden = !(b.dataset.g === '' || c.dataset.g === b.dataset.g));
  }));
  $('#hideMean').addEventListener('change', e => {
    document.body.classList.toggle('hide-mean', e.target.checked);
    $$('.card.shown').forEach(c => c.classList.remove('shown'));
    if (e.target.checked) toast('Chạm vào một thẻ để hiện nghĩa.');
  });
}

/* ---------- grammar ---------- */
if (G.length) $('#gram').innerHTML = G.map(g => `<div class="g">
  <h3><span class="zh">${esc(g.zh)}</span><span>${esc(g.vi)}</span></h3>
  ${g.pat ? `<div class="pattern">${esc(g.pat)}</div>` : ''}
  <ul>${(g.ex || []).map(([z, v]) => `<li><span class="zh">${esc(z)}</span>${sayBtn(z)}<span class="vi">${esc(v)}</span></li>`).join('')}</ul>
  ${g.note ? `<p class="note">${md(g.note)}</p>` : ''}</div>`).join('');

/* ---------- dialogue ---------- */
if (D.length) {
  const who = [...new Set(D.map(d => d[0]))];
  $('#dlg').innerHTML = D.map(([w, z, p, v]) => `<div class="line ${who.indexOf(w) % 2 ? 'b' : 'a'}">
    <span class="who">${esc(w)}</span>
    <div><div class="zh">${esc(z)}</div><div class="p">${esc(p)}</div><div class="vi">${esc(v)}</div></div>
    ${sayBtn(z)}</div>`).join('');
  $('#playAll').addEventListener('click', () => {
    if (!('speechSynthesis' in window)) { toast('Thiết bị này không hỗ trợ đọc tiếng Trung.'); return; }
    speechSynthesis.cancel();
    const lines = $$('#dlg .line');
    D.forEach((d, i) => speechSynthesis.speak(utter(d[1],
      () => { lines.forEach(l => l.classList.remove('now')); lines[i].classList.add('now'); },
      () => { if (i === D.length - 1) lines[i].classList.remove('now'); })));
  });
}

/* ---------- exercises ---------- */
let imLang = false;   // đang chấm cả bài khi nộp: không hiện thông báo của từng bài
function setScore(block, ok, total) {
  const s = $('.score', block); s.textContent = `Đúng ${ok}/${total}`;
  s.classList.toggle('full', ok === total);
  block.dataset.ok = ok; block.dataset.total = total;
  if (!imLang) toast(ok === total ? `Tuyệt vời! Đúng cả ${total} câu.` : `Em làm đúng ${ok}/${total} câu. Xem lại các câu tô đỏ nhé.`);
}
function clearMarks(block) {
  $$('li', block).forEach(li => li.classList.remove('ok', 'bad'));
  $$('.fb', block).forEach(f => f.innerHTML = '');
  const s = $('.score', block); if (s) { s.textContent = ''; s.classList.remove('full'); }
}
const CHECK = '<div class="ex-actions"><button class="btn primary chk">Kiểm tra</button><button class="btn rst">Làm lại</button></div>';
const splitAD = s => s.split(/\s*\b([ABCD])\b\s*/);

const KIEU = {
  /* Chọn vị trí A/B/C/D cho từ trong ngoặc */
  vitri(el, X) {
    el.innerHTML += `<ol class="qs"></ol>${CHECK}`;
    const render = () => $('.qs', el).innerHTML = X.cau.map(([s, w], i) => `<li data-i="${i}"><div class="sent">${splitAD(s).map((p, k) => k % 2 ? `<button class="slot" data-l="${p}" aria-pressed="false">${p}</button>` : esc(p)).join('')}<span class="word">(${esc(w)})</span></div><div class="fb"></div></li>`).join('');
    render();
    el.addEventListener('click', e => {
      const b = e.target.closest('.slot'); if (!b) return;
      $$('.slot', b.closest('li')).forEach(x => x.setAttribute('aria-pressed', x === b));
    });
    $('.chk', el).addEventListener('click', () => {
      let ok = 0;
      $$('.qs>li', el).forEach(li => {
        const [s, w, a] = X.cau[li.dataset.i];
        const right = $('.slot[aria-pressed="true"]', li)?.dataset.l === a; ok += right;
        li.classList.toggle('ok', right); li.classList.toggle('bad', !right);
        const full = splitAD(s).map((p, k) => k % 2 ? (p === a ? `<mark>${esc(w)}</mark>` : '') : esc(p)).join('');
        $('.fb', li).innerHTML = (right ? '✓ ' : `✗ Đáp án: <b>${esc(a)}</b> · `) + `<span class="zh">${full}</span>`;
      });
      setScore(el, ok, X.cau.length);
    });
    $('.rst', el).addEventListener('click', () => { render(); clearMarks(el); });
  },
  /* Chọn từ điền vào chỗ trống (____) */
  dien(el, X) {
    el.innerHTML += X.nhom.map((n, k) => `${n.tu.length ? `<div class="part">${n.tu.map(esc).join(' · ')}</div>` : ''}<ol class="qs" data-k="${k}"></ol>`).join('') + CHECK;
    const sel = words => `<select class="blank" aria-label="Chọn từ"><option value="">…</option>${words.map(w => `<option>${esc(w)}</option>`).join('')}</select>`;
    const render = () => X.nhom.forEach((n, k) => {
      const words = n.tu.length ? n.tu : [...new Set(n.cau.flatMap(c => c[1]))];
      $(`.qs[data-k="${k}"]`, el).innerHTML = n.cau.map(([s], i) => `<li data-k="${k}" data-i="${i}"><div class="sent">${s.split('____').map(esc).join(sel(words))}</div><div class="fb"></div></li>`).join('');
    });
    render();
    $('.chk', el).addEventListener('click', () => {
      let ok = 0, total = 0;
      $$('.qs>li', el).forEach(li => {
        const ans = X.nhom[li.dataset.k].cau[li.dataset.i][1];
        // Nhiều chỗ trống: nếu số đáp án bằng số chỗ trống thì chấm theo thứ tự, không thì mỗi ô chỉ cần là một đáp án đúng.
        const vals = $$('select', li).map(s => s.value);
        const right = vals.length > 1 && ans.length === vals.length ? vals.every((v, k) => v === ans[k]) : vals.every(v => ans.includes(v));
        ok += right; total++;
        li.classList.toggle('ok', right); li.classList.toggle('bad', !right);
        $('.fb', li).innerHTML = right ? '✓ Đúng' : `✗ Đáp án: <b class="zh">${ans.map(esc).join(' / ')}</b>`;
      });
      setScore(el, ok, total);
    });
    $('.rst', el).addEventListener('click', () => { render(); clearMarks(el); });
  },
  /* Sắp xếp từ thành câu */
  sapxep(el, X) {
    el.innerHTML += `<ol class="qs"></ol>${CHECK}`;
    let pick = [];
    const render = () => {
      pick = X.cau.map(() => []);
      $('.qs', el).innerHTML = X.cau.map(([toks], i) => `<li data-i="${i}"><div><div class="ansline"></div><div class="bank">${toks.map((t, k) => `<button class="tok" data-k="${k}">${esc(t)}</button>`).join('')}</div></div><div class="fb"></div></li>`).join('');
    };
    const draw = li => {
      const i = +li.dataset.i, toks = X.cau[i][0];
      $('.ansline', li).innerHTML = pick[i].map((k, n) => `<button class="tok" data-n="${n}">${esc(toks[k])}</button>`).join('');
      $$('.bank .tok', li).forEach(b => b.disabled = pick[i].includes(+b.dataset.k));
    };
    render();
    el.addEventListener('click', e => {
      const b = e.target.closest('.tok'); if (!b) return;
      const li = b.closest('li'), i = +li.dataset.i;
      if (b.dataset.k !== undefined) pick[i].push(+b.dataset.k); else pick[i].splice(+b.dataset.n, 1);
      li.classList.remove('ok', 'bad'); $('.fb', li).innerHTML = '';
      draw(li);
    });
    $('.chk', el).addEventListener('click', () => {
      let ok = 0;
      $$('.qs>li', el).forEach(li => {
        const i = +li.dataset.i, [toks, ans] = X.cau[i];
        const s = pick[i].map(k => toks[k]).join('');
        const right = pick[i].length === toks.length && ans.some(a => norm(a) === s);
        ok += right;
        li.classList.toggle('ok', right); li.classList.toggle('bad', !right);
        $('.fb', li).innerHTML = (right ? '✓ ' : '✗ Đáp án: ') + `<span class="zh">${ans.map(esc).join(' / ')}</span>`;
      });
      setScore(el, ok, X.cau.length);
    });
    $('.rst', el).addEventListener('click', () => { render(); clearMarks(el); });
  },
  /* Đọc đoạn văn và tự viết câu trả lời, có gợi ý đáp án */
  tuluan(el, X) {
    el.innerHTML += X.doan.map((p, i) => (p.van ? `<div class="passage">${i + 1}. ${esc(p.van)} ${sayBtn(p.van)}</div>` : '') +
      p.hoi.map(([q, a]) => `<div class="q4"><div class="q">${esc(q)}</div><textarea rows="1" aria-label="Câu trả lời"></textarea>${a ? `<div><button class="btn show-ans">Xem đáp án</button></div><div class="reveal" hidden>Gợi ý: <span class="zh">${esc(a)}</span></div>` : ''}</div>`).join('')).join('');
    el.addEventListener('click', e => {
      const b = e.target.closest('.show-ans'); if (!b) return;
      const r = $('.reveal', b.closest('.q4')); r.hidden = !r.hidden;
      b.textContent = r.hidden ? 'Xem đáp án' : 'Ẩn đáp án';
    });
  },
  /* Trắc nghiệm A/B/C/D, có thể kèm một đoạn đọc */
  tracnghiem(el, X, n) {
    el.innerHTML += (X.doan ? `<div class="passage">${esc(X.doan)} ${sayBtn(X.doan)}</div>` : '') + `<ol class="qs"></ol>${CHECK}`;
    const render = () => $('.qs', el).innerHTML = X.cau.map(([q, opts], i) => `<li data-i="${i}"><div><div class="sent">${esc(q)}</div><div class="opts">${opts.map((o, k) => `<label class="opt"><input type="radio" name="q${n}-${i}" value="${k}">${'ABCDEF'[k]}. ${esc(o)}</label>`).join('')}</div></div><div class="fb"></div></li>`).join('');
    render();
    $('.chk', el).addEventListener('click', () => {
      let ok = 0;
      $$('.qs>li', el).forEach(li => {
        const [, opts, a] = X.cau[li.dataset.i];
        const v = $('input:checked', li)?.value; const right = v !== undefined && +v === a;
        ok += right;
        li.classList.toggle('ok', right); li.classList.toggle('bad', !right);
        $('.fb', li).innerHTML = right ? '✓ Đúng' : `✗ Đáp án: <b>${'ABCDEF'[a]}. <span class="zh">${esc(opts[a])}</span></b>`;
      });
      setScore(el, ok, X.cau.length);
    });
    $('.rst', el).addEventListener('click', () => { render(); clearMarks(el); });
  },
};
EX.forEach((X, n) => {
  if (!KIEU[X.loai]) return;
  const el = document.createElement('div');
  el.className = 'ex-block'; el.id = 'ex' + (n + 1);
  el.innerHTML = `<header><h3>Bài ${n + 1}. ${esc(X.tieude)}</h3>${X.loai === 'tuluan' ? '' : '<span class="score"></span>'}</header>`;
  $('#exs').append(el);
  KIEU[X.loai](el, X, n);
});

/* ---------- nộp bài: họ tên, lớp, điểm từng bài gửi tới Google Sheet của giáo viên (khung/cau-hinh.js) ---------- */
function nopBai(url) {
  const box = document.createElement('div');
  box.className = 'ex-block nop'; box.id = 'nop-bai';
  box.innerHTML = `<header><h3>Nộp bài</h3></header>
    <p class="sub">Làm xong các bài ở trên, điền họ tên và lớp rồi bấm <b>Nộp bài</b>. Thầy cô sẽ nhận được kết quả của em.</p>
    <div class="nop-f"><label>Họ và tên<input id="nopTen" autocomplete="name"></label><label>Lớp<input id="nopLop" autocomplete="off"></label></div>
    <div class="ex-actions"><button class="btn primary" id="nopBtn">Nộp bài</button></div>
    <div class="nop-kq" id="nopKq" aria-live="polite"></div>`;
  $('#exs').append(box);
  try { const h = JSON.parse(localStorage.getItem('hoc-sinh') || '{}'); $('#nopTen').value = h.ten || ''; $('#nopLop').value = h.lop || ''; } catch {}
  $('#nopBtn').addEventListener('click', async () => {
    const ten = $('#nopTen').value.trim(), lop = $('#nopLop').value.trim();
    if (!ten || !lop) { toast('Em điền đủ họ tên và lớp nhé.'); (ten ? $('#nopLop') : $('#nopTen')).focus(); return; }
    if (!url) { toast('Đây là bản xem trước, học sinh nộp được trên trang thật.'); return; }
    imLang = true; $$('#exs .chk').forEach(b => b.click()); imLang = false;
    let dung = 0, tong = 0;
    const ct = [], tl = [];
    EX.forEach((X, n) => {
      const el = $('#ex' + (n + 1)); if (!el) return;
      if (X.loai === 'tuluan') {
        $$('textarea', el).forEach((t, k) => tl.push(`Bài ${n + 1}.${k + 1}: ${t.value.trim() || '(bỏ trống)'}`));
        return;
      }
      const ok = +el.dataset.ok || 0, total = +el.dataset.total || 0;
      dung += ok; tong += total; ct.push(`Bài ${n + 1}: ${ok}/${total}`);
    });
    const btn = $('#nopBtn'); btn.disabled = true; btn.textContent = 'Đang nộp…';
    try {
      // Google Apps Script không trả CORS, nên gửi kiểu no-cors (không đọc được phản hồi, lỗi mạng thì vẫn bắt được).
      await fetch(url, {method: 'POST', mode: 'no-cors', headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify({bai: `Bài ${B.so} · ${B.ten}`, dir: B.dir || '', ten, lop, dung, tong, chitiet: ct.join('; '), tuluan: tl.join('\n')})});
      try { localStorage.setItem('hoc-sinh', JSON.stringify({ten, lop})); } catch {}
      const gio = new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
      $('#nopKq').textContent = `Đã nộp lúc ${gio}.${tong ? ` Em đúng ${dung}/${tong} câu.` : ''}`;
      btn.textContent = 'Nộp lại';
      toast('Đã nộp bài.');
    } catch {
      btn.textContent = 'Nộp bài';
      toast('Chưa nộp được, kiểm tra mạng rồi bấm Nộp bài lại.');
    } finally { btn.disabled = false; }
  });
}
if (EX.length) {
  if (preview) nopBai('');
  else {
    // Cấu hình nằm chung một file cho mọi bài, đọc lúc mở trang để bài cũ cũng dùng được.
    const s = document.createElement('script'); s.src = '../khung/cau-hinh.js';
    s.onload = () => { const url = window.CAU_HINH?.nop; if (url) nopBai(url); };
    document.head.append(s);
  }
}

/* ---------- QR ---------- */
const dlg = $('#qrDlg');
let qrK = 0;
const pageUrl = () => { const base = location.href.split('#')[0]; return QRT[qrK][0] ? new URL(QRT[qrK][0], base).href : base; };
function qrCanvas(url, scale, label) {
  const q = qrcode(0, 'M'); q.addData(url); q.make();
  const n = q.getModuleCount(), m = 4, size = (n + m * 2) * scale, lh = label ? Math.round(scale * 5) : 0;
  const c = document.createElement('canvas'); c.width = size; c.height = size + lh;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect((k + m) * scale, (r + m) * scale, scale, scale);
  if (label) {
    g.font = `600 ${Math.round(scale * 2.4)}px "Be Vietnam Pro","Noto Serif SC",sans-serif`;
    g.textAlign = 'center'; g.fillText(label, size / 2, size + lh * 0.35, size - scale * 4);
  }
  return c;
}
function drawQr() {
  const url = pageUrl();
  $('#qrImg').src = qrCanvas(url, 10).toDataURL('image/png');
  $('#qrLink').textContent = url;
  const local = !/^https?:/.test(location.protocol);
  $('#qrWarn').hidden = !local;
  $('#qrWarn').textContent = local ? 'Đây là link trên máy tính của bạn, điện thoại không mở được. Hãy mở bài trên web (github.io) rồi xuất QR.' : '';
}
$('#qrBtn').addEventListener('click', () => { drawQr(); dlg.showModal(); });
$('#qrClose').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
$$('.seg button', dlg).forEach(b => b.addEventListener('click', () => {
  $$('.seg button', dlg).forEach(x => x.setAttribute('aria-pressed', x === b));
  qrK = +b.dataset.k; drawQr();
}));
$('#qrSave').addEventListener('click', () => {
  const a = document.createElement('a'), duoi = QRT[qrK][2];
  a.href = qrCanvas(pageUrl(), 20, `Bài ${B.so} · ${B.ten}${duoi ? ' · Bài tập' : ''}`).toDataURL('image/png');
  a.download = `qr-${B.dir || 'bai' + B.so}${duoi}.png`;
  document.body.append(a); a.click(); a.remove();
});
$('#qrCopy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(pageUrl()); toast('Đã sao chép link.'); }
  catch { toast('Không sao chép được, hãy chép link bên dưới mã QR.'); }
});

/* ---------- section tabs ---------- */
// Khung xem trước (srcdoc) lấy địa chỉ của trang soạn bài làm gốc: link "#tu-moi" sẽ mở cả trang soạn bài vào khung.
// Nên ở đó chỉ cuộn tới mục, không chuyển trang.
if (preview) document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  e.preventDefault();
  const t = document.getElementById(a.getAttribute('href').slice(1));
  if (t) t.scrollIntoView({behavior: 'smooth', block: 'start'});
});
const links = $$('nav.tabs a');
const io = new IntersectionObserver(es => es.forEach(en => {
  if (en.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
}), {rootMargin: '-45% 0px -50% 0px'});
$$('main section').forEach(s => io.observe(s));
if (location.hash && /^#[\w-]+$/.test(location.hash)) { const t = $(location.hash); if (t) t.scrollIntoView(); }
})();
