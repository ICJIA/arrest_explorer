<template>
  <v-card outlined>
    <v-row>
      <v-col cols="4">
        <v-img
          height="100%"
          contain
          alt="ICJIA logo"
          src="https://icjia.illinois.gov/researchhub/icjia-logo.png"
        /> </v-col
      ><v-col>
        <v-card-title>Arrest Explorer</v-card-title>
        <v-card-subtitle
          >Illinois Criminal Justice Information Authority</v-card-subtitle
        >
      </v-col>
    </v-row>
    <v-card-text>
      <v-row class="button-blocks">
        <v-col>
          <v-btn
            block
            x-large
            @click="
              $root.settings.sheet = '';
              $root.settings.intro = true;
            "
            >Show Introduction</v-btn
          >
        </v-col>
        <v-col>
          <v-btn
            block
            x-large
            target="_blank"
            rel="noreferrer"
            href="https://icjia-arrest-explorer-docs.netlify.app"
            >About this Project<v-icon right>mdi-open-in-new</v-icon></v-btn
          >
        </v-col>
        <v-col>
          <v-btn
            block
            x-large
            target="_blank"
            rel="noreferrer"
            href="http://www.icjia.state.il.us"
            >About the ICJIA<v-icon right>mdi-open-in-new</v-icon></v-btn
          ></v-col
        ><v-col>
          <v-btn
            block
            x-large
            target="_blank"
            rel="noreferrer"
            href="https://github.com/miserman/arrest_explorer"
            >Code Repository<v-icon right>mdi-open-in-new</v-icon></v-btn
          >
        </v-col>
      </v-row>
      <span v-show="$root.settings.version"
        >Data updated {{ $root.settings.version }}.</span
      >
    </v-card-text>
  </v-card>
</template>

<style scoped>
.about-header {
  margin: 0 0.5em;
}
h1 {
  font-size: 1.8em;
}
.theme--dark.v-expansion-panels .v-expansion-panel {
  background-color: #272727;
}
.v-item-group {
  margin: 0 0 1.5em 0;
}
.v-expansion-panel-content {
  font-size: 16px;
}
.row {
  margin: 0 0 0.5em 0;
}
.button-blocks {
  display: block;
}
.button-blocks .col {
  margin: 0.5em 0 0 0;
}
.v-card__text {
  text-align: right;
}
</style>
