<template>
  <v-card tile>
    <v-btn
      title="revert to default data view"
      @click="$root.reset_view"
      block
      text
      color="primary"
      >Reset View</v-btn
    >
    <v-subheader main class="step-subheader"
      >(<strong>1</strong>) Dataset to view</v-subheader
    >
    <v-select
      aria-label="step 1. Data-set to view"
      :items="$root.$options.source.variables.values.values"
      v-model="$root.settings.value"
      hint="View arrest_charges for crime-related variables, and others for demographic variables."
      persistent-hint
      dense
      solo-inverted
    ></v-select>
    <v-subheader class="step-subheader"
      >(<strong>2</strong>) Timeframe</v-subheader
    >
    <v-col class="timeframe">
      <v-row>
        <v-col
          ><v-subheader
            ><label for="starting_year">Starting Year</label></v-subheader
          ></v-col
        >
        <v-col>
          <v-text-field
            id="starting_year"
            aria-label="step 2a. Timeframe: starting year"
            type="number"
            v-model="min_year"
            step="1"
            :min="$root.settings.year.range[0]"
            :max="$root.settings.year.window[1]"
            dense
            solo-inverted
            :rules="earliest_year"
            @blur="adjust_years"
            clearable
          ></v-text-field>
        </v-col>
      </v-row>

      <v-row>
        <v-col
          ><v-subheader
            ><label for="ending_year">Ending Year</label></v-subheader
          ></v-col
        >
        <v-col>
          <v-text-field
            id="ending_year"
            aria-label="step 2b. Timeframe: ending year"
            type="number"
            v-model="max_year"
            step="1"
            :min="$root.settings.year.window[0]"
            :max="$root.settings.year.range[1]"
            dense
            solo-inverted
            :rules="latest_year"
            @blur="adjust_years"
            clearable
          ></v-text-field>
        </v-col>
      </v-row>
    </v-col>
    <v-subheader class="step-subheader"
      >(<strong>3</strong>) Break by variables</v-subheader
    >
    <DataSplitDisplay :which="'split1'" />
    <DataSplitDisplay :which="'split2'" />
    <v-btn
      text
      block
      large
      v-if="$root.settings.split2"
      @click="swap_order"
      color="primary"
    >
      Swap Order <v-icon>mdi-shuffle-variant</v-icon>
    </v-btn>
    <v-switch
      label="Aggregate"
      :hint="
        'Average ' +
          $root.settings.value +
          ' over years' +
          ($root.settings.split1 ? ' by grouping variables.' : '.')
      "
      persistent-hint
      v-model="$root.settings.average"
      inset
    ></v-switch>

    <div
      v-if="
        $root.settings.as_table ||
          (!$root.settings.average &&
            $root.settings.year.window[0] !== $root.settings.year.window[1]) ||
          $root.settings.split1
      "
    >
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-header @click="addListeners">
            Display Options
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-select
              v-if="$root.settings.as_table"
              label="Table Format"
              :items="$root.settings.table_formats"
              v-model="$root.settings.format_table"
            ></v-select>
            <div v-else>
              <v-select
                label="Plot Type"
                :items="$root.settings.plot_types"
                v-model="$root.settings.plot_type"
              ></v-select>
              <v-switch
                v-if="$root.settings.split2 && !$root.settings.average"
                label="Scale vertical axes per group"
                v-model="$root.settings.unlock_yaxis_max"
                inset
              ></v-switch>
              <v-switch
                label="Disable plot animation"
                v-model="$root.settings.disable_plot_animation"
                inset
              ></v-switch>
              <v-switch
                label="Plot as SVG"
                v-model="$root.settings.svg"
                inset
              ></v-switch>
              <v-btn block text @click="$root.refresh_data">
                <span>Redraw Plot</span>
                <v-icon right>mdi-reload</v-icon>
              </v-btn>
            </div>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </v-card>
</template>

<script>
import DataSplitDisplay from "./DataSplitDisplay.vue";

export default {
  components: {
    DataSplitDisplay,
  },
  data: function() {
    return {
      earliest_year: [
        v =>
          Number(v) >= this.$root.settings.year.range[0]
            ? Number(v) <= this.$root.settings.year.window[1] ||
              "starting year cannot be greater than ending year"
            : "earliest year is " + this.$root.settings.year.range[0],
      ],
      latest_year: [
        v =>
          Number(v) <= this.$root.settings.year.range[1]
            ? Number(v) >= this.$root.settings.year.window[0] ||
              "ending year cannot be less than starting year"
            : "latest year is " + this.$root.settings.year.range[1],
      ],
    };
  },
  computed: {
    min_year: {
      get: function() {
        return this.$root.settings.year.window[0];
      },
      set: function(v) {
        this.$root.settings.year.window = [
          v === null ? this.$root.settings.year.range[0] : Number(v),
          this.$root.settings.year.window[1],
        ];
      },
    },
    max_year: {
      get: function() {
        return this.$root.settings.year.window[1];
      },
      set: function(v) {
        this.$root.settings.year.window = [
          this.$root.settings.year.window[0],
          v === null ? this.$root.settings.year.range[1] : Number(v),
        ];
      },
    },
  },
  methods: {
    adjust_years: function() {
      if (
        this.$root.settings.year.window[0] <
          this.$root.settings.year.range[0] ||
        this.$root.settings.year.window[0] > this.$root.settings.year.window[1]
      )
        this.$root.settings.year.window[0] = this.$root.settings.year.range[0];
      if (
        this.$root.settings.year.window[1] >
          this.$root.settings.year.range[1] ||
        this.$root.settings.year.window[1] < this.$root.settings.year.window[0]
      )
        this.$root.settings.year.window[1] = this.$root.settings.year.range[1];
    },
    swap_order: function() {
      var s = this.$root.settings.split1;
      this.$root.settings.split1 = this.$root.settings.split2;
      this.$root.settings.split2 = s;
    },
    addListeners: function() {
      setTimeout(this.$root.addListenersToSelects.bind(this), 0);
    },
  },
  created() {
    for (var i = this.$root.$options.source.raw.year.length; i--; ) {
      if (
        this.$root.settings.year.range[0] >
        this.$root.$options.source.raw.year[i]
      )
        this.$root.settings.year.range[0] = this.$root.$options.source.raw.year[
          i
        ];
      if (
        this.$root.settings.year.range[1] <
        this.$root.$options.source.raw.year[i]
      )
        this.$root.settings.year.range[1] = this.$root.$options.source.raw.year[
          i
        ];
    }
    this.adjust_years();
  },
  updated() {
    this.$nextTick(this.$root.addListenersToSelects.bind(this));
  },
};
</script>

<style scoped>
.v-expansion-panels {
  margin: 2em 0 1em 0;
}
.v-text-field {
  margin-top: 0;
}
.timeframe {
  padding: 0 0.6em;
}
.row + .row {
  margin-top: 0;
}
.v-subheader {
  padding: 0;
}
.step-subheader {
  font-size: 1rem;
  opacity: 1;
}
</style>
