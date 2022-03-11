// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

const CodeMirror = window.CodeMirror;

export function runMode(
  string: string,
  modespec: string,
  callback: any,
  options?: any
) {
  const mode = CodeMirror.getMode(CodeMirror.defaults, modespec);
  const tabSize = (options && options.tabSize) || CodeMirror.defaults.tabSize;

  // Create a tokenizing callback function if passed-in callback is a DOM element.
  if (callback.appendChild) {
    const ie = /MSIE \d/.test(navigator.userAgent);
    const ie_lt9 =
      ie && (document.documentMode == null || document.documentMode < 9);
    const node = callback;
    let col = 0;
    node.innerHTML = "";
    callback = function (text: string, style: string) {
      if (text == "\n") {
        // Emitting LF or CRLF on IE8 or earlier results in an incorrect display.
        // Emitting a carriage return makes everything ok.
        node.appendChild(document.createTextNode(ie_lt9 ? "\r" : text));
        col = 0;
        return;
      }
      let content = "";
      // replace tabs
      for (let pos = 0; ; ) {
        const idx = text.indexOf("\t", pos);
        if (idx == -1) {
          content += text.slice(pos);
          col += text.length - pos;
          break;
        } else {
          col += idx - pos;
          content += text.slice(pos, idx);
          const size = tabSize - (col % tabSize);
          col += size;
          for (let i = 0; i < size; ++i) content += " ";
          pos = idx + 1;
        }
      }
      // Create a node with token style and append it to the callback DOM element.
      if (style) {
        const sp = node.appendChild(document.createElement("span"));
        sp.className = "cm-" + style.replace(/ +/g, " cm-");
        sp.appendChild(document.createTextNode(content));
      } else {
        node.appendChild(document.createTextNode(content));
      }
    };
  }

  const lines = CodeMirror.splitLines(string),
    state = (options && options.state) || CodeMirror.startState(mode);
  for (let i = 0, e = lines.length; i < e; ++i) {
    if (i) callback("\n");
    const stream = new CodeMirror.StringStream(lines[i], null, {
      lookAhead: function (n) {
        return lines[i + n];
      },
      baseToken: function () {},
    });
    if (!stream.string && mode.blankLine) mode.blankLine(state);
    while (!stream.eol()) {
      const style = mode.token(stream, state);
      callback(stream.current(), style, i, stream.start, state, mode);
      stream.start = stream.pos;
    }
  }
}
