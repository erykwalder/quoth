import {
  Platform,
  Plugin,
  PluginSettingTab,
  Setting,
  TAbstractFile,
  TFile,
} from "obsidian";
import addIcons from "./addIcons";
import { checkCopyReference, CopySettings } from "./copyReference";
import copyButton from "./copyButton";
import { EmbedDisplay } from "./embed";
import { quothProcessor } from "./processor";
import { selectListener } from "./selection";
import {
  deleteFileReferences,
  dirtyReferences,
  fileReferences,
  ReferenceItem,
  renameFileInReferences,
  updateReferences,
} from "./refIndex";

interface QuothData {
  copySettings: CopySettings;
  index: ReferenceItem[];
}

const DEFAULT_DATA: QuothData = {
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

    this.addSettingTab(new QuothSettingTab(this));

    this.registerMarkdownCodeBlockProcessor(
      "quoth",
      quothProcessor.bind(null, this.app)
    );

    this.addCommand({
      id: "quoth-copy-reference",
      name: "Copy Reference",
      checkCallback: checkCopyReference.bind(
        null,
        this.app,
        this.data.copySettings
      ),
      hotkeys: [
        {
          modifiers: ["Shift", "Mod"],
          key: "'",
        },
      ],
      icon: "quoth-copy",
    });

    this.registerDomEvent(document, "selectionchange", selectListener);
    if (Platform.isMobile) {
      this.registerDomEvent(
        document,
        "selectionchange",
        copyButton.bind(null, this.app, this.data.copySettings)
      );
    }

    this.registerEvent(
      this.app.vault.on(
        "rename",
        async (file: TAbstractFile, oldPath: string) => {
          if (file instanceof TFile) {
            this.data.index = renameFileInReferences(
              this.data.index,
              file as TFile,
              oldPath
            );
            const dirtyRefs = dirtyReferences(this.data.index, file as TFile);
            await this.saveStorage();
            await updateReferences(dirtyRefs, this.app, file as TFile);
          }
        }
      )
    );

    this.registerEvent(
      this.app.vault.on("modify", async (file: TAbstractFile) => {
        if (file instanceof TFile) {
          let indexChanged = false;
          let count = this.data.index.length;

          this.data.index = deleteFileReferences(
            this.data.index,
            file as TFile
          );
          indexChanged = count !== this.data.index.length;
          count = this.data.index.length;

          this.data.index = [
            ...this.data.index,
            ...(await fileReferences(file as TFile, this.app)),
          ];
          indexChanged ||= count !== this.data.index.length;

          if (indexChanged) {
            this.saveStorage();
          }
        }
      })
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

class QuothSettingTab extends PluginSettingTab {
  plugin: QuothPlugin;

  constructor(plugin: QuothPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Quoth Settings" });

    if (Platform.isMobile) {
      new Setting(containerEl)
        .setName("Show Copy Button")
        .setDesc(
          "Mobile only. " +
            "When a selection is made in preview mode, " +
            "a button to copy will appear in the bottom right."
        )
        .addToggle((toggle) => {
          toggle
            .setValue(this.plugin.data.copySettings.showMobileButton)
            .onChange(async (value) => {
              this.plugin.data.copySettings.showMobileButton = value;
              await this.plugin.saveStorage();
            });
        });
    }

    containerEl.createEl("h4", {
      text: "Default copy reference options",
    });
    containerEl.createEl("p", {
      text: "Note: this changes only references copied going forward, not previous references.",
    });

    new Setting(containerEl).setName("Display Style:").addDropdown((drop) =>
      drop
        .addOptions({ null: "", embedded: "Embedded", inline: "Inline" })
        .setValue(this.plugin.data.copySettings.defaultDisplay)
        .onChange(async (value) => {
          if (value == "null") {
            delete this.plugin.data.copySettings.defaultDisplay;
          } else {
            this.plugin.data.copySettings.defaultDisplay =
              value as EmbedDisplay;
          }
          await this.plugin.saveStorage();
        })
    );
    new Setting(containerEl).setName("Show Author:").addToggle((toggle) =>
      toggle
        .setValue(this.plugin.data.copySettings.defaultShow.author)
        .onChange(async (value) => {
          this.plugin.data.copySettings.defaultShow.author = value;
          await this.plugin.saveStorage();
        })
    );
    new Setting(containerEl).setName("Show Title:").addToggle((toggle) =>
      toggle
        .setValue(this.plugin.data.copySettings.defaultShow.title)
        .onChange(async (value) => {
          this.plugin.data.copySettings.defaultShow.title = value;
          await this.plugin.saveStorage();
        })
    );
  }
}
