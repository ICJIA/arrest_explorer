<template>
  <div v-if="$root.settings.as_table">
    <p class="text-subtitle-1" v-if="$root.settings.average">
      {{
        $root.year_window[0] === $root.year_window[1]
          ? $root.format_name($root.settings.value) +
            " in " +
            $root.year_window[0]
          : "Average " +
            $root.format_name($root.settings.value) +
            " between " +
            $root.year_window[0] +
            " and " +
            $root.year_window[1]
      }}
    </p>
    <v-data-table
      :headers="$root.table.header"
      :items="$root.table.rows"
      multi-sort
      dense
      disable-pagination
      hide-default-footer
    ></v-data-table>
  </div>
  <Plot
    v-else-if="
      $root.settings.split1 ||
        (!$root.settings.average &&
          $root.year_window[0] !== $root.year_window[1])
    "
  />
  <div class="average-display" v-else>
    <p class="text-h4">
      {{
        ($root.year_window[0] === $root.year_window[1]
          ? "In " + $root.year_window[0]
          : "Between " +
            $root.year_window[0] +
            " and " +
            $root.year_window[1]) + " there where"
      }}
    </p>
    <p class="primary--text text-h2">
      {{ format_number($root.settings.value_mean) }}
    </p>
    <p class="text-h4">
      {{
        $root.year_window[0] === $root.year_window[1]
          ? $root.format_name($root.settings.value).toLowerCase() + "."
          : "average " +
            $root.format_name($root.settings.value).toLowerCase() +
            " per year."
      }}
    </p>
  </div>
</template>

<script>
import Plot from "./Plot.vue";
const number_breaks = /^(\d{3})/g;

export default {
  methods: {
    format_number: function(x) {
      return String(
        x > 100 ? Math.round(x) : Math.round(x * 1e3) / 1e3
      ).replace(number_breaks, "$1,");
    },
  },
  mounted() {
    window.addEventListener("resize", this.$root.resize_plot);
  },
  components: {
    Plot,
  },
};
</script>

<style scoped>
.average-display {
  width: 100%;
  text-align: center;
  padding: 0.5em 0 0 0;
}
.average-display .text-h2 {
  padding: 0.5em;
}
.text-subtitle-1 {
  text-align: center;
}
</style>
