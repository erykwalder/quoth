let lastRange: Range;

export function getSelectedRange(): Range {
  return lastRange;
}

export function clearSelection(): void {
  document.getSelection().empty();
  lastRange.collapse();
}

export function isTextSelected(): boolean {
  return !getSelectedRange()?.collapsed;
}

export function selectListener() {
  const sel = document.getSelection();
  if (sel.rangeCount > 0) {
    const range = document.getSelection().getRangeAt(0);
    const startEl = range.startContainer as HTMLElement;
    if (
      startEl?.className != "prompt" &&
      !(
        startEl?.tagName == "BODY" &&
        startEl?.className?.indexOf("is-mobile") >= 0
      )
    ) {
      lastRange = range;
    }
  }
}
