<template>
  <v-data-table
    :headers="this.$root.table.header"
    :items="this.$root.table.rows"
    multi-sort
    dense
    disable-pagination
    hide-default-footer
    v-if="$root.settings.as_table"
  ></v-data-table>
  <Plot v-else />
</template>

<script>
import Plot from "./Plot.vue";

export default {
  mounted() {
    window.addEventListener("resize", this.$root.resize_plot);
  },
  components: {
    Plot,
  },
};
</script>
