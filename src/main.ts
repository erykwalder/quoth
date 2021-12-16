import { Plugin } from "obsidian";
import { copyReference } from "./copyReference";
import { quothProcessor } from "./processor";
import { selectListener } from "./selection";

export default class QuothPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor(
      "quoth",
      quothProcessor.bind(null, this.app)
    );

    this.addCommand({
      id: "quoth-copy-reference",
      name: "Copy Reference",
      checkCallback: copyReference.bind(null, this.app),
      hotkeys: [
        {
          modifiers: ["Shift", "Mod"],
          key: "'",
        },
      ],
    });

    this.registerDomEvent(document, "selectionchange", selectListener);
  }
}
