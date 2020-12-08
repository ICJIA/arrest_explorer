<template>
  <v-card outlined>
    <v-card-title>Examples</v-card-title>
    <v-card-text>
      <v-row v-for="content in examples" :key="content.name">
        <p class="display-1 text--primary">{{ content.question }}</p>
        <p>{{ content.decription }}</p>
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
          question: "How do arrests vary by sex?",
          decription:
            "You might look at average arrests within each sex group:",
          base_url: window.location.origin,
          url: this.$root.display_query(
            {},
            { by_year: false, split: ["gender"], plot_type: "bar" }
          ),
        },
        {
          name: "frequent categories over time",
          question:
            "How have the most frequent arrest charges changed over time?",
          decription: "You might look at offense categories with large means:",
          base_url: window.location.origin,
          url: this.$root.display_query(
            {},
            {
              value: "arrest_charges",
              by_year: true,
              plot_type: "line",
              split: ["offense_category"],
              offense_category: [
                {
                  aspect: "mean",
                  type: ">",
                  display_value: "25000",
                },
              ],
            }
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
</style>
