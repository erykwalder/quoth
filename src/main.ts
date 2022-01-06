import { Platform, Plugin, PluginSettingTab, Setting } from "obsidian";
import addIcons from "./addIcons";
import { checkCopyReference, CopySettings } from "./copyReference";
import copyButton from "./copyButton";
import { EmbedDisplay } from "./parse";
import { quothProcessor } from "./processor";
import { selectListener } from "./selection";

interface PluginSettings {
  copySettings: CopySettings;
}

const DEFAULT_SETTINGS: PluginSettings = {
  copySettings: {
    defaultShow: {
      title: false,
      author: false,
    },
    showMobileButton: false,
  },
};

export default class QuothPlugin extends Plugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();

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
        this.settings.copySettings
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
        copyButton.bind(null, this.app, this.settings.copySettings)
      );
    }
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
            .setValue(this.plugin.settings.copySettings.showMobileButton)
            .onChange(async (value) => {
              this.plugin.settings.copySettings.showMobileButton = value;
              await this.plugin.saveSettings();
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
        .setValue(this.plugin.settings.copySettings.defaultDisplay)
        .onChange(async (value) => {
          if (value == "null") {
            delete this.plugin.settings.copySettings.defaultDisplay;
          } else {
            this.plugin.settings.copySettings.defaultDisplay =
              value as EmbedDisplay;
          }
          await this.plugin.saveSettings();
        })
    );
    new Setting(containerEl).setName("Show Author:").addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.copySettings.defaultShow.author)
        .onChange(async (value) => {
          this.plugin.settings.copySettings.defaultShow.author = value;
          await this.plugin.saveSettings();
        })
    );
    new Setting(containerEl).setName("Show Title:").addToggle((toggle) =>
      toggle
        .setValue(this.plugin.settings.copySettings.defaultShow.title)
        .onChange(async (value) => {
          this.plugin.settings.copySettings.defaultShow.title = value;
          await this.plugin.saveSettings();
        })
    );
  }
}
