import { Platform, Plugin, PluginSettingTab, Setting } from "obsidian";
import { CopySettings } from "./commands";
import { EmbedDisplay } from "./model/embed";
import { buildIndex, EmbedCache } from "./model/embedCache";

export interface QuothData {
  copySettings: CopySettings;
  index: EmbedCache[];
}

export class QuothSettingTab extends PluginSettingTab {
  constructor(
    plugin: Plugin,
    private data: QuothData,
    private saveSettings: () => Promise<void>
  ) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Quoth Settings" });

    new Setting(containerEl)
      .setName("Rebuild Quoth Index")
      .setDesc(
        "This will load all quoths in your vault into the index. " +
          "This may need to be called after a major update, " +
          "or after updating markdown files outside of obsidian."
      )
      .addButton((button) => {
        button
          .setButtonText("Rebuild Index")
          .setClass("mod-cta")
          .onClick(async () => {
            if (button.disabled) {
              return;
            }
            button.setDisabled(true);
            button.setButtonText("Rebuilding Index...");
            this.data.index = await buildIndex(this.app);
            await this.saveSettings();
            button.setDisabled(false);
            button.setButtonText("Rebuild Index");
          });
      });

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
            .setValue(this.data.copySettings.showMobileButton)
            .onChange(async (value) => {
              this.data.copySettings.showMobileButton = value;
              await this.saveSettings();
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
        .setValue(this.data.copySettings.defaultDisplay)
        .onChange(async (value) => {
          if (value == "null") {
            delete this.data.copySettings.defaultDisplay;
          } else {
            this.data.copySettings.defaultDisplay = value as EmbedDisplay;
          }
          await this.saveSettings();
        })
    );
    new Setting(containerEl).setName("Show Author:").addToggle((toggle) =>
      toggle
        .setValue(this.data.copySettings.defaultShow.author)
        .onChange(async (value) => {
          this.data.copySettings.defaultShow.author = value;
          await this.saveSettings();
        })
    );
    new Setting(containerEl).setName("Show Title:").addToggle((toggle) =>
      toggle
        .setValue(this.data.copySettings.defaultShow.title)
        .onChange(async (value) => {
          this.data.copySettings.defaultShow.title = value;
          await this.saveSettings();
        })
    );
  }
}
