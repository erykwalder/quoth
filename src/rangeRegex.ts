import { escapeRegex } from "./escapeRegex";

export function rangeRegex(range: Range): RegExp {
  return new RegExp(
    getRangePrefix(range) +
      getRangeText(range).join(".*?").trim().replace(/\s+/gm, "\\s+") +
      getRangeSuffix(range),
    "ms"
  );
}

function getRangePrefix(range: Range): string {
  let prefix = "";
  if (range.startOffset === 0) {
    let node = range.startContainer;
    while (node.nodeType !== node.TEXT_NODE && node.firstChild) {
      node = node.firstChild;
    }
    while (node.isSameNode(node.parentNode.firstChild)) {
      if (node.parentNode.nodeType === Node.ELEMENT_NODE) {
        const matcher = prefixList.find((p) =>
          (node.parentNode as HTMLElement).matches(p.matcher)
        );
        if (matcher) {
          prefix = `((${matcher.regex})\\s*?)?` + prefix;
        }
      }
      if (node.isSameNode(range.commonAncestorContainer)) {
        break;
      }
      node = node.parentNode;
    }
    return prefix;
  } else {
    return "";
  }
}

function getRangeSuffix(range: Range): string {
  let suffix = "";
  let node = range.endContainer;
  if (
    (node.nodeType === Node.TEXT_NODE &&
      range.endOffset === node.textContent.length) ||
    (node.nodeType === Node.ELEMENT_NODE &&
      range.endOffset === node.childNodes.length)
  ) {
    while (node.nodeType !== node.TEXT_NODE && node.lastChild) {
      node = node.lastChild;
    }
    while (node.isSameNode(node.parentNode.lastChild)) {
      if (node.parentNode.nodeType === node.ELEMENT_NODE) {
        const matcher = suffixList.find((p) =>
          (node.parentNode as HTMLElement).matches(p.matcher)
        );
        if (matcher) {
          suffix += `(\\s*?(${matcher.regex}))?`;
        }
      }
      if (node.isSameNode(range.commonAncestorContainer)) {
        break;
      }
      node = node.parentNode;
    }
    return suffix;
  } else {
    return "";
  }
}

const prefixList = [
  { matcher: "h1", regex: "#" },
  { matcher: "h2", regex: "##" },
  { matcher: "h3", regex: "###" },
  { matcher: "h4", regex: "####" },
  { matcher: "h5", regex: "#####" },
  { matcher: "h6", regex: "######" },
  { matcher: "blockquote", regex: ">" },
  { matcher: "strong", regex: "\\*\\*|__" },
  { matcher: "em", regex: "\\*|_" },
  { matcher: "del", regex: "~~" },
  { matcher: "mark", regex: "==" },
  { matcher: "ul > li", regex: "-|\\+|\\*" },
  { matcher: "ol > li", regex: "\\d+\\." },
  { matcher: "pre > code", regex: "`{3,}|~{3,}|\\t| {4}" },
  { matcher: "code", regex: "`" },
  { matcher: "a.internal-link", regex: "\\[\\[(.+?\\|)?" },
  { matcher: "a", regex: "\\[|<" },
];

const suffixList = [
  { matcher: "strong", regex: "\\*\\*|__" },
  { matcher: "em", regex: "\\*|_" },
  { matcher: "del", regex: "~~" },
  { matcher: "mark", regex: "==" },
  { matcher: "code", regex: "`" },
  { matcher: "a.internal-link", regex: "\\]\\]" },
  { matcher: "a", regex: "\\]|>" },
];

const appendList = [
  { matcher: ".copy-code-button", fn: nop },
  { matcher: ".collapse-indicator", fn: nop },
  { matcher: ".markdown-preview-pusher", fn: nop },
  { matcher: ".internal-embed", fn: appendEmbed },
  { matcher: "img", fn: appendImg },
  { matcher: ".footnote-ref", fn: appendFootnote },
  { matcher: "iframe", fn: appendIframe },
  { matcher: "*", fn: appendChildren },
];

function getRangeText(range: Range): string[] {
  const text: string[] = [];
  walkRange(range, (n) => {
    appendNode(text, n, range);
  });
  return text;
}

function walkRange(range: Range, fn: (n: Node) => void): void {
  let node = range.startContainer;
  while (!node.isSameNode(range.endContainer)) {
    if (node.contains(range.endContainer)) {
      node = node.firstChild;
    } else {
      fn(node);
      while (!node.nextSibling) {
        node = node.parentNode;
      }
      node = node.nextSibling;
    }
  }
  fn(range.endContainer);
}

function appendNode(text: string[], node: Node, range: Range): void {
  if (node.nodeType === Node.TEXT_NODE) {
    appendTextNode(text, node as Text, range);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    appendEl(text, node as Element, range);
  }
}

function appendEl(text: string[], el: Element, range: Range): void {
  const fn = appendList.find((m) => el.matches(m.matcher)).fn;
  fn(text, el, range);
}

function appendEmbed(text: string[], el: Element): void {
  text.push(`!\\[\\[${el.getAttribute("src")}\\]\\]`);
}

function appendImg(text: string[], el: Element): void {
  let img = "!\\[";
  if (el.hasAttribute("alt")) {
    img += el.getAttribute("alt");
  }
  img += "\\]\\(" + el.getAttribute("src");
  if (el.hasAttribute("title")) {
    img += ` "${el.getAttribute("title")}"`;
  }
  img += "\\)";
  text.push(img);
}

function appendFootnote(text: string[]): void {
  text.push("\\[\\^[^\\]]*\\]");
}

function appendIframe(text: string[], el: Element): void {
  text.push(`<iframe[^>]+src="${el.getAttribute("src")}"[^>]*></iframe>`);
}

function appendChildren(text: string[], el: Element, range: Range): void {
  let startOffset = 0,
    endOffset = el.childNodes.length;
  if (el.isSameNode(range.startContainer)) {
    startOffset = range.startOffset;
  }
  if (el.isSameNode(range.endContainer)) {
    endOffset = range.endOffset;
  }
  for (let i = startOffset; i < endOffset; i++) {
    appendNode(text, el.childNodes[i], range);
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function nop() {}

function appendTextNode(text: string[], node: Text, range: Range): void {
  let startOffset = 0,
    endOffset = node.textContent.length;
  if (node.isSameNode(range.startContainer)) {
    startOffset = range.startOffset;
  }
  if (node.isSameNode(range.endContainer)) {
    endOffset = range.endOffset;
  }
  text.push(escapeRegex(node.textContent.slice(startOffset, endOffset)));
}
