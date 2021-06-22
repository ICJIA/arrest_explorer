<template>
  <v-card>
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
      aria-label="step 1. Dataset to view"
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
          :max="max_year"
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
          :min="min_year"
          :max="$root.settings.year.range[1]"
          dense
          solo-inverted
          :rules="latest_year"
          @blur="adjust_years"
          clearable
        ></v-text-field>
      </v-col>
    </v-row>

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
      id="average_toggle"
      :label="
        'Average ' +
          $root.settings.value +
          ' over years' +
          ($root.settings.split1 ? ' by grouping variables' : '')
      "
      v-model="$root.settings.average"
      inset
      hide-details
    ></v-switch>

    <div
      v-if="
        $root.settings.as_table ||
          (!$root.settings.average &&
            this.$root.year_window[0] !== this.$root.year_window[1]) ||
          $root.settings.split1
      "
    >
      <v-divider></v-divider>
      <v-subheader>Display Options</v-subheader>
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
          :items="$root.settings.unlock_yaxis_max"
          v-model="$root.settings.unlock_yaxis_max"
          inset
        ></v-switch>
      </div>
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
            ? Number(v) <= this.max_year ||
              "starting year cannot be greater than ending year"
            : "earliest year is " + this.$root.settings.year.range[0],
      ],
      latest_year: [
        v =>
          Number(v) <= this.$root.settings.year.range[1]
            ? Number(v) >= this.min_year ||
              "ending year cannot be less than starting year"
            : "latest year is " + this.$root.settings.year.range[1],
      ],
    };
  },
  computed: {
    min_year: {
      get: function() {
        return this.$root.year_window[0];
      },
      set: function(v) {
        this.$root.year_window = [Number(v), this.$root.year_window[1]];
      },
    },
    max_year: {
      get: function() {
        return this.$root.year_window[1];
      },
      set: function(v) {
        this.$root.year_window = [this.$root.year_window[0], Number(v)];
      },
    },
  },
  methods: {
    adjust_years: function() {
      if (
        this.min_year < this.$root.settings.year.range[0] ||
        this.min_year > this.max_year
      )
        this.min_year = this.$root.settings.year.range[0];
      if (
        this.max_year > this.$root.settings.year.range[1] ||
        this.max_year < this.min_year
      )
        this.max_year = this.$root.settings.year.range[1];
    },
    swap_order: function() {
      var s = this.$root.settings.split1;
      this.$root.settings.split1 = this.$root.settings.split2;
      this.$root.settings.split2 = s;
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

<style>
.data-menu-advanced {
  z-index: 0;
  margin: 0 0 3.7em 0;
}
.data-menu-advanced .v-expansion-panel-content__wrap {
  padding: 0.3em;
}
.v-messages__message {
  line-height: 1.2em;
}
</style>

<style scoped>
.v-text-field {
  margin-top: 0;
}
#side-menu .row + .row {
  margin-top: 0;
}
.v-subheader {
  padding: 0;
}
.theme--dark.step-subheader.v-subheader {
  color: #fff;
}
.theme--light.step-subheader.v-subheader {
  color: #000;
}
.step-subheader {
  font-size: 1rem;
  opacity: 1;
}
.sort-header {
  height: 20px;
  padding: 0;
}
.sort-container {
  margin: 0 0 1em 0;
  overflow: hidden;
}
.sort-table {
  border-spacing: 0;
  font-size: 0.8em;
  text-align: left;
  padding: 0 0 0.5em 0;
}
.sort-table .hide {
  display: none;
}
.sort-table thead td {
  padding: 0.4em 0.5em;
}
.sort-table td:first-of-type {
  max-width: 97px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}
.sort-table td {
  padding: 0.1em 0.5em;
}
.sort-table .v-input {
  margin: 0;
}
.v-card__title {
  padding: 0;
  font-weight: normal;
}
</style>
