export const checkedDate = "2026-11-21";
const lawUrl = "https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=B0000001&flno=429";
const judgmentUrl = "https://judgment.judicial.gov.tw/FJUD/data.aspx?ty=JD&id=TPEV,112%2C%E5%8C%97%E5%B0%8F%2C4745%2C20240109%2C1";
const judgmentName = "臺北簡易庭 112 年度北小字第 4745 號民事判決";

export const statusLabels = {
  source: {
    S01: "已找到回答引用的來源",
    S02: "這次查詢沒有找到來源",
    S03: "法律資料服務不提供這類資料",
    S04: "查詢失敗，請稍後再試",
    S05: "還不能確認引用的是哪份來源",
  },
  text: {
    T01: "與來源原文相同",
    T02: "調整空格、換行和符號格式後相同",
    T03: "統一「臺／台」等寫法後相同",
    T04: "與來源原文不同",
    T05: "在已取得的完整內容中找不到這段話",
    T06: "只取得部分內容，還不能判定",
    T07: "還不能確認要和來源的哪一段比較",
    T08: "這是摘要，不能逐字比對",
    T09: "尚未比對",
  },
  completeness: {
    C01: "已取得這次要核對的完整內容",
    C02: "只取得這次要核對的部分內容",
    C03: "沒有取得內容，或無法確認是否完整",
  },
  review: {
    U01: "未檢查摘要是否正確，也未判斷法院是否採納",
    U02: "未判斷是否適用你的情況，或法律推論是否正確",
    U03: "未檢查事情發生時適用的法律版本",
    U04: "未確認法規何時生效",
  },
};

// shortcut: 固定情境只展示介面，不執行擷取、來源檢索或比對；即時版須接入後端並重新驗證。
export const citations = [
  {
    id: "repair", number: "01", kind: "法條引用", title: "租賃物的修繕責任",
    extraction: "系統找到", extractionDetail: "法規名稱、條號和引號內的文字都很清楚",
    source: "民法第 429 條第 1 項",
    quote: "租賃物之修繕，除契約另有訂定或另有習慣外，由出租人負擔。",
    context: "關於修繕責任，民法第 429 條第 1 項規定：",
    sourceCode: "S01",
    textCode: "T01", tone: "match",
    completeness: "C01", scope: "民法第 429 條第 1 項完整條文",
    original: "租賃物之修繕，除契約另有訂定或另有習慣外，由出租人負擔。",
    url: lawUrl, linkLabel: "查看全國法規資料庫原文",
    evidence: "事先核對的官方條文", location: "民法第 429 條第 1 項",
    limits: ["U02", "U03", "U04"],
  },
  {
    id: "missing", number: "02", kind: "法條引用", title: "沒有找到這條法規",
    extraction: "系統找到", extractionDetail: "法規名稱、條號和引號內的文字都很清楚",
    source: "民法第 429-99 條",
    quote: "出租人應於退租當日返還全部押金。",
    context: "示範文件另引用「民法第 429-99 條」：",
    sourceCode: "S02",
    textCode: "T09", tone: "unknown", simulated: true,
    completeness: "C03", scope: "未取得這條法規內容",
    original: null,
    explanation: "這次沒有找到回答引用的法規，因此無法逐字比對。這不代表法條不存在或內容虛構。",
    url: null, linkLabel: null,
    evidence: "模擬查詢結果：未找到來源", location: "沒有找到這條法規的位置",
    limits: ["U02", "U03"],
  },
  {
    id: "number", number: "03", kind: "判決引用", title: "引用中的數字不同",
    extraction: "系統找到，AI 協助確認來源", extractionDetail: "系統找到完整案號，AI 協助確認引用文字對應的判決",
    source: judgmentName,
    quote: "從而，原告得請求被告返還之金額為81,200元",
    context: "臺北簡易庭 112 年度北小字第 4745 號判決記載：",
    sourceCode: "S01",
    textCode: "T04", tone: "difference",
    completeness: "C02", scope: "判決「事實及理由」第 4 大段第 4 小點的相關內容（原文：四㈣）",
    original: "從而，原告得請求被告返還之金額為61,200元",
    diff: { before: "從而，原告得請求被告返還之金額為", removed: "81,200", added: "61,200", after: "元" },
    url: judgmentUrl, linkLabel: "查看司法院判決原文",
    evidence: "事先核對的官方原文，由人工選定比較段落", location: "判決「事實及理由」第 4 大段第 4 小點，計算式前（原文：四㈣）",
    limits: ["U01", "U02"],
  },
  {
    id: "mismatch", number: "04", kind: "判決引用", title: "來源中找不到這段話",
    extraction: "AI 協助確認來源", extractionDetail: "「同一份判決」要連回前文提到的判決",
    source: judgmentName,
    quote: "租賃終止後，出租人不得扣除任何費用，應無條件返還全部押金。",
    context: "同一份示範文字也將下列句子標示為該判決原話：",
    sourceCode: "S01",
    textCode: "T05", tone: "difference", simulated: true,
    completeness: "C01", scope: "模擬：已取得這份判決要核對的完整內容",
    original: null,
    explanation: "已取得這次要核對的完整內容，但逐字搜尋沒有這段引用。結果只限於這次取得的內容，不代表其他版本或其他來源也沒有。",
    url: judgmentUrl, linkLabel: "查看司法院判決原文",
    evidence: "官方來源連結與模擬比對結果", location: "沒有找到這段引用在來源中的位置",
    limits: ["U01", "U02"],
  },
  {
    id: "summary", number: "05", kind: "判決摘要", title: "摘要不是來源原文",
    extraction: "AI 協助找到", extractionDetail: "這段是摘要，沒有用引號標示為來源原文",
    source: judgmentName,
    quote: null,
    summary: "房屋自然耗損與承租人應負責的損害，需要分開檢視。",
    context: "最後，示範文件依同一份判決整理出一段摘要：",
    sourceCode: "S01",
    textCode: "T08", tone: "neutral",
    completeness: "C02", scope: "判決「事實及理由」第 4 大段第 3 小點的相關內容（原文：四㈢）",
    original: "租賃契約終止時返還租賃物，亦僅合於約定之使用收益狀態即足，不包括回復因自然耗損造成之損害。",
    explanation: "已找到判決，但這段是摘要，不是來源原文，因此不能逐字比對。系統也沒有判斷摘要是否正確表達法院意見。",
    url: judgmentUrl, linkLabel: "查看司法院判決原文",
    evidence: "事先核對的官方原文片段，摘要為自製", location: "判決「事實及理由」第 4 大段第 3 小點（原文：四㈢）",
    limits: ["U01", "U02"],
  },
];

export const answerParagraphs = [
  [
    { text: "依你描述的情況，房東能否從押金中扣除費用，要看租約約定、費用性質，以及房屋損壞是否超出正常使用造成的自然耗損。以下提供一般性資訊。" },
  ],
  [
    { text: "首先，關於修繕責任，" },
    { citationId: "repair", text: "民法第 429 條第 1 項規定：「租賃物之修繕，除契約另有訂定或另有習慣外，由出租人負擔。」" },
    { text: "因此，一般修繕原則上由出租人負責，但租約另有約定或損壞可歸責於承租人時，仍需依具體情況判斷。" },
  ],
  [
    { text: "另外，" },
    { citationId: "missing", text: "民法第 429-99 條規定：「出租人應於退租當日返還全部押金。」" },
    { text: "如果房東沒有提出扣款明細，承租人可以請求返還押金。" },
  ],
  [
    { text: "法院實務也會檢查各項扣款是否有依據。" },
    { citationId: "number", text: "臺北簡易庭 112 年度北小字第 4745 號判決記載：「從而，原告得請求被告返還之金額為81,200元」。" },
    { text: "這表示法院會逐項計算合理扣款後的餘額。" },
  ],
  [
    { text: "同一份判決也指出：" },
    { citationId: "mismatch", text: "「租賃終止後，出租人不得扣除任何費用，應無條件返還全部押金。」" },
    { text: "因此，房東不能只以籠統理由拒絕返還。" },
  ],
  [
    { text: "整體而言，" },
    { citationId: "summary", text: "房屋自然耗損與承租人應負責的損害，需要分開檢視。" },
    { text: "你可以先要求房東提供租約依據、照片、估價單或收據；如仍有爭議，再攜帶完整租約與點交紀錄向法律專業人士確認。" },
  ],
];

export const answerText = answerParagraphs
  .map((paragraph) => paragraph.map((segment) => segment.text).join(""))
  .join("\n\n");
