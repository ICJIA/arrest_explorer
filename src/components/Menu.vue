<template>
  <div class="bottom-menu">
    <v-dialog
      fullscreen
      hide-overlay
      v-model="$root.settings.app_menu_open"
      class="menu-sheet-wrap"
      transition="dialog-bottom-transition"
    >
      <v-card>
        <v-app-bar fixed>
          <v-tabs centered v-model="$root.settings.sheet">
            <v-tab v-for="{ name, hint } in sheets" :key="name" :title="hint">{{
              name
            }}</v-tab>
          </v-tabs>
          <v-spacer></v-spacer>
          <v-btn
            text
            title="close menu"
            @click="$root.settings.app_menu_open = false"
            ><v-icon>mdi-close</v-icon></v-btn
          >
        </v-app-bar>
        <div class="dialog-tab-content">
          <v-tabs-items v-model="$root.settings.sheet">
            <v-tab-item v-for="sheet in sheets" :key="sheet.name">
              <component
                class="menu-sheet-content"
                :is="sheet.name"
              ></component>
            </v-tab-item>
          </v-tabs-items>
        </div>
      </v-card>
    </v-dialog>
    <v-row no-gutters class="menu-bar">
      <v-col>
        <v-btn
          text
          title="info and settings"
          @click="$root.settings.app_menu_open = true"
        >
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </v-col>
      <v-col>
        <div class="menu-bar-central">
          <v-btn title="reprocess data" @click="$root.refresh_data"
            ><span class="menu-button-text">Refresh</span
            ><v-icon right>mdi-reload</v-icon></v-btn
          >
          <v-btn
            :title="
              'display data as ' + ($root.settings.as_table ? 'plot' : 'table')
            "
            @click="$root.settings.as_table = !$root.settings.as_table"
          >
            <span class="menu-button-text">{{
              $root.settings.as_table ? "Plot" : "Table"
            }}</span>
            <v-icon right>{{
              $root.settings.as_table
                ? "mdi-chart-" +
                  ($root.settings.plot_type === "scatter"
                    ? "scatter-plot"
                    : $root.settings.plot_type)
                : "mdi-table-large"
            }}</v-icon>
          </v-btn>
          <v-btn
            title="download image or data"
            @click="$root.settings.export_open = true"
            ><span class="menu-button-text">Export</span
            ><v-icon right>mdi-download</v-icon></v-btn
          >
        </div>
      </v-col>
      <v-col class="menu-bar-offset">
        <v-btn
          title="change data and variables"
          color="primary"
          @click="$root.toggleDataMenu()"
          :active="$root.settings.data_menu_open"
          aria-owns="side-menu"
          ><span class="menu-button-text">Data Menu</span
          ><v-icon small>mdi-database-cog</v-icon></v-btn
        >
      </v-col>
    </v-row>
  </div>
</template>

<script>
import About from "./Sheets/About";
import Examples from "./Sheets/Examples";
import Options from "./Sheets/Options";

export default {
  components: {
    About,
    Examples,
    Options,
  },
  data() {
    return {
      update_countdown: 0,
      menu_wrap: null,
      sheets: [
        {
          name: "About",
          hint: "Find more information about this site and API.",
        },
        { name: "Examples", hint: "View preset plots for specific questions." },
        { name: "Options", hint: "Adjust site and data display options." },
      ],
    };
  },
  methods: {
    toggleSheet: function(sheet) {
      if (sheet && this.$root.settings.sheet !== sheet) {
        this.$root.gtag("event", "click", {
          event_category: "open_menu",
          event_label: sheet,
        });
      }
      this.$root.settings.sheet =
        this.$root.settings.sheet === sheet ? "" : sheet;
    },
  },
};
</script>

<style scoped>
.v-dialog__content {
  height: 100%;
}
.dialog-tab-content {
  position: fixed;
  top: 64px;
  bottom: 0;
  width: 100%;
}
.dialog-tab-content .v-tabs-items,
.v-window-item {
  height: 100%;
}
.menu-sheet-content {
  padding: 1em 0 0 0;
}
.v-window-item {
  overflow-y: auto;
}
.v-menu .v-btn {
  display: block;
}
.bottom-menu {
  position: fixed;
  bottom: 0;
  left: 0;
}
.menu-bar {
  height: 2.5em;
  position: fixed;
  bottom: 0;
  width: 100%;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14),
    0 1px 10px 0 rgba(0, 0, 0, 0.12);
}
.menu-bar-central {
  margin: 0 auto;
  height: 100%;
  max-width: 500px;
  min-width: 200px;
}
.menu-bar button.v-btn {
  border-radius: 0;
  box-shadow: none;
  width: 33%;
  height: 100%;
}
.menu-bar-offset {
  max-width: 320px;
}
.menu-bar-offset button.v-btn {
  width: 100%;
}
button[active="true"] {
  font-weight: bold;
  color: #8e8e8e;
}
.v-bottom-sheet {
  height: 100%;
}
.v-bottom-sheet > .row > .col:first-of-type {
  max-width: 200px;
}
.v-bottom-sheet > .row > .col > .v-list {
  padding: 0;
  position: absolute;
  bottom: 0;
}
.row > .v-input {
  margin-right: 4px;
}
.row > .v-input:last-of-type {
  margin-right: 0px;
}
.menu-bar .col:first-of-type {
  max-width: 70px;
}
@media screen and (max-width: 600px) {
  .dialog-tab-content {
    top: 56px;
  }
  .menu-button-text {
    display: none;
  }
  .v-btn__content .v-icon--right {
    margin: 0;
  }
  .menu-bar button.v-btn {
    padding: 0;
  }
  .menu-bar button.v-btn,
  .menu-bar-offset {
    max-width: 70px;
  }
  .menu-bar-central {
    margin: auto;
  }
  .col {
    display: inline-flex;
  }
}
@media screen and (max-width: 326px) {
  .menu-bar button.v-btn,
  .menu-bar-offset {
    min-width: 30px;
  }
  .menu-bar .col:first-of-type,
  .menu-bar .col:last-of-type {
    max-width: 40px;
  }
  .menu-bar-central {
    min-width: 90px;
    width: 100%;
    margin: auto;
  }
}
</style>

<style>
.menu-sheet-content {
  margin: 0 auto;
  max-width: 600px;
}
.theme--dark .v-card {
  background: #393939;
}
.theme--dark .menu-bar,
.theme--dark .sort-table thead {
  background: #272727;
}
.theme--light .menu-bar {
  background: #f5f5f5;
}
.row {
  width: 100%;
  margin: 0;
}
.button-row > .col {
  padding: 0.5em;
}
.v-input__slider .v-input__slot,
.v-input--switch .v-input__slot {
  flex-direction: row-reverse;
}
.theme--light.v-expansion-panels > div.v-expansion-panel {
  background: #f5f5f5;
}
@media screen and (max-width: 380px) {
  .v-slide-group__prev--disabled,
  .v-slide-group__next--disabled {
    display: none !important;
  }
  .v-tab {
    padding: 0 !important;
    font-size: 0.5em !important;
    min-width: 70px !important;
  }
}
</style>
