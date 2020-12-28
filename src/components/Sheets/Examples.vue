<template>
  <v-card outlined>
    <v-card-title>Examples</v-card-title>
    <v-card-text>
      <v-row v-for="content in examples" :key="content.name">
        <p class="title text--primary">{{ content.question }}</p>
        <p class="body-1">{{ content.decription }}</p>
        <div class="api-display">
          <a :href="content.url.string">
            <span class="url-base">{{ content.base_url }}</span>
            <span v-if="content.url.parts.length" class="url-param-inital"
              >/?</span
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
    </v-card-text>
  </v-card>
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
          base_url: window.location.origin,
          url: this.$root.display_query(
            {},
            {
              value: "arrests",
              by_year: false,
              split: ["gender"],
              plot_type: "bar",
            },
            true
          ),
        },
        {
          name: "arrests_per_arrestee by age_group",
          question:
            "Over time, which age groups were most likely to be re-arrested?",
          decription:
            "You might look at arrests per arrestee within age groups:",
          base_url: window.location.origin,
          url: this.$root.display_query(
            {},
            {
              value: "arrests_per_arrestee",
              by_year: true,
              split: ["age_group"],
              plot_type: "line",
            },
            true
          ),
        },
        {
          name: "frequent categories over time",
          question: "What were people most frequently arrested for?",
          decription:
            "You might look at average arrest charges by offense categories with large means:",
          base_url: window.location.origin,
          url: this.$root.display_query(
            {},
            {
              value: "arrest_charges",
              by_year: false,
              plot_type: "bar",
              split: ["offense_category"],
              offense_category: [
                {
                  aspect: "mean",
                  type: ">",
                  display_value: "10000",
                },
              ],
              sort: {
                offense_category: {
                  aspect: "mean",
                  increasing: false,
                },
              },
            },
            true
          ),
        },
      ],
    };
  },
};
</script>

<style scoped>
a {
  text-decoration: none;
  color: "primary";
}
.v-card__text .row {
  margin: 0 0 1em 0;
}
.menu-sheet-content {
  padding: 0;
}
.v-application .title {
  font-size: 1.2rem !important;
  margin: 0;
}
.v-application .body-1 {
  font-size: 0.91rem !important;
}
</style>
