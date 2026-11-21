import { answerParagraphs, answerText, citations, checkedDate, statusLabels } from "./data.js";

const $ = (selector) => document.querySelector(selector);
const content = $("#stage-content");
const title = $("#stage-title");
const next = $("#next");
const back = $("#back");
const answerInput = $("#preset-answer");
const inputView = $("#answer-input-view");
const annotatedAnswer = $("#annotated-answer");
let step = 1;
let furthest = 1;
let selected = citations[0].id;
let timers = [];
let busy = false;
let animationType = null;
let extractionPlayed = false;
let verificationPlayed = false;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function paragraph(text, className) {
  return element("p", className, text);
}

function buildAnnotatedAnswer() {
  const fragment = document.createDocumentFragment();
  for (const segments of answerParagraphs) {
    const block = element("p", "answer-paragraph");
    for (const segment of segments) {
      if (!segment.citationId) {
        block.append(document.createTextNode(segment.text));
        continue;
      }
      const citation = citations.find((item) => item.id === segment.citationId);
      const button = element("button", "citation-mark");
      button.type = "button";
      button.dataset.citation = citation.id;
      button.setAttribute("aria-controls", "stage-content");
      button.setAttribute("aria-pressed", "false");
      button.append(element("span", "citation-index", citation.number), document.createTextNode(segment.text));
      button.addEventListener("click", () => selectCitation(citation.id));
      block.append(button);
    }
    fragment.append(block);
  }
  annotatedAnswer.replaceChildren(fragment);
}

function selectCitation(id) {
  selected = id;
  render();
  if (window.matchMedia("(max-width: 760px)").matches) title.scrollIntoView({ block: "start" });
}

function createTabs() {
  const tabs = element("div", "citation-tabs");
  tabs.setAttribute("role", "group");
  tabs.setAttribute("aria-label", "選擇引用");
  for (const citation of citations) {
    const button = element("button", citation.id === selected ? "active" : "", citation.number);
    button.type = "button";
    button.setAttribute("aria-label", `引用 ${citation.number}：${citation.title}`);
    button.setAttribute("aria-pressed", String(citation.id === selected));
    button.addEventListener("click", () => {
      selectCitation(citation.id);
      content.querySelector(`[aria-label="引用 ${citation.number}：${citation.title}"]`).focus();
    });
    tabs.append(button);
  }
  return tabs;
}

function renderIntro() {
  const intro = element("div", "intro");
  intro.append(element("h3", "", "準備核對這段回覆"));
  intro.append(paragraph("系統會找出法條、判決和引用的原文，再逐筆查找來源並核對文字。"));
  const list = element("ol", "intro-list");
  for (const [heading, detail] of [
    ["找出引用", "找出法條、判決和被標示為原文的句子。"],
    ["確認引用來源", "確認每段內容引用哪一份資料。"],
    ["核對來源原文", "查看來源是否找到，以及文字是否相同。"],
  ]) {
    const item = element("li");
    item.append(element("strong", "", heading), paragraph(detail));
    list.append(item);
  }
  intro.append(list);
  const note = element("div", "boundary-note");
  note.append(element("strong", "", "核對範圍"), paragraph("只核對引用與來源文字，不判斷整份回答或法律結論是否正確。"));
  intro.append(note);
  content.append(intro);
}

function renderConfirmation(citation) {
  content.append(createTabs(), element("h3", "", citation.title));
  const origin = element("div", "candidate-origin");
  origin.append(element("span", "origin-badge", citation.extraction), paragraph(citation.extractionDetail));
  content.append(origin);
  const fields = element("dl", "confirmation-fields");
  for (const [label, value] of [
    ["回答引用的來源", citation.source],
    ["回答中的文字", citation.quote ? `「${citation.quote}」` : citation.summary],
    ["引用方式", citation.quote ? "以引號標示為來源原文" : "摘要或改寫，不是來源原文"],
    ["在 AI 回覆中的位置", `第 ${Number(citation.number)} 筆引用`],
  ]) {
    fields.append(element("dt", "", label), element("dd", "", value));
  }
  content.append(fields);
  const note = element("div", "boundary-note");
  note.append(element("strong", "", "確認後開始核對"), paragraph("確認引用與來源無誤後，再查找來源並核對文字。"));
  content.append(note);
}

function renderEvidence(citation) {
  content.append(createTabs());
  const textResult = statusLabels.text[citation.textCode];
  const sourceResult = statusLabels.source[citation.sourceCode];
  const completenessResult = statusLabels.completeness[citation.completeness];
  const announcement = paragraph(`引用 ${citation.number}：${textResult}`, "sr-only");
  announcement.setAttribute("role", "status");
  content.append(announcement);

  const textSection = element("section", "evidence-section text-result-section");
  textSection.dataset.section = "text";
  textSection.append(element("h4", "section-label", "文字核對結果"));
  const result = element("div", `result-heading ${citation.tone}`);
  const symbol = element("span", "result-symbol", citation.textCode === "T01" ? "✓" : citation.textCode === "T04" || citation.textCode === "T05" ? "!" : "—");
  symbol.setAttribute("aria-hidden", "true");
  result.append(symbol);
  const heading = element("div", "result-copy");
  heading.append(element("h3", "", textResult));
  result.append(heading);
  if (citation.simulated) result.append(element("span", "simulation-badge", "模擬案例"));
  textSection.append(result);
  if (citation.explanation) textSection.append(paragraph(citation.explanation, "explanation"));

  if (citation.original) {
    const compare = element("section", "comparison");
    compare.append(element("h4", "", citation.diff ? "AI 回覆與來源原文" : citation.textCode === "T08" ? "來源中的相關原文" : "來源原文"));
    if (citation.diff) {
      compare.append(paragraph("AI 回覆寫的是　／　來源原文是", "diff-legend"));
      const line = paragraph(citation.diff.before, "source-quote");
      const del = element("del", "", citation.diff.removed);
      const ins = element("ins", "", citation.diff.added);
      del.setAttribute("aria-label", `AI 回覆文字 ${citation.diff.removed}`);
      ins.setAttribute("aria-label", `來源原文 ${citation.diff.added}`);
      line.append(del, document.createTextNode(" "), ins, document.createTextNode(citation.diff.after));
      compare.append(line, paragraph("由人工選定要核對的來源段落", "muted"));
    } else {
      compare.append(paragraph(citation.original, "source-quote"));
    }
    textSection.append(compare);
  }
  content.append(textSection);

  const sourceSection = element("section", "evidence-section");
  sourceSection.dataset.section = "source";
  sourceSection.append(element("h4", "section-label", "引用的來源"));
  const sourceMetadata = element("dl", "evidence-metadata");
  for (const [label, value] of [
    ["查詢結果", sourceResult],
    ["回答引用的來源", citation.source],
    ["用來核對的資料", citation.evidence],
    ["資料日期", checkedDate],
  ]) {
    sourceMetadata.append(element("dt", "", label), element("dd", "", value));
  }
  sourceSection.append(sourceMetadata);
  if (citation.url) {
    const link = element("a", "source-link", `${citation.linkLabel} ↗`);
    link.href = citation.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    sourceSection.append(link);
  } else {
    sourceSection.append(paragraph("沒有取得來源連結。", "muted"));
  }
  content.append(sourceSection);

  const scopeSection = element("section", "evidence-section");
  scopeSection.dataset.section = "scope";
  scopeSection.append(element("h4", "section-label", "這次查到的內容"));
  const scopeMetadata = element("dl", "evidence-metadata");
  for (const [label, value] of [
    ["取得情況", completenessResult],
    ["這次取得的內容", citation.scope],
    ["在來源中的位置", citation.location],
  ]) {
    scopeMetadata.append(element("dt", "", label), element("dd", "", value));
  }
  scopeSection.append(scopeMetadata);
  content.append(scopeSection);

  const reviewSection = element("section", "evidence-section review-section");
  reviewSection.dataset.section = "review";
  const limits = element("details", "limits");
  limits.open = true;
  limits.append(element("summary", "", "這次沒有檢查"));
  const list = element("ul");
  for (const limit of citation.limits) list.append(element("li", "", statusLabels.review[limit]));
  limits.append(list);
  reviewSection.append(limits);
  content.append(reviewSection);
}

function render() {
  const citation = citations.find((item) => item.id === selected);
  for (const button of document.querySelectorAll("[data-citation]")) {
    const active = step > 1 && button.dataset.citation === selected;
    button.classList.toggle("selected", active);
    button.disabled = step === 1 || busy;
    button.setAttribute("aria-pressed", String(active));
  }
  for (const button of document.querySelectorAll("[data-step]")) {
    const number = Number(button.dataset.step);
    button.disabled = number > furthest || busy;
    button.classList.toggle("complete", number < step);
    if (number === step) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  }
  content.replaceChildren();
  if (step === 1) renderIntro();
  else if (step === 2) renderConfirmation(citation);
  else renderEvidence(citation);
  inputView.hidden = step !== 1;
  annotatedAnswer.hidden = step === 1;
  $("#document-mode").textContent = step === 1 ? "唯讀" : "完整回覆・已標出引用";
  title.textContent = ["準備核對", "確認找到的引用", "核對結果"][step - 1];
  $("#stage-meta").textContent = step === 1 ? "尚未開始" : step === 2 ? "5 筆引用" : "5 筆結果";
  $("#action-hint").textContent = [
    "確認核對範圍後開始。",
    "確認引用與來源後，開始核對來源與文字。",
    "點擊 AI 回覆中標出的引用或上方編號，查看其他結果。",
  ][step - 1];
  back.hidden = step === 1;
  back.disabled = busy;
  next.hidden = step === 3;
  next.disabled = busy;
  next.textContent = step === 1 ? "開始核對 →" : "確認引用並核對來源 →";
}

function goTo(number) {
  step = number;
  furthest = Math.max(furthest, step);
  render();
  title.focus({ preventScroll: true });
  if (window.matchMedia("(max-width: 760px)").matches) title.scrollIntoView({ block: "start" });
}

function clearTimers() {
  for (const timer of timers) window.clearTimeout(timer);
  timers = [];
}

function renderProcess(type, activeIndex) {
  const stages = type === "extraction"
    ? [
        ["找出引用", "找出法規、條號、判決案號和引用文字"],
        ["確認引用來源", "確認每段引用對應哪一份來源"],
      ]
    : [
        ["查找法律來源", "查找引用的法規或判決並取得原文"],
        ["核對文字", "比較 AI 回覆與來源原文，標出相同與不同之處"],
      ];
  content.replaceChildren();
  content.setAttribute("aria-busy", "true");
  const list = element("ol", "process-flow");
  stages.forEach(([actor, detail], index) => {
    const item = element("li", index < activeIndex ? "done" : index === activeIndex ? "active" : "");
    item.append(element("span", "process-status", index < activeIndex ? "✓" : String(index + 1)));
    const copy = element("div");
    copy.append(element("strong", "", actor), paragraph(detail));
    item.append(copy);
    list.append(item);
  });
  const status = paragraph(`${stages[Math.min(activeIndex, stages.length - 1)][0]}：${activeIndex >= stages.length ? "處理完成" : "處理中…"}`, "progress-label");
  status.setAttribute("role", "status");
  content.append(list, status);
}

function finishAnimation() {
  if (!busy) return;
  const completedType = animationType;
  clearTimers();
  busy = false;
  animationType = null;
  content.removeAttribute("aria-busy");
  if (completedType === "extraction") {
    extractionPlayed = true;
    goTo(2);
  } else {
    verificationPlayed = true;
    goTo(3);
  }
}

function playProcess(type) {
  busy = true;
  animationType = type;
  for (const button of document.querySelectorAll("[data-citation], [data-step]")) button.disabled = true;
  renderProcess(type, 0);
  back.hidden = true;
  next.hidden = false;
  next.disabled = false;
  next.textContent = "直接查看結果 →";
  $("#stage-meta").textContent = "處理中";
  $("#action-hint").textContent = "正在處理，可直接查看結果。";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    finishAnimation();
    return;
  }
  timers.push(window.setTimeout(() => renderProcess(type, 1), 650));
  timers.push(window.setTimeout(finishAnimation, 1450));
}

next.addEventListener("click", () => {
  if (busy) {
    finishAnimation();
    return;
  }
  if (step === 1) extractionPlayed ? goTo(2) : playProcess("extraction");
  else if (step === 2) verificationPlayed ? goTo(3) : playProcess("verification");
});
back.addEventListener("click", () => { if (!busy && step > 1) goTo(step - 1); });
$("#reset").addEventListener("click", () => {
  clearTimers();
  busy = false;
  animationType = null;
  extractionPlayed = false;
  verificationPlayed = false;
  content.removeAttribute("aria-busy");
  furthest = 1;
  selected = citations[0].id;
  goTo(1);
});
for (const button of document.querySelectorAll("[data-step]")) {
  button.addEventListener("click", () => {
    const number = Number(button.dataset.step);
    if (!busy && number <= furthest) goTo(number);
  });
}
answerInput.value = answerText;
buildAnnotatedAnswer();
render();
