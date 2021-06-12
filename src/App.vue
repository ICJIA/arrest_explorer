<template>
  <v-app v-if="$root.settings.embed">
    <v-col>
      <v-row class="data-wrap embeded" no-gutters>
        <div role="main" id="data-container"><DataDisplay /></div>
      </v-row>
    </v-col>
  </v-app>
  <v-app v-else>
    <v-col>
      <v-row
        :class="'data-wrap' + ($root.settings.embed ? ' embeded' : '')"
        no-gutters
      >
        <Header />
        <div id="data-container" @click="$root.settings.sheet = ''">
          <DataDisplay />
        </div>
        <div id="side-menu"><DataSheet /></div>
      </v-row>
      <v-row no-gutters><Menu /></v-row>
    </v-col>
    <Intro />
    <Export />
    <FilterSort />
  </v-app>
</template>

<script>
import Header from "./components/Header";
import DataDisplay from "./components/DataDisplay";
import Intro from "./components/Sheets/Intro";
import Export from "./components/Sheets/Export";
import FilterSort from "./components/Sheets/FilterSort";
import Menu from "./components/Menu";

export default {
  components: {
    Header,
    DataDisplay,
    DataSheet: async function() {
      return import("./components/Sheets/Data");
    },
    Intro,
    Export,
    FilterSort,
    Menu,
  },
};
</script>

<style scoped>
#side-menu {
  position: absolute;
  width: 320px;
  height: 100%;
  top: 0;
  right: -320px;
  bottom: 2.5em;
}
#side-menu .v-card {
  overflow: hidden;
  padding: 0 0.4em 0.4em 0.4em;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
.v-input--switch {
  margin: 0;
}
.v-btn-toggle > .v-btn.v-btn--active {
  opacity: 0.8;
}
.v-btn--active::before {
  opacity: 0;
}
.data-wrap.embeded,
.data-wrap.embeded #data-container {
  padding: 0;
  top: 0;
  bottom: 0;
}
#data-container {
  position: absolute;
  top: 35px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.3em 0 0 0;
}
.data-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 2.5em;
  overflow-x: hidden;
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
#app,
.v-application .title,
.v-application .body-1 {
  font-family: "Lato", sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 20px;
}
.col {
  padding: 0;
}
.v-divider {
  margin: 2em 0 0 0;
}
.theme--light.v-select .v-select__selections {
  color: #000;
}
.api-display {
  text-align: center;
  padding: 1em;
  margin: 0 0 0 0.5em;
  border-radius: 10px;
  width: 100%;
}
.api-display span {
  display: inline-block;
}
.api-display a {
  padding: 0.5em;
  text-decoration: none;
}
.theme--dark .primary,
.theme--dark .primary .v-btn__content {
  color: #000;
}
.theme--dark .v-select__selection--disabled {
  color: #ccc !important;
}
.theme--dark.v-btn.v-btn--disabled {
  color: #cacaca !important;
}
.theme--light .v-select__selection--disabled {
  color: #565656 !important;
}
.theme--dark .api-display {
  color: #d6d6d6;
  background: #2f2f2f;
}
.theme--dark .url-param-inital {
  color: #ffbdbd;
}
.theme--dark .url-param-key {
  color: #b3d6ff;
}
.theme--dark .url-param-aspect {
  color: #90e6ce;
}
.theme--dark .url-param-type {
  color: #cccccc;
}
.theme--dark .url-param-value {
  color: #b8efaf;
}
.theme--dark .url-param-sep {
  color: #f5da77;
}
.theme--light .api-display {
  color: #5d5d5d;
  background: #f3f3f3;
}
.theme--light .url-param-inital {
  color: #902f2f;
}
.theme--light .url-param-key {
  color: #004ba2;
}
.theme--light .url-param-aspect {
  color: #2d564d;
}
.theme--light .url-param-type {
  color: #525252;
}
.theme--light .url-param-value {
  color: #0c5400;
}
.theme--light .url-param-sep {
  color: #796310;
}

@media screen and (max-width: 590px) {
  #menu-sheet-wrap {
    width: 100%;
  }
}
</style>
