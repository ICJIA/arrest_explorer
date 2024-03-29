<template>
  <v-dialog
    v-model="$root.settings.intro"
    open-delay="0"
    overlay-opacity=".8"
    max-width="1200px"
    persistent
    scrollable
  >
    <v-card>
      <v-card-title class="intro-header">
        <v-col>
          <v-img
            max-width="250px"
            contain
            alt="Illinois Criminal Justice Information Authority logo"
            src="https://icjia.illinois.gov/researchhub/icjia-logo.png"
          /> </v-col
        ><v-col>
          <v-card-title
            ><span class="text-h3">Arrest Explorer</span></v-card-title
          >
          <v-card-subtitle style="padding-bottom: 0"
            ><span class="text-h6"
              >Illinois Criminal Justice Information Authority</span
            ></v-card-subtitle
          ></v-col
        >
      </v-card-title>
      <v-card-text>
        <v-col>
        <v-row>
          <h1 class="text--primary">User Agreement</h1>
          <p class="text--secondary">
            Use of this site or its data is subject to our
            <a
              rel="noreferrer"
              href="https://icjia.illinois.gov/arrestexplorer/docs/user_agreement"
              target="_blank"
              >User Agreement</a
            >. By clicking Acknowledge below, you state that you understand that these are not official crime statistics (see Data Source below) and to not reproduce any data except under terms allowed in the User agreement. You also agree to not attempt re-identification of any individuals or attempt to hack the Arrest Explorer application.
          </p>
        </v-row>
        <v-row>
          <h1 class="text--primary">Data Source</h1>
          <p class="text--secondary">
            Data are aggregated adult records, originally provided
            by the Illinois State Police but with some changes to protect privacy. Note that these exclude juvenile arrests as well as arrests for class C misdemeanors and local ordinance violations.
            <br/>For more information about how data were prepared, please visit
            our
            <a
              rel="noreferrer"
              href="https://icjia.illinois.gov/arrestexplorer/docs/"
              target="_blank"
              >documentation site</a
            >.
          </p>
        </v-row>

          <v-row>
            <h1 class="text--primary">Exploring the Data</h1>
            <p class="text--secondary">
              Use the Data Menu <v-icon small>mdi-database-cog</v-icon> to
              select which tables and splits to view.
              <br />
              All tables can be split by <em>county</em>.
              <br />
              The <span class="text--primary">arrests</span>,
              <span class="text--primary">arrestees</span>, and
              <span class="text--primary">arrests per arrestees</span> tables
              can be split by the <u>demographic</u> variables <em>sex</em>,
              <em>age group</em>, and <em>race</em>.
              <br />
              The <span class="text--primary">arrest charges</span> table can be
              split by the <u>crime-related</u> variables <em>crime type</em>,
              <em>offense class</em>, and <em>offense category</em>.
            </p>
          </v-row>


          <v-row>
            <h1 class="text--primary">
              Notice of Federal Funding and Federal Disclaimer
            </h1>
            <p class="text--secondary">
              This website is funded through a grant from the Bureau of Justice
              Statistics, Office of Justice Programs, U.S. Department of
              Justice. Neither the U.S. Department of Justice nor any of its
              components operate, control, are responsible for, or necessarily
              endorse this website, including, without limitation, its content,
              technical infrastructure, and policies, and any services or tools
              provided.
            </p>
          </v-row>
          <v-row>
            <h1 class="text--primary">
              Interaction Data
            </h1>
            <v-checkbox
              label="Share Your Interaction Data"
              v-model="$root.settings.send_data"
              color="primary"
              hint="We use Google Analytics to collect interaction data, which helps us learn how people use the site."
              persistent-hint
            ></v-checkbox>
          </v-row>
        </v-col>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text class="primary" @click="$root.settings.intro = false">
          Acknowledge
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.intro-header {
  height: 150px;
}
.intro-header .v-image {
  margin: auto;
}
.intro-header .col:first-of-type {
  position: absolute;
  width: 175px;
}
.intro-header .col:last-of-type {
  margin: 0 0 0 175px;
}
.v-application .text-h3 {
  font-size: 2.5rem !important;
}
img {
  min-width: 110px !important;
}
h1 {
  margin: 0 0 0.2em 0;
  line-height: 2rem;
}
.v-card__text .row {
  display: block;
  margin: 0;
}
@media screen and (max-width: 550px) {
  .intro-header {
    height: auto;
  }
  .v-application .text-h3 {
    font-size: 1.5rem !important;
  }
  .v-application .text-h6 {
    font-size: 1rem !important;
  }
  .intro-header .col:first-of-type,
  .intro-header .col:last-of-type {
    margin: 0;
    position: relative;
    flex-basis: auto;
  }
}
</style>
