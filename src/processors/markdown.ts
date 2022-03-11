import { runMode } from "../cm/runMode";
import { Pos } from "obsidian";

const startMatchers = `
.cm-line-HyperMD-codeblock-begin,
.cm-formatting-quote,
.cm-hmd-indent-in-quote,
.cm-formatting-list,
.cm-formatting-header
`;

const surroundingMatchers = `
.cm-formatting-strong,
.cm-formatting-em,
.cm-formatting-strikethrough,
.cm-formatting-highlight,
.cm-formatting-code,
.cm-comment-start,
.cm-commend-end,
.cm-formatting-math
`;

const endMatchers = `.cm-line-HyperMD-codeblock-end,
.cm-formatting-header-1,
.cm-formatting-header-2`;

function startCMTokens(node: Node, start: number): string {
  let pos = 0;
  let res = "";
  while (node && pos < start) {
    if (node.nodeType === Node.TEXT_NODE) {
      pos += node.textContent.length;
    } else if (node instanceof HTMLElement) {
      if (node.matches(startMatchers)) {
        res += node.firstChild.textContent;
      }
      if (node.matches(".cm-line-HyperMD-codeblock-begin")) {
        res += "\n";
      }
      pos += node.firstChild.textContent.length;
    }
    node = node.nextSibling;
  }
  // have to remove duplicate list items,
  // since block starts potentially before starting line
  return res.replace(/^([-*+]\s+|\d+[.)]\s+)+/, "$1");
}

function openCMTokens(node: Node, start: number): string {
  let pos = 0;
  const res: string[] = [];
  while (node && pos < start) {
    if (node.nodeType === Node.TEXT_NODE) {
      pos += node.textContent.length;
    } else if (node instanceof HTMLElement) {
      if (node.matches(surroundingMatchers)) {
        if (res.last() === node.firstChild.textContent) {
          res.pop();
        } else {
          res.push(node.firstChild.textContent);
        }
      }
      pos += node.firstChild.textContent.length;
    }
    node = node.nextSibling;
  }
  return res.join("");
}

function endCMTokens(node: Node, end: number): string {
  let pos = 0;
  let res = "";
  while (node && pos < end) {
    if (node.nodeType === Node.TEXT_NODE) {
      pos += node.textContent.length;
    } else if (node instanceof HTMLElement) {
      pos += node.firstChild.textContent.length;
    }
    node = node.nextSibling;
  }
  while (node) {
    if (node instanceof HTMLElement && node.matches(endMatchers)) {
      res += "\n" + node.firstChild.textContent;
    }
    node = node.nextSibling;
  }
  return res;
}

export function extractCodeMirrorContext(
  text: string,
  start: number,
  end: number,
  startBlock?: Pos,
  endBlock?: Pos
): string {
  startBlock ||= {
    start: { offset: 0, line: 0, col: 0 },
    end: { offset: text.length, line: 0, col: 0 },
  };
  endBlock ||= {
    start: { offset: 0, line: 0, col: 0 },
    end: { offset: text.length, line: 0, col: 0 },
  };

  const holder = createDiv();

  runMode(
    text.slice(startBlock.start.offset, startBlock.end.offset),
    "hypermd",
    holder
  );

  const prefix =
    startCMTokens(holder.firstChild, start - startBlock.start.offset) +
    openCMTokens(holder.firstChild, start - startBlock.start.offset);

  if (startBlock.start.offset != endBlock.start.offset) {
    holder.empty();
    runMode(
      text.slice(endBlock.start.offset, endBlock.end.offset),
      "hypermd",
      holder
    );
  }

  const suffix =
    openCMTokens(holder.firstChild, end - endBlock.start.offset)
      .split("")
      .reverse()
      .join("") + endCMTokens(holder.firstChild, end - endBlock.start.offset);

  return prefix + text.slice(start, end) + suffix;
}
