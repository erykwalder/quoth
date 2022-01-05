export function rangeRegex(range: Range): RegExp {
  return new RegExp(
    getRangePrefix(range) +
      getRangeText(range)
        .map(escapeRegExp)
        .join(".*?")
        .trim()
        .replace(/\s+/gm, "\\s+") +
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

interface Matcher {
  matcher: string;
  regex: string;
}

const prefixList: Matcher[] = [
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
  { matcher: "pre > code", regex: "```|\\t| {4}" },
  { matcher: "code", regex: "`" },
  { matcher: "a.internal-link", regex: "\\[\\[(.+?\\|)?" },
  { matcher: "a", regex: "\\[|<" },
];

const suffixList: Matcher[] = [
  { matcher: "strong", regex: "\\*\\*|__" },
  { matcher: "em", regex: "\\*|_" },
  { matcher: "del", regex: "~~" },
  { matcher: "mark", regex: "==" },
  { matcher: "code", regex: "`" },
  { matcher: "a.internal-link", regex: "\\]\\]" },
  { matcher: "a", regex: "\\]|>" },
];

function getRangeText(range: Range): string[] {
  const text: string[] = [];
  let node = range.startContainer;
  if (node.isSameNode(range.endContainer)) {
    appendNodeText(text, node, range.startOffset, range.endOffset);
    return text;
  }
  // walk up
  appendNodeText(text, node, range.startOffset);
  node = nextNode(node);
  while (!node.contains(range.endContainer)) {
    appendNodeText(text, node);
    node = nextNode(node);
  }
  //walk down
  while (!node.isSameNode(range.endContainer)) {
    for (let i = 0; i < node.childNodes.length; i++) {
      if (node.childNodes[i].contains(range.endContainer)) {
        node = node.childNodes[i];
        break;
      } else {
        appendNodeText(text, node.childNodes[i]);
      }
    }
  }
  appendNodeText(text, node, 0, range.endOffset);

  return text;
}

function nextNode(node: Node): Node {
  while (!node.nextSibling) {
    node = node.parentNode;
  }
  return node.nextSibling;
}

function appendNodeText(
  text: string[],
  node: Node,
  startOffset = 0,
  endOffset?: number
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    endOffset = argOrDefault(endOffset, node.textContent.length);
    text.push(node.textContent.slice(startOffset, endOffset));
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    endOffset = argOrDefault(endOffset, node.childNodes.length);
    for (let i = startOffset; i < endOffset; i++) {
      appendNodeText(text, node.childNodes[i]);
    }
  }
}

// from MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
function escapeRegExp(re: string): string {
  // $& means the whole matched string
  return re.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function argOrDefault<T>(arg: T | undefined, defaultVal: T): T {
  return arg === undefined ? defaultVal : arg;
}
