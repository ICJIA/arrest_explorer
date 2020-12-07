<template>
  <v-app>
    <v-col>
      <v-row class="data-wrap" no-gutters>
        <div id="data-container" @click="closeMenu"><DataDisplay /></div>
        <div id="side-menu"><DataSheet /></div>
      </v-row>
      <v-row no-gutters><Menu /></v-row>
    </v-col>
  </v-app>
</template>

<script>
import DataDisplay from "./components/DataDisplay";
import DataSheet from "./components/MenuSheets/Data";
import Menu from "./components/Menu";

export default {
  components: {
    DataDisplay,
    DataSheet,
    Menu,
  },
  methods: {
    closeMenu() {
      this.$children[0].$children[2].sheet = "";
    },
  },
};
</script>

<style scoped>
#side-menu {
  position: absolute;
  width: 300px;
  height: 100%;
  top: 0;
  right: -300px;
  bottom: 2.5em;
}
#side-menu .v-card {
  overflow: hidden;
  padding: 0 0.4em;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
.v-input--switch {
  margin: 0;
}
#data-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
}
.data-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 2.5em;
  padding: 0.5em 0.5em 2.5em 0.5em;
}
#data-container,
#side-menu {
  transition: right 0.3s cubic-bezier(0, 1.4, 0.01, 0.91);
  -webkit-transition: right 0.3s cubic-bezier(0, 1.4, 0.01, 0.91);
}
</style>

<style>
html {
  overflow-y: auto;
}
#app {
  font-family: "Lucida Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 20px;
}
.col {
  padding: 0;
}
.v-label {
  margin: 0 0.5em 0 0;
}
</style>
