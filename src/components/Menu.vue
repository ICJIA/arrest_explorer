<template>
  <div class="bottom-menu">
    <v-menu
      v-model="$root.plot_part_menu.open"
      :position-x="$root.plot_part_menu.x"
      :position-y="$root.plot_part_menu.y"
    >
      <v-list>
        <v-list-item-group>
          <v-list-item
            @click="updatePlotParts"
            v-for="item in $root.plot_part_menu.options"
            :key="item"
          >
            <v-list-item-title v-text="item"></v-list-item-title>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-menu>
    <div id="menu-sheet-wrap">
      <component
        class="menu-sheet-content"
        :is="$root.settings.sheet"
      ></component>
    </div>
    <v-row no-gutters class="menu-bar">
      <v-col>
        <div class="menu-bar-central">
          <v-btn
            v-for="{ name, hint } in sheets"
            :key="name"
            :title="hint"
            :active="$root.settings.sheet === name"
            @click="toggleSheet(name)"
            >{{ name }}</v-btn
          >
        </div>
      </v-col>
      <v-col class="menu-bar-offset">
        <v-btn @click="toggleDataMenu()" :active="$root.settings.data_menu_open"
          >Data<v-icon right>mdi-database-cog</v-icon></v-btn
        >
      </v-col>
    </v-row>
  </div>
</template>

<script>
import About from "./Sheets/About";
import Examples from "./Sheets/Examples";
import Options from "./Sheets/Options";

var watch = {
  "$root.settings.sheet": {
    handler: function(s) {
      if (!this.menu_wrap)
        this.menu_wrap = document.getElementById("menu-sheet-wrap");
      if (this.menu_wrap) this.menu_wrap.style.bottom = (s ? 0 : -500) + "px";
    },
  },
};

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
        { name: "Options", hint: "Adjust site options and download data." },
      ],
    };
  },
  mounted() {
    this.data_container = document.getElementById("data-container");
    this.data_menu = document.getElementById("side-menu");
    this.menu_wrap = document.getElementById("menu-sheet-wrap");
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
    toggleDataMenu: function() {
      var w = document.body.getBoundingClientRect().width;
      if (this.$root.settings.data_menu_open) {
        this.data_container.style.right = "0px";
        this.data_menu.style.right = "-320px";
        this.data_menu.style.width = "320px";
        this.$root.settings.data_menu_open = false;
      } else {
        this.data_menu.style.right = "0px";
        if (w < 600) {
          this.data_menu.style.width = "100%";
        } else {
          this.data_container.style.right = "320px";
          this.data_menu.style.width = "320px";
        }
        this.$root.settings.data_menu_open = true;
        this.$root.gtag("event", "click", {
          event_category: "open_menu",
          event_label: "data",
        });
      }
      if (
        w >= 600 &&
        !this.$root.settings.as_table &&
        this.$root.$options.plot.instance
      ) {
        this.$root.$options.plot.element.style.width =
          this.$root.$el.getBoundingClientRect().width +
          (this.$root.settings.data_menu_open ? -320 : 0) +
          "px";
        this.$root.resize_plot("100%");
      }
    },
    updatePlotParts(e) {
      this.$root.settings.active = false;
      switch (this.$root.plot_part_menu.part) {
        case "value":
          this.$root.settings.value = e.target.innerText;
          break;
        case "split1":
          if (e.target.innerText === "year") {
            this.$root.settings.by_year = true;
          } else {
            if (
              this.$root.settings.by_year &&
              e.target.innerText !== this.$root.settings.split1
            ) {
              this.$root.settings.split2 = this.$root.settings.split1;
            }
            this.$root.settings.by_year = false;
            this.$root.settings.split1 = e.target.innerText;
          }
          break;
        case "split1_by_year":
          this.$root.settings.split1 = e.target.innerText;
          break;
        case "split2":
          this.$root.settings.split2 = e.target.innerText;
          break;
        default:
      }
      this.$root.settings.active = true;
    },
  },
  watch: watch,
};
</script>

<style scoped>
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
#menu-sheet-wrap {
  position: fixed;
  max-height: 100%;
  overflow-y: auto;
  left: 0;
  right: 320px;
  bottom: -500px;
  padding: 0 0 2.5em 0;
  transition: bottom 0.3s cubic-bezier(0, 1.4, 0.01, 0.91);
  -webkit-transition: bottom 0.3s cubic-bezier(0, 1.4, 0.01, 0.91);
}
@media screen and (max-width: 590px) {
  .menu-bar-offset {
    max-width: 24%;
  }
}
</style>

<style>
.menu-sheet-content {
  margin: 0 auto;
  max-width: 600px;
  padding: 0.5em;
}
.theme--dark .v-card {
  background: #393939;
}
.theme--light .menu-sheet-content,
.theme--light #side-menu .v-card {
  background: #f9f9f9;
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
.row > .v-input {
  margin-right: 4px;
}
.row > .v-input:last-of-type {
  margin-right: 0px;
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
</style>
