import { Plugin, PluginSettingTab, Setting } from "obsidian";
import { copyReference } from "./copyReference";
import { EmbedDisplay, EmbedOptions } from "./parse";
import { quothProcessor } from "./processor";
import { selectListener } from "./selection";

interface PluginSettings {
  defaultDisplay?: EmbedDisplay;
  defaultShow: EmbedOptions;
}

const DEFAULT_SETTINGS: PluginSettings = {
  defaultShow: {
    title: false,
    author: false,
  },
};

export default class QuothPlugin extends Plugin {
  settings: PluginSettings;

  async onload() {
    this.loadSettings();

    this.addSettingTab(new QuothSettingTab(this));

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

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
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
    containerEl.createEl("h4", {
      text: "Default copy reference options",
    });
    containerEl.createEl("p", {
      text: "Note: this changes only references copied going forward, not previous references.",
    });

    new Setting(containerEl).setName("Display Style:").addDropdown((drop) =>
      drop
        .addOptions({ null: "", embedded: "Embedded", inline: "Inline" })
        .setValue(this.plugin.settings.defaultDisplay)
        .onChange(async (value) => {
          if (value == "null") {
            delete this.plugin.settings.defaultDisplay;
          } else {
            this.plugin.settings.defaultDisplay = value as EmbedDisplay;
          }
          await this.plugin.saveSettings();
        })
    );
    new Setting(containerEl).setName("Show Author:").addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.defaultShow.author)
        .onChange(async (value) => {
          this.plugin.settings.defaultShow.author = value;
          await this.plugin.saveSettings();
        })
    );
    new Setting(containerEl).setName("Show Title:").addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.defaultShow.title)
        .onChange(async (value) => {
          this.plugin.settings.defaultShow.title = value;
          await this.plugin.saveSettings();
        })
    );
  }
}
