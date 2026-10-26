// Dữ liệu bài học. Tạo và sửa bằng trang soan-bai.html (dành cho giáo viên).
window.BAI = {
  "so": 10,
  "dir": "bai10",
  "mau": "ngoc",
  "cap": "Tiếng Trung HSK 1",
  "ten": "你家有几口人？",
  "pinyin": "Nǐ jiā yǒu jǐ kǒu rén?",
  "nghia": "Nhà bạn có mấy người?",
  "gioithieu": "Học cách giới thiệu gia đình: có bao nhiêu người, mỗi người bao nhiêu tuổi và làm nghề gì. Chạm vào chữ Hán hoặc nút loa để nghe phát âm.",
  "anhbia": "s01_1.jpg",
  "slide": "bai10-slide.pptx",
  "muctieu": {
    "kienthuc": ["Từ vựng về thành viên gia đình, nghề nghiệp, tuổi.", "Lượng từ 口, 只; đại từ 谁, hậu tố 们.", "Câu hỏi với 几, 多大, 什么工作; liên từ 和."],
    "nangluc": ["Hỏi và trả lời về số người trong gia đình.", "Hỏi tuổi, hỏi nghề nghiệp của người khác.", "Giới thiệu gia đình qua một bức ảnh (5–6 câu)."],
    "phamchat": ["Yêu thương, trân trọng gia đình.", "Mạnh dạn giao tiếp, hợp tác khi luyện tập theo cặp."]
  },
  "tientrinh": {
    "tieude": "Tiến trình dạy học (dành cho giáo viên, 55 phút)",
    "buoc": [
      ["5′", "**Khởi động.** Chiếu ảnh gia đình, hỏi 这是谁？ để học sinh đoán từ."],
      ["15′", "**Từ mới.** Dạy theo 4 nhóm. Học sinh nghe phát âm, xem cách viết, sau đó bật “Ẩn nghĩa” để tự kiểm tra."],
      ["10′", "**Ngữ pháp.** Bốn mẫu câu hỏi chính: 几口人, 多大, 做什么工作, 谁. Luyện thay thế."],
      ["5′", "**Hội thoại.** Nghe mẫu, luyện theo cặp, thay bằng thông tin gia đình mình."],
      ["15′", "**Luyện tập.** Học sinh quét mã QR, làm Bài 1–5 trên điện thoại, báo điểm."],
      ["5′", "**Củng cố và giao bài.** Về nhà viết 5 câu giới thiệu gia đình kèm một bức ảnh."]
    ]
  },
  "tumoi": [
    {"w": "爸爸", "p": "bàba", "t": "danh từ", "m": "bố, ba", "g": "Gia đình", "img": "s02_1.jpg", "ex": ["我爸爸是老师。", "Wǒ bàba shì lǎoshī.", "Bố tôi là giáo viên."]},
    {"w": "妈妈", "p": "māma", "t": "danh từ", "m": "mẹ, má", "g": "Gia đình", "img": "s02_6.jpg", "ex": ["我妈妈是医生。", "Wǒ māma shì yīshēng.", "Mẹ tôi là bác sĩ."]},
    {"w": "哥哥", "p": "gēge", "t": "danh từ", "m": "anh trai", "g": "Gia đình", "img": "s04_3.jpg", "ex": ["我哥哥今年二十七岁。", "Wǒ gēge jīnnián èrshíqī suì.", "Anh trai tôi năm nay 27 tuổi."]},
    {"w": "姐姐", "p": "jiějie", "t": "danh từ", "m": "chị gái", "g": "Gia đình", "img": "s04_5.jpg", "ex": ["我姐姐是大学生。", "Wǒ jiějie shì dàxuéshēng.", "Chị gái tôi là sinh viên."]},
    {"w": "弟弟", "p": "dìdi", "t": "danh từ", "m": "em trai", "g": "Gia đình", "img": "s03_1.jpg", "ex": ["你弟弟多大了？", "Nǐ dìdi duō dà le?", "Em trai bạn bao nhiêu tuổi rồi?"]},
    {"w": "妹妹", "p": "mèimei", "t": "danh từ", "m": "em gái", "g": "Gia đình", "img": "s03_3.jpg", "ex": ["我妹妹是中学生。", "Wǒ mèimei shì zhōngxuéshēng.", "Em gái tôi là học sinh trung học."]},
    {"w": "家", "p": "jiā", "t": "danh từ", "m": "nhà, gia đình", "g": "Gia đình", "img": "s05_2.jpg", "ex": ["你家有几口人？", "Nǐ jiā yǒu jǐ kǒu rén?", "Nhà bạn có mấy người?"]},
    {"w": "人", "p": "rén", "t": "danh từ", "m": "người", "g": "Gia đình", "ex": ["我家有四口人。", "Wǒ jiā yǒu sì kǒu rén.", "Nhà tôi có bốn người."]},
    {"w": "口", "p": "kǒu", "t": "lượng từ", "m": "lượng từ đếm số người trong gia đình", "g": "Gia đình", "ex": ["我家有五口人。", "Wǒ jiā yǒu wǔ kǒu rén.", "Nhà tôi có năm người."]},
    {"w": "和", "p": "hé", "t": "liên từ", "m": "và, với", "g": "Gia đình", "ex": ["爸爸、妈妈和我", "bàba, māma hé wǒ", "bố, mẹ và tôi"]},
    {"w": "照片", "p": "zhàopiàn", "t": "danh từ", "m": "bức ảnh", "g": "Gia đình", "img": "s05_6.jpg", "ex": ["这是我家的照片。", "Zhè shì wǒ jiā de zhàopiàn.", "Đây là ảnh gia đình tôi."]},
    {"w": "工作", "p": "gōngzuò", "t": "danh từ / động từ", "m": "công việc; làm việc", "g": "Nghề nghiệp", "ex": ["你爸爸做什么工作？", "Nǐ bàba zuò shénme gōngzuò?", "Bố bạn làm nghề gì?"]},
    {"w": "老师", "p": "lǎoshī", "t": "danh từ", "m": "giáo viên, thầy cô", "g": "Nghề nghiệp", "ex": ["我爸爸是老师。", "Wǒ bàba shì lǎoshī.", "Bố tôi là giáo viên."]},
    {"w": "医生", "p": "yīshēng", "t": "danh từ", "m": "bác sĩ", "g": "Nghề nghiệp", "img": "s13_5.jpg", "ex": ["她是医生。", "Tā shì yīshēng.", "Cô ấy là bác sĩ."]},
    {"w": "律师", "p": "lǜshī", "t": "danh từ", "m": "luật sư", "g": "Nghề nghiệp", "img": "s07_1.jpg", "ex": ["我哥哥是律师。", "Wǒ gēge shì lǜshī.", "Anh trai tôi là luật sư."]},
    {"w": "大学生", "p": "dàxuéshēng", "t": "danh từ", "m": "sinh viên", "g": "Nghề nghiệp", "ex": ["我是大学生。", "Wǒ shì dàxuéshēng.", "Tôi là sinh viên."]},
    {"w": "中学生", "p": "zhōngxuéshēng", "t": "danh từ", "m": "học sinh trung học", "g": "Nghề nghiệp", "ex": ["弟弟是中学生。", "Dìdi shì zhōngxuéshēng.", "Em trai là học sinh trung học."]},
    {"w": "多", "p": "duō", "t": "phó từ", "m": "bao (nhiêu), mức độ bao nhiêu", "g": "Tuổi & năm", "ex": ["你多大？", "Nǐ duō dà?", "Bạn bao nhiêu tuổi?"]},
    {"w": "大", "p": "dà", "t": "tính từ", "m": "to, lớn; (tuổi) lớn", "g": "Tuổi & năm", "ex": ["你姐姐多大了？", "Nǐ jiějie duō dà le?", "Chị bạn bao nhiêu tuổi rồi?"]},
    {"w": "岁", "p": "suì", "t": "lượng từ", "m": "tuổi", "g": "Tuổi & năm", "ex": ["我今年二十岁。", "Wǒ jīnnián èrshí suì.", "Năm nay tôi 20 tuổi."]},
    {"w": "今年", "p": "jīnnián", "t": "danh từ", "m": "năm nay", "g": "Tuổi & năm", "img": "s09_1.jpg", "ex": ["今年我十八岁。", "Jīnnián wǒ shíbā suì.", "Năm nay tôi 18 tuổi."]},
    {"w": "明年", "p": "míngnián", "t": "danh từ", "m": "năm sau, sang năm", "g": "Tuổi & năm", "ex": ["明年我去中国。", "Míngnián wǒ qù Zhōngguó.", "Sang năm tôi đi Trung Quốc."]},
    {"w": "去年", "p": "qùnián", "t": "danh từ", "m": "năm ngoái", "g": "Tuổi & năm", "ex": ["去年他是中学生。", "Qùnián tā shì zhōngxuéshēng.", "Năm ngoái cậu ấy là học sinh trung học."]},
    {"w": "谁", "p": "shéi", "t": "đại từ", "m": "ai", "g": "Từ khác", "ex": ["他是谁？", "Tā shì shéi?", "Anh ấy là ai?"]},
    {"w": "他们", "p": "tāmen", "t": "đại từ", "m": "họ, bọn họ", "g": "Từ khác", "img": "s11_1.jpg", "ex": ["他们是我的同学。", "Tāmen shì wǒ de tóngxué.", "Họ là bạn học của tôi."]},
    {"w": "们", "p": "men", "t": "hậu tố", "m": "chỉ số nhiều (dùng cho người)", "g": "Từ khác", "ex": ["我们、你们、同学们", "wǒmen, nǐmen, tóngxuémen", "chúng tôi, các bạn, các bạn học"]},
    {"w": "可爱", "p": "kě'ài", "t": "tính từ", "m": "đáng yêu, dễ thương", "g": "Từ khác", "img": "s12_1.jpg", "ex": ["这只小狗很可爱。", "Zhè zhī xiǎo gǒu hěn kě'ài.", "Chú chó con này rất đáng yêu."]},
    {"w": "只", "p": "zhī", "t": "lượng từ", "m": "con (dùng cho động vật)", "g": "Từ khác", "ex": ["我家有一只狗。", "Wǒ jiā yǒu yì zhī gǒu.", "Nhà tôi có một con chó."]},
    {"w": "狗", "p": "gǒu", "t": "danh từ", "m": "con chó", "g": "Từ khác", "img": "s13_4.jpg", "ex": ["那只狗是谁的？", "Nà zhī gǒu shì shéi de?", "Con chó kia là của ai?"]}
  ],
  "cachviet": {
    "爸": "s02_2.gif", "妈": "s02_4.gif", "妹": "s03_2.gif", "弟": "s03_5.gif", "哥": "s04_1.gif", "姐": "s04_4.gif",
    "家": "s05_1.gif", "人": "s05_3.gif", "照": "s05_4.gif", "片": "s05_5.gif", "口": "s06_1.gif", "和": "s06_2.gif",
    "律": "s07_2.gif", "师": "s07_3.gif", "多": "s08_1.gif", "大": "s08_2.gif", "岁": "s08_3.gif", "今": "s09_2.gif",
    "年": "s09_3.gif", "谁": "s10_1.gif", "他": "s11_2.gif", "们": "s11_3.gif", "可": "s12_2.gif", "爱": "s12_3.gif",
    "只": "s12_4.gif", "医": "s13_1.gif", "生": "s13_2.gif", "狗": "s13_3.gif"
  },
  "nguphap": [
    {"zh": "几口人", "vi": "Hỏi số người trong gia đình", "pat": "你家有几口人？ → 我家有 + số + 口人。",
     "ex": [["你家有几口人？", "Nhà bạn có mấy người?"], ["我家有四口人：爸爸、妈妈、姐姐和我。", "Nhà tôi có bốn người: bố, mẹ, chị và tôi."]],
     "note": "**几** dùng để hỏi số lượng nhỏ (thường dưới 10). **口** là lượng từ riêng cho thành viên gia đình."},
    {"zh": "多大", "vi": "Hỏi tuổi", "pat": "你今年多大(了)？ → 我今年 + số + 岁。",
     "ex": [["你今年多大了？", "Năm nay bạn bao nhiêu tuổi rồi?"], ["我今年二十一岁。", "Năm nay tôi 21 tuổi."]],
     "note": "Hỏi trẻ nhỏ dùng **你几岁？** Hỏi người lớn tuổi lịch sự dùng **您多大年纪？**"},
    {"zh": "做什么工作", "vi": "Hỏi nghề nghiệp", "pat": "你(爸爸)做什么工作？ → 他是 + nghề nghiệp。",
     "ex": [["你妈妈做什么工作？", "Mẹ bạn làm nghề gì?"], ["我妈妈是英语老师。", "Mẹ tôi là giáo viên tiếng Anh."]],
     "note": "Trả lời bằng câu chữ **是**: 我是医生 / 我不是律师。"},
    {"zh": "和", "vi": "Nối các danh từ", "pat": "A 和 B · A、B 和 C",
     "ex": [["爸爸和妈妈都是老师。", "Bố và mẹ đều là giáo viên."], ["我喜欢中国菜、韩国菜和越南菜。", "Tôi thích món Trung, món Hàn và món Việt."]],
     "note": "**和** chỉ nối danh từ, đại từ. Không dùng 和 để nối hai câu."},
    {"zh": "们", "vi": "Số nhiều của người", "pat": "我们 · 你们 · 他们 · 同学们 · 老师们",
     "ex": [["同学们好！", "Chào các em!"], ["他们是我的朋友。", "Họ là bạn của tôi."]],
     "note": "Khi đã có số đếm thì **không** thêm 们: nói 三个同学, không nói 三个同学们."},
    {"zh": "都 · 又…又…", "vi": "“Đều” và “vừa… vừa…”", "pat": "A 和 B 都 + V/是… · 又 + Adj + 又 + Adj",
     "ex": [["他爸爸妈妈都是英语老师。", "Bố mẹ anh ấy đều là giáo viên tiếng Anh."], ["那只小狗又可爱又漂亮。", "Chú chó con đó vừa đáng yêu vừa xinh."]],
     "note": "**都** đứng sau chủ ngữ, trước động từ. Lượng từ cho động vật là **只**: 一只狗."}
  ],
  "hoithoai": {
    "gioithieu": "Hai bạn xem ảnh gia đình của B. Luyện theo cặp, sau đó thay bằng thông tin gia đình em.",
    "cau": [
      ["A", "这是你家的照片吗？", "Zhè shì nǐ jiā de zhàopiàn ma?", "Đây là ảnh gia đình bạn à?"],
      ["B", "是。我家有五口人。", "Shì. Wǒ jiā yǒu wǔ kǒu rén.", "Đúng rồi. Nhà mình có năm người."],
      ["A", "他是谁？", "Tā shì shéi?", "Anh này là ai?"],
      ["B", "他是我哥哥，他是律师。", "Tā shì wǒ gēge, tā shì lǜshī.", "Đó là anh trai mình, anh ấy là luật sư."],
      ["A", "你哥哥今年多大？", "Nǐ gēge jīnnián duō dà?", "Anh bạn năm nay bao nhiêu tuổi?"],
      ["B", "他今年二十七岁。", "Tā jīnnián èrshíqī suì.", "Năm nay anh ấy 27 tuổi."],
      ["A", "你爸爸妈妈做什么工作？", "Nǐ bàba māma zuò shénme gōngzuò?", "Bố mẹ bạn làm nghề gì?"],
      ["B", "我爸爸是医生，我妈妈是老师。", "Wǒ bàba shì yīshēng, wǒ māma shì lǎoshī.", "Bố mình là bác sĩ, mẹ mình là giáo viên."],
      ["A", "这只小狗真可爱！", "Zhè zhī xiǎo gǒu zhēn kě'ài!", "Chú chó con này dễ thương quá!"],
      ["B", "是我妹妹的狗。", "Shì wǒ mèimei de gǒu.", "Đó là chó của em gái mình."]
    ]
  },
  "baitap": [
    {"loai": "vitri", "tieude": "Chọn vị trí đúng cho từ trong ngoặc", "cau": [
      ["A 中午 B 你 C 想吃 D？", "什么", "D"],
      ["我家有五 A 口人。你家 B 有 C 口人 D？", "几", "C"],
      ["我喜欢吃 A 中国菜 B、韩国菜 C 越南菜 D。", "和", "C"],
      ["小明 A 不 B 知道 C 书店在 D。", "哪儿", "D"],
      ["你 A 学习 B 汉语 C 学习英语 D？", "还是", "C"],
      ["我 A 想 B 去 C 人民公园，D 走？", "怎么", "D"],
      ["我们 A 去电影院 B 看电影，然后 C 去喝茶，D？", "怎么样", "D"],
      ["今年 A 我弟弟21岁 B 了，你妹妹 C 大 D？", "多", "C"],
      ["我这里 A 有牛奶和 B 咖啡，你要 C 个 D？", "哪", "C"],
      ["A 你 B 做 C 什么 D 工作？", "想", "B"]
    ]},
    {"loai": "dien", "tieude": "Chọn từ điền vào chỗ trống", "nhom": [
      {"tu": ["什么", "哪", "哪儿", "怎么", "怎么样", "几", "多", "还是", "多少", "为什么"], "cau": [
        ["奶茶____钱一杯？", ["多少"]], ["你是____国人？", ["哪"]], ["你喜欢看韩国电影____中国电影？", ["还是"]],
        ["你姐姐做____工作？", ["什么"]], ["这只狗是____的？", ["哪儿"]], ["中国银行在____？", ["哪儿"]],
        ["你____喜欢看美国电影？", ["为什么"]], ["他家有____口人？", ["几"]], ["我不知道他去____。", ["哪儿"]],
        ["你要____杯咖啡？", ["几", "多少"]], ["他弟弟今年____大？", ["多"]], ["他们____去学校？", ["怎么"]]
      ]},
      {"tu": ["了", "吗", "呢", "吧"], "cau": [
        ["A：这是我们家的全家福。这是我爸爸，这是我妈妈。\nB：你妹妹____？\nA：她在我妈妈左边。", ["呢"]],
        ["这儿有麻婆豆腐____？", ["吗"]], ["我叫高小明，他叫欧文。你____？", ["呢"]],
        ["我喜欢喝奶茶，我们去喝奶茶____。", ["吧"]], ["人民博物馆到____吗？", ["了"]],
        ["他是你的医生____？", ["吗", "吧"]], ["A：那儿的菜又好吃又便宜。\nB：那好____，我们去那儿吃。", ["吧"]],
        ["我吃饭____。", ["了"]]
      ]}
    ]},
    {"loai": "sapxep", "tieude": "Sắp xếp thành câu hoàn chỉnh", "cau": [
      [["你", "做", "爸爸", "什么", "工作"], ["你爸爸做什么工作？"]],
      [["弟弟", "的", "大", "你", "了", "多", "今年"], ["你的弟弟今年多大了？"]],
      [["你们", "哪儿", "吃", "在", "韩国菜"], ["你们在哪儿吃韩国菜？"]],
      [["这", "他", "照片", "的", "家人", "是", "和", "他"], ["这是他和他家人的照片。"]],
      [["那", "又", "只", "小狗", "可爱", "又", "漂亮"], ["那只小狗又可爱又漂亮。", "那只小狗又漂亮又可爱。"]],
      [["我爸爸", "医生", "不是", "律师", "是", "他"], ["我爸爸是律师，他不是医生。", "我爸爸不是医生，他是律师。"]],
      [["是", "我", "男朋友", "他", "的", "姐姐"], ["他是我姐姐的男朋友。"]],
      [["中学生", "十五", "今年", "我", "妹妹", "岁", "是"], ["我妹妹今年十五岁，是中学生。"]],
      [["他", "电影", "喜欢", "还是", "美国", "韩国", "看"], ["他喜欢看美国还是韩国电影？", "他喜欢看韩国还是美国电影？"]],
      [["爸爸", "他", "妈妈", "是", "英语", "都", "老师"], ["他爸爸妈妈都是英语老师。", "他妈妈爸爸都是英语老师。"]]
    ]},
    {"loai": "tuluan", "tieude": "Đọc và trả lời câu hỏi", "doan": [
      {"van": "我家有四口人，爸爸、妈妈、姐姐和我。我妈妈和我姐姐都是老师，爸爸是律师，我是学生。",
       "hoi": [["★ “我姐姐”做什么工作？", "她是老师。"]]},
      {"van": "我在中国有两个朋友，一个是男的、一个是女的。男的叫高小明，是中国人，他学习英语。女的叫卡玛拉，是南非人。她不是学生，她是律师。",
       "hoi": [["a. “我”有几个中国朋友？", "我有一个中国朋友（高小明）。"], ["b. “我”的朋友都是学生吗？", "不是。卡玛拉不是学生，她是律师。"]]},
      {"van": "我是大学生，今年二十岁。我在大学学习汉语。我家有四口人：爸爸、妈妈、妹妹和我。我爸爸是汉语老师、我妈妈是医生、我妹妹是小学生。",
       "hoi": [["★ “我”做什么工作？", "我是大学生。"]]}
    ]},
    {"loai": "tracnghiem", "tieude": "Đọc và chọn đáp án đúng",
     "doan": "我家有四口人：我爸爸、妈妈、哥哥和我。我今年二十一岁，是大学生。我在河内大学学习汉语。我很喜欢看美国电影和韩国电影。我爸爸是医生，他很忙。我妈妈是英语老师，她在高中教英语，她很漂亮。我哥哥今年二十七岁，他在一家中国公司工作。星期天我家常去饭店吃饭，然后去公园玩。我们都很开心。",
     "cau": [
      ["“我”家有几口人？", ["三", "六", "四", "五"], 2],
      ["“我”的哥哥今年多大？", ["二十一岁", "二十七岁", "三十岁", "二十九岁"], 1],
      ["“我”爸爸做什么工作？", ["律师", "老师", "大学生", "医生"], 3],
      ["我哥哥在哪儿工作？", ["苹果公司", "中国公司", "越南公司", "美国公司"], 1],
      ["我在河内大学学习什么？", ["汉语", "法语", "英语", "越南语"], 0]
    ]}
  ]
};
