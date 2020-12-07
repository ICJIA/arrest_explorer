<template>
  <div class="bottom-menu">
    <div id="menu-sheet-wrap">
      <v-card outlined class="menu-sheet">
        <component class="menu-sheet-content" :is="this.sheet"></component>
      </v-card>
    </div>
    <div class="menu-bar">
      <div class="menu-items">
        <v-btn
          v-for="{ name, hint } in sheets"
          :key="name"
          :title="hint"
          :active="name === 'Data' ? data_menu_open : sheet === name"
          @click="name === 'Data' ? toggleDataMenu() : toggleSheet(name)"
          >{{ name }}</v-btn
        >
      </div>
    </div>
  </div>
</template>

<script>
import About from "./MenuSheets/About";
import Options from "./MenuSheets/Options";

var watch = {
  sheet: {
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
    Options,
  },
  data() {
    return {
      update_countdown: 0,
      menu_wrap: null,
      data_menu_open: false,
      sheets: [
        {
          name: "About",
          hint: "Find more information about this site and API.",
        },
        { name: "Options", hint: "Adjust site options and download data." },
        {
          name: "Data",
          hint:
            "Visualize and filter by variables, and adjust data display settings.",
        },
      ],
      sheet: "",
    };
  },
  mounted() {
    this.data_container = document.getElementById("data-container");
    this.data_menu = document.getElementById("side-menu");
    this.menu_wrap = document.getElementById("menu-sheet-wrap");
  },
  methods: {
    toggleSheet: function(sheet) {
      this.sheet = this.sheet === sheet ? "" : sheet;
    },
    toggleDataMenu: function() {
      if (this.data_menu_open) {
        this.data_container.style.right = "0px";
        this.menu_wrap.style.right = "0px";
        this.data_menu.style.right = "-300px";
        this.data_menu_open = false;
      } else {
        this.data_container.style.right = "300px";
        this.menu_wrap.style.right = "300px";
        this.data_menu.style.right = "0px";
        this.data_menu_open = true;
      }
      if (!this.$root.settings.as_table && this.$root.$options.plot.instance) {
        setTimeout(this.$root.$options.plot.instance.resize, 400);
      }
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
.menu-items {
  margin: 0 auto;
  height: 100%;
  max-width: 500px;
  min-width: 200px;
}
.menu-items > button.v-btn {
  border-radius: 0;
  box-shadow: none;
  width: 33%;
  height: 100%;
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
  right: 0;
  bottom: -500px;
  padding: 0 0 2.5em 0;
  transition: bottom 0.3s cubic-bezier(0, 1.4, 0.01, 0.91);
  -webkit-transition: bottom 0.3s cubic-bezier(0, 1.4, 0.01, 0.91);
}
</style>

<style>
.menu-sheet {
  width: 100%;
  padding: 0.5em;
}
.theme--dark .v-card {
  background: #393939;
}
.theme--light .menu-sheet,
.theme--light #side-menu .v-card {
  background: #f9f9f9;
}
.theme--dark .menu-bar {
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
.v-input__slot {
  flex-direction: row-reverse;
}
.theme--light.v-expansion-panels > div.v-expansion-panel {
  background: #f5f5f5;
}
.v-application--is-ltr .v-input__slider--inverse-label .v-input__slot .v-label {
  margin-left: 0;
  margin-right: 12px;
}
</style>
