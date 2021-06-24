<template>
  <div>
    <SideMenu />
    <v-bottom-navigation absolute>
      <v-btn title="info and settings" @click="openSideMenu">
        <span>About</span>
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn
        :title="
          'display data as ' + ($root.settings.as_table ? 'plot' : 'table')
        "
        @click="$root.settings.as_table = !$root.settings.as_table"
      >
        <span>{{
          $root.settings.as_table ? "View as Plot" : "View as Table"
        }}</span>
        <v-icon>{{
          $root.settings.as_table
            ? "mdi-chart-" +
              ($root.settings.plot_type === "scatter"
                ? "scatter-plot"
                : $root.settings.plot_type)
            : "mdi-table-large"
        }}</v-icon>
      </v-btn>
      <v-btn @click="$root.settings.export_open = true">
        <span>Export</span>
        <v-icon>mdi-download</v-icon>
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn
        class="data-menu-button"
        label="change data and variables"
        color="primary"
        @click="$root.toggleDataMenu()"
        :active="$root.settings.data_menu_open"
        aria-owns="data-menu"
      >
        <span>Data Menu</span>
        <v-icon>mdi-database-cog</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script>
import Examples from "./Sheets/Examples";
import SideMenu from "./Sheets/SideMenu";

export default {
  components: {
    Examples,
    SideMenu,
  },
  methods: {
    openSideMenu: function() {
      this.$root.settings.app_menu_open = true;
      setTimeout(function() {
        var l = document.getElementById("about_list_items");
        if (l && l.firstElementChild) l.firstElementChild.focus();
      }, 100);
    },
  },
};
</script>

<style scoped>
.v-item-group.v-bottom-navigation .v-btn.data-menu-button {
  min-width: 320px;
}
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
button[active="true"] {
  font-weight: bold;
}
.data-menu-button.theme--light > span {
  color: #fff;
}
@media screen and (max-width: 600px) {
  .v-item-group.v-bottom-navigation .v-btn.data-menu-button {
    min-width: 10px;
  }
}
</style>
