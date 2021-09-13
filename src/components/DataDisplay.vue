<template>

<div>


  <div v-if="$root.settings.as_table">
    <div v-if="$root.$options.display.graphic.length !== 0">
      <p class="text-h4">
        {{ $root.$options.display.graphic[0].style.text }}
      </p>
      <p
        class="text-subtitle-1"
        v-if="$root.$options.display.graphic[1].style.text"
      >
        {{ $root.$options.display.graphic[1].style.text }}
      </p>

    </div>
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
          $root.settings.year.window[0] !== $root.settings.year.window[1])
    "
  />

  <div class="average-display" v-else>
    <p class="text-h4">
      {{
        (year[0] === year[1]
          ? "In " + year[0]
          : "Between " + year[0] + " and " + year[1]) + " there were"
      }}
    </p>
    <p class="primary--text text-h4">
      {{ format_number($root.settings.value_mean) }}
    </p>
    <p class="text-h4">
      {{
        year[0] === year[1]
          ? $root.format_name($root.settings.value).toLowerCase() + "."
          : "average " +
            $root.format_name($root.settings.value).toLowerCase() +
            " per year."
      }}
    </p>

  </div>

<div>
    <v-footer height="auto" position="fixed"><v-flex><div class="text-caption" >
      <a href="https://icjia.illinois.gov/arrestexplorer/docs" 
      style="text-decoration:none"
      target="_blank">
        Data represent non-expunged adult arrests for Class B misdemeanors and higher offenses. Hispanic was first report in 2015. Data have been modified to protect privacy, including not reporting zeros, click here for full details.
        </a></div></v-flex> </v-footer>


</div>



</div>

</template>

<script>
import Plot from "./Plot.vue";
const number_breaks = /^(\d{3})/g;

export default {
  computed: {
    year: function() {
      if (this.$root.settings.year.range[0] === Infinity) {
        this.$root.$options.source.update(this.$root.$options.display.options);
        this.$root.settings.year.window[0] = this.$root.$options.source.view.year.min;
        this.$root.settings.year.window[1] = this.$root.$options.source.view.year.max;
      }
      return this.$root.settings.year.window;
    },
  },
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
.text-h4,
.text-subtitle-1 {
  text-align: center;
}
.text-h4 {
  margin: 0;
}
</style>
