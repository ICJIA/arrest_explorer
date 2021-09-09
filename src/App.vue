<template>
  <v-app v-if="$root.settings.embed">
    <v-col>
      <v-row class="data-wrap embedded" no-gutters>
        <div role="main" id="data-container"><DataDisplay /></div>
      </v-row>
    </v-col>
  </v-app>
  <v-app v-else>

    <v-col>
      <v-row
        :class="'data-wrap' + ($root.settings.embed ? ' embedded' : '')"
        no-gutters
      >
        <Header />
        <div role="main" id="data-container">
          <DataDisplay />
        </div>
        <div id="data-menu" style="visibility: hidden">
          <DataSheet />
        </div>
    <v-footer height="auto" absolute="true"><v-flex><div class="text-caption" ><a href="https://icjia.illinois.gov/arrestexplorer/docs/guide/#what-data-is-available" target="_blank">Data represent non-expunged adult arrests for Class B misdemeanors, higher offenses, and unclassified arrests.
          Bond skip charges are excluded. Data have been modified for privacy.</a></div></v-flex> </v-footer>
      </v-row>


        <Menu />




      </v-row>

    </v-col>

    <Intro />
    <Examples />
    <Export />
    <FilterSort />

  </v-app>
</template>

<script>
import Header from "./components/Header";
import DataDisplay from "./components/DataDisplay";
import Intro from "./components/Sheets/Intro";
import Examples from "./components/Sheets/Examples";
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
    Examples,
    Export,
    FilterSort,
    Menu,
  },
};
</script>

<style scoped>
#data-menu {
  position: absolute;
  width: 330px;
  height: 100%;
  top: 0;
  right: -330px;
  bottom: 2.5em;
}
#data-menu .v-card {
  overflow: hidden;
  padding: 0 0.4em 0.4em 0.4em;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
#data-container {
  position: absolute;
  top: 35px;
  left: 0;
  right: 0;
  bottom: 6px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.5em 0;
}
.data-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 2.5em;
  overflow-x: hidden;
}
.data-wrap.embedded,
.data-wrap.embedded #data-container {
  padding: 0;
  top: 0;
  bottom: 0;
}
</style>

<style>
html {
  overflow-y: auto;
}
#app,
.v-application,
.v-application .title,
.v-application .body-1,
.v-application .text-h1,
.v-application .text-h2,
.v-application .text-h3,
.v-application .text-h4,
.v-application .text-h5,
.v-application .text-subtitle1,
.v-application .text-subtitle2 {
  font-family: "Lato", sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 20px;
}
.col {
  padding: 0;
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
.theme--dark .url-param-initial {
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
.theme--light .url-param-initial {
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
.v-input__slider .v-input__slot,
.v-input--switch .v-input__slot {
  flex-direction: row-reverse;
}
.theme--dark.step-subheader.v-subheader {
  color: #fff;
}
.theme--light.step-subheader.v-subheader {
  color: #000;
}
.theme--dark .v-card {
  background: #393939;
}
.theme--light.v-bottom-navigation .data-menu-button,
.theme--light.v-bottom-navigation .data-menu-button:not(.v-btn--active) {
  color: #fbfbfb !important;
}
.v-expansion-panel {
  padding: 0 0.5em;
}
.v-expansion-panel .v-expansion-panel-content__wrap {
  padding: 0 0 0.5em 0;
}
.v-expansion-panel .v-expansion-panel-header {
  padding: 0;
}
.v-application--is-ltr .v-input--selection-controls__input {
  margin-right: 0;
}
.v-card__title {
  word-break: break-word;
}
.v-select__selection,
.v-select__slot {
  line-height: 1.2rem;
}
.v-input input {
  max-height: 34px;
}
@media screen and (max-width: 590px) {
  #menu-sheet-wrap {
    width: 100%;
  }
}
</style>
