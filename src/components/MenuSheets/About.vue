<template>
  <v-card outlined>
    <v-row>
      <v-col cols="4">
        <v-img
          height="100%"
          contain
          alt="ICJIA logo"
          src="../../assets/logo-icjia.png"
        /> </v-col
      ><v-col>
        <v-card-title>Arrest Explorer</v-card-title>
        <v-card-subtitle
          >Illinois Criminal Justice Information Authority</v-card-subtitle
        >
      </v-col>
    </v-row>
    <v-card-text>
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

      <v-row class="button-blocks">
        <v-col>
          <v-btn
            block
            x-large
            target="_blank"
            href="https://icjia-arrest-explorer-docs.netlify.app"
            >About this Project<v-icon right>mdi-open-in-new</v-icon></v-btn
          >
        </v-col>
        <v-col>
          <v-btn
            block
            x-large
            target="_blank"
            href="http://www.icjia.state.il.us"
            >About the ICJIA<v-icon right>mdi-open-in-new</v-icon></v-btn
          ></v-col
        ><v-col>
          <v-btn
            block
            x-large
            target="_blank"
            href="https://github.com/miserman/arrest_explorer"
            >Code Repository<v-icon right>mdi-open-in-new</v-icon></v-btn
          >
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
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
</style>
