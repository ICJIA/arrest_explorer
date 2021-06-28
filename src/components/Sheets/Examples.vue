<template>
  <v-dialog
    role="dialog"
    v-model="$root.settings.examples_open"
    open-delay="0"
    overlay-opacity=".8"
    max-width="600px"
    scrollable
  >
    <v-card>
      <v-card-title>
        <h1 role="heading" class="headline">Examples</h1>
        <v-spacer></v-spacer
        ><v-btn icon title="close" @click="$root.settings.examples_open = false"
          ><v-icon>mdi-close</v-icon></v-btn
        >
      </v-card-title>
      <v-card-text>
        <v-row v-for="content in examples" :key="content.name">
          <p class="title text--primary">{{ content.question }}</p>
          <p class="body-1">{{ content.decription }}</p>
          <div class="api-display">
            <a :href="content.url.string">
              <span class="url-base">{{ content.base_url }}</span>
              <span v-if="content.url.parts.length" class="url-param-initial"
                >?</span
              >
              <span
                v-for="(part, index) in content.url.parts"
                :key="part.slot + part.type"
              >
                <span class="url-param-key">{{ part.slot }}</span>
                <span v-if="part.aspect" class="url-param-aspect">{{
                  "[" + part.aspect + "]"
                }}</span>
                <span class="url-param-type">{{ part.type }}</span>
                <span class="url-param-value">{{ part.value }}</span>
                <span
                  v-if="index !== content.url.parts.length - 1"
                  class="url-param-sep"
                  >&</span
                >
              </span>
            </a>
          </div>
        </v-row>
        <v-row>
          <p>
            See our
            <a
              rel="noreferrer"
              :href="this.$root.settings.repo + '/tree/master/examples'"
              target="_blank"
              >example scripts</a
            >
            to reproduce these examples in R or Python using the API.
          </p>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data: function() {
    return {
      examples: [
        {
          name: "arrests by sex",
          question: "How did arrest rates vary by sex?",
          decription:
            "You might look at average arrests within each sex group:",
          base_url: this.$root.settings.url,
          url: this.$root.display_query({
            average: true,
            split: ["gender"],
            plot_type: "bar",
          }),
        },
        {
          name: "arrests_per_arrestee by age_group",
          question:
            "Over time, which age groups were most likely to be re-arrested?",
          decription:
            "You might look at arrests per arrestee within age groups:",
          base_url: this.$root.settings.url,
          url: this.$root.display_query({
            value: "arrests_per_arrestee",
            split: ["age_group"],
            plot_type: "line",
          }),
        },
        {
          name: "frequent categories over time",
          question: "What were people most frequently arrested for?",
          decription:
            "You might look at average arrest charges by offense categories with large means:",
          base_url: this.$root.settings.url,
          url: this.$root.display_query({
            value: "arrest_charges",
            average: true,
            plot_type: "bar",
            split: ["offense_category"],
            offense_category: [
              {
                aspect: "mean",
                type: ">",
                display_value: "10000",
                enabled: true,
              },
            ],
            sort: {
              offense_category: {
                aspect: "mean",
                increasing: false,
              },
            },
          }),
        },
      ],
    };
  },
};
</script>

<style scoped>
.row {
  margin: 0 0 1em 0;
}
.title {
  font-size: 1.2rem !important;
  margin: 0;
}
.body-1 {
  font-size: 0.91rem !important;
}
</style>
