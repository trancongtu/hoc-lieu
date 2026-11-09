/* Trang soạn bài: nhập tay hoặc nạp từ Word/PPT, xem trước, rồi lưu thành thư mục bài trong "web". */
(function () {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BASE = new URL('.', location.href).href;
const DRAFT = 'soan-bai-nhap';

/* Trang bài học; trang = 'baitap' cho bai-tap.html khi xuất riêng giáo trình và bài tập. */
const shell = trang => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Bài học</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Ma+Shan+Zheng&family=Noto+Serif:ital,wght@0,400;0,600;0,700;1,400&family=Noto+Serif+SC:wght@500;700&family=Patrick+Hand&display=swap">
<link rel="stylesheet" href="../khung/giao-an.css">
</head>
<body>
${trang ? `<script>window.TRANG = '${trang}';</script>\n` : ''}<script src="du-lieu.js"></script>
<script src="../khung/lib/qrcode.min.js"></script>
<script src="../khung/giao-an.js"></script>
</body>
</html>
`;

/* l: mẫu đổi bố cục (khớp với html[data-mau] trong giao-an.css và .mini[data-l] trong soan-bai.html); không có l thì chỉ đổi màu. */
const MAU = [
  {id: 'sotay', l: 'sotay', ten: 'Sổ tay', mo: 'Giấy kẻ dòng, mục lục dọc bên trái, từ mới xếp thành danh sách như từ điển.', bg: '#fbf9f3', fg: '#2b59a6', c: ['#2b59a6', '#c2410c'], s: '#fffefa', rr: 1},
  {id: 'the', l: 'the', ten: 'Thẻ học', mo: 'Ảnh bìa tràn màn hình, thẻ từ lớn có ảnh, hội thoại kiểu tin nhắn. Hợp học sinh nhỏ.', bg: '#fff7ef', fg: '#2a1840', c: ['#6d28d9', '#d6336c'], s: '#fff', rr: 6},
  {id: 'tapchi', l: 'tapchi', ten: 'Tạp chí', mo: 'Chữ to kiểu báo, đề mục đánh số 01 02, từ mới chia hai cột như từ điển.', bg: '#f7f6f2', fg: '#141414', c: ['#b91c1c', '#44403c'], s: '#fff', rr: 0},
  {id: 'bangden', l: 'bangden', ten: 'Bảng đen', mo: 'Nền bảng phấn, chữ viết tay, ô kẻ nét đứt. Hợp chiếu lên máy chiếu.', bg: '#1d3b30', fg: '#f3f1e7', c: ['#f6d76b', '#f6a5c0'], s: '#24493b', rr: 3},
  {id: 'ngoc', ten: 'Ngọc bích', mo: 'Xanh ngọc, gọn gàng, hợp mọi lớp.', bg: '#f4f7f5', fg: '#18221e', c: ['#16765b', '#bf3a29'], s: '#fff', rr: 4},
  {id: 'son', ten: 'Son mực', mo: 'Nền giấy dó, chữ son đỏ, góc vuông kiểu thư pháp.', bg: '#f6f0e4', fg: '#9e2b1d', c: ['#9e2b1d', '#2f4a6d'], s: '#fffaf0', rr: 1},
  {id: 'bien', ten: 'Tươi sáng', mo: 'Xanh dương, bo tròn, hợp học sinh nhỏ tuổi.', bg: '#f2f6fc', fg: '#13203a', c: ['#1f5fd0', '#b45309'], s: '#fff', rr: 8},
];
/* Mỗi loại bài tập: cột trong ô (cols, [tên, bắt buộc]), cách viết trong Word (word), ví dụ gõ trong ô (mau) và hình học sinh thấy (web). */
const LOAI = {
  vitri: {ten: 'Chọn vị trí', tieude: 'Chọn vị trí đúng cho từ trong ngoặc',
    cols: [['Câu có A B C D', 1], ['Từ cần đặt', 1], ['Đáp án: A, B, C hoặc D', 1]],
    mau: '你 A 今天 B 漂亮 C 了 D！ | 太 | C',
    word: '<p class="h">Bài 1: Chọn vị trí đúng cho từ trong ngoặc</p><p>1. 你 A 今天 B 漂亮 C 了 D！（太） <span class="red">Đáp án: C</span></p>',
    web: '<div class="mk-sent">你 <i>A</i> 今天 <i>B</i> 漂亮 <i class="on">C</i> 了 <i>D</i>！ <em>(太)</em></div><span class="mk-btn">Kiểm tra</span>'},
  dien: {ten: 'Điền từ', tieude: 'Chọn từ điền vào chỗ trống',
    cols: [['Từ: từ 1, từ 2  ← dòng mở đầu nhóm từ', 0], ['Câu có ____', 1], ['Đáp án (đúng nhiều cách thì cách nhau /)', 1]],
    mau: 'Từ: 都, 还是, 非常\n他们____不是韩国人。 | 都',
    word: '<p class="h">Bài 2: Chọn từ điền vào chỗ trống</p><p>都 / 还是 / 非常</p><p>1. 他们 ______ 不是韩国人。 <span class="red">Đáp án: 都</span></p>',
    web: '<div class="mk-tok"><span>都</span><span>还是</span><span>非常</span></div><div class="mk-sent">他们 <span class="mk-sel">都 ▾</span> 不是韩国人。</div>'},
  sapxep: {ten: 'Sắp xếp câu', tieude: 'Sắp xếp thành câu hoàn chỉnh',
    cols: [['Các từ cách nhau dấu cách', 1], ['Đáp án', 1], ['Đáp án khác', 0]],
    mau: '电影院 在 我 电影 看 | 我在电影院看电影。',
    word: '<p class="h">Bài 3: Sắp xếp câu</p><p>1. 电影院 / 在 / 我 / 电影 / 看</p><p class="red">Đáp án: 我在电影院看电影。</p>',
    web: '<div class="mk-tok ans"><span>我</span><span>在</span></div><div class="mk-tok"><span>电影院</span><span class="off">在</span><span class="off">我</span><span>电影</span><span>看</span></div>'},
  tracnghiem: {ten: 'Trắc nghiệm', tieude: 'Đọc và chọn đáp án đúng',
    cols: [['Đoạn: đoạn văn  ← không bắt buộc', 0], ['Câu hỏi', 1], ['A', 1], ['B', 1], ['*C  ← dấu * là đáp án đúng', 1], ['D', 0]],
    mau: 'Đoạn: 今天晚上他请我们去四川饭店吃饭。\n他们去哪儿吃饭？ | 北京饭店 | 电影院 | *四川饭店 | 咖啡店',
    word: '<p class="h">Bài 4: Đọc và chọn đáp án đúng</p><p>今天晚上他请我们去四川饭店吃饭。</p><p>1. 他们去哪儿吃饭？</p><p>A. 北京饭店</p><p>B. 电影院</p><p><b>C. 四川饭店</b> <span class="red">← in đậm</span></p><p>D. 咖啡店</p>',
    web: '<div class="mk-pass">今天晚上他请我们去四川饭店吃饭。</div><div class="zh">他们去哪儿吃饭？</div><div class="mk-opts"><span>A. 北京饭店</span><span>B. 电影院</span><span class="on">C. 四川饭店</span><span>D. 咖啡店</span></div>'},
  tuluan: {ten: 'Đọc và trả lời', tieude: 'Đọc và trả lời câu hỏi',
    cols: [['Đoạn: đoạn văn  ← không bắt buộc', 0], ['Câu hỏi', 1], ['Gợi ý đáp án', 0]],
    mau: 'Đoạn: 小明和欧文明天坐地铁去电影院。\n他们怎么去电影院？ | 他们坐地铁去。',
    word: '<p class="h">Bài 5: Đọc và trả lời câu hỏi</p><p>1. 小明和欧文明天坐地铁去电影院。</p><p>★ 他们怎么去电影院？</p><p class="red">Đáp án: 他们坐地铁去。</p>',
    web: '<div class="mk-pass">小明和欧文明天坐地铁去电影院。</div><div class="zh">他们怎么去电影院？</div><div class="mk-card" style="min-height:22px"></div><span class="mk-btn o">Xem đáp án</span>'},
};
const guessLoai = t => /vị trí/i.test(t) ? 'vitri' : /điền|chỗ trống|hoàn thành|hoàn thiện/i.test(t) ? 'dien' : /sắp xếp/i.test(t) ? 'sapxep'
  : /trắc nghiệm|đáp án đúng|chọn đáp án/i.test(t) ? 'tracnghiem' : 'tuluan';
const colsHtml = cols => `<div class="cols">${cols.map(([t, r]) => `<span${r ? ' class="req"' : ''}>${esc(t)}</span>`).join('<i>|</i>')}</div>`;
const codeHtml = s => esc(s).replace(/ \| /g, ' <b>|</b> ');

/* Ví dụ cho từng loại file ở mục 1: trang Word/slide bên trái → màn hình học sinh bên phải. */
const DEMO = {
  baitap: {
    a: 'File Word của thầy cô', b: 'Học sinh thấy trên điện thoại',
    paper: `<p class="gray">Họ và tên: ........ Lớp: ......</p><p class="h1" style="text-align:center">BÀI TẬP</p>
      <p class="h">Bài 1: Chọn vị trí đúng cho từ trong ngoặc</p><p>1. 你 A 今天 B 漂亮 C 了 D！（太） <span class="red">Đáp án: C</span></p>
      <p class="h">Bài 2: Sắp xếp câu</p><p>1. 电影院 / 在 / 我 / 电影 / 看</p><p class="gray">______________________</p><p class="red">Đáp án: 我在电影院看电影。</p>
      <p class="h">Bài 3: Đọc và chọn đáp án đúng</p><p>1. 他们去哪儿吃饭？</p><p>A. 北京饭店 &nbsp; B. 电影院</p><p><b>C. 四川饭店</b> &nbsp; D. 咖啡店</p>`,
    web: `<div class="mk-h">Bài 1. Chọn vị trí đúng…</div><div class="mk-sent">你 <i>A</i> 今天 <i>B</i> 漂亮 <i class="on">C</i> 了 <i>D</i>！ <em>(太)</em></div>
      <div class="mk-h">Bài 2. Sắp xếp câu</div><div class="mk-tok ans"><span>我</span><span>在</span></div><div class="mk-tok"><span>电影院</span><span class="off">在</span><span class="off">我</span><span>电影</span><span>看</span></div>
      <div class="mk-h">Bài 3. Đọc và chọn đáp án đúng</div><div class="mk-opts"><span>A. 北京饭店</span><span>B. 电影院</span><span class="on">C. 四川饭店</span><span>D. 咖啡店</span></div>
      <div><span class="mk-btn">Kiểm tra</span> <span class="mk-ok">Đúng 3/3</span></div>`,
    tips: ['Mỗi bài mở đầu bằng dòng <b>Bài 1: …</b>. Tên bài quyết định loại: có chữ <b>vị trí</b>, <b>điền / chỗ trống</b>, <b>sắp xếp</b>, <b>chọn đáp án</b>; còn lại là bài tự trả lời.',
      'Ghi đáp án bằng <b>Đáp án: …</b> ở cuối câu hoặc dòng ngay dưới. Trắc nghiệm thì <b>in đậm</b> lựa chọn đúng.',
      'Chưa có đáp án vẫn nạp được: câu nào thiếu sẽ báo vàng ở mục 8 để điền thêm.',
      'Dòng kẻ ____ để học sinh viết và dòng “Họ và tên, Lớp” được tự bỏ qua.'],
    dl: [['khung/mau-bai-tap.docx', 'Tải phiếu bài tập mẫu (.docx)']]},
  giaoan: {
    a: 'File Word theo mẫu', b: 'Thành trang bài học',
    paper: `<p class="h1">Thông tin bài</p><table><tr><td>Số bài</td><td>10</td></tr><tr><td>Tên bài</td><td>你家有几口人？</td></tr><tr><td>Giao diện</td><td>Thẻ học</td></tr></table>
      <p class="h1">Từ mới</p><table><tr><th>Chữ Hán</th><th>Pinyin</th><th>Từ loại</th><th>Nghĩa</th><th>…</th></tr><tr><td>爸爸</td><td>bàba</td><td>danh từ</td><td>bố, ba</td><td>…</td></tr></table>
      <p class="h1">Hội thoại</p><p>A：你家有几口人？</p><p>B：我家有五口人。</p>`,
    web: `<div class="mk-mute" style="font-size:9px;letter-spacing:.1em;color:var(--seal)">BÀI 10 · HSK 1</div><div class="zh" style="font-size:20px;font-weight:700;line-height:1.1">你家有几口人？</div>
      <div class="mk-card"><div class="mk-row"><div class="mk-cells"><span>爸</span><span>爸</span></div><i class="mk-img"></i></div><div class="mk-py">bàba<span class="mk-pos">danh từ</span></div><b>bố, ba</b></div>
      <div class="mk-line"><span class="mk-who">A</span><span class="zh">你家有几口人？</span></div>`,
    tips: ['Giữ đúng tên các đề mục: <b>Thông tin bài, Mục tiêu, Tiến trình, Từ mới, Cách viết, Ngữ pháp, Hội thoại, Bài tập</b>. Mục nào không có thì xóa cả đề mục.',
      'Bảng giữ đúng thứ tự cột như file mẫu; hàng tiêu đề được tự bỏ qua; thêm bớt dòng thoải mái.',
      'Ô “Giao diện” ghi tên mẫu, vd. <b>Thẻ học</b>, <b>Sổ tay</b>, <b>Tạp chí</b>, <b>Bảng đen</b>.'],
    dl: [['khung/mau-soan-bai.docx', 'Tải giáo án mẫu (.docx)']]},
  slide: {
    a: 'Slide .pptx hoặc .pdf', b: 'Thành mục Bài giảng',
    paper: `<div class="slides"><div class="slide"><i>ảnh</i><i class="gif">爸</i><span>trang 2</span></div><div class="slide"><i>ảnh</i><i>ảnh</i><span>trang 3</span></div></div>`,
    web: `<div class="mk-gal"><span class="on"><i></i>s02_1.jpg</span><span><i class="gif">爸</i>s02_2.gif</span><span><i></i>s03_1.jpg</span><span><i></i>s03_2.jpg</span></div>
      <div class="mk-mute">Bài giảng · mục lục · 爸爸 bàba – Bố 🔊 · ảnh xếp cạnh chữ</div>`,
    tips: ['Mỗi trang slide (.pptx) hoặc trang PDF thành một mục của <b>Bài giảng</b> trong giáo trình, đọc như bài viết trên web: tiêu đề, chữ, gạch đầu dòng, ảnh, bảng, có mục lục, bấm 🔊 để nghe câu tiếng Trung. Slide toàn ảnh, chữ không tách được thì hiện ảnh chụp slide, vẫn đủ nội dung. Có cả .pptx và .pdf cùng tên thì dùng .pptx (tách được ảnh riêng).',
      'Chữ đọc được thì tự điền số bài, tên bài, pinyin và từ mới dạng <b>爸爸 bàba 名 Bố</b> hoặc <b>píngguǒ (n) táo</b>, câu ví dụ ngay dưới.',
      'Ảnh trong slide cũng được tách riêng (<b>s02_1.jpg</b> là trang 2, ảnh thứ 1) để gắn vào thẻ từ; ảnh động .gif (thứ tự nét) dùng ở mục Cách viết.']},
  anh: {
    a: 'Ảnh trong máy', b: 'Gắn vào thẻ từ',
    paper: `<div class="files"><div><i></i>ba-me.jpg</div><div><i></i>con-cho.png</div><div><i style="background:#fff;border:1px solid #e5b4ab"></i>but-thuan-ba.gif</div></div>`,
    web: `<div class="mk-card"><div class="mk-row"><div class="mk-cells"><span>狗</span></div><i class="mk-img"></i></div><div class="mk-py">gǒu<span class="mk-pos">danh từ</span></div><b>con chó</b></div>`,
    tips: ['Ảnh lớn được tự thu nhỏ cho nhẹ. Tên có dấu cách được đổi thành gạch nối.',
      'Bấm ảnh ở mục 9 để chép tên, dán vào cột <b>Ảnh</b> của từ mới (vd. <code>狗 | gǒu | danh từ | con chó | | | | | con-cho.png</code>).']},
};
const VD = {
  tientrinh: '5′ | **Khởi động.** Chiếu ảnh gia đình, hỏi 这是谁？\n15′ | **Từ mới.** Dạy theo 4 nhóm.',
  tumoi: '爸爸 | bàba | danh từ | bố, ba | Gia đình | 我爸爸是老师。 | Wǒ bàba shì lǎoshī. | Bố tôi là giáo viên.',
  nguphap: '几口人 | Hỏi số người trong gia đình | 你家有几口人？ → 我家有 + số + 口人。 | 你家有几口人？ = Nhà bạn có mấy người?; 我家有四口人。 = Nhà tôi có bốn người. | **几** hỏi số lượng nhỏ.',
  hoithoai: 'A | 你家有几口人？ | Nǐ jiā yǒu jǐ kǒu rén? | Nhà bạn có mấy người?\nB | 我家有五口人。 | Wǒ jiā yǒu wǔ kǒu rén. | Nhà mình có năm người.',
};

/* ---------- state ---------- */
const S = {mau: 'ngoc', exs: [], slideFile: null, slideName: '', goc: '', cu: new Set(), sua: '', demo: 'baitap', luu: false, pv: 'giaotrinh',
  trang: [], noidung: [], minhhoa: [], xuatTay: false};   // trang: ảnh từng trang slide; noidung: chữ, ảnh, bảng của từng trang đó (mục Bài giảng); xuatTay: thầy cô đã tự chọn dạng bài
const NHOM = new Map();   // tên file slide (không đuôi) → {kieu, g, names, nd}: mỗi bộ slide một nhóm trang
const DA_NAP = new Set();   // file đã nạp (tên, cỡ, ngày sửa), nạp lại cùng file thì bỏ qua
const NGUON = new Map();   // tên file → File Word vừa nạp, lưu kèm bài vào thư mục tai-lieu/
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
      if (!a) w.push(`Dòng ${i + 1}: chưa có đáp án, thêm “| A” (hoặc B, C, D) vào cuối dòng.`);
      else if (!/^[ABCD]$/.test(a)) w.push(`Dòng ${i + 1}: đáp án phải là A, B, C hoặc D.`);
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
      if (doanRe.test(l)) { cur = {van: nl(l.replace(doanRe, '')), hoi: []}; doan.push(cur); return; }
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
  tuluan: X => X.doan.map(p => (p.van ? `Đoạn: ${unnl(p.van)}\n` : '') + p.hoi.map(h => J(h)).join('\n')).join('\n'),
};

const val = id => $('#' + id).value.trim();
function model() {
  const W = {tumoi: [], nguphap: [], hoithoai: [], ex: []};
  const so = parseInt(val('so'), 10) || '';
  const dir = val('dir');
  const tumoi = L(val('tumoi')).map((l, i) => {
    const c = C(l);
    if (c.length < 4) W.tumoi.push(`Dòng ${i + 1}: cần ít nhất 4 cột (chữ Hán | pinyin | từ loại | nghĩa).`);
    else if (!c[0]) W.tumoi.push(`Dòng ${i + 1} (${c[1] || c[3]}): chưa có chữ Hán.`);
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
    return {zh: c[0], vi: c[1] || '', pat: c[2] || '', ex, note: c[4] || '', ...(c[5] ? {gif: c[5]} : {})};
  });
  const cau = L(val('hoithoai')).map((l, i) => {
    const c = C(l);
    if (c.length < 2) W.hoithoai.push(`Dòng ${i + 1}: cần ít nhất 2 cột (người nói | câu).`);
    return [c[0], c[1] || '', c[2] || '', c[3] || '', ...(c[4] ? [c[4]] : [])];
  });
  const baitap = S.exs.map((x, i) => {
    const w = []; const d = PX[x.loai](x.text, w); W.ex[i] = w;
    return {loai: x.loai, tieude: x.tieude.trim() || LOAI[x.loai].tieude, ...d};
  }).filter(x => (x.cau || x.nhom || x.doan || []).length);
  const B = {
    so, dir, mau: S.mau, xuat: xuat(), cap: val('cap'), ten: val('ten'), pinyin: val('pinyin'), nghia: val('nghia'),
    gioithieu: val('gioithieu'), anhbia: $('#anhbia').value, trang: [...S.trang], noidung: S.noidung, hienTrang: $('#hienTrang').checked, minhhoa: S.minhhoa.map(x => ({...x})),
    slide: S.slideFile ? `${dir}-slide.${S.slideFile.name.split('.').pop().toLowerCase()}` : S.slideName,
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
  set('nguphap', (B.nguphap || []).map(g => J([g.zh, g.vi, g.pat, (g.ex || []).map(([z, v]) => v ? `${z} = ${v}` : z).join('; '), g.note, g.gif])).join('\n'));
  set('ht-gioithieu', B.hoithoai?.gioithieu); set('hoithoai', (B.hoithoai?.cau || []).map(c => J(c)).join('\n'));
  S.mau = B.mau || 'ngoc'; setXuat(B.xuat || 'full');
  S.exs = (B.baitap || []).filter(x => FX[x.loai]).map(x => ({loai: x.loai, tieude: x.tieude || '', text: FX[x.loai](x)}));
  S.slideName = B.slide || ''; S.slideFile = null;
  S.trang = [...(B.trang || [])]; S.noidung = B.noidung || []; $('#hienTrang').checked = B.hienTrang !== false;
  S.minhhoa = (B.minhhoa || []).map(x => ({...x}));
  drawThemes(); drawExs(); drawGallery(B.anhbia || ''); drawMinhHoa();
}
const BIA_WEB = '@web';   // bìa dựng bằng giao diện web, không cần ảnh
const usedImgs = B => new Set([B.anhbia, ...(B.trang || []), ...(B.noidung || []).flatMap(x => x ? x.khoi.map(k => k.ten) : []), ...B.tumoi.map(v => v.img), ...Object.values(B.cachviet),
  ...(B.minhhoa || []).filter(x => !x.bo).map(x => x.anh), ...(B.nguphap || []).map(g => g.gif), ...(B.hoithoai?.cau || []).map(c => c[4])].filter(n => n && n !== BIA_WEB));

/* ---------- preview ---------- */
let tPrev;
function changed() { dirty = true; clearTimeout(tPrev); tPrev = setTimeout(render, 400); }
function render() {
  const [B, W] = model();
  const warnList = (list, max = 6) => list.slice(0, max).map(x => `<div>${esc(x)}</div>`).join('') + (list.length > max ? `<div>… và ${list.length - max} chỗ khác</div>` : '');
  ['tumoi', 'nguphap', 'hoithoai'].forEach(k => $('#w-' + k).innerHTML = warnList(W[k]));
  $$('#exs .exi').forEach((el, i) => $('.warns', el).innerHTML = warnList(W.ex[i] || []));
  const exW = W.ex.reduce((n, w) => n + (w ? w.length : 0), 0);
  const cnt = (id, txt, warn) => { const c = $('#c-' + id); c.textContent = [txt, warn && `${warn} chỗ cần xem`].filter(Boolean).join(' · '); c.classList.toggle('warn', !!warn); };
  const mtN = ['kienthuc', 'nangluc', 'phamchat'].reduce((n, k) => n + B.muctieu[k].length, 0);
  cnt('muctieu', mtN ? `${mtN} ý · ${B.tientrinh.buoc.length} bước` : '');
  cnt('tumoi', B.tumoi.length ? `${B.tumoi.length} từ` : '', W.tumoi.length);
  cnt('nguphap', B.nguphap.length ? `${B.nguphap.length} điểm` : '', W.nguphap.length);
  cnt('hoithoai', B.hoithoai.cau.length ? `${B.hoithoai.cau.length} câu` : '', W.hoithoai.length);
  cnt('baitap', S.exs.length ? `${S.exs.length} bài` : '', exW);
  const mau = MAU.find(m => m.id === S.mau) || MAU[0];
  $('#c-mau').textContent = mau.ten; $('#pvMau').textContent = mau.ten;
  $('#slideInfo').value = S.slideFile ? `${S.slideFile.name} (lưu thành ${B.slide})` : S.slideName;
  $('#trangInfo').textContent = S.trang.length ? `Hiện ${S.trang.length} trang ở mục “Bài giảng” của giáo trình` : 'Chưa có. Nạp .pptx hoặc .pdf, từng trang sẽ được đưa vào.';
  drawGif();
  const used = usedImgs(B);
  $$('#gallery button').forEach(b => b.classList.toggle('used', used.has(b.dataset.n)));
  const an = AN[B.xuat] || [];   // mục bị ẩn theo loại bài thì không tính lỗi
  drawSteps(B, [['box-tumoi', W.tumoi.length], ['box-nguphap', W.nguphap.length], ['box-hoithoai', W.hoithoai.length], ['box-baitap', exW]]
    .filter(([id]) => !an.includes(id)), mau);
  saveDraft(B);

  const map = {}; IMG.forEach((v, k) => map[k] = v.url);
  const goc = S.goc || (B.dir ? BASE + B.dir + '/anh/' : '');
  const js = o => JSON.stringify(o).replace(/</g, '\\u003c');
  $('#pvTrang').hidden = B.xuat !== 'rieng';
  const trang = B.xuat === 'rieng' ? S.pv : '';
  const f = $('#frame');
  let y = 0; try { y = f.contentWindow.scrollY; } catch {}
  f.onload = () => { try { f.contentWindow.scrollTo(0, y); } catch {} };
  f.srcdoc = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Ma+Shan+Zheng&family=Noto+Serif:ital,wght@0,400;0,600;0,700;1,400&family=Noto+Serif+SC:wght@500;700&family=Patrick+Hand&display=swap">
<link rel="stylesheet" href="${BASE}khung/giao-an.css"></head><body>
<script>window.XEM_TRUOC=1;window.TRANG=${js(trang)};window.ANH_MAP=${js(map)};window.ANH_GOC=${js(goc)};window.BAI=${js({...B, ten: B.ten || '(Chưa có tên bài)', so: B.so || '?'})};<\/script>
<script src="${BASE}khung/lib/qrcode.min.js"><\/script><script src="${BASE}khung/giao-an.js"><\/script></body></html>`;
}
$$('.ph [data-size]').forEach(b => b.addEventListener('click', () => $('#preview').classList.toggle('phone', b.dataset.size === 'phone')));
$('#pvTrang').addEventListener('click', e => {
  const b = e.target.closest('[data-t]'); if (!b) return;
  S.pv = b.dataset.t; $$('#pvTrang button').forEach(x => x.setAttribute('aria-pressed', x === b)); render();
});
/* Thiết kế bài dạng: giáo trình (PDF) / bài tập (Word, nộp online) / cả hai một trang / cả hai tách riêng. */
const AN = {giaotrinh: ['box-baitap'], baitap: ['box-muctieu', 'box-tumoi', 'box-nguphap', 'box-hoithoai']};
const xuat = () => $('input[name="xuat"]:checked')?.value || 'full';
function setXuat(v) {
  $$('input[name="xuat"]').forEach(r => r.checked = r.value === v);
  document.body.dataset.loai = v;
  $('#xuatGoi').textContent = S.xuatTay ? 'Bạn đã tự chọn.' : 'Tự chọn theo file đã nạp, bấm ô khác để đổi.';
}
$('#xuat').addEventListener('change', () => { S.xuatTay = true; setXuat(xuat()); changed(); });
/* Dạng bài tự chọn theo nội dung đã nạp (có giáo trình, có bài tập), trừ khi thầy cô đã tự bấm chọn. */
function tuXuat() {
  if (S.xuatTay) return;
  const gt = S.trang.length || ['tumoi', 'nguphap', 'hoithoai', 'kienthuc'].some(val), bt = S.exs.length;
  if (gt || bt) setXuat(gt && bt ? 'full' : bt ? 'baitap' : 'giaotrinh');
}
$('#napBia').addEventListener('click', () => $('#fileBia').click());
$('#fileBia').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const n = await addImage(f.name, f);
  drawGallery(n); changed(); toast(`Đã đặt “${n}” làm ảnh bìa.`);
});

/* ---------- 4 bước ở đầu trang ---------- */
function go(id) {
  const box = document.getElementById(id); if (!box) return;
  box.open = true; box.scrollIntoView({behavior: 'smooth', block: 'start'});
}
function drawSteps(B, warns, mau) {
  const step = (s, done, todo, small, goTo) => {
    const li = $(`#steps [data-s="${s}"]`);
    li.classList.toggle('done', done); li.classList.toggle('todo', todo);
    if (small != null) $('small', li).textContent = small;
    if (goTo != null) $('button', li).dataset.go = goTo;
  };
  const has = [S.trang.length && `${S.trang.length} trang slide`, B.tumoi.length && `${B.tumoi.length} từ`, B.nguphap.length && `${B.nguphap.length} ngữ pháp`, B.hoithoai.cau.length && 'hội thoại', S.exs.length && `${S.exs.length} bài tập`].filter(Boolean);
  step('nap', has.length > 0, false, has.length ? 'Đã có: ' + has.join(', ') : 'Word, slide hoặc ảnh');
  step('mau', true, false, mau.ten);
  const bad = warns.filter(([, n]) => n), total = bad.reduce((n, [, k]) => n + k, 0);
  step('xem', has.length > 0 && !total, total > 0, total ? `${total} chỗ cần xem, bấm để tới` : has.length ? 'Không thấy lỗi' : 'Ô vàng là chỗ cần sửa', bad.length ? bad[0][0] : 'box-info');
  step('luu', S.luu && !dirty, false, S.luu && !dirty ? 'Đã lưu' : 'Chưa lưu');
}
$('#steps').addEventListener('click', e => {
  const b = e.target.closest('[data-go]'); if (!b) return;
  if (b.dataset.go === 'save') $('#save').click(); else go(b.dataset.go);
});

/* ---------- draft ---------- */
function saveDraft(B) {
  try { localStorage.setItem(DRAFT, JSON.stringify({B, exs: S.exs, sua: S.sua, slideName: S.slideName, dirty})); } catch {}
}
function readDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT) || 'null'); } catch { return null; }
}

/* ---------- themes ---------- */
/* Hình thu nhỏ vẽ bố cục của mẫu (đầu bài, ảnh, thanh mục lục, các thẻ), không chỉ bảng màu. */
const mini = m => `<div class="mini"${m.l ? ` data-l="${m.l}"` : ''} style="--bg:${m.bg};--fg:${m.fg};--p:${m.c[0]};--a:${m.c[1]};--s:${m.s};--rr:${m.rr}px" aria-hidden="true"><b>你好</b><i class="img"></i><i class="nav"></i>${'<i class="k"></i>'.repeat(4)}</div>`;
function drawThemes() {
  $('#themes').innerHTML = MAU.map(m => `<label class="theme"><input type="radio" name="mau" value="${m.id}"${m.id === S.mau ? ' checked' : ''}>
    ${mini(m)}<span class="kind${m.l ? ' bo' : ''}">${m.l ? 'Đổi bố cục' : 'Đổi màu'}</span>
    <strong>${m.ten}</strong><small>${m.mo}</small></label>`).join('');
}
$('#themes').addEventListener('change', e => { S.mau = e.target.value; changed(); });

/* ---------- exercises ---------- */
const demoEx = (l, open) => `<details class="vd"${open ? ' open' : ''}><summary>Cách soạn bài “${l.ten}”</summary><div class="in">
  <div class="trio">
    <figure><figcaption>Trong file Word</figcaption><div class="paper">${l.word}</div></figure>
    <figure><figcaption>Hoặc gõ trong ô</figcaption><pre class="code">${codeHtml(l.mau)}</pre></figure>
    <figure><figcaption>Học sinh thấy</figcaption><div class="screen">${l.web}</div></figure>
  </div>
  <div><button class="btn sm" data-act="vd">Chèn ví dụ vào ô</button></div></div></details>`;
function drawExs() {
  $('#exs').innerHTML = S.exs.length ? S.exs.map((x, i) => `<div class="exi" data-i="${i}">
    <div class="hd"><b>Bài ${i + 1}</b>
      <select data-k="loai" aria-label="Loại bài tập">${Object.entries(LOAI).map(([k, l]) => `<option value="${k}"${k === x.loai ? ' selected' : ''}>${l.ten}</option>`).join('')}</select>
      <input data-k="tieude" value="${esc(x.tieude)}" placeholder="${esc(LOAI[x.loai].tieude)}" aria-label="Tiêu đề bài tập">
      <button class="btn sm" data-act="up" aria-label="Chuyển lên"${i ? '' : ' disabled'}>↑</button>
      <button class="btn sm" data-act="down" aria-label="Chuyển xuống"${i < S.exs.length - 1 ? '' : ' disabled'}>↓</button>
      <button class="btn sm danger" data-act="del">Xóa</button>
    </div>
    ${colsHtml(LOAI[x.loai].cols)}
    <textarea data-k="text" placeholder="${esc(LOAI[x.loai].mau)}" aria-label="Nội dung bài ${i + 1}">${esc(x.text)}</textarea>
    <div class="warns"></div>
    ${demoEx(LOAI[x.loai], !x.text.trim())}
  </div>`).join('') : '<p class="hint">Chưa có bài tập. Nạp phiếu bài tập Word ở mục 1, hoặc bấm một loại bên dưới để thêm.</p>';
}
$('#addEx').innerHTML = Object.entries(LOAI).map(([k, l]) => `<button data-loai="${k}"><b>+ ${l.ten}</b><div class="screen" style="border-width:1px;min-height:0">${l.web}</div></button>`).join('');
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
  if (a === 'vd') {
    const ta = $('textarea', b.closest('.exi')), mau = LOAI[S.exs[i].loai].mau;
    S.exs[i].text = ta.value = ta.value.trim() ? ta.value.replace(/\n*$/, '\n') + mau : mau;
    ta.focus(); changed(); return;
  }
  if (a === 'del') { if (S.exs[i].text.trim() && !confirm(`Xóa Bài ${i + 1}?`)) return; S.exs.splice(i, 1); }
  else { const j = a === 'up' ? i - 1 : i + 1; [S.exs[i], S.exs[j]] = [S.exs[j], S.exs[i]]; }
  drawExs(); changed();
});

/* ---------- images ---------- */
/* Khung ảnh minh họa: mỗi khung có vị trí và ảnh tải lên. Tích "Bỏ ảnh" thì khung không hiện; khung chưa có ảnh chỉ hiện ở xem trước. */
const VI_TRI = [['dau', 'Đầu bài'], ['tu-moi', 'Đầu mục Từ mới'], ['ngu-phap', 'Đầu mục Ngữ pháp'], ['hoi-thoai', 'Đầu mục Hội thoại'], ['th-1', 'Trước tình huống 1'], ['th-2', 'Trước tình huống 2'], ['bai-tap', 'Đầu mục Bài tập']];
const urlAnh = n => IMG.get(n)?.url || S.goc + encodeURIComponent(n);
const duoiAnh = f => (f.name.match(/\.\w+$/) || ['.jpg'])[0].toLowerCase();
/* Loại khung chèn: ảnh, ảnh động GIF, âm thanh. [tên, accept của ô chọn file] */
const LOAI_MH = {anh: ['ảnh', 'image/*'], gif: ['ảnh động GIF', 'image/gif'], am: ['âm thanh', 'audio/*']};
const laAm = n => /\.(mp3|m4a|wav|ogg|oga|aac|weba|opus)$/i.test(n || '');
function drawMinhHoa() {
  $('#mhDs').innerHTML = S.minhhoa.length ? S.minhhoa.map((x, i) => {
    const l = LOAI_MH[x.loai] ? x.loai : 'anh', ten = LOAI_MH[l][0];
    const xem = !x.anh ? `Chưa có ${ten}` : l === 'am' ? `<button type="button" class="mh-nghe" data-mh="nghe" title="${esc(x.anh)}">🔊 Nghe thử</button>`
      : `<img src="${esc(urlAnh(x.anh))}" alt="${ten} ${i + 1}">`;
    return `<div class="mh${x.bo ? ' bo' : ''}" data-i="${i}">
    <div class="mh-anh">${xem}</div>
    <label class="f">${l === 'anh' ? 'Ảnh' : l === 'gif' ? 'Ảnh động' : 'Âm thanh'} · vị trí<select data-mh="vitri">${VI_TRI.map(([v, t]) => `<option value="${v}"${v === x.vitri ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
    <button type="button" class="btn sm" data-mh="tai">${x.anh ? 'Đổi file' : 'Chọn file'}</button>
    <label class="hint mh-bo"><input type="checkbox" data-mh="bo"${x.bo ? ' checked' : ''}> Bỏ</label></div>`;
  }).join('')
    : '<p class="hint">Chưa có gì. Bấm một nút “Chèn …” bên dưới.</p>';
}
let mhDang = -1, chenDang = null, amNghe = null;
const chonFile = accept => { const f = $('#fileMh'); f.accept = accept; f.click(); };
/* Nút Chèn ảnh / ảnh động / âm thanh: bấm thì hiện danh sách vị trí, chọn vị trí thì mở hộp chọn file. */
$('#mhChen').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const menu = $('#mhViTri');
  if (b.dataset.chen) {
    menu.dataset.loai = b.dataset.chen;
    menu.innerHTML = `<p class="hint">Chèn ${LOAI_MH[b.dataset.chen][0]} vào đâu?</p><div class="mh-vt">${VI_TRI.map(([v, t]) => `<button type="button" class="btn sm" data-vt="${v}">${t}</button>`).join('')}
      <button type="button" class="btn sm ghost" data-vt="">Hủy</button></div>`;
    menu.hidden = false; $$('#mhChen [data-chen]').forEach(x => x.setAttribute('aria-pressed', x === b));
  } else if ('vt' in b.dataset) {
    menu.hidden = true; $$('#mhChen [data-chen]').forEach(x => x.setAttribute('aria-pressed', false));
    if (!b.dataset.vt) return;
    chenDang = {loai: menu.dataset.loai, vitri: b.dataset.vt}; mhDang = -1; bgDang = null;
    chonFile(LOAI_MH[chenDang.loai][1]);
  }
});
$('#mhDs').addEventListener('click', e => {
  const n = e.target.closest('[data-mh="nghe"]');
  if (n) {
    const x = S.minhhoa[+n.closest('.mh').dataset.i];
    if (amNghe) { amNghe.pause(); amNghe = null; } else { amNghe = new Audio(urlAnh(x.anh)); amNghe.onended = () => amNghe = null; amNghe.play().catch(() => toast('Không phát được file này.')); }
    return;
  }
  const b = e.target.closest('[data-mh="tai"]'); if (!b) return;
  mhDang = +b.closest('.mh').dataset.i; bgDang = null; chenDang = null;
  chonFile(LOAI_MH[S.minhhoa[mhDang].loai || 'anh'][1]);
});
/* Kiểm tra loại file rồi nạp: ảnh thu nhỏ, GIF giữ nguyên để còn chuyển động, âm thanh giữ nguyên. Sai loại thì trả về ''. */
async function napFileMh(f, loai) {
  const id = Date.now().toString(36);
  if (loai === 'gif') {
    if (f.type !== 'image/gif' && !/\.gif$/i.test(f.name)) { toast('Hãy chọn file ảnh động .gif.'); return ''; }
    return addImage(`minh-hoa-${id}.gif`, f);
  }
  if (loai === 'am') {
    if (!/^audio\//.test(f.type) && !laAm(f.name)) { toast('Hãy chọn file âm thanh (.mp3, .m4a, .wav, .ogg).'); return ''; }
    if (f.size > 20 * 1024 * 1024) { toast('File âm thanh quá lớn (trên 20 MB). Hãy cắt ngắn hoặc nén thành .mp3.'); return ''; }
    const ext = (f.name.match(/\.\w+$/) || ['.mp3'])[0].toLowerCase(), ten = `am-thanh-${id}${ext}`;
    const old = IMG.get(ten); if (old) URL.revokeObjectURL(old.url);
    IMG.set(ten, {blob: f, url: URL.createObjectURL(f)});
    return ten;
  }
  if (!/^image\//.test(f.type)) { toast('Hãy chọn file ảnh.'); return ''; }
  return addImage(`minh-hoa-${id}${duoiAnh(f)}`, f, 1600);
}
$('#mhDs').addEventListener('change', e => {
  const k = e.target.dataset.mh, x = S.minhhoa[+e.target.closest('.mh')?.dataset.i]; if (!k || !x) return;
  if (k === 'vitri') x.vitri = e.target.value; else if (e.target.checked) x.bo = true; else delete x.bo;
  drawMinhHoa(); changed();
});
/* Nút Đổi ảnh / Bỏ ảnh trên từng ảnh mục Bài giảng ở khung xem trước: p = trang, j = vị trí khối (-1 là ảnh chụp cả trang). */
let bgDang = null;
window.addEventListener('message', e => {
  const d = e.data; if (e.source !== $('#frame').contentWindow || !d || !d.anhBG) return;
  if (d.anhBG === 'doi') { bgDang = d; mhDang = -1; chenDang = null; chonFile('image/*'); return; }
  const nd = S.noidung[d.p]; if (!nd || !nd.khoi[d.j]) return;
  nd.khoi.splice(d.j, 1); drawGallery(); changed(); toast('Đã bỏ ảnh. Muốn lấy lại thì nạp lại file.');
});
async function doiAnhBG({p, j}, f) {
  const ten = await addImage(`bai-giang-${Date.now().toString(36)}${duoiAnh(f)}`, f, 1600);
  if (j < 0) {   // trang không có chữ: thay ảnh chụp trang
    const cu = S.trang[p]; if (cu == null) return;
    S.trang[p] = ten; NHOM.forEach(x => { const k = x.names.indexOf(cu); if (k >= 0) x.names[k] = ten; });
  } else { const k = S.noidung[p]?.khoi[j]; if (!k) return; k.ten = ten; }
  drawGallery(); changed(); toast('Đã đổi ảnh.');
}
$('#fileMh').addEventListener('change', async e => {
  if (bgDang) { const f = e.target.files[0], d = bgDang; bgDang = null; e.target.value = ''; if (f) await doiAnhBG(d, f); return; }
  if (chenDang) {
    const f = e.target.files[0], c = chenDang; chenDang = null; e.target.value = ''; if (!f) return;
    const ten = await napFileMh(f, c.loai); if (!ten) return;
    S.minhhoa.push({loai: c.loai, vitri: c.vitri, anh: ten});
    toast(`Đã chèn ${LOAI_MH[c.loai][0]} vào “${VI_TRI.find(v => v[0] === c.vitri)[1]}”.`);
    drawGallery(); drawMinhHoa(); changed(); return;
  }
  const f = e.target.files[0], x = S.minhhoa[mhDang]; e.target.value = ''; if (!f || !x) return;
  const ten = await napFileMh(f, x.loai || 'anh'); if (!ten) return;
  x.anh = ten; delete x.bo;
  drawGallery(); drawMinhHoa(); changed();
});
/* Ảnh động cho phần chữ: mỗi từ, điểm ngữ pháp, lượt thoại có nút tải GIF; tên ảnh ghi vào cột cuối của dòng trong ô nhập. */
const GIF_COT = {tumoi: 8, nguphap: 5, hoithoai: 4};
function drawGif() {
  $$('details[data-gif]').forEach(d => {
    if (!d.open) return;
    const id = d.dataset.gif, cot = GIF_COT[id];
    const hang = L(val(id)).map((l, i) => {
      const c = C(l), ten = id === 'hoithoai' ? `${c[0]}: ${c[1] || ''}` : id === 'nguphap' ? (c[0] || c[1] || '') : c[0];
      return id === 'hoithoai' && /^TH\d$/.test(c[0]) ? '' : `<div class="gif-h" data-i="${i}"><span class="zh">${esc(ten)}</span>${c[cot] ? `<img src="${esc(urlAnh(c[cot]))}" alt="">` : ''}
        <button type="button" class="btn sm" data-gif-tai>${c[cot] ? 'Đổi GIF' : 'Tải GIF'}</button>${c[cot] ? '<button type="button" class="btn sm" data-gif-bo>Bỏ</button>' : ''}</div>`;
    }).join('');
    const box = $('.in', d);
    if (box.dataset.ve !== hang) { box.innerHTML = hang || '<p class="hint">Mục này chưa có nội dung.</p>'; box.dataset.ve = hang; }
  });
}
function datGif(id, i, ten) {
  const ds = L(val(id)), c = C(ds[i]), cot = GIF_COT[id];
  while (c.length <= cot) c.push('');
  c[cot] = ten; ds[i] = J(c);
  $('#' + id).value = ds.join('\n'); changed(); drawGif();
}
let gifDang = null;
$$('details[data-gif]').forEach(d => {
  d.addEventListener('toggle', drawGif);
  d.addEventListener('click', e => {
    const h = e.target.closest('.gif-h'); if (!h) return;
    if (e.target.closest('[data-gif-bo]')) datGif(d.dataset.gif, +h.dataset.i, '');
    else if (e.target.closest('[data-gif-tai]')) { gifDang = [d.dataset.gif, +h.dataset.i]; $('#fileGif').click(); }
  });
});
$('#fileGif').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f || !gifDang) return;
  if (f.type !== 'image/gif') return toast('Hãy chọn file ảnh động .gif.');
  const ten = await addImage(`chu-${Date.now().toString(36)}.gif`, f);
  datGif(...gifDang, ten); drawGallery();
});
function drawGallery(keep) {
  const names = [...new Set([...IMG.keys(), ...S.cu])].sort(), trang = new Set(S.trang);
  const url = n => IMG.get(n)?.url || S.goc + encodeURIComponent(n);
  const luoi = names.filter(n => !trang.has(n));   // ảnh trang slide nằm ở mục Bài giảng, không chen vào lưới ảnh
  $('#gallery').innerHTML = luoi.length ? luoi.map(n => `<button data-n="${esc(n)}" title="Chép tên file">${laAm(n) ? '<span class="g-am" aria-hidden="true">🔊</span>' : `<img src="${esc(url(n))}" alt="" loading="lazy">`}${esc(n)}</button>`).join('')
    : '<p class="hint">Chưa có ảnh. Kéo file .pptx hoặc ảnh vào mục 1.</p>';
  $('#c-anh').textContent = luoi.length ? `${luoi.length} ảnh` : '';
  const cur = keep ?? ($('#anhbia').dataset.want || $('#anhbia').value);
  $('#anhbia').innerHTML = `<option value="">(không có ảnh bìa)</option><option value="${BIA_WEB}"${cur === BIA_WEB ? ' selected' : ''}>Bìa kiểu web (không cần ảnh)</option>` + names.filter(n => !laAm(n)).map(n => `<option${n === cur ? ' selected' : ''}>${esc(n)}</option>`).join('');
}
$('#gallery').addEventListener('click', async e => {
  const b = e.target.closest('[data-n]'); if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.n); toast(`Đã chép tên ảnh “${b.dataset.n}”.`); }
  catch { toast(`Tên ảnh: ${b.dataset.n}`); }
});
const MIME = {jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp'};
async function addImage(name, blob, max = 1200) {
  name = name.replace(/\s+/g, '-').replace(/\.jpeg$/i, '.jpg');
  const ext = name.split('.').pop().toLowerCase();
  if (ext !== 'gif') {
    try {
      const bmp = await createImageBitmap(blob);
      const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
      if (k < 1 || blob.size > max * 330) {
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
/* Mỗi file nạp vào có một thẻ kết quả: nhận ra được gì, còn thiếu gì, bấm để tới đúng mục. */
const TAG = {docx: ['w', 'Word'], pptx: ['p', 'PPT'], pdf: ['d', 'PDF']};
function logFile(name, items) {
  const [c, t] = TAG[name.split('.').pop().toLowerCase()] || ['i', 'Ảnh'];
  $('#log').insertAdjacentHTML('beforeend', `<div class="res"><div class="rh"><span class="tag ${c}">${t}</span><b>${esc(name)}</b></div>
    <ul>${items.map(x => `<li class="${x.cls || ''}">${x.go ? `<a data-go="${x.go}" tabindex="0">${esc(x.t)}</a>` : esc(x.t)}</li>`).join('')}</ul></div>`);
}
$('#log').addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (a) go(a.dataset.go); });
$('#log').addEventListener('keydown', e => { const a = e.target.closest('[data-go]'); if (a && e.key === 'Enter') go(a.dataset.go); });

/* Nhận loại file theo nội dung, không theo đuôi: Word, PowerPoint, PDF, ảnh, hoặc .zip chứa các file đó. */
const RAC_FILE = /^(~\$|\.)|^(thumbs\.db|desktop\.ini)$/i;   // file tạm của Office, file ẩn của hệ điều hành
async function loaiFile(f) {
  const dau = new Uint8Array(await f.slice(0, 8).arrayBuffer()), chu = String.fromCharCode(...dau);
  if (chu.startsWith('%PDF')) return {loai: 'pdf'};
  if (chu.startsWith('PK')) {
    const zip = await JSZip.loadAsync(f);
    return {loai: zip.file('word/document.xml') ? 'docx' : zip.file('ppt/presentation.xml') ? 'pptx' : 'zip', zip};
  }
  if (dau[0] === 0xD0 && dau[1] === 0xCF) return {loai: 'cu'};   // .doc, .ppt đời cũ
  const ext = f.name.split('.').pop().toLowerCase();
  if (MIME[ext] || /^image\//.test(f.type)) return {loai: 'anh'};
  return {loai: ''};
}
/* Các file trong một .zip thành danh sách File như khi kéo cả thư mục vào. */
async function moZip(zip) {
  const out = [];
  for (const z of Object.values(zip.files)) {
    if (z.dir || /(^|\/)__MACOSX\//.test(z.name)) continue;
    out.push(new File([await z.async('blob')], z.name.split('/').pop(), {lastModified: z.date ? +z.date : 0}));
  }
  return out;
}
/* Kéo thả thư mục: đọc hết file trong thư mục con. */
async function docMuc(en) {
  if (en.isFile) return [await new Promise((ok, err) => en.file(ok, err))];
  const r = en.createReader(), out = [];
  for (;;) {
    const lo = await new Promise((ok, err) => r.readEntries(ok, err));
    if (!lo.length) return out;
    for (const c of lo) out.push(...await docMuc(c));
  }
}
const THU_TU = {pdf: 0, pptx: 1, docx: 2, anh: 3};
let dangNap = Promise.resolve();
/* Nạp bao nhiêu lần cũng được: nội dung mới được cộng vào bài đang soạn, file đã nạp rồi thì bỏ qua. */
function nap(files) { return dangNap = dangNap.then(async () => napLuot(await files)).catch(e => toast('Không nạp được: ' + (e.message || e))); }
async function napLuot(files) {
  files = [...files].filter(f => !RAC_FILE.test(f.name));
  if (!files.length) return;
  if (files.length > 1) toast(`Đang đọc ${files.length} file…`);
  const ds = [];
  for (const f of files) {
    try {
      const t = await loaiFile(f);
      if (t.loai === 'zip') { const con = (await moZip(t.zip)).filter(x => !RAC_FILE.test(x.name)); for (const x of con) ds.push({f: x, ...await loaiFile(x)}); }
      else ds.push({f, ...t});
    } catch (e) { logFile(f.name, [{t: `Không đọc được file: ${e.message || e}`, cls: 'err'}]); }
  }
  // PDF, slide trước: nạp giáo trình bài khác sẽ mở bài mới, các file còn lại (Word, ảnh) mới vào đúng bài đó.
  ds.sort((a, b) => (THU_TU[a.loai] ?? 9) - (THU_TU[b.loai] ?? 9));
  const imgs = [];
  for (const {f, loai, zip} of ds) {
    const khoa = `${f.name}|${f.size}|${f.lastModified}`;
    if (DA_NAP.has(khoa) && loai !== 'anh') { logFile(f.name, [{t: 'File này đã nạp rồi nên bỏ qua.', cls: 'warn'}]); continue; }
    try {
      if (loai === 'docx') { await napWord(f); NGUON.set(f.name.replace(/\s+/g, '-'), f); showDemo(S.exs.length && !$('#tumoi').value.trim() ? 'baitap' : 'giaoan'); }
      else if (loai === 'pptx') { await napSlide(f, zip); showDemo('slide'); }
      else if (loai === 'pdf') { await napPdf(f); showDemo('slide'); }
      else if (loai === 'anh') imgs.push(await addImage(f.name, f));
      else if (loai === 'cu') { logFile(f.name, [{t: 'File Word/PowerPoint đời cũ (.doc, .ppt): mở bằng Word/PowerPoint, chọn Lưu thành .docx hoặc .pptx rồi nạp lại.', cls: 'err'}]); continue; }
      else { logFile(f.name, [{t: 'Bỏ qua: không phải file Word, PowerPoint, PDF hay ảnh.', cls: 'err'}]); continue; }
      DA_NAP.add(khoa);
    } catch (e) { logFile(f.name, [{t: `Không đọc được file: ${e.message || e}`, cls: 'err'}]); }
  }
  if (imgs.length) {
    logFile(imgs.length > 1 ? `${imgs.length} ảnh` : imgs[0], [{t: `Đã thêm vào mục 9: ${imgs.join(', ')}`, go: 'box-anh'},
      {t: 'Bấm ảnh để chép tên, rồi dán vào cột “Ảnh” của từ mới.'}]);
    showDemo('anh');
  }
  tuXuat();
  drawGallery(); render();
  if (ds.length > 1) toast(`Đã nạp xong ${ds.length} file.`);
}
/* Từng trang của một file slide / PDF thành mục Bài giảng: ảnh chụp trang + nội dung đọc được (tiêu đề, chữ, ảnh, bảng),
   giáo trình hiện như bài đọc, trang không có chữ thì hiện ảnh chụp. File cùng tên (Bài 10.pptx và Bài 10.pdf) là một bộ slide:
   chỉ giữ một bản, ưu tiên .pptx vì tách được chữ và ảnh riêng. Bộ slide khác tên thì nối tiếp phía sau. */
async function datTrang(file, kieu, ds) {
  const ten = file.name.replace(/\.[^.]+$/, '').trim().toLowerCase(), cu = NHOM.get(ten);
  if (cu && cu.kieu === 'pptx' && kieu === 'pdf') return false;
  const g = cu ? cu.g : Math.max(0, ...[...NHOM.values()].map(x => x.g)) + 1, dau = g === 1 ? 'trang' : `trang${g}`;
  const names = [];
  for (const [i, x] of ds.entries()) {
    const so = String(i + 1).padStart(2, '0');
    names.push(await addImage(`${dau}-${so}.jpg`, x.blob, 1600));
    if (x.hinh && x.nd) {   // PDF: khối 'goc' thành các ảnh cắt riêng từ trang; không cắt được thì bỏ, không chụp cả trang
      const ten = [];
      for (const [k, b] of x.hinh.entries()) ten.push(await addImage(`${dau}-${so}-hinh${k + 1}.jpg`, b, 1600));
      x.nd.khoi = x.nd.khoi.flatMap(k => k.t !== 'goc' ? [k] : ten.map(t => ({t: 'goc', ten: t})));
    }
  }
  NHOM.set(ten, {kieu, g, names, nd: ds.map(x => x.nd || null)});
  const ns = [...NHOM.values()].sort((a, b) => a.g - b.g);   // bài đã lưu có slide cũ: bộ mới thay bộ cũ
  S.trang = ns.flatMap(x => x.names); S.noidung = ns.flatMap(x => x.nd);
  return true;
}
const chupTrang = async (pg, rong, vung = []) => {
  const vp = pg.getViewport({scale: rong / pg.getViewport({scale: 1}).width});
  const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
  await pg.render({canvasContext: c.getContext('2d'), viewport: vp}).promise;
  const blob = c2 => new Promise(r => c2.toBlob(r, 'image/jpeg', 0.85));
  const hinh = [];
  for (const v of vung) {   // vùng ảnh (tỉ lệ 0–1 theo trang) cắt ra thành ảnh riêng
    const x = Math.round(v.x0 * c.width), y = Math.round(v.y0 * c.height), w = Math.round((v.x1 - v.x0) * c.width), h = Math.round((v.y1 - v.y0) * c.height);
    if (w < 8 || h < 8) continue;
    const k = document.createElement('canvas'); k.width = w; k.height = h;
    k.getContext('2d').drawImage(c, x, y, w, h, 0, 0, w, h);
    hinh.push(await blob(k));
  }
  return {blob: await blob(c), hinh};
};
/* Vị trí các ảnh trong một trang PDF (theo lệnh vẽ ảnh và ma trận biến đổi), tỉ lệ 0–1 theo khổ trang, gốc trên trái.
   Bỏ ảnh quá nhỏ (biểu tượng, gạch đầu dòng) và ảnh gần kín trang (nền); ảnh chồng / sát nhau gộp làm một. */
function vungAnh(ol, vp) {
  const O = pdfjsLib.OPS, nhan = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  const W = vp.width, H = vp.height, st = [], hop = [];
  let m = [1, 0, 0, 1, 0, 0];
  const ve = mm => {
    const ds = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v]) => vp.convertToViewportPoint(mm[0] * u + mm[2] * v + mm[4], mm[1] * u + mm[3] * v + mm[5]));
    const xs = ds.map(d => d[0]), ys = ds.map(d => d[1]);
    const r = {x0: Math.max(0, Math.min(...xs)) / W, y0: Math.max(0, Math.min(...ys)) / H, x1: Math.min(W, Math.max(...xs)) / W, y1: Math.min(H, Math.max(...ys)) / H};
    if (r.x1 > r.x0 && r.y1 > r.y0) hop.push(r);
  };
  ol.fnArray.forEach((f, i) => {
    const a = ol.argsArray[i];
    if (f === O.save) st.push(m);
    else if (f === O.restore) m = st.pop() || m;
    else if (f === O.transform) m = nhan(m, a);
    else if (f === O.paintFormXObjectBegin) { st.push(m); if (Array.isArray(a?.[0]) && a[0].length === 6) m = nhan(m, a[0]); }
    else if (f === O.paintFormXObjectEnd) m = st.pop() || m;
    else if (f === O.paintImageXObject || f === O.paintInlineImageXObject) ve(m);
    else if (f === O.paintImageXObjectRepeat) for (let k = 0; k + 1 < (a[3] || []).length; k += 2) ve(nhan(m, [a[1], 0, 0, a[2], a[3][k], a[3][k + 1]]));
  });
  const dt = r => (r.x1 - r.x0) * (r.y1 - r.y0);
  const ds = hop.filter(r => dt(r) >= 0.015 && dt(r) <= 0.8 && (r.x1 - r.x0) > 0.06 && (r.y1 - r.y0) > 0.06);
  for (let gop = true; gop;) {
    gop = false;
    for (let i = 0; i < ds.length && !gop; i++) for (let j = i + 1; j < ds.length && !gop; j++) {
      const a = ds[i], b = ds[j], e = 0.01;
      if (a.x0 <= b.x1 + e && b.x0 <= a.x1 + e && a.y0 <= b.y1 + e && b.y0 <= a.y1 + e) {
        ds[i] = {x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1)}; ds.splice(j, 1); gop = true;
      }
    }
  }
  return ds.filter(r => dt(r) <= 0.85).sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0).slice(0, 4);
}
/* PDF giáo trình (slide xuất ra PDF), chia phần bằng các trang bìa phần chữ dọc (生词, 语法, 课文, 练习):
   - trang đầu: 第N课, tên bài chữ Hán, pinyin;
   - từ vựng: dòng "píngguǒ (n) táo" hoặc "多少（pro）bao nhiêu?", câu chữ Hán trên cùng trang làm câu ví dụ;
   - ngữ pháp: mỗi trang một điểm (tiêu đề, mẫu câu có dấu +, giải thích, câu ví dụ);
   - câu hỏi sau dòng 回答问题 thành bài tập "Đọc và trả lời".
   Chỉ đọc được chữ có sẵn trong PDF; chữ nằm trong ảnh (thường là chữ Hán của từ vựng, hội thoại) thì không. */
const TU_LOAI = {n: 'danh từ', v: 'động từ', adj: 'tính từ', adv: 'phó từ', pro: 'đại từ', pron: 'đại từ', lt: 'lượng từ', m: 'lượng từ', mw: 'lượng từ',
  num: 'số từ', prep: 'giới từ', conj: 'liên từ', part: 'trợ từ', 名: 'danh từ', 动: 'động từ', 形: 'tính từ', 副: 'phó từ', 代: 'đại từ',
  量: 'lượng từ', 数: 'số từ', 介: 'giới từ', 连: 'liên từ', 助: 'trợ từ'};
const PY_DAU = /[āēīōūǎěǐǒǔǖǘǚǜ]/i;
const PY_TU = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü']+( [a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü']+){0,3}$/i;
const HAN = /^[㐀-鿿]+$/;
const TU_DONG = /^(.{1,24}?)\s*[（(]\s*([^()（）]{1,10}?)\s*[)）]\s*[=:：]?\s*(.+)$/;
const MOC = [['tumoi', /生.*词|词.*生/], ['nguphap', /语.*法|法.*语/], ['baikhoa', /课.*文|文.*课/], ['luyentap', /练.*习|习.*练/]];
const soHan = l => (l.match(/[㐀-鿿]/g) || []).length;
const BAI_SO = /第\s*([\d一二三四五六七八九十]+)\s*课/;
const soTuHan = s => {   // "12" hoặc "十二" → 12
  if (/^\d+$/.test(s)) return +s;
  const d = c => '一二三四五六七八九'.indexOf(c) + 1, [a, b] = s.includes('十') ? s.split('十') : ['', s];
  return s.includes('十') ? (a ? d(a) : 1) * 10 + (b ? d(b) : 0) : d(b);
};
const PY_CHU = /[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ]/i;
/* Câu ví dụ: "我的爸爸 Wǒ de bàba" → [chữ Hán, pinyin]; câu chỉ có chữ Hán thì phải có dấu câu cuối. */
const tachVd = s => {
  const k = s.search(PY_CHU);
  if (k < 0) return laCau(s) && /[。？！?!]$/.test(s) ? [s, ''] : null;
  const zh = s.slice(0, k).trim(), py = s.slice(k).trim();
  return k > 0 && laCau(zh) && !CJK.test(py) ? [zh, py] : null;
};
const tuLoai = pos => [...new Set(pos.toLowerCase().split(/\s*[,，、/]\s*/).map(x => TU_LOAI[x] || (/từ$/.test(x) ? x : '')).filter(Boolean))].join(', ');
/* Một dòng từ vựng: "píngguǒ (n) táo", "多少（pro）bao nhiêu" (PDF) hoặc "1. 你 (代) nǐ ： you" (slide .pptx). */
const TU_SO = /^\d+\s*[.、．]\s*([㐀-鿿]{1,4})\s*[（(]\s*([^()（）]{1,10}?)\s*[)）]\s*([a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ' ]+?)\s*[:：]\s*(.+)$/i;
/* Dòng từ của slide: "爸爸 bàba 名 Bố", "工作 gōngzuò 名/动 Công việc", "口 kǒu 量" (nghĩa ở chỗ khác). */
const TL_HAN = '[名动形副代量数介连助叹]';
const TU_TRAN = new RegExp(`^([㐀-鿿]{1,4})\\s+([a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ'’ ]+?)\\s+(${TL_HAN}(?:\\s*[/／、,]\\s*${TL_HAN})*|(?:n|v|adj|adv|pron?|m|mw|num|prep|conj|part)\\.?)(?:\\s+(.+))?$`, 'i');
function tuDong(l) {
  let m = l.match(TU_SO);
  if (m) {
    const tl = tuLoai(m[2]), p = m[3].trim(), nghia = m[4].replace(/[㐀-鿿]+(\s*\/\s*[㐀-鿿]+)*/g, '').replace(/[\s,，;；]+$/, '').trim();   // bỏ chữ Hán ghi chú lẫn vào nghĩa
    return tl && nghia ? {w: m[1], p: p[0].toLowerCase() + p.slice(1), tl, nghia} : null;
  }
  if ((m = l.match(TU_TRAN)) && !CJK.test(m[4] || '')) {
    const p = m[2].trim().replace(/’/g, "'");
    return {w: m[1], p: p[0].toLowerCase() + p.slice(1), tl: tuLoai(m[3]), nghia: (m[4] || '').replace(/[\s,，;；]+$/, '').trim()};
  }
  if (!(m = l.match(TU_DONG))) return null;
  const dau = m[1].trim(), tl = tuLoai(m[2].trim()), nghia = m[3].replace(/[\s,，;；]+$/, '').trim();
  let w = '', p = '';
  if (HAN.test(dau)) w = dau; else if (PY_TU.test(dau)) p = dau[0].toLowerCase() + dau.slice(1);
  return tl && nghia && !CJK.test(nghia) && (w || p) ? {w, p, tl, nghia} : null;
}
/* Trang bìa phần: vài dòng chữ Hán ngắn (生词, hoặc 生 / 词 tách dòng), có thể kèm dòng ngắn "Từ vựng", "Part 2". */
const laBia = ls => { const h = ls.filter(l => CJK.test(l)); return h.length > 0 && h.length <= 4 && h.every(l => l.length <= 3) && ls.length <= 5 && ls.every(l => l.length <= 12); };
const boDau = l => l.replace(/^\s*(\d+\s*[.、．)]|[-–•]|=>|\(\?\)|vd\s*[:：])\s*/i, '').trim();   // "1." "- " "=> " "VD:" ở đầu dòng
const laCau = l => soHan(l) >= 2 && !l.includes('+') && !/[|]/.test(l);
/* han: chữ Hán đọc được bằng OCR, khóa "pinyin|nghĩa" (lần đọc thứ hai, sau khi OCR). */
function docGiaoTrinh(pages, tenFile, han = new Map()) {
  const p1 = pages[0] || [], g = {so: 0, ten: '', pinyin: '', tumoi: [], nguphap: [], hoi: [], tu: [], baiKhoa: []};
  const so = p1.join(' ').match(BAI_SO) || tenFile.match(/b[àa]i\s*(\d+)/i);
  if (so) g.so = soTuHan(so[1]);
  g.ten = p1.find(l => !BAI_SO.test(l) && !/汇报人|报告人|[:：]/.test(l) && soHan(l) >= 2) || '';
  g.pinyin = p1.find(l => PY_DAU.test(l) && !CJK.test(l) && !/[:：]/.test(l)) || '';
  // Tên bài và pinyin chung một dòng: "你好！Nǐ hǎo！"
  const k = g.ten.search(PY_CHU);
  if (k > 0 && CJK.test(g.ten.slice(0, k))) { g.pinyin ||= g.ten.slice(k).trim(); g.ten = g.ten.slice(0, k).trim(); }
  const tu = new Map();   // khóa → {w, p, tl, nghia, ex, trang}
  let phan = '', hoi = false;
  pages.forEach((ls, i) => {
    if (!i) return;
    // Trang bìa phần: vài dòng ngắn ghép lại thành 生词 / 语法 / 课文 / 练习.
    if (laBia(ls)) { const m = MOC.find(([, re]) => re.test(ls.filter(l => CJK.test(l)).join(''))); if (m) { phan = m[0]; return; } }
    if (phan === 'baikhoa') g.baiKhoa.push(i);
    if (phan === 'nguphap') { const d = diemNguPhap(ls); if (d) g.nguphap.push(d); return; }
    const trang = [];
    hoi = false;
    ls.forEach(l => {
      if (/回答问题/.test(l)) { hoi = true; return; }
      if (hoi && laCau(l)) { g.hoi.push(boDau(l.replace(/^\d+\s*、/, ''))); return; }
      const v = phan !== 'luyentap' && tuDong(l);
      if (v) {
        const k = (v.p || v.w) + '|' + v.nghia;
        if (!tu.has(k)) tu.set(k, {...v, w: v.w || han.get(k) || '', ex: null, trang: i});
        trang.push(tu.get(k));
        return;
      }
      // Câu ví dụ chữ Hán: gán cho từ trên cùng trang có chữ Hán nằm trong câu, không thì từ đầu tiên còn thiếu ví dụ.
      const vd = trang.length && tachVd(boDau(l));
      if (vd) {
        const v = trang.find(v => v.w && vd[0].includes(v.w) && !v.ex) || trang.find(v => !v.ex);
        if (v) v.ex = vd;
      }
    });
  });
  g.tu = [...tu.values()];
  g.tumoi = g.tu.map(v => J([v.w, v.p, v.tl, v.nghia, '', ...(v.ex || [])]));
  return g;
}
/* Một trang ngữ pháp → dòng "điểm | ý nghĩa | mẫu câu | câu; câu | ghi chú" của ô Ngữ pháp. */
const VIET = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
function diemNguPhap(ls) {
  ls = ls.filter(l => !/^từ vựng$/i.test(l) && !/^\S+(\s\S+)?\s*[（(][^)）]*[)）]$/.test(l));   // bỏ dòng "ba (助)"
  const mau = ls.filter(l => l.includes('+') && !/^=>/.test(l));
  const tieu = ls.find(l => VIET.test(l) && soHan(l) <= 4 && !l.includes('+') && !/^(\d+\s*[.)]|[-–•]|=>|vd)/i.test(l));
  const cau = [...new Set(ls.filter(l => !mau.includes(l) && l !== tieu).map(boDau).filter(laCau))].slice(0, 6);
  const ghi = ls.filter(l => l !== tieu && !mau.includes(l) && VIET.test(l) && soHan(l) <= 4).map(boDau).filter(Boolean);
  if (!tieu && !cau.length) return null;
  const zh = [...(tieu || '').matchAll(/\[\s*([㐀-鿿]+)\s*\]/g)].map(m => m[1]).join('、') || (mau.join(' ').match(/[㐀-鿿]+/) || [''])[0];
  const vi = (tieu || '').replace(/\s*\[[^\]]*\](\s*,\s*\[[^\]]*\])*/g, '').trim();
  return J([zh || vi, vi, mau.join(' · '), cau.join('; '), ghi.map(s => /[.!?:。]$/.test(s) ? s : s + '.').join(' ')].map(x => x.replace(/\|/g, '/')));
}
/* OCR chữ trong ảnh của PDF: chỉ các trang có từ vựng còn thiếu chữ Hán và các trang bài khóa.
   Chữ Hán đọc được đổi ra pinyin (pinyin-pro) rồi so với pinyin của từ, nên không cần biết chữ nằm ở đâu trên slide.
   Thư viện và dữ liệu nhận chữ (khoảng 6 MB) tải từ CDN lúc dùng lần đầu, trình duyệt giữ lại cho lần sau. */
const OCR_LIB = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const PINYIN_LIB = 'https://cdn.jsdelivr.net/npm/pinyin-pro@3.26.0/dist/index.js';
const pyBo = s => s.toLowerCase().normalize('NFC').replace(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, '');
const pyTron = s => pyBo(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
function timHan(p, ung) {
  const muc = pyBo(p), tron = pyTron(p);
  // Đúng cả dấu thanh trước; bỏ dấu chỉ dùng cho từ từ hai chữ (biến điệu như yígòng), từ một chữ bỏ dấu dễ khớp nhầm.
  return (ung.find(u => u.py === muc) || ung.find(u => u.s.length > 1 && u.tron === tron) || {}).s || '';
}
async function docAnh(pdf, g) {
  const can = [...new Set([...g.tu.filter(v => !v.w).map(v => v.trang), ...g.baiKhoa])].sort((a, b) => a - b);
  const kq = {han: new Map(), hoithoai: [], trang: can.length};
  if (!can.length) return kq;
  if (!window.Tesseract) { toast('Đang tải bộ đọc chữ Hán (khoảng 6 MB, chỉ lần đầu)…'); await loadScript(OCR_LIB); }
  if (!window.pinyinPro) await loadScript(PINYIN_LIB);
  const worker = await Tesseract.createWorker('chi_sim');
  const ung = {};   // trang → [{s: chữ Hán, py, tron}] mọi đoạn 1–4 chữ liền nhau
  try {
    for (const [k, i] of can.entries()) {
      toast(`Đang đọc chữ trong ảnh: trang ${i + 1} (${k + 1}/${can.length})…`);
      const pg = await pdf.getPage(i + 1), vp = pg.getViewport({scale: 1600 / pg.getViewport({scale: 1}).width});
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
      await pg.render({canvasContext: c.getContext('2d'), viewport: vp}).promise;
      const text = (await worker.recognize(c)).data.text.replace(/([㐀-鿿，。？！：、])[ \t]+(?=[㐀-鿿，。？！：、])/g, '$1');
      ung[i] = [];
      for (const r of text.match(/[㐀-鿿]+/g) || []) for (let n = 1; n <= 4; n++) for (let j = 0; j + n <= r.length; j++) {
        const s = r.slice(j, j + n), py = pinyinPro.pinyin(s, {type: 'array'}).join('');
        ung[i].push({s, py: pyBo(py), tron: pyTron(py)});
      }
      // Hội thoại: tách mỗi lượt "A:" "B;" thành một dòng (OCR hay dính hai bóng thoại cạnh nhau), bỏ pinyin lẫn vào.
      if (g.baiKhoa.includes(i)) text.replace(/(?<=[㐀-鿿。？！?!，])\s*([AB甲乙])\s*[:：;；]/g, '\n$1:').split('\n').forEach(l => {
        const m = l.trim().match(/^([A-Za-z甲乙]|[㐀-鿿]{1,3})\s*[:：;；]\s*(.*[㐀-鿿].*)$/); if (!m) return;
        const cau = m[2].replace(/[A-Za-z0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]{2,}[，,?？!！]?/g, '').replace(/\s+/g, '')
          .replace(/([㐀-鿿])\?/g, '$1？').replace(/([㐀-鿿])!/g, '$1！').replace(/([㐀-鿿]),/g, '$1，');
        if (soHan(cau) >= 2) kq.hoithoai.push(J([m[1].toUpperCase(), cau]));
      });
    }
  } finally { await worker.terminate(); }
  const tatCa = Object.values(ung).flat();
  g.tu.filter(v => !v.w).forEach(v => {
    const w = timHan(v.p, ung[v.trang] || []) || timHan(v.p, tatCa);   // ưu tiên chữ trên cùng trang với từ
    if (w) kq.han.set(v.p + '|' + v.nghia, w);
  });
  return kq;
}
/* PDF giáo trình dạng tình huống, có thể nhiều bài trong một file (Word xuất ra, có chữ thật):
   "Bài 1: Tên bài" / tên chữ Hán / "I. Tình huống 1:" (lời thoại 3 dòng Hán, pinyin, Việt; "1. Từ vựng"; "2. Kiến thức ngôn ngữ")
   / "II. Tình huống 2:" / "III. Luyện tập" (đúng/sai, chọn đáp án) / "ĐÁP ÁN THAM KHẢO". Trang trước bài đầu tiên (bìa, hồ sơ) không lấy. */
const TH = {
  BAI: /^Bài\s*(\d+)\s*[:：]\s*(.*)$/, MUC: /^(I{1,2})\.\s*Tình huống\s*(\d)\s*[:：]?\s*(.*)$/, LT: /^III\.\s*Luyện tập/, DA: /^ĐÁP ÁN/,
  TU: /^(1\.\s*)?Từ (vựng|mới)\s*$/, KT: /^2\.\s*Kiến thức ngôn ngữ/, DE: /^(Bài tập|Bài|Câu)\s*\d\s*[.:：]\s*(.*)$/,
  NOI: /^([㐀-鿿]{1,5})[.．]?\s*[：:]\s*(.*)$/, VAI: /^\p{L}[\p{L}\p{N}_'’ ]{0,24}?\s*[：:]\s*/u, CUOI: /^(Ngày …|（日期|Người khai\s*\/|供述人|Ký tên|（签名|Họ và tên:)/,
  CHAM: /^[•●▪]\s*|^l\s+(?=[㐀-鿿])/, RIENG: /[ăâđêôơưạảãấầẩẫậắằẳẵặẹẻẽếềểễệỉĩịọỏõốồổỗộớờởỡợụủũứừửữựỳỵỷỹ]/i,
  CHI_VIET: /[đơưạảấầậắằặẹẻẽếềệịọỏốồộớờợụủứừựỷ]/, DAU_BANG: ['TT', 'TT Từ vựng', 'Từ vựng', 'Từ mới', 'Phiên âm', 'Dịch nghĩa', 'Ý nghĩa'],
};
const sach = s => s.replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
/* Các bài trong file: mốc đầu bài và các dòng chữ của bài. */
function tachBaiTH(tho) {
  const moc = [];
  tho.forEach((t, p) => t.ds.forEach((l, i) => {
    const m = l.s.match(TH.BAI);
    if (m && !moc.some(x => x.so === +m[1]) && t.ds.slice(i + 1, i + 7).some(x => /Tình huống\s*1/.test(x.s))) moc.push({so: +m[1], nghia: m[2].trim(), p, y: l.y, fs: l.fs});
  }));
  moc.forEach((m, k) => {
    const sau = moc[k + 1];
    m.ls = [];
    for (let p = m.p; p <= (sau ? sau.p : tho.length - 1); p++) tho[p].ds.forEach((l, i) => {
      if ((p === m.p && l.y > m.y + 0.5) || (sau && p === sau.p && l.y <= sau.y + 0.5)) return;
      if (i === 0 && /^\d{1,3}$/.test(l.s)) return;   // số trang
      m.ls.push(l.s);
    });
  });
  return moc;
}
function dongTH(ls) {   // gộp dấu đầu dòng đứng riêng và "II." tách khỏi "Tình huống 2:"
  const ra = []; let cham = false, ii = false;
  ls.forEach(x => {
    if (x === 'II.') { ii = true; return; }
    if (ii) { x = 'II. ' + x; ii = false; }
    if (['•', '●', 'l', ''].includes(x)) { cham = true; return; }
    ra.push(cham ? '• ' + x : x); cham = false;
  });
  return ra;
}
function hoiThoaiTH(ls, canh) {
  const cau = []; let tt = 'dau', c = null;
  for (const x of ls) {
    if (TH.CUOI.test(x)) tt = 'het';
    if (tt === 'het') continue;
    const m = x.match(TH.NOI);
    if (m && (tt === 'dau' || tt === 'vi') && CJK.test(m[2])) { c = {w: m[1], z: m[2].trim(), p: '', v: ''}; cau.push(c); tt = 'zh'; }
    else if (tt === 'zh') {
      if (CJK.test(x) && !/^[A-Za-z]/.test(x)) c.z += x;
      else { c.p = x.replace(TH.VAI, ''); tt = 'py'; }
    } else if (tt === 'py') {
      if ((TH.VAI.test(x) && TH.RIENG.test(x)) || (!CJK.test(x) && TH.CHI_VIET.test(x))) { c.v = x.replace(TH.VAI, ''); tt = 'vi'; }
      else c.p += ' ' + x;
    } else if (tt === 'vi' && !CJK.test(x) && !x.startsWith('!')) c.v += ' ' + x;
  }
  cau.filter(c => !(c.z && c.p && c.v)).forEach(c => canh.push(`Lượt thoại thiếu phần: ${c.w}: ${c.z}`));
  return cau;
}
function tuVungTH(ls, nhom, canh) {
  const hang = []; let cur = null;
  ls.forEach(x => {
    if (TH.DAU_BANG.includes(x) || TH.TU.test(x)) return;
    const m = x.match(/^(\d+)\s*[.．]?\s*([㐀-鿿].*)?$/);
    if (m) { cur = m[2] ? [m[2]] : []; hang.push(cur); }
    else if (cur && cur.length >= 3 && /^[㐀-鿿]/.test(x)) { cur = [x]; hang.push(cur); }   // một ô số thứ tự chung hai hàng từ
    else if (cur) cur.push(x);
  });
  const ra = [];
  hang.forEach(h => {
    const k = h.findIndex(x => !CJK.test(x));
    if (k > 1 && h.length === 3 * k) { for (let i = 0; i < k; i++) ra.push(J([h[i], h[k + i], ' ', h[2 * k + i], nhom].map(sach))); return; }   // một ô hai từ
    if (h.length < 3 || !CJK.test(h[0]) || CJK.test(h[1])) { canh.push(`Hàng từ vựng lạ: ${h.join(' / ')}`); return; }
    ra.push(J([h[0], h[1], ' ', h.slice(2).join(' '), nhom].map(sach)));
  });
  return ra;
}
function tenHanTH(ten) {
  const q = ten.match(/[“"]([^”"]+)[”"]/); if (q) return q[1].trim();
  const m = ten.match(/[㐀-鿿…].*$/); if (!m) return '';
  return m[0].split(/\s*→|\s*\+\s*[a-zA-Zà-ỹ]{2}|\s*[(（]\s*[a-zA-Zà-ỹ]|\s*[:：]|\s+(?=\S*[ăâđêôơưạảãấầẩẫậắằẳẵặẹẻẽếềểễệỉĩịọỏõốồổỗộớờởỡợụủũứừửữựỳỵỷỹ])/)[0].replace(/[\s+/]+$/, '');
}
function nguPhapTH(ls, canh) {
  const khoi = []; let cur = null;
  ls.forEach(x => {
    const m = x.match(/^\((\d+)\)\s*(.*)$/);
    if (m) { cur = {ten: m[2], ls: []}; khoi.push(cur); }
    else if (cur) cur.ls.push(x);
    else { cur = {ten: x, ls: []}; khoi.push(cur); }   // điểm ngữ pháp không đánh số
  });
  return khoi.map(k => {
    const pat = [], ghi = [], ex = []; let vd = false, cuoi = '';
    k.ls.forEach(x => {
      if (/^Ví dụ\s*[:：]?\s*$/.test(x)) { vd = true; return; }
      if (/^Cấu trúc\s*[:：]?\s*$/.test(x)) { vd = false; return; }
      const c = TH.CHAM.test(x);
      if (x.startsWith('+') && pat.length) pat[pat.length - 1] += ' ' + x;
      else if (x.includes('+') && CJK.test(x) && x.length < 60 && !c) pat.push(x);
      else if (c || (vd && CJK.test(x) && !TH.RIENG.test(x))) {
        const s = x.replace(TH.CHAM, '').trim(), t = s.match(/^(.*[㐀-鿿。？！）…][。？！）”…]*)\s*([^㐀-鿿]*)$/);
        cuoi = 'vd';
        if (!CJK.test(s) || (t && TH.RIENG.test(t[1]))) { ghi.push(s); cuoi = 'ghi'; }   // gạch đầu dòng tiếng Việt: thuộc phần giải thích
        else if (t && TH.RIENG.test(t[2])) ex.push([t[1], t[2].replace(/^[\s()]+|[\s()]+$/g, '')]);
        else ex.push([s, '']);
      } else if (ex.length && cuoi === 'vd' && !ex.at(-1)[1] && !CJK.test(x)) ex.at(-1)[1] = x;
      else if (ex.length && cuoi === 'vd' && !CJK.test(x) && !x.endsWith(':') && /^\p{Ll}/u.test(x)) ex.at(-1)[1] += ' ' + x;
      else { ghi.push(x); cuoi = 'ghi'; }
    });
    ex.filter(e => !e[1]).forEach(e => canh.push(`Ví dụ thiếu nghĩa: ${e[0]}`));
    const cauVd = ex.map(([z, v]) => sach(v ? `${z} = ${v}` : z).replace(/;/g, ',')).join('; ');
    return J([tenHanTH(k.ten), k.ten, pat.join(' · '), cauVd, ghi.join(' ')].map(sach));
  });
}
function baiTapTH(ls, da, canh) {
  const de = []; let cur = null;
  ls.forEach(x => { const m = x.match(TH.DE); if (m) { cur = {tieude: m[2].replace(/[:：\s]+$/, ''), ls: []}; de.push(cur); } else if (cur) cur.ls.push(x); });
  const dap = [];
  da.forEach(x => { if (TH.DE.test(x)) dap.push([]); else if (dap.length) dap.at(-1).push(x); });
  const ra = [];
  de.forEach((d, i) => {
    const phan = d.ls.join('\n').split(/^(\d+)\s*[.．]\s*/m), cac = [];
    for (let k = 2; k < phan.length; k += 2) { const q = phan[k].trim(); if (!cac.includes(q)) cac.push(q); }   // PDF có chỗ lặp câu
    const an = [...(dap[i] || []).join(' ').matchAll(/(\d+)\s*[.．][\s.．]*([✔✓✘✗×ABCD])/g)].sort((a, b) => a[1] - b[1]).map(m => m[2]);
    if (an.length !== cac.length) { canh.push(`Bài tập ${i + 1}: ${cac.length} câu nhưng đọc được ${an.length} đáp án, chưa đưa vào.`); return; }
    const dong = [];
    cac.forEach((q, j) => {
      const a = an[j];
      if ('✔✓✘✗×'.includes(a)) { dong.push(J([sach(q.replace(/\(\s*\)\s*$/, '')), a === '✔' || a === '✓' ? '*Đúng' : 'Đúng', a === '✔' || a === '✓' ? 'Sai' : '*Sai'])); return; }
      const m = q.split(/(?<![A-Za-z])([A-D])\s*[.．]\s*/), o = {};
      for (let k = 1; k < m.length - 1; k += 2) o[m[k]] = sach(m[k + 1]);
      const chu = Object.keys(o).sort();
      if (chu.join('') !== 'ABCD'.slice(0, chu.length) || chu.length < 2 || !o[a]) { canh.push(`Câu trắc nghiệm chưa đọc được: ${sach(q)}`); return; }
      dong.push(J([sach(m[0]), ...chu.map(c => (c === a ? '*' : '') + o[c])]));
    });
    ra.push({loai: 'tracnghiem', tieude: d.tieude, text: dong.join('\n')});
  });
  return ra;
}
/* Nội dung một bài ở dạng chữ của các ô nhập, giống khi thầy cô tự gõ vào. */
function docBaiTH(m) {
  const ls = dongTH(m.ls), canh = [], tim = re => ls.findIndex(x => re.test(x));
  const k1 = ls.findIndex(x => (x.match(TH.MUC) || [])[1] === 'I'), k2 = ls.findIndex(x => (x.match(TH.MUC) || [])[1] === 'II'), k3 = tim(TH.LT), k4 = tim(TH.DA);
  if ([k1, k2, k3, k4].includes(-1)) return null;
  const r = {ten: sach(ls[1]), tumoi: [], nguphap: [], hoithoai: [], exs: baiTapTH(ls.slice(k3 + 1, k4), ls.slice(k4), canh), canh};
  [[1, k1, k2], [2, k2, k3]].forEach(([so, a, b]) => {
    const dau = ls[a].match(TH.MUC), d = [...(dau[3] ? [dau[3]] : []), ...ls.slice(a + 1, b)];
    let kKt = d.findIndex(x => TH.KT.test(x));
    if (kKt < 0) { canh.push(`Tình huống ${so}: không thấy mục Kiến thức ngôn ngữ.`); kKt = d.length; }
    let kTu = d.findIndex(x => TH.TU.test(x));
    if (kTu < 0) kTu = d.indexOf('TT');
    if (kTu < 0) { canh.push(`Tình huống ${so}: không thấy mục Từ vựng.`); kTu = kKt; }
    // Tên tình huống: tên tiếng Việt (có thể xuống dòng) rồi tên chữ Hán, hoặc chung một dòng.
    let vi = '', zh = '', i = 0;
    while (i < d.length && !CJK.test(d[i]) && !d[i].startsWith('(')) vi = (vi + ' ' + d[i++]).trim();
    if (i < d.length && !TH.NOI.test(d[i]) && CJK.test(d[i])) {
      const x = d[i++], t = x.match(/^(.*[㐀-鿿。，])\s+([^㐀-鿿]+)$/) || x.match(/^([^㐀-鿿]+?)[\s:：]+([㐀-鿿].*)$/);
      if (t) { const hanTruoc = CJK.test(t[1]); zh = (hanTruoc ? t[1] : t[2]).trim(); vi ||= (hanTruoc ? t[2] : t[1]).trim(); }
      else zh = x;
      if (!vi && i < d.length && !CJK.test(d[i]) && !d[i].startsWith('(')) vi = d[i++];
    }
    r.hoithoai.push(J([`TH${so}`, sach(zh), ' ', sach(vi)]));
    hoiThoaiTH(d.slice(i, kTu), canh).forEach(c => r.hoithoai.push(J([c.w, sach(c.z), sach(c.p), sach(c.v)])));
    r.tumoi.push(...tuVungTH(d.slice(kTu, kKt), `Tình huống ${so}`, canh));
    r.nguphap.push(...nguPhapTH(d.slice(kKt + 1), canh));
  });
  return r;
}
let BO_TH = null;   // file nhiều bài vừa nạp: {file, bai, cap}
async function soanBaiTH(so) {
  const {file, bai, cap} = BO_TH, m = bai.find(x => x.so === so);
  if (dirty && !confirm('Bài đang soạn chưa lưu sẽ bị thay thế. Tiếp tục?')) return;
  const r = docBaiTH(m);
  if (!r) { logFile(file.name, [{t: `Bài ${so}: không tìm đủ các phần (tình huống, luyện tập, đáp án).`, cls: 'err'}]); return; }
  await openLesson('');
  location.hash = 'soan';
  const dirTrung = list().some(x => x.dir === 'bai' + so);   // không chiếm thư mục của bài đang có cùng số
  $('#so').value = so; $('#dir').value = dirTrung ? `bai${so}-2` : 'bai' + so;
  $('#ten').value = r.ten; $('#nghia').value = m.nghia;
  if (cap) $('#cap').value = cap;
  $('#tumoi').value = r.tumoi.join('\n'); $('#nguphap').value = r.nguphap.join('\n'); $('#hoithoai').value = r.hoithoai.join('\n');
  S.exs = r.exs; drawExs(); setXuat('full');
  try { if (!window.pinyinPro) await loadScript(PINYIN_LIB); $('#pinyin').value = pinyinPro.pinyin(r.ten); } catch {}
  // Không chụp trang PDF vào bài: bìa dựng kiểu web, ảnh minh họa do thầy cô tải vào khung ở mục 9.
  $('#anhbia').dataset.want = ''; drawGallery(BIA_WEB);
  S.minhhoa = [{vitri: 'th-1'}, {vitri: 'th-2'}]; drawMinhHoa();
  logFile(`Bài ${so} (từ ${file.name})`, [
    {t: `Thông tin bài: Bài ${so} · ${r.ten} · ${m.nghia}`, go: 'box-info'},
    ...(dirTrung ? [{t: `Đã có bài trong thư mục bai${so}, bài này để ở bai${so}-2 để không ghi đè.`, cls: 'warn', go: 'box-info'}] : []),
    {t: `Từ mới: ${r.tumoi.length} từ, chưa có từ loại vì file không ghi.`, go: 'box-tumoi'},
    {t: `Ngữ pháp: ${r.nguphap.length} điểm`, go: 'box-nguphap'},
    {t: `Hội thoại: ${r.hoithoai.length - 2} lượt, 2 tình huống`, go: 'box-hoithoai'},
    {t: `Bài tập: ${r.exs.length} bài (${r.exs.map(x => x.text.split('\n').length + ' câu').join(', ')}), đã đánh dấu đáp án.`, go: 'box-baitap'},
    {t: 'Ảnh minh họa: có 2 khung trước mỗi tình huống, tải ảnh hoặc tích “Bỏ ảnh” ở mục 9.', go: 'box-anh'},
    ...r.canh.map(t => ({t, cls: 'warn'})),
  ]);
  changed(); render();
}
$('#log').addEventListener('click', e => {
  const b = e.target.closest('[data-bai-th]'); if (!b) return;
  dangNap = dangNap.then(() => soanBaiTH(+b.dataset.baiTh)).catch(err => toast('Không nạp được: ' + (err.message || err)));
});
/* Một trang PDF thành mục Bài giảng: dòng chữ to hẳn ở đầu trang làm tiêu đề, còn lại thành đoạn (dòng có dấu • - thành ý gạch đầu dòng).
   Ảnh trong PDF không tách riêng được: trang có ảnh thì kèm ảnh chụp trang làm hình minh họa ({t: 'goc'}). */
function ndTrang(dong, coAnh) {
  const ds = [...dong], giua = ds.map(l => l.fs).sort((a, b) => a - b)[ds.length >> 1] || 0;
  let tieude = '';
  // Trang chỉ có một dòng chữ (vd. "Từ vựng" trên trang toàn ảnh) thì dòng đó là tiêu đề, trang hiện ảnh chụp.
  if (ds[0] && ds[0].s.length <= 40 && (ds.length === 1 || ds[0].fs >= giua * 1.3)) tieude = ds.shift().s;
  const khoi = noiDong(ds.map(l => { const m = l.s.match(/^[•●▪■◆\-–]\s*(.+)/); return {t: 'p', s: m ? m[1] : l.s, lv: 0, cham: m ? '•' : '', sz: l.fs}; }))
    .map(({sz, ...p}) => p);
  return {tieude, khoi: coAnh && khoi.length ? [...khoi, {t: 'goc'}] : khoi};
}
async function napPdf(file) {
  if (!window.pdfjsLib) {
    await loadScript('khung/lib/pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'khung/lib/pdf.worker.min.js';
  }
  const pdf = await pdfjsLib.getDocument({data: await file.arrayBuffer()}).promise;
  // Ghép các mảnh chữ cùng độ cao thành dòng theo khoảng cách thật giữa chúng: sát nhau thì liền chữ,
  // cách cỡ một dấu cách thì thêm dấu cách, cách xa (hai cột trên cùng hàng) thì tách thành hai dòng.
  const pages = [], nd = [], tho = [], vungTrang = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const rows = [], pg = await pdf.getPage(i);
    for (const it of (await pg.getTextContent()).items) {
      if (!it.str.trim()) continue;
      const y = it.transform[5], fs = Math.hypot(it.transform[2], it.transform[3]) || 10;
      let r = rows.find(r => Math.abs(r.y - y) < fs * 0.4);
      if (!r) rows.push(r = {y, parts: []});
      r.parts.push({x: it.transform[4], w: it.width, fs, s: it.str});
    }
    const lines = [], fs = [], ys = [];
    rows.sort((a, b) => b.y - a.y).forEach(r => {
      let cur = '', end = null, to = 0;
      r.parts.sort((a, b) => a.x - b.x).forEach(p => {
        const gap = end == null ? 0 : p.x - end;
        if (end != null && gap > p.fs * 1.5) { lines.push(cur); fs.push(to); ys.push(r.y); cur = ''; to = 0; }
        else if (end != null && gap > p.fs * 0.2) cur += ' ';
        cur += p.s; end = p.x + p.w; to = Math.max(to, p.fs);
      });
      lines.push(cur); fs.push(to); ys.push(r.y);
    });
    const ds = lines.map((l, k) => ({s: l.replace(/\s+/g, ' ').trim(), fs: fs[k], y: ys[k]})).filter(l => l.s);
    pages.push(ds.map(l => l.s));
    const O = pdfjsLib.OPS, ol = await pg.getOperatorList(), op = ol.fnArray;
    const coAnh = op.some(f => f === O.paintImageXObject || f === O.paintInlineImageXObject || f === O.paintImageXObjectRepeat || f === O.paintImageMaskXObject);
    let vung = [];
    try { vung = coAnh ? vungAnh(ol, pg.getViewport({scale: 1})) : []; } catch {}
    vungTrang.push(vung);
    tho.push({ds, coAnh});
    nd.push(ndTrang(ds, coAnh));
  }
  // PDF dạng tình huống: một bài thì soạn luôn; nhiều bài thì thầy cô chọn bài, mỗi bài soạn và lưu riêng như bình thường.
  const baiTH = tachBaiTH(tho);
  if (baiTH.length) {
    const kh = pages.slice(0, baiTH[0].p).flat().find(l => /^KHÓA HỌC\s+\S/i.test(l));
    const cap = kh ? kh.replace(/^KHÓA HỌC\s+/i, '').toLowerCase().replace(/^\p{L}/u, c => c.toUpperCase()).replace(/\btrung\b/, 'Trung') : '';
    BO_TH = {file, bai: baiTH, cap};
    if (baiTH.length === 1) return soanBaiTH(baiTH[0].so);
    $('#log').insertAdjacentHTML('beforeend', `<div class="res"><div class="rh"><span class="tag d">PDF</span><b>${esc(file.name)}</b></div>
      <ul><li>Tìm thấy ${baiTH.length} bài${baiTH[0].p ? `, bỏ qua ${baiTH[0].p} trang đứng trước Bài ${baiTH[0].so} (bìa, hồ sơ)` : ''}. Bấm để soạn từng bài, lưu xong bấm bài tiếp theo:</li></ul>
      <div class="acts" style="flex-wrap:wrap">${baiTH.map(m => `<button type="button" class="btn sm" data-bai-th="${m.so}" title="${esc(m.nghia)}">Bài ${m.so}</button>`).join('')}</div></div>`);
    return;
  }
  let g = docGiaoTrinh(pages, file.name), ocr = null, ocrLoi = '';
  const got = [];
  await doiBai(g, 'PDF');
  S.slideFile = file;
  if ($('#ocr').checked) {
    try { ocr = await docAnh(pdf, g); if (ocr.han.size) g = docGiaoTrinh(pages, file.name, ocr.han); }
    catch (e) { ocrLoi = e.message || String(e); }
  }
  apDung(g, got, pages.flat().length > 0, ocr, 'PDF');
  if (ocrLoi) got.push({t: `Không đọc được chữ trong ảnh: ${ocrLoi}. Phần chữ thường vẫn được nạp.`, cls: 'warn'});
  // Mục Bài giảng: chữ từng trang thành bài đọc; ảnh trong trang được cắt riêng (không chụp cả trang) đặt cạnh chữ.
  const anhTrang = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    toast(`Đang đọc trang ${i}/${pdf.numPages} của PDF…`);
    anhTrang.push(await chupTrang(await pdf.getPage(i), 1600, vungTrang[i - 1]));
  }
  if (await datTrang(file, 'pdf', anhTrang.map((x, i) => ({blob: x.blob, hinh: x.hinh, nd: nd[i]})))) {
    const chup = nd.filter(x => !x.khoi.some(k => k.t === 'p')).length, soHinh = anhTrang.reduce((n, x) => n + x.hinh.length, 0);
    got.push({t: `Bài giảng: ${anhTrang.length} trang PDF thành bài đọc trong giáo trình${soHinh ? `, cắt riêng ${soHinh} ảnh trong trang` : ''}${chup ? `; ${chup} trang không có chữ nên hiện ảnh chụp trang` : ''}. Ở khung xem trước, mỗi ảnh có nút “Đổi ảnh” / “Bỏ ảnh”.`, go: 'box-info'});
  } else got.push({t: 'Đã có bản .pptx cùng tên nên mục Bài giảng giữ nội dung đọc từ slide.', go: 'box-info'});
  if (!$('#anhbia').value && anhTrang[0]) {   // trang đầu làm ảnh bìa nếu bài chưa có
    $('#anhbia').dataset.want = await addImage('bia.jpg', anhTrang[0].blob);
    got.push({t: 'Trang đầu được dùng làm ảnh bìa (đổi được ở mục 3).', go: 'box-info'});
  }
  logFile(file.name, got);
  changed();
}
/* File giáo trình của bài khác với bài đang mở: chuyển sang soạn bài mới để khung xem trước không còn nội dung bài cũ. */
async function doiBai(g, kieu) {
  const dang = parseInt(val('so'), 10) || 0, coNoiDung = S.sua || ['ten', 'tumoi', 'nguphap', 'hoithoai'].some(id => val(id)) || S.exs.length;
  if ((g.so && g.so !== dang && coNoiDung) || (!g.so && S.sua)) {
    const ten = S.sua ? `Bài ${dang}` : 'bài đang soạn';
    if (confirm(`${g.so ? `File này là Bài ${g.so}` : 'File này'}, khác ${ten}.\n\nOK: soạn thành bài mới từ file ${kieu} (nội dung ${ten} trên trang sẽ được thay).\nHủy: chỉ dùng ${kieu} làm slide cho ${ten}.`)) {
      const loai = xuat();
      await openLesson('');
      setXuat(loai);
    }
  }
}
/* Điền các mục còn trống từ kết quả đọc giáo trình (PDF hoặc slide .pptx); coChu: file có chữ để đọc. */
function apDung(g, got, coChu, ocr, kieu) {
  const dien = (id, v) => { if (v && !val(id)) { $('#' + id).value = v; return true; } };
  if (g.so && !S.sua) { $('#so').value = g.so; $('#dir').value = 'bai' + g.so; }
  const tt = [g.so && !S.sua && `Bài ${g.so}`, dien('ten', g.ten) && g.ten, dien('pinyin', g.pinyin) && g.pinyin].filter(Boolean);
  if (tt.length) got.push({t: 'Thông tin bài: ' + tt.join(' · '), go: 'box-info'});
  else if (!coChu) got.push({t: `${kieu} này toàn ảnh, không có chữ để đọc. Hãy điền thông tin bài bằng tay.`, cls: 'warn', go: 'box-info'});
  if (!g.ten && coChu) got.push({t: 'Không thấy tên bài chữ Hán ở trang đầu, hãy điền tay.', cls: 'warn', go: 'box-info'});
  if (g.tumoi.length && !val('tumoi')) {
    $('#tumoi').value = g.tumoi.join('\n');
    const thieu = g.tumoi.filter(r => r.startsWith(' |') || r.startsWith('|')).length, khongNghia = g.tu.filter(v => !v.nghia).length;
    const vd = g.tumoi.filter(r => r.split(' | ').length > 5).length;
    got.push({t: `Từ mới: ${g.tumoi.length} từ${vd ? `, ${vd} từ có câu ví dụ (đoán theo trang, nên xem lại)` : ''}`, go: 'box-tumoi'});
    if (ocr && ocr.han.size) got.push({t: `Đọc chữ trong ảnh (OCR ${ocr.trang} trang): tìm được chữ Hán cho ${ocr.han.size} từ, khớp theo pinyin. Nên xem lại.`, go: 'box-tumoi'});
    if (khongNghia) got.push({t: `${khongNghia} từ chưa đọc được nghĩa, cần điền tay.`, cls: 'warn', go: 'box-tumoi'});
    if (thieu) got.push({t: `${thieu} từ chưa có chữ Hán${ocr ? ' (OCR không đọc ra)' : ' (nằm trong ảnh)'}, cần điền tay.`, cls: 'warn', go: 'box-tumoi'});
  } else if (g.tumoi.length) got.push({t: `Tìm được ${g.tumoi.length} từ nhưng mục Từ mới đã có sẵn nên không ghi đè.`, cls: 'warn', go: 'box-tumoi'});
  if (g.nguphap.length && !val('nguphap')) {
    $('#nguphap').value = g.nguphap.join('\n');
    got.push({t: `Ngữ pháp: ${g.nguphap.length} điểm (mẫu câu, câu ví dụ, giải thích); nghĩa tiếng Việt của câu ví dụ cần điền thêm`, go: 'box-nguphap'});
  } else if (g.nguphap.length) got.push({t: `Tìm được ${g.nguphap.length} điểm ngữ pháp nhưng mục Ngữ pháp đã có sẵn nên không ghi đè.`, cls: 'warn', go: 'box-nguphap'});
  if (g.hoi.length && !S.exs.some(x => x.loai === 'tuluan')) {
    S.exs.push({loai: 'tuluan', tieude: 'Đọc bài khóa và trả lời câu hỏi', text: g.hoi.join('\n')});
    drawExs();
    got.push({t: `Bài khóa: ${g.hoi.length} câu hỏi, thêm vào mục Bài tập${xuat() === 'giaotrinh' ? ' (chỉ hiện khi chọn Cả hai)' : ''}`, go: 'box-baitap'});
  }
  if (ocr && ocr.hoithoai.length >= 2 && !val('hoithoai')) {
    $('#hoithoai').value = ocr.hoithoai.join('\n');
    got.push({t: `Hội thoại (OCR): ${ocr.hoithoai.length} câu, chưa có pinyin và nghĩa. Nên đối chiếu lại với slide.`, cls: 'warn', go: 'box-hoithoai'});
  } else if (coChu && !val('hoithoai')) got.push({t: 'Không đọc được hội thoại bài khóa, cần gõ vào mục Hội thoại nếu muốn có.', cls: 'warn', go: 'box-hoithoai'});
}
/* Chữ trên một slide: mỗi đoạn <a:p> (cả trong bảng, nhóm hình) một dòng, xuống dòng <a:br/> cũng tách dòng. */
const XML_KT = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"};
const dongSlide = xml => (xml.match(/<a:p>[\s\S]*?<\/a:p>/g) || [])
  .flatMap(p => [...p.matchAll(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>|<a:br\b/g)].map(m => m[1] ?? '\n').join('').split('\n'))
  .map(l => l.replace(/&(amp|lt|gt|quot|apos);/g, (_, k) => XML_KT[k]).replace(/\s+/g, ' ').trim()).filter(Boolean);
async function napSlide(file, zip) {
  zip ||= await JSZip.loadAsync(file);
  const num = n => +n.match(/(\d+)\.xml/)[1];
  const slides = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b));
  const bodies = await Promise.all(slides.map(s => zip.file(s).async('string')));
  // Đọc chữ trên slide như PDF giáo trình (số bài, tên bài, từ vựng…), trước khi tách ảnh để đổi bài mới không làm mất ảnh.
  const pages = bodies.map(dongSlide), g = docGiaoTrinh(pages, file.name), got = [];
  await doiBai(g, '.pptx');
  let count = 0, gif = 0, bia = null;
  const tenAnh = new Map();   // số slide → [thứ tự r:embed trên slide → tên ảnh đã tách], để gắn ảnh vào nội dung Bài giảng
  for (const [j, s] of slides.entries()) {
    const n = num(s), rel = zip.file(`ppt/slides/_rels/slide${n}.xml.rels`); if (!rel) continue;
    const xml = new DOMParser().parseFromString(await rel.async('string'), 'application/xml');
    // Đánh số theo thứ tự ảnh xuất hiện trên trang (kể cả ảnh lặp): s02_1.jpg, s02_2.gif…
    const rels = Object.fromEntries([...xml.getElementsByTagName('Relationship')]
      .filter(r => /\/image$/.test(r.getAttribute('Type'))).map(r => [r.getAttribute('Id'), r.getAttribute('Target')]));
    const ten = [];
    let k = 0;
    for (const [o, m] of [...bodies[j].matchAll(/r:embed="([^"]+)"/g)].entries()) {
      const t = rels[m[1]]; if (!t) continue;
      const path = t.startsWith('/') ? t.slice(1) : 'ppt/' + t.replace(/^\.\.\//, '');
      const ext = path.split('.').pop().toLowerCase(), f = zip.file(path);
      if (!f || !MIME[ext]) continue;
      k++; count++; gif += ext === 'gif';
      ten[o] = await addImage(`s${String(n).padStart(2, '0')}_${k}.${ext}`, new Blob([await f.async('uint8array')], {type: MIME[ext]}));
      if (!j && ext !== 'gif' && (!bia || IMG.get(ten[o]).blob.size > IMG.get(bia).blob.size)) bia = ten[o];   // ảnh lớn nhất trang đầu làm ảnh bìa
    }
    tenAnh.set(n, ten);
  }
  S.slideFile = file;
  apDung(g, got, pages.flat().length > 0, null, 'Slide');
  // Mục Bài giảng: chữ, ảnh, bảng từng slide thành bài đọc; slide toàn ảnh, chữ không tách được thì dùng ảnh chụp slide.
  try {
    const ve = await veSlides(zip, {rong: 1600, tienDo: (i, n) => toast(`Đang đọc slide ${i + 1}/${n}…`)});
    ve.forEach(x => {
      if (!x.nd) return;
      const ten = tenAnh.get(x.so) || [];
      x.nd.khoi = x.nd.khoi.flatMap(({i, ...k}) => k.t !== 'anh' ? [k] : ten[i] ? [{...k, ten: ten[i]}] : []);
    });
    const anhChup = ve.filter(x => !x.nd || !x.nd.khoi.some(k => k.t !== 'anh')).length;
    if (!ve.length) got.push({t: 'Không đọc được slide nào.', cls: 'warn'});
    else if (await datTrang(file, 'pptx', ve)) got.push({t: `Bài giảng: ${ve.length} slide thành bài đọc trong giáo trình (chữ, ảnh, bảng)${anhChup ? `; ${anhChup} slide không có chữ nên hiện ảnh chụp slide` : ''}. Xem lại ở khung bên phải.`, go: 'box-info'});
  } catch (e) { got.push({t: `Không đọc được slide cho mục Bài giảng: ${e.message || e}`, cls: 'warn'}); }
  if (bia && !$('#anhbia').value) { $('#anhbia').dataset.want = bia; got.push({t: `Ảnh lớn nhất ở trang đầu (${bia}) được dùng làm ảnh bìa (đổi được ở mục 3).`, go: 'box-info'}); }
  got.push({t: `Tách riêng được ${count} ảnh trong slide${gif ? ` (${gif} ảnh động .gif, thường là thứ tự nét)` : ''} để gắn vào thẻ từ.`, go: 'box-anh', cls: count ? '' : 'warn'});
  logFile(file.name, got);
  changed();
}

/* Word: các đề mục (Thông tin, Mục tiêu, Tiến trình, Từ mới, Cách viết, Ngữ pháp, Hội thoại, Bài 1. …) chia phần;
   bảng thành các dòng "cột | cột", đoạn văn thành từng dòng. */
const SEC = [
  ['info', /^thông tin/i], ['muctieu', /^mục tiêu/i], ['tientrinh', /^(tiến trình|các bước lên lớp|hoạt động dạy)/i],
  ['tumoi', /^(từ mới|từ vựng|生词)/i], ['cachviet', /^(cách viết|thứ tự nét)/i], ['nguphap', /^(ngữ pháp|语法|mẫu câu)/i],
  ['hoithoai', /^(hội thoại|会话|对话|课文)/i], ['baitap', /^(bài tập|luyện tập|练习)\s*$/i], ['bo', /^(đáp án|answer key)\s*$/i],
];
const SUB = [['kienthuc', /^kiến thức\s*[:：]?\s*/i], ['nangluc', /^(năng lực|kỹ năng|kĩ năng)\s*[:：]?\s*/i], ['phamchat', /^(phẩm chất|thái độ)\s*[:：]?\s*/i]];
const INFO = [['so', /số bài|bài số/i], ['ten', /tên bài|tiêu đề/i], ['pinyin', /pinyin|phiên âm/i], ['nghia', /nghĩa|dịch/i],
  ['cap', /cấp|trình độ|lớp/i], ['gioithieu', /giới thiệu|mô tả/i], ['mau', /mẫu|giao diện/i], ['anhbia', /ảnh bìa/i]];
const HEAD_RE = /^(stt|chữ hán|hán tự|từ|pinyin|phiên âm|từ loại|nghĩa|nhóm|ví dụ|ảnh|thời gian|nội dung|người nói|nhân vật|câu|mẫu câu|ghi chú|điểm ngữ pháp|ý nghĩa|đáp án|lựa chọn|câu hỏi|gợi ý|hoạt động)(?!\p{L})/iu;
const CJK = /[㐀-鿿]/;

/* Phiếu bài tập soạn tự do (như "bài 8 D57.docx"): đổi từng dòng sang dạng "cột | cột" của ô bài tập.
   Dòng đã có dấu | thì giữ nguyên. In đậm được đánh dấu bằng ** khi đọc file. */
const bo = s => s.replace(/\*\*/g, '');
const RAC = /^[\s_＿.…·\-–—]*$|^(họ (và )?tên|lớp|ngày|điểm)\s*[:：]/i;   // dòng kẻ để viết, dòng họ tên
const SO = /^\s*\d+\s*[.)、．:]\s*/;                                        // "1. " ở đầu câu
const DA = /\s*(?:đáp án|đ\/a)\s*[:：]\s*(.*)$/i;
const OPT = /^([A-F])\s*[.、．:)）]\s*(.*)$/;
const CHO = /_{2,}|＿{2,}|…{2,}|\.{4,}|（\s*）|\(\s*\)/;
const LUOT = /^\S{1,6}[:：]/;                                               // "A：…" một lượt thoại
const dapAn = s => { const m = s.match(DA); return m ? [s.slice(0, m.index).trim(), m[1].trim()] : [s.trim(), '']; };
const TU_DO = {
  vitri(ls) {
    const out = [];
    ls.forEach(l => {
      const [s, a] = dapAn(bo(l).replace(SO, ''));
      const m = s.match(/[（(]\s*([^（）()]+?)\s*[）)]\s*[。.]?$/);
      if (m && /\b[A-D]\b/.test(s)) out.push([s.slice(0, m.index).trim(), m[1], a.toUpperCase()]);
      else if (!s && a && out.length) out[out.length - 1][2] = a.toUpperCase();
    });
    return out;
  },
  dien(ls) {
    const out = []; let ctx = [];   // ctx: các câu dẫn không có chỗ trống (vd. lượt thoại trước), ghép vào câu điền ngay sau
    ls.forEach(l => {
      const [s, a] = dapAn(bo(l).replace(SO, ''));
      const da = a.split(/\s*[,，、;；\/]\s*/).filter(Boolean).join(' / ');
      const last = out.findLast(x => Array.isArray(x));
      if (!s) { if (last && da) last[1] = da; return; }
      if (CHO.test(s)) { out.push([[...ctx, s.replace(new RegExp(`\\s*(?:${CHO.source})\\s*`, 'g'), '____')].join(' // '), da]); ctx = []; return; }
      const tu = s.replace(/^từ\s*[:：]\s*/i, '').split(/\s*[\/,，、;；]\s*|\s{2,}/).filter(Boolean);
      if (tu.length > 1 && tu.every(t => t.length <= 8)) { out.push('Từ: ' + tu.join(', ')); ctx = []; }
      else if (!CJK.test(s)) return;
      else if (LUOT.test(s) && last && out[out.length - 1] === last && !ctx.length && LUOT.test(last[0].split(' // ').pop())) last[0] += ' // ' + s;   // lượt thoại nối tiếp câu điền
      else ctx.push(s);
    });
    return out;
  },
  sapxep(ls) {
    const out = [];
    ls.forEach(l => {
      const [s, a] = dapAn(bo(l).replace(SO, ''));
      if (!s) { if (a && out.length) out[out.length - 1][1] = a; return; }
      let toks = s.split(/\s*[\/／]\s*/).filter(Boolean);
      if (toks.length < 2 && !/[。？！?!]$/.test(s)) toks = s.split(/\s+/);
      if (toks.length > 1) out.push([toks.join(' '), a]);
      else if (out.length && !out[out.length - 1][1] && CJK.test(s)) out[out.length - 1][1] = s;   // câu đáp án viết ngay dưới
    });
    return out;
  },
  tracnghiem(ls) {
    // Các lựa chọn viết liền một dòng ("A. 三  B. 四  C. 五") được tách ra từng dòng.
    const ps = ls.flatMap(l => l.split(/\s+(?=(?:\*\*)?[B-F]\s*[.、．)）])/));
    const out = []; let q = null;
    const flush = () => {
      if (!q) return;
      const bold = q.o.filter(o => o.b).length;
      const k = q.a ? 'ABCDEF'.indexOf(q.a[0]) : bold && bold < q.o.length ? q.o.findIndex(o => o.b) : -1;
      out.push([q.q, ...q.o.map((o, j) => (j === k ? '*' : '') + o.t)]); q = null;
    };
    ps.forEach((l, i) => {
      const p = bo(l).trim(), m = p.match(OPT);
      if (m && q) { const [t, a] = dapAn(m[2]); q.o.push({t, b: l.includes('**')}); if (a) q.a = a.toUpperCase(); return; }
      const [s, a] = dapAn(p.replace(SO, ''));
      if (!s) { if (q && a) q.a = a.toUpperCase(); return; }
      flush();
      if (ps[i + 1] && OPT.test(bo(ps[i + 1]).trim())) q = {q: s, o: [], a: a.toUpperCase()};
      else out.push(/^đoạn\s*[:：]/i.test(s) ? s : 'Đoạn: ' + s);
    });
    flush();
    return out;
  },
  tuluan(ls) {
    const ps = ls.map(l => bo(l).trim());
    const HOI = /^([★☆]|[a-e][.)]\s)/;
    const star = ps.some(l => HOI.test(l));   // có ★ hoặc "a." thì đó là câu hỏi, các dòng khác là đoạn văn
    const out = []; let doan = -1, last = null;
    ps.forEach(l => {
      if (doanRe.test(l)) { out.push(l); doan = -1; return; }
      const [s0, a] = dapAn(l);
      if (!s0) { if (a && last) last[1] = a; return; }
      if (star && !HOI.test(s0)) {
        const s = s0.replace(SO, '');
        if (doan < 0 || SO.test(s0)) { doan = out.length; out.push('Đoạn: ' + s); } else out[doan] += ' // ' + s;
        return;
      }
      last = [s0.replace(/^[★☆]\s*/, '').replace(SO, ''), a]; out.push(last); doan = -1;
    });
    return out;
  },
};
function tuDo(loai, ls) {
  const out = []; let buf = [];
  const flush = () => { if (buf.length) out.push(...TU_DO[loai](buf).map(x => Array.isArray(x) ? J(x) : x)); buf = []; };
  ls.filter(l => !RAC.test(bo(l))).forEach(l => { if (l.includes('|')) { flush(); out.push(bo(l)); } else buf.push(l); });
  flush();
  return out.join('\n');
}
/* Chữ của một đoạn văn: xuống dòng mềm (Shift+Enter) thành dòng mới, chữ in đậm bọc trong ** */
function paraText(el) {
  const c = el.cloneNode(true);
  c.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
  c.querySelectorAll('strong').forEach(b => { if (b.textContent.trim()) b.replaceWith(`**${b.textContent}**`); });
  return c.textContent.replace(/\*\*\*\*/g, '').replace(/\*\*(\s*)\*\*/g, '$1');
}
const soCau = (loai, d) => loai === 'dien' ? d.nhom.reduce((n, g) => n + g.cau.length, 0) : loai === 'tuluan' ? d.doan.reduce((n, p) => n + p.hoi.length, 0) : d.cau.length;

async function napWord(file) {
  const {value: html} = await mammoth.convertToHtml({arrayBuffer: await file.arrayBuffer()});
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out = {info: {}, kienthuc: [], nangluc: [], phamchat: [], tientrinh: [], tumoi: [], cachviet: [], nguphap: [], hoithoai: [], exs: []};
  let sec = null, sub = 'kienthuc', ex = null, ttTitle = '', htIntro = '', seenEx = false;
  const head = txt => {
    const t = txt.replace(/^(\d+|[IVX]+)[.)]\s+/, '').trim();
    // "Bài 10: 你家有几口人？" ở đầu giáo án là tên bài, không phải bài tập.
    const m = t.match(/^bài\s*(?:tập\s*)?\d+\s*[.:：)\-–]?\s*(.*)$/i);
    if (m && t.length < 120 && (seenEx || /chọn|điền|sắp xếp|đọc|trả lời|trắc nghiệm|viết|nối|dịch|hoàn thành|hoàn thiện/i.test(m[1]))) {
      ex = {tieude: m[1].trim(), lines: []}; out.exs.push(ex); sec = 'ex'; seenEx = true; return true;
    }
    if (t.length > 80 || (sec === 'ex' && CJK.test(t))) return false;
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
    // Danh sách lồng nhau (Word hay tạo <ul><li><ol><li>…): mỗi mục chỉ lấy chữ của chính nó, bỏ danh sách con.
    const items = /^(UL|OL)$/.test(el.tagName) ? [...el.querySelectorAll('li')].map(li => {
      const c = li.cloneNode(true); c.querySelectorAll('ul,ol').forEach(x => x.remove()); return c;
    }) : [el];
    for (const it of items) for (let txt of paraText(it).split('\n')) {
      txt = txt.replace(/\s+/g, ' ').trim(); if (!bo(txt).trim()) continue;
      if (head(bo(txt))) continue;
      line(sec === 'ex' ? txt : bo(txt));
    }
  }

  const I = out.info, got = [];
  const add = (t, go, cls) => got.push({t, go, cls});
  if (Object.keys(I).length) {
    if (I.so) { $('#so').value = parseInt(I.so, 10) || ''; $('#dir').value = 'bai' + $('#so').value; }
    ['ten', 'pinyin', 'nghia', 'cap', 'gioithieu'].forEach(k => { if (I[k]) $('#' + k).value = I[k]; });
    const m = I.mau && MAU.find(x => new RegExp(x.ten, 'i').test(I.mau) || x.id === I.mau.toLowerCase());
    if (m) { S.mau = m.id; drawThemes(); }
    if (I.anhbia) $('#anhbia').dataset.want = I.anhbia;
    add(`Thông tin bài${I.ten ? ': ' + I.ten : ''}${m ? ` · giao diện ${m.ten}` : ''}`, 'box-info');
  }
  ['kienthuc', 'nangluc', 'phamchat'].forEach(k => { if (out[k].length) $('#' + k).value = out[k].join('\n'); });
  const mtN = out.kienthuc.length + out.nangluc.length + out.phamchat.length;
  if (mtN) add(`Mục tiêu: ${mtN} ý`, 'box-muctieu');
  if (out.tientrinh.length) { $('#tientrinh').value = out.tientrinh.join('\n'); if (ttTitle) $('#tt-tieude').value = ttTitle; add(`Tiến trình: ${out.tientrinh.length} bước`, 'box-muctieu'); }
  if (out.tumoi.length) { $('#tumoi').value = out.tumoi.join('\n'); add(`Từ mới: ${out.tumoi.length} từ`, 'box-tumoi'); }
  if (out.cachviet.length) { $('#cachviet').value = out.cachviet.join('\n'); add(`Cách viết: ${out.cachviet.length} chữ`, 'box-tumoi'); }
  if (out.nguphap.length) { $('#nguphap').value = out.nguphap.join('\n'); add(`Ngữ pháp: ${out.nguphap.length} điểm`, 'box-nguphap'); }
  if (out.hoithoai.length) { $('#hoithoai').value = out.hoithoai.join('\n'); add(`Hội thoại: ${out.hoithoai.length} câu`, 'box-hoithoai'); }
  if (htIntro) $('#ht-gioithieu').value = htIntro;
  const exs = out.exs.filter(x => x.lines.length);
  if (exs.length) {
    // Cộng vào bài tập đã có; file này nạp lại (đã sửa) thì thay các bài cũ của chính nó.
    S.exs = S.exs.filter(x => x.nguon !== file.name);
    const dau = S.exs.length;
    S.exs.push(...exs.map(x => { const loai = guessLoai(x.tieude); return {loai, tieude: x.tieude, text: tuDo(loai, x.lines), nguon: file.name}; }));
    drawExs();
    S.exs.slice(dau).forEach((x, j) => {
      const i = dau + j;
      const w = [], d = PX[x.loai](x.text, w), n = soCau(x.loai, d);
      add(`Bài ${i + 1} · ${LOAI[x.loai].ten} · ${n} câu${w.length ? ` · ${w.length} chỗ cần xem (thường là thiếu đáp án)` : ''}`, 'box-baitap', !n ? 'err' : w.length ? 'warn' : '');
    });
  }
  if (got.length) logFile(file.name, got);
  else logFile(file.name, [{t: 'Không tìm thấy đề mục nào (Từ mới, Ngữ pháp, Hội thoại, Bài 1: …). Xem ví dụ bên cạnh để soạn cho đúng.', cls: 'err'}]);
  changed();
}

/* Khung ví dụ bên cạnh ô nạp file: đổi theo loại file vừa nạp hoặc theo nút bấm. */
function showDemo(k) {
  S.demo = k; const d = DEMO[k];
  $$('#demoSeg button, #kinds button').forEach(b => b.setAttribute('aria-pressed', b.dataset.d === k));
  $('#demoBody').innerHTML = `<div class="pair">
      <figure><figcaption>${d.a}</figcaption><div class="paper">${d.paper}</div></figure>
      <div class="to" aria-hidden="true">→</div>
      <figure><figcaption>${d.b}</figcaption><div class="screen">${d.web}</div></figure>
    </div>
    <ul class="tips">${d.tips.map(t => `<li>${t}</li>`).join('')}</ul>
    ${d.dl ? `<div class="dl">${d.dl.map(([h, t]) => `<a class="btn sm" href="${h}" download>${t}</a>`).join('')}</div>` : ''}`;
}
$('#demoSeg').addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) showDemo(b.dataset.d); });
$('#kinds').addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) showDemo(b.dataset.d); });

const drop = $('#drop');
$('#pickFile').addEventListener('click', () => $('#file').click());
$('#file').addEventListener('change', e => { nap([...e.target.files]); e.target.value = ''; });
$('#pickFolder').addEventListener('click', () => $('#folder').click());
$('#folder').addEventListener('change', e => { nap([...e.target.files]); e.target.value = ''; });
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => {
  // Lấy mục kéo vào ngay lúc thả (sau await thì trình duyệt xóa mất), thư mục thì đọc hết file bên trong.
  const ms = [...e.dataTransfer.items].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
  if (!ms.length || ms.every(m => m.isFile)) return nap([...e.dataTransfer.files]);
  nap(Promise.all(ms.map(docMuc)).then(x => x.flat()));
});

/* Nút "Chèn ví dụ" dưới các mục 4–7 */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-vd]'); if (!b) return;
  const ta = $('#' + b.dataset.vd);
  ta.value = ta.value.trim() ? ta.value.replace(/\n*$/, '\n') + VD[b.dataset.vd] : VD[b.dataset.vd];
  ta.focus(); changed();
});

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
  IMG.forEach(v => URL.revokeObjectURL(v.url)); IMG.clear(); NGUON.clear(); NHOM.clear(); DA_NAP.clear();
  S.sua = dir; S.cu = new Set(); S.goc = ''; S.xuatTay = !!dir;
  if (!dir) {
    const last = list().at(-1), so = last ? last.so + 1 : 1;
    fill({so, dir: 'bai' + so, cap: last ? (await lessonCap(last.dir)) : 'Tiếng Trung HSK 1', mau: S.mau});
  } else {
    delete window.BAI;
    await loadScript(`${dir}/du-lieu.js?v=${Date.now()}`);
    const B = window.BAI;
    S.goc = BASE + dir + '/anh/';
    S.cu = usedImgs({anhbia: B.anhbia, tumoi: B.tumoi || [], cachviet: B.cachviet || {}, minhhoa: B.minhhoa, nguphap: B.nguphap, hoithoai: B.hoithoai});
    fill(B);
  }
  dirty = false; S.luu = !!dir; drawPick(); render();
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
  if (!miss.length && B.xuat !== 'giaotrinh' && B.xuat !== 'full' && !B.baitap.length) {
    go('box-baitap'); toast('Cách xuất này cần có bài tập, nhưng mục 8 chưa có bài nào.'); return false;
  }
  if (!miss.length) return true;
  const box = $('#so').closest('details'); box.open = true; box.scrollIntoView({behavior: 'smooth'});
  toast('Còn thiếu: ' + miss.join(', ') + '.');
  return false;
}
const dataJs = B => '// Dữ liệu bài học. Tạo và sửa bằng trang soan-bai.html (dành cho giáo viên).\nwindow.BAI = ' + JSON.stringify(B, null, 2) + ';\n';
const listJs = L => '// Danh sách bài trên trang mục lục. Trang soan-bai.html tự cập nhật file này khi lưu bài.\nwindow.DANH_SACH = [\n' + L.map(x => '  ' + JSON.stringify(x)).join(',\n') + '\n];\n';
function upsert(L, B) {
  const e = {so: B.so, dir: B.dir, ten: B.ten, nghia: B.nghia, xuat: B.xuat}; if (B.slide) e.slide = B.slide;
  return [...L.filter(x => x.dir !== B.dir), e].sort((a, b) => a.so - b.so);
}
function parseList(text) {
  const m = text.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
  try { return m ? JSON.parse(m[1]) : list(); } catch { return list(); }
}
function bundle(B, L) {
  const files = [[`${B.dir}/index.html`, shell('')], [`${B.dir}/du-lieu.js`, dataJs(B)]];
  if (B.xuat === 'rieng') files.push([`${B.dir}/bai-tap.html`, shell('baitap')]);
  NGUON.forEach((f, n) => files.push([`${B.dir}/tai-lieu/${n}`, f]));
  for (const n of usedImgs(B)) { const im = IMG.get(n); if (im) files.push([`${B.dir}/anh/${n}`, im.blob]); }
  if (S.slideFile) files.push([`${B.dir}/${B.slide}`, S.slideFile]);
  const L2 = upsert(L, B);
  files.push(['danh-sach.js', listJs(L2)]);
  return [files, L2];
}
function saved(B, L2) {
  window.DANH_SACH = L2; S.sua = B.dir; dirty = false; S.luu = true; NGUON.clear(); CAY = null;
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
$('#saveLocal').addEventListener('click', async () => {
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
    saved(B, L2); render();
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
  saved(B, L2); render();
  toast(`Đã tải ${B.dir}.zip. Giải nén vào thư mục web (chép đè danh-sach.js), rồi Commit và Push bằng GitHub Desktop.`);
}
$('#zip').addEventListener('click', () => { const [B] = model(); if (ready(B)) zipIt(B); });

/* ---------- publish: commit thẳng lên repo GitHub, Pages tự cập nhật ---------- */
const REPO = 'trancongtu/hoc-lieu', TOKEN_KEY = 'gh-token';
const savedToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
function token(ask) {
  let t = savedToken();
  if (t && !ask) return t;
  t = (prompt('Dán mã đăng bài (token GitHub) vào đây. Chỉ cần nhập một lần, trình duyệt sẽ nhớ.') || '').trim();
  if (t) try { localStorage.setItem(TOKEN_KEY, t); } catch {}
  return t;
}
async function gh(path, opt = {}) {
  const r = await fetch('https://api.github.com/repos/' + REPO + path, {...opt,
    headers: {Authorization: 'Bearer ' + token(), Accept: 'application/vnd.github+json', 'Content-Type': 'application/json'}});
  if (!r.ok) { const e = new Error((await r.json().catch(() => ({}))).message || r.statusText); e.status = r.status; throw e; }
  return r.json();
}
const b64 = blob => new Promise((ok, err) => {
  const f = new FileReader(); f.onload = () => ok(f.result.slice(f.result.indexOf(',') + 1)); f.onerror = () => err(f.error); f.readAsDataURL(blob);
});
const utf8 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), c => c.charCodeAt(0)));
/* Một commit lên repo. lam(L, base) nhận danh-sach.js mới nhất trên repo (không dùng bản trên trang, có thể chậm vài phút)
   và cây file hiện tại, trả về [các mục cây cần đổi, danh sách mới, lời commit] hoặc null để thôi. */
async function ghiRepo(lam) {
  const {default_branch: br} = await gh('');
  const head = (await gh(`/git/ref/heads/${br}`)).object.sha;
  const base = (await gh(`/git/commits/${head}`)).tree.sha;
  const L = parseList(utf8((await gh(`/contents/danh-sach.js?ref=${head}`)).content));
  const r = await lam(L, base); if (!r) return null;
  const [tree, L2, msg] = r;
  const t = await gh('/git/trees', {method: 'POST', body: JSON.stringify({base_tree: base, tree})});
  const c = await gh('/git/commits', {method: 'POST', body: JSON.stringify({message: msg, tree: t.sha, parents: [head]})});
  await gh(`/git/refs/heads/${br}`, {method: 'PATCH', body: JSON.stringify({sha: c.sha})});
  return L2;
}
async function thuLai(fn) {
  for (let i = 0; ; i++) {
    try { return await fn(); }
    catch (err) {
      if (err.status === 401 && i < 1 && token(true)) continue;          // mã sai hoặc hết hạn: hỏi lại
      if (err.status === 422 && i < 2) continue;                         // có người vừa đăng cùng lúc: thử lại
      throw err;
    }
  }
}
function loiGh(err, viec) {
  const ma = err.status === 401 || err.status === 403 || err.status === 404;
  toast(ma ? 'Mã đăng bài không đúng hoặc đã hết hạn. Bấm lại để nhập mã mới.' : `Không ${viec} được: ` + err.message);
  if (ma) try { localStorage.removeItem(TOKEN_KEY); } catch {}
}
const publish = B => ghiRepo(async L => {
  if (L.some(x => x.dir === B.dir) && S.sua !== B.dir && !confirm(`Thư mục ${B.dir} đã có bài. Ghi đè?`)) return null;
  const [files, L2] = bundle(B, L);
  const tree = [];
  for (const [path, d] of files) {
    const body = typeof d === 'string' ? {content: d, encoding: 'utf-8'} : {content: await b64(d), encoding: 'base64'};
    tree.push({path, mode: '100644', type: 'blob', sha: (await gh('/git/blobs', {method: 'POST', body: JSON.stringify(body)})).sha});
  }
  return [tree, L2, `Soạn Bài ${B.so}: ${B.ten}`];
});
/* Xóa cả thư mục bài (ảnh, tài liệu gốc, trang) và bỏ bài khỏi danh-sach.js. Lịch sử git vẫn giữ nên khôi phục được. */
const xoaBai = l => ghiRepo(async (L, base) => {
  const files = (await gh(`/git/trees/${base}?recursive=1`)).tree.filter(x => x.type === 'blob' && x.path.startsWith(l.dir + '/'));
  const L2 = L.filter(x => x.dir !== l.dir);
  return [[...files.map(x => ({path: x.path, mode: x.mode, type: 'blob', sha: null})),
    {path: 'danh-sach.js', mode: '100644', type: 'blob', content: listJs(L2)}], L2, `Xóa Bài ${l.so}: ${l.ten}`];
});
$('#save').addEventListener('click', async e => {
  const [B] = model(); if (!ready(B)) return;
  if (!token()) return toast('Chưa có mã đăng bài nên chưa đăng được.');
  const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Đang đăng…';
  try {
    const L2 = await thuLai(() => publish(B));
    if (!L2) return;
    saved(B, L2); render();
    toast(`Đã đăng Bài ${B.so}. Khoảng 1–2 phút nữa trang sẽ cập nhật.`);
  } catch (err) { loiGh(err, 'đăng'); }
  finally { btn.disabled = false; btn.textContent = 'Đăng lên mạng'; }
});
window.addEventListener('beforeunload', e => { if (dirty) e.preventDefault(); });

/* ---------- menu dọc: Danh sách bài · Soạn bài · Bài đã xuất ---------- */
// Link và mã QR luôn trỏ tới trang trên mạng, kể cả khi mở trang này từ máy tính.
const SITE = /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname) ? BASE : 'https://trancongtu.github.io/hoc-lieu/';
const VIEWS = ['danh-sach', 'soan', 'da-xuat'];
function view() {
  const v = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'soan';
  VIEWS.forEach(k => $('#v-' + k).hidden = k !== v);
  $$('.side [data-v]').forEach(a => a.setAttribute('aria-current', a.dataset.v === v ? 'page' : 'false'));
  if (v === 'danh-sach') drawDocs(); else if (v === 'da-xuat') drawPubs();
}
window.addEventListener('hashchange', view);
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-sua]'); if (!b) return;
  if (dirty && !confirm('Bài đang soạn chưa lưu sẽ bị thay thế. Tiếp tục?')) return;
  location.hash = 'soan';
  try { await openLesson(b.dataset.sua); } catch (err) { toast(err.message); }
});

/* Cây file của repo trên GitHub (đọc công khai; có mã đăng bài thì dùng để khỏi bị giới hạn lượt). */
let CAY = null;
function cay() {
  if (!CAY) {
    const t = savedToken();
    CAY = fetch(`https://api.github.com/repos/${REPO}/git/trees/HEAD?recursive=1`, {headers: t ? {Authorization: 'Bearer ' + t} : {}})
      .then(r => r.ok ? r.json() : Promise.reject(new Error(r.status === 403 ? 'GitHub tạm khóa lượt đọc, thử lại sau ít phút.' : r.statusText)))
      .then(j => j.tree.filter(x => x.type === 'blob'));
    CAY.catch(() => CAY = null);
  }
  return CAY;
}
const siteUrl = p => SITE + p.split('/').map(encodeURIComponent).join('/');
const kb = n => n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB';
const dau = l => `<span class="num">${esc(l.so)}</span><div class="name">${esc(l.ten)}<small>${esc(l.nghia)}</small>`;
const XUAT = {full: 'Giáo trình + bài tập', rieng: 'Giáo trình, bài tập riêng', giaotrinh: 'Chỉ giáo trình', baitap: 'Chỉ bài tập'};
const DOC = /\.(docx?|pptx?|pdf)$/i;

async function drawDocs() {
  const box = $('#docs');
  if (!list().length) { box.innerHTML = '<p class="hint">Chưa có bài nào.</p>'; return; }
  let files = null, err = '';
  box.innerHTML = '<p class="hint">Đang đọc tài liệu trên GitHub…</p>';
  try { files = await cay(); } catch (e) { err = e.message; }
  box.innerHTML = (err ? `<p class="hint" style="color:var(--warn)">Không đọc được GitHub: ${esc(err)}</p>` : '') + list().map(l => {
    const fs = (files || []).filter(f => f.path.startsWith(l.dir + '/') && DOC.test(f.path) && !f.path.includes('/anh/'));
    return `<li>${dau(l)}</div>
      <div class="docs">${fs.length ? fs.map(f => {
        const n = f.path.split('/').pop(), ext = n.split('.').pop().toLowerCase(), [c, t] = TAG[ext] || TAG[ext + 'x'] || ['i', 'File'];
        return `<a class="doc" href="${esc(siteUrl(f.path))}" target="_blank" rel="noopener"${/\.pdf$/i.test(n) ? '' : ' download'}><span class="tag ${c}">${t}</span><span>${esc(n)}</span><small>${kb(f.size)}</small></a>`;
      }).join('') : `<span class="hint">${files ? 'Chưa có tài liệu gốc trên GitHub.' : ''}</span>`}</div>
      <div class="acts"><button class="btn sm" data-sua="${esc(l.dir)}">Sửa bài</button><a class="btn sm" href="${esc(SITE + l.dir)}/" target="_blank" rel="noopener">Xem trên web</a>
        <button class="btn sm danger" data-xoa="${esc(l.dir)}">Xóa bài</button></div></li>`;
  }).join('');
}
$('#docsReload').addEventListener('click', () => { CAY = null; drawDocs(); });
$('#docs').addEventListener('click', async e => {
  const b = e.target.closest('[data-xoa]'); if (!b) return;
  const l = list().find(x => x.dir === b.dataset.xoa); if (!l) return;
  if (!confirm(`Xóa hẳn Bài ${l.so} · ${l.ten}?\n\nCả trang bài, ảnh và tài liệu gốc sẽ bị gỡ khỏi web. Học sinh không mở được nữa, mã QR đã phát cũng hết dùng được.`)) return;
  b.disabled = true; b.textContent = 'Đang xóa…';
  try {
    const L2 = await thuLai(() => xoaBai(l));
    window.DANH_SACH = L2; CAY = null;
    if (S.sua === l.dir) { dirty = false; await openLesson(''); } else drawPick();
    drawDocs();
    toast(`Đã xóa Bài ${l.so}. Khoảng 1–2 phút nữa trang web sẽ cập nhật.`);
  } catch (err) { loiGh(err, 'xóa'); b.disabled = false; b.textContent = 'Xóa bài'; }
});

/* Mã QR: [đường dẫn trong thư mục bài, tên nút, đuôi tên ảnh], khớp với QRT trong giao-an.js */
const qrDich = l => ({
  full: [['', 'Cả bài', ''], ['#bai-tap', 'Phần bài tập', '-bai-tap']],
  rieng: [['', 'Giáo trình', ''], ['bai-tap.html', 'Bài tập', '-bai-tap']],
  giaotrinh: [['', 'Giáo trình', '']],
  baitap: [['', 'Bài tập', '-bai-tap']],
}[l.xuat || 'full']);
async function drawPubs() {
  const box = $('#pubs'), bang = window.CAU_HINH?.bang;
  if (bang) { $('#xemNop').href = bang; $('#xemNop').hidden = false; }
  if (!list().length) { box.innerHTML = '<p class="hint">Chưa có bài nào được xuất.</p>'; return; }
  const draw = files => box.innerHTML = list().map(l => {
    const chua = files && !files.some(f => f.path === `${l.dir}/du-lieu.js`);
    return `<li>${dau(l)}${chua ? '<span class="badge warn">Chưa có trên GitHub</span>' : ''}</div>
      <div class="hint">${XUAT[l.xuat || 'full']}${l.slide ? ' · có slide thuyết trình' : ''}</div>
      <div class="acts"><button class="btn primary sm" data-qr="${esc(l.dir)}">Mã QR</button>
        ${qrDich(l).map(([to, t]) => `<a class="btn sm" href="${esc(SITE + l.dir + '/' + to)}" target="_blank" rel="noopener">Mở ${t.toLowerCase()}</a>`).join('')}</div></li>`;
  }).join('');
  draw(null);
  try { draw(await cay()); } catch {}
}

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
const QR = {l: null, k: 0};
const qrUrl = () => SITE + QR.l.dir + '/' + qrDich(QR.l)[QR.k][0];
function drawQr() {
  $('#qrImg').src = qrCanvas(qrUrl(), 10).toDataURL('image/png');
  $('#qrLink').textContent = qrUrl();
  $$('#qrSeg button').forEach((b, k) => b.setAttribute('aria-pressed', k === QR.k));
}
$('#pubs').addEventListener('click', e => {
  const b = e.target.closest('[data-qr]'); if (!b) return;
  QR.l = list().find(l => l.dir === b.dataset.qr); QR.k = 0;
  const d = qrDich(QR.l);
  $('#qrSub').textContent = `Bài ${QR.l.so} · ${QR.l.ten}`;
  $('#qrSeg').hidden = d.length < 2;
  $('#qrSeg').innerHTML = d.map(([, t], k) => `<button data-k="${k}">${t}</button>`).join('');
  drawQr(); $('#qrDlg').showModal();
});
$('#qrSeg').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { QR.k = +b.dataset.k; drawQr(); } });
$('#qrClose').addEventListener('click', () => $('#qrDlg').close());
$('#qrDlg').addEventListener('click', e => { if (e.target === $('#qrDlg')) $('#qrDlg').close(); });
$('#qrSave').addEventListener('click', () => {
  const duoi = qrDich(QR.l)[QR.k][2], a = document.createElement('a');
  a.href = qrCanvas(qrUrl(), 20, `Bài ${QR.l.so} · ${QR.l.ten}${duoi ? ' · Bài tập' : ''}`).toDataURL('image/png');
  a.download = `qr-${QR.l.dir}${duoi}.png`;
  document.body.append(a); a.click(); a.remove();
});
$('#qrCopy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(qrUrl()); toast('Đã sao chép link.'); }
  catch { toast('Không sao chép được, hãy chép link bên dưới mã QR.'); }
});

/* ---------- cửa vào: chỉ ai có mã đăng bài (token có quyền ghi repo) mới dùng được trang này ---------- */
async function coQuyen(t) {
  const r = await fetch('https://api.github.com/repos/' + REPO, {headers: {Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json'}});
  if (r.status === 401 || r.status === 403 || r.status === 404) return false;
  if (!r.ok) throw new Error(r.statusText);
  return !!(await r.json()).permissions?.push;
}
function moCua() { $('#gate').hidden = true; $('.app').hidden = false; view(); }
async function cua() {
  const t = savedToken();
  if (!t) return;
  try {
    if (await coQuyen(t)) return moCua();
    $('#gateErr').textContent = 'Mã đã lưu không còn dùng được, hãy nhập mã mới.';
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
  } catch { $('#gateErr').textContent = 'Không kết nối được GitHub, kiểm tra mạng rồi tải lại trang.'; }
}
$('#gateForm').addEventListener('submit', async e => {
  e.preventDefault();
  const t = $('#gateTok').value.trim(); if (!t) return;
  $('#gateBtn').disabled = true; $('#gateErr').textContent = '';
  try {
    if (!await coQuyen(t)) { $('#gateErr').textContent = 'Mã không đúng, đã hết hạn hoặc không có quyền đăng bài.'; return; }
    try { localStorage.setItem(TOKEN_KEY, t); } catch {}
    $('#gateTok').value = ''; moCua();
  } catch { $('#gateErr').textContent = 'Không kết nối được GitHub, kiểm tra mạng rồi thử lại.'; }
  finally { $('#gateBtn').disabled = false; }
});
$('#logout').addEventListener('click', () => {
  if (dirty && !confirm('Bài đang soạn chưa đăng. Vẫn đăng xuất?')) return;
  try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(DRAFT); } catch {}
  dirty = false; location.reload();
});

/* ---------- start ---------- */
(async () => {
  cua(); drawThemes(); drawPick(); showDemo(S.demo);
  const d = readDraft();
  if (d && d.dirty && d.B) {
    if (d.sua) { S.sua = d.sua; S.goc = BASE + d.sua + '/anh/'; S.cu = usedImgs(d.B); }
    S.xuatTay = !!d.sua;
    fill(d.B); S.exs = d.exs || S.exs; S.slideName = d.slideName || ''; drawExs(); drawPick();
    dirty = true; render();
    toast('Đã mở lại bài đang soạn dở. Ảnh và slide mới nạp cần nạp lại.');
  } else {
    try { await openLesson(d?.sua || ''); } catch { try { await openLesson(''); } catch { render(); } }
  }
})();
})();
