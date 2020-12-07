<template>
  <v-col>
    <v-row>
      <v-col style="flex-grow: 0; min-height: 110px">
        <a href="http://www.icjia.state.il.us" target="_blank">
          <v-img eager alt="ICJIA logo" src="../../assets/logo-icjia.png" />
        </a>
      </v-col>
      <v-col class="about-header">
        <h1>Arrest Explorer</h1>
        <h2>
          Illinois Criminal Justice Information Authority
        </h2>
      </v-col>
    </v-row>
    <v-row>
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-header
            ><h4>
              User Agreement
            </h4></v-expansion-panel-header
          >
          <v-expansion-panel-content>
            User agreement text.
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header
            ><h4>
              Notice of federal funding and federal disclaimer
            </h4></v-expansion-panel-header
          >
          <v-expansion-panel-content>
            This website is funded through a grant from the Bureau of Justice
            Statistics, Office of Justice Programs, U.S. Department of Justice.
            Neither the U.S. Department of Justice nor any of its components
            operate, control, are responsible for, or necessarily endorse, this
            website (including, without limitation, its content, technical
            infrastructure, and policies, and any services or tools provided).
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-row>
    <v-row class="button-row">
      <v-col>
        <v-btn block x-large target="_blank" href="http://www.icjia.state.il.us"
          >ICJIA Website<v-icon right>mdi-open-in-new</v-icon></v-btn
        ></v-col
      ><v-col>
        <v-btn
          block
          x-large
          target="_blank"
          href="https://github.com/ICJIA/icjia-arrest-explorer"
          >GitHub<v-icon right>mdi-open-in-new</v-icon></v-btn
        > </v-col
      ><v-col>
        <v-btn
          block
          x-large
          target="_blank"
          href="https://icjia-arrest-explorer-docs.netlify.app"
          >Documentation<v-icon right>mdi-open-in-new</v-icon></v-btn
        >
      </v-col>
    </v-row>
  </v-col>
</template>

<script></script>

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
.v-expansion-panel-content {
  font-size: 16px;
}
.row {
  margin: 0 0 0.5em 0;
}
@media screen and (max-width: 955px) {
  h1 {
    font-size: 1.3em;
  }
  h2 {
    font-size: 1em;
  }
}
</style>
