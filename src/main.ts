import { Platform, Plugin } from "obsidian";
import addIcons from "./addIcons";
import { checkCopyReference, copyButton } from "./commands";
import { quothProcessor } from "./processors";
import { selectListener } from "./commands/selection";
import { replaceBlockquotes } from "./commands/replaceBlockquotes";
import { QuothData, QuothSettingTab } from "./settings";
import { IndexListener, EmbedCache } from "./model/embedCache";

export const DEFAULT_DATA: QuothData = {
  copySettings: {
    defaultShow: {
      title: false,
      author: false,
    },
    showMobileButton: false,
  },
  index: [],
};

export default class QuothPlugin extends Plugin {
  data: QuothData;

  async onload() {
    await this.loadStorage();

    addIcons();

    this.addSettingTab(
      new QuothSettingTab(this, this.data, async () => {
        await this.saveStorage();
      })
    );

    this.registerMarkdownCodeBlockProcessor("quoth", quothProcessor);

    this.addCommand({
      id: "quoth-copy-reference",
      name: "Copy Reference",
      checkCallback: checkCopyReference.bind(null, this.data.copySettings),
      hotkeys: [
        {
          modifiers: ["Shift", "Mod"],
          key: "'",
        },
      ],
      icon: "quoth-copy",
    });

    this.addCommand({
      id: "quoth-replace-blockquotes",
      name: "Replace Blockquotes with Quoth Embeds",
      editorCallback: replaceBlockquotes.bind(null, this.data.copySettings),
    });

    this.registerDomEvent(document, "selectionchange", selectListener);
    if (Platform.isMobile) {
      this.registerDomEvent(
        document,
        "selectionchange",
        copyButton.bind(null, this.data.copySettings)
      );
    }

    const indexListener = new IndexListener(
      () => this.data.index,
      async (refs: EmbedCache[]) => {
        this.data.index = refs;
        await this.saveStorage();
      }
    );
    this.registerEvent(
      this.app.vault.on("rename", indexListener.rename.bind(indexListener))
    );
    this.registerEvent(
      this.app.vault.on("delete", indexListener.delete.bind(indexListener))
    );
    this.registerEvent(
      this.app.vault.on("modify", indexListener.modify.bind(indexListener))
    );
  }

  async loadStorage() {
    const loaded = await this.loadData();
    this.data = {
      ...DEFAULT_DATA,
      ...loaded,
      copySettings: {
        ...DEFAULT_DATA.copySettings,
        ...loaded?.copySettings,
        defaultShow: {
          ...DEFAULT_DATA.copySettings.defaultShow,
          ...loaded?.copySettings?.defaultShow,
        },
      },
    };
  }

  async saveStorage() {
    await this.saveData(this.data);
  }
}
