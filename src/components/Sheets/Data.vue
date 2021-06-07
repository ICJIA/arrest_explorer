<template>
  <v-card>
    <v-btn @click="$root.reset_view" inset block text color="primary"
      >Reset View</v-btn
    >
    <v-subheader main class="step-subheader"
      >(<strong>1</strong>) Which values?</v-subheader
    >
    <v-select
      style="padding:0"
      aria-label="primary value"
      :items="$root.$options.source.variables.values.values"
      v-model="$root.settings.value"
      hint="View arrest_charges for crime-related variables, and others for demographic variables."
      persistent-hint
      dense
      solo-inverted
    ></v-select>
    <v-subheader class="step-subheader"
      >(<strong>2</strong>) Over what timeframe?</v-subheader
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
          aria-label="Starting Year"
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

    <v-row>
      <v-col
        ><v-subheader
          ><label for="average_toggle">Average</label></v-subheader
        ></v-col
      >
      <v-col>
        <v-switch
          id="average_toggle"
          v-model="$root.settings.average"
          inset
          hide-details
        ></v-switch>
      </v-col>
    </v-row>

    <v-subheader class="step-subheader"
      >(<strong>3</strong>) Split by which variables?</v-subheader
    >
    <v-select
      label="Split values by"
      :items="
        $root.$options.source.variables.values.splits[$root.settings.value]
      "
      v-model="$root.settings.split1"
      clearable
      hide-details
    ></v-select>
    <v-row
      class="filter-results"
      v-if="$root.settings.split1"
      @click="$root.settings.filter_showing = $root.settings.split1"
      title="sort and filter"
    >
      <v-col>{{
        this.split1_spec.displaying +
          " / " +
          this.split1_spec.levels +
          " levels"
      }}</v-col>
      <v-col
        >{{
          "sorted by " +
            this.split1_spec.sort.aspect +
            " (" +
            (this.split1_spec.sort.increasing ? "increasing" : "decreasing") +
            ") "
        }}<v-icon x-small>mdi-cog</v-icon></v-col
      >
    </v-row>
    <v-select
      v-if="
        $root.settings.split1 &&
          $root.$options.source.variables[$root.settings.split1].splits[
            $root.settings.value
          ] &&
          $root.$options.source.variables[$root.settings.split1].splits[
            $root.settings.value
          ].length
      "
      label="and by"
      :items="
        $root.$options.source.variables[$root.settings.split1].splits[
          $root.settings.value
        ]
      "
      v-model="$root.settings.split2"
      clearable
      hide-details
    ></v-select>
    <v-row
      class="filter-results"
      v-if="$root.settings.split2"
      @click="$root.settings.filter_showing = $root.settings.split2"
      title="sort and filter"
    >
      <v-col>{{
        this.split2_spec.displaying +
          " / " +
          this.split2_spec.levels +
          " levels"
      }}</v-col>
      <v-col
        >{{
          "sorted by " +
            this.split2_spec.sort.aspect +
            " (" +
            (this.split2_spec.sort.increasing ? "increasing" : "decreasing") +
            ") "
        }}<v-icon x-small>mdi-cog</v-icon></v-col
      >
    </v-row>
    <v-btn
      text
      block
      v-if="$root.settings.split2"
      @click="flip_splits"
      color="primary"
    >
      Flip Splits <v-icon>mdi-shuffle-variant</v-icon>
    </v-btn>
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
        v-if="$root.settings.split1 !== ''"
        label="Category Format"
        :items="$root.settings.category_formats"
        v-model="$root.settings.format_category"
      ></v-select>

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
          label="Unlock Y-Axis Max"
          :items="$root.settings.unlock_yaxis_max"
          v-model="$root.settings.unlock_yaxis_max"
          inset
        ></v-switch>
        <v-switch
          label="Unlock Y-Axis Min"
          :items="$root.settings.unlock_yaxis_min"
          v-model="$root.settings.unlock_yaxis_min"
          inset
        ></v-switch>
      </div>
    </div>
  </v-card>
</template>

<script>
function get_splits() {
  var d = this.$root.$options.display.options,
    s = this.$root.settings;
  this.splits[0] = "";
  this.splits[1] = "";
  if (s.split1) {
    this.$root.validate_filter_sort(s.split1);
    this.splits[0] = s.split1;
    this.split1_spec.sort = d.sort[s.split1];
    this.split1_spec.levels = this.$root.$options.source.variables[
      s.split1
    ].levels.length;
    this.split1_spec.displaying = Object.prototype.hasOwnProperty.call(
      this.$root.$options.source.view,
      s.split1
    )
      ? this.$root.$options.source.view[s.split1].levels.length
      : this.split1_spec.levels;
  }
  if (s.split2) {
    this.$root.validate_filter_sort(s.split2);
    this.splits[1] = s.split2;
    this.split2_spec.sort = d.sort[s.split2];
    this.split2_spec.levels = this.$root.$options.source.variables[
      s.split2
    ].levels.length;
    this.split2_spec.displaying = Object.prototype.hasOwnProperty.call(
      this.$root.$options.source.view,
      s.split2
    )
      ? this.$root.$options.source.view[s.split2].levels.length
      : this.split2_spec.levels;
  }
}

export default {
  data: function() {
    return {
      splits: ["", ""],
      split1_spec: { displaying: 0, levels: 0, sort: {} },
      split2_spec: { displaying: 0, levels: 0, sort: {} },
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
    flip_splits: function() {
      var s = this.$root.settings.split1;
      this.$root.settings.split1 = this.$root.settings.split2;
      this.$root.settings.split2 = s;
    },
    add_filter: function(v) {
      if (!Object.prototype.hasOwnProperty.call(this.options, v)) {
        this.options[v] = [
          {
            enabled: true,
            aspect: "mean",
            type: ">",
            display_value: 0,
            value: 0,
          },
        ];
        this.refilter();
      }
      get_splits.bind(this)();
    },
    remove_variable: function(v) {
      if (Object.prototype.hasOwnProperty.call(this.options, v)) {
        delete this.options[v];
        get_splits.bind(this)();
        this.$root.queue_update();
      }
    },
    condition_remove: function(variable, type) {
      if (Object.prototype.hasOwnProperty.call(this.options, variable)) {
        for (var i = this.options[variable].length; i--; )
          if (this.options[variable][i].type === type) {
            this.options[variable].splice(i, 1);
            break;
          }
        get_splits.bind(this)();
        this.$root.queue_update();
      }
    },
    condition_add: function(variable) {
      if (Object.prototype.hasOwnProperty.call(this.options, variable)) {
        for (var i = this.options[variable].length; i--; )
          if (this.options[variable][i].type === "") return;
        this.options[variable].push({
          aspect: "",
          type: "",
          display_value: "",
        });
        get_splits.bind(this)();
      }
    },
    refilter: function(e, c) {
      if (c) {
        if (c.aspect === "label") {
          if (c.type !== "!=") c.type = "=";
          if (!c.display_value.push) c.display_value = "";
          c.value = c.display_value;
        } else {
          if (c.type !== "<") c.type = ">";
          if (c.display_value.push) c.display_value = 0;
        }
        c.enabled = true;
      }
      get_splits.bind(this)();
      this.$root.queue_update();
    },
  },
  watch: {
    "$root.settings.active": get_splits,
    "$root.settings.data_menu_open": get_splits,
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
.filter-results {
  font-size: 0.65em;
  padding: 0.5em 0;
  cursor: pointer;
  opacity: 0.7;
}
.filter-results .col:first-child {
  max-width: 100px;
}
.filter-results .col:last-child {
  text-align: right;
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
.v-divider {
  margin: 3em 0.5em 0.5em 0.5em;
}
.criteria-header {
  padding: 0 0.5em;
}
.criteria-row {
  margin: 0.3em 0;
  padding: 0;
}
.criteria-row .v-card {
  width: 100%;
}
.v-card__title {
  padding: 0;
  font-weight: normal;
}
.conditions div {
  width: 18%;
  padding: 0.6em 0 0 0.1em;
  display: inline-block;
}
.conditions .v-input:nth-child(1) {
  width: 12%;
  margin: 0 -6px 0 0;
}
.conditions .v-input:nth-child(2) {
  width: 18%;
}
.conditions .v-input:nth-child(3) {
  width: 9%;
}
.v-input--checkbox {
  margin: 0;
}
.add-condition {
  margin: auto;
}
.condition-foot {
  padding: 0;
}
.condition-remove {
  margin: 0.8em 0 0 0;
}
</style>
