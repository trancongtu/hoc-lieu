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
    a: 'Slide .pptx', b: 'Ảnh được tách ra ở mục 9',
    paper: `<div class="slides"><div class="slide"><i>ảnh</i><i class="gif">爸</i><span>trang 2</span></div><div class="slide"><i>ảnh</i><i>ảnh</i><span>trang 3</span></div></div>`,
    web: `<div class="mk-gal"><span class="on"><i></i>s02_1.jpg</span><span><i class="gif">爸</i>s02_2.gif</span><span><i></i>s03_1.jpg</span><span><i></i>s03_2.jpg</span></div>
      <div class="mk-mute">Trên mục lục có nút</div><span class="mk-btn o">Thuyết trình</span>`,
    tips: ['<b>.pptx</b>: mọi ảnh trong slide được tách ra và đặt tên theo trang: <b>s02_1.jpg</b> là trang 2, ảnh thứ 1. Ảnh động .gif (thứ tự nét) dùng ở mục Cách viết.',
      '<b>.pdf</b> (giáo trình, slide đã xuất ra PDF): tự lấy số bài, tên bài, pinyin và các dòng từ vựng dạng <b>píngguǒ (n) táo</b>; trang đầu làm ảnh bìa. Chữ nằm trong ảnh thì không đọc được, cần điền tay.',
      'Slide được lưu kèm bài, học sinh mở bằng nút <b>Thuyết trình</b> ở trang mục lục.']},
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
const S = {mau: 'ngoc', exs: [], slideFile: null, slideName: '', goc: '', cu: new Set(), sua: '', demo: 'baitap', luu: false, pv: 'giaotrinh'};
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
    so, dir, mau: S.mau, xuat: xuat(), cap: val('cap'), ten: val('ten'), pinyin: val('pinyin'), nghia: val('nghia'),
    gioithieu: val('gioithieu'), anhbia: $('#anhbia').value,
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
  set('nguphap', (B.nguphap || []).map(g => J([g.zh, g.vi, g.pat, (g.ex || []).map(([z, v]) => v ? `${z} = ${v}` : z).join('; '), g.note])).join('\n'));
  set('ht-gioithieu', B.hoithoai?.gioithieu); set('hoithoai', (B.hoithoai?.cau || []).map(c => J(c)).join('\n'));
  S.mau = B.mau || 'ngoc'; setXuat(B.xuat || 'full');
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
const GOI = {giaotrinh: 'Giáo trình: file PDF bài giảng (hoặc .pptx để lấy ảnh).', baitap: 'Bài tập: file Word phiếu bài tập.',
  full: 'File PDF giáo trình và file Word bài tập, kéo cùng lúc được.', rieng: 'File PDF giáo trình và file Word bài tập, kéo cùng lúc được.'};
const xuat = () => $('input[name="xuat"]:checked')?.value || 'full';
function setXuat(v) {
  $$('input[name="xuat"]').forEach(r => r.checked = r.value === v);
  document.body.dataset.loai = v; $('#napGoi').textContent = GOI[v];
}
$('#xuat').addEventListener('change', () => { setXuat(xuat()); changed(); });
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
  const has = [B.tumoi.length && `${B.tumoi.length} từ`, B.nguphap.length && `${B.nguphap.length} ngữ pháp`, B.hoithoai.cau.length && 'hội thoại', S.exs.length && `${S.exs.length} bài tập`].filter(Boolean);
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
/* Mỗi file nạp vào có một thẻ kết quả: nhận ra được gì, còn thiếu gì, bấm để tới đúng mục. */
const TAG = {docx: ['w', 'Word'], pptx: ['p', 'PPT'], pdf: ['d', 'PDF']};
function logFile(name, items) {
  const [c, t] = TAG[name.split('.').pop().toLowerCase()] || ['i', 'Ảnh'];
  $('#log').insertAdjacentHTML('beforeend', `<div class="res"><div class="rh"><span class="tag ${c}">${t}</span><b>${esc(name)}</b></div>
    <ul>${items.map(x => `<li class="${x.cls || ''}">${x.go ? `<a data-go="${x.go}" tabindex="0">${esc(x.t)}</a>` : esc(x.t)}</li>`).join('')}</ul></div>`);
}
$('#log').addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (a) go(a.dataset.go); });
$('#log').addEventListener('keydown', e => { const a = e.target.closest('[data-go]'); if (a && e.key === 'Enter') go(a.dataset.go); });

async function nap(files) {
  $('#log').innerHTML = '';
  const imgs = [];
  for (const f of files) {
    const ext = f.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'docx') { await napWord(f); NGUON.set(f.name.replace(/\s+/g, '-'), f); showDemo(S.exs.length && !$('#tumoi').value.trim() ? 'baitap' : 'giaoan'); }
      else if (ext === 'pptx') { await napSlide(f); showDemo('slide'); }
      else if (ext === 'pdf') { await napPdf(f); showDemo('slide'); }
      else if (MIME[ext]) imgs.push(await addImage(f.name, f));
      else logFile(f.name, [{t: 'Bỏ qua: chỉ nhận .docx, .pptx, .pdf hoặc ảnh.', cls: 'err'}]);
    } catch (e) { logFile(f.name, [{t: `Không đọc được file: ${e.message || e}`, cls: 'err'}]); }
  }
  if (imgs.length) {
    logFile(imgs.length > 1 ? `${imgs.length} ảnh` : imgs[0], [{t: `Đã thêm vào mục 9: ${imgs.join(', ')}`, go: 'box-anh'},
      {t: 'Bấm ảnh để chép tên, rồi dán vào cột “Ảnh” của từ mới.'}]);
    showDemo('anh');
  }
  drawGallery(); render();
}
/* PDF giáo trình (slide xuất ra PDF): trang đầu có 第N课, tên bài chữ Hán và pinyin; trang từ vựng có dòng
   "píngguǒ (n) táo" hoặc "多少（pro）bao nhiêu?". Chỉ đọc được chữ có sẵn trong PDF; chữ nằm trong ảnh thì không. */
const TU_LOAI = {n: 'danh từ', v: 'động từ', adj: 'tính từ', adv: 'phó từ', pro: 'đại từ', pron: 'đại từ', lt: 'lượng từ', m: 'lượng từ', mw: 'lượng từ',
  num: 'số từ', prep: 'giới từ', conj: 'liên từ', part: 'trợ từ', 名: 'danh từ', 动: 'động từ', 形: 'tính từ', 副: 'phó từ', 代: 'đại từ',
  量: 'lượng từ', 数: 'số từ', 介: 'giới từ', 连: 'liên từ', 助: 'trợ từ'};
const PY_DAU = /[āēīōūǎěǐǒǔǖǘǚǜ]/i;
const PY_TU = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü']+( [a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü']+){0,3}$/i;
const HAN = /^[㐀-鿿]+$/;
const TU_DONG = /^(.{1,24}?)\s*[（(]\s*([^()（）]{1,10}?)\s*[)）]\s*[=:：]?\s*(.+)$/;
function docGiaoTrinh(pages, tenFile) {
  const p1 = pages[0] || [], g = {so: 0, ten: '', pinyin: '', tumoi: []};
  const so = p1.join(' ').match(/第\s*(\d+)\s*课/) || tenFile.match(/b[àa]i\s*(\d+)/i);
  if (so) g.so = +so[1];
  g.ten = p1.find(l => !/第\s*\d+\s*课|汇报人|报告人|[:：]/.test(l) && (l.match(/[㐀-鿿]/g) || []).length >= 2) || '';
  g.pinyin = p1.find(l => PY_DAU.test(l) && !CJK.test(l) && !/[:：]/.test(l)) || '';
  const seen = new Set();
  pages.flat().forEach(l => {
    const m = l.match(TU_DONG); if (!m) return;
    const dau = m[1].trim(), pos = m[2].trim().toLowerCase();
    const tl = TU_LOAI[pos] || (/từ$/.test(pos) ? pos : '');
    const nghia = m[3].replace(/[\s,，;；]+$/, '').trim();
    if (!tl || !nghia || CJK.test(nghia)) return;
    let w = '', p = '';
    if (HAN.test(dau)) w = dau;
    else if (PY_TU.test(dau)) p = dau[0].toLowerCase() + dau.slice(1);
    else return;
    const k = (w || p) + '|' + nghia;
    if (!seen.has(k)) { seen.add(k); g.tumoi.push(J([w, p, tl, nghia])); }
  });
  return g;
}
async function napPdf(file) {
  if (!window.pdfjsLib) {
    await loadScript('khung/lib/pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'khung/lib/pdf.worker.min.js';
  }
  const pdf = await pdfjsLib.getDocument({data: await file.arrayBuffer()}).promise;
  // Ghép các mảnh chữ cùng độ cao thành dòng theo khoảng cách thật giữa chúng: sát nhau thì liền chữ,
  // cách cỡ một dấu cách thì thêm dấu cách, cách xa (hai cột trên cùng hàng) thì tách thành hai dòng.
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const rows = [];
    for (const it of (await (await pdf.getPage(i)).getTextContent()).items) {
      if (!it.str.trim()) continue;
      const y = it.transform[5], fs = Math.hypot(it.transform[2], it.transform[3]) || 10;
      let r = rows.find(r => Math.abs(r.y - y) < fs * 0.4);
      if (!r) rows.push(r = {y, parts: []});
      r.parts.push({x: it.transform[4], w: it.width, fs, s: it.str});
    }
    const lines = [];
    rows.sort((a, b) => b.y - a.y).forEach(r => {
      let cur = '', end = null;
      r.parts.sort((a, b) => a.x - b.x).forEach(p => {
        const gap = end == null ? 0 : p.x - end;
        if (end != null && gap > p.fs * 1.5) { lines.push(cur); cur = ''; }
        else if (end != null && gap > p.fs * 0.2) cur += ' ';
        cur += p.s; end = p.x + p.w;
      });
      lines.push(cur);
    });
    pages.push(lines.map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean));
  }
  S.slideFile = file;
  const g = docGiaoTrinh(pages, file.name), got = [];
  const dien = (id, v) => { if (v && !val(id)) { $('#' + id).value = v; return true; } };
  if (g.so && !S.sua) { $('#so').value = g.so; $('#dir').value = 'bai' + g.so; }
  const tt = [g.so && !S.sua && `Bài ${g.so}`, dien('ten', g.ten) && g.ten, dien('pinyin', g.pinyin) && g.pinyin].filter(Boolean);
  if (tt.length) got.push({t: 'Thông tin bài: ' + tt.join(' · '), go: 'box-info'});
  else if (!pages.flat().length) got.push({t: 'PDF này toàn ảnh, không có chữ để đọc. Hãy điền thông tin bài bằng tay.', cls: 'warn', go: 'box-info'});
  if (!g.ten && pages.flat().length) got.push({t: 'Không thấy tên bài chữ Hán ở trang đầu, hãy điền tay.', cls: 'warn', go: 'box-info'});
  if (g.tumoi.length && !val('tumoi')) {
    $('#tumoi').value = g.tumoi.join('\n');
    const thieu = g.tumoi.filter(r => r.startsWith(' |') || r.startsWith('|')).length;
    got.push({t: `Từ mới: ${g.tumoi.length} từ (pinyin, từ loại, nghĩa)`, go: 'box-tumoi'});
    if (thieu) got.push({t: `${thieu} từ có chữ Hán nằm trong ảnh nên chưa đọc được, cần điền cột chữ Hán.`, cls: 'warn', go: 'box-tumoi'});
  } else if (g.tumoi.length) got.push({t: `Tìm được ${g.tumoi.length} từ nhưng mục Từ mới đã có sẵn nên không ghi đè.`, cls: 'warn', go: 'box-tumoi'});
  // Trang đầu làm ảnh bìa nếu bài chưa có.
  if (!$('#anhbia').value) {
    const pg = await pdf.getPage(1), vp = pg.getViewport({scale: 1200 / pg.getViewport({scale: 1}).width});
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
    await pg.render({canvasContext: c.getContext('2d'), viewport: vp}).promise;
    const n = await addImage('bia.jpg', await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85)));
    $('#anhbia').dataset.want = n;
    got.push({t: 'Trang đầu được dùng làm ảnh bìa (đổi được ở mục 3).', go: 'box-info'});
  }
  got.push({t: 'Dùng làm bài thuyết trình của bài.', go: 'box-info'});
  logFile(file.name, got);
  changed();
}
async function napSlide(file) {
  const zip = await JSZip.loadAsync(file);
  const num = n => +n.match(/(\d+)\.xml/)[1];
  const slides = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b));
  let count = 0, gif = 0;
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
      k++; count++; gif += ext === 'gif';
      await addImage(`s${String(n).padStart(2, '0')}_${k}.${ext}`, new Blob([await f.async('uint8array')], {type: MIME[ext]}));
    }
  }
  S.slideFile = file;
  logFile(file.name, [{t: `${slides.length} trang, tách được ${count} ảnh${gif ? ` (${gif} ảnh động .gif, thường là thứ tự nét)` : ''}.`, go: 'box-anh', cls: count ? '' : 'warn'},
    {t: 'Dùng làm bài thuyết trình (nút “Thuyết trình” trên mục lục).', go: 'box-info'}]);
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
    S.exs = exs.map(x => { const loai = guessLoai(x.tieude); return {loai, tieude: x.tieude, text: tuDo(loai, x.lines)}; });
    drawExs();
    S.exs.forEach((x, i) => {
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
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => nap([...e.dataTransfer.files]));

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
  IMG.forEach(v => URL.revokeObjectURL(v.url)); IMG.clear(); NGUON.clear();
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
    fill(d.B); S.exs = d.exs || S.exs; S.slideName = d.slideName || ''; drawExs(); drawPick();
    dirty = true; render();
    toast('Đã mở lại bài đang soạn dở. Ảnh và slide mới nạp cần nạp lại.');
  } else {
    try { await openLesson(d?.sua || ''); } catch { try { await openLesson(''); } catch { render(); } }
  }
})();
})();
