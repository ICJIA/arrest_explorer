<template>
  <v-card>
    <v-select
      label="Which values would you like to view?"
      :items="$root.$options.source.variables.values.values"
      v-model="$root.settings.value"
      hint="View arrest_charges for crime-related variables, and others for demographic variables."
      persistent-hint
    ></v-select>
    <v-btn
      @click="$root.settings.by_year = !$root.settings.by_year"
      inset
      block
      text
      color="primary"
      >{{ "View " + ($root.settings.by_year ? "Averages" : "by Year") }}</v-btn
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
    <v-btn
      text
      block
      v-if="$root.settings.split2"
      @click="flip_splits"
      color="primary"
    >
      Flip Splits <v-icon>mdi-shuffle-variant</v-icon>
    </v-btn>
    <v-divider></v-divider>
    <v-select
      v-if="$root.settings.as_table"
      label="Table Format"
      :items="$root.settings.table_formats"
      v-model="$root.settings.format_table"
    ></v-select>
    <v-select
      v-else
      label="Plot Type"
      :items="$root.settings.plot_types"
      v-model="$root.settings.plot_type"
    ></v-select>
    <v-expansion-panels class="data-menu-advanced" flat>
      <v-expansion-panel>
        <v-expansion-panel-header>Sort &amp; Filter</v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-range-slider
            label="Year Range"
            thumb-label="always"
            v-model="$root.year_window"
            :min="$root.settings.year.range[0]"
            :max="$root.settings.year.range[1]"
            :aria-valuetext="
              $root.year_window[0] + ' to ' + $root.year_window[1]
            "
            :aria-valuenow="$root.year_window[0]"
            inverse-label
          ></v-range-slider>
          <v-row v-if="$root.settings.by_year || sort.length > 1">
            <v-subheader class="sort-header">Sort</v-subheader>
            <v-card class="sort-container" elevation="4" outlined>
              <table class="sort-table">
                <thead>
                  <tr>
                    <td></td>
                    <td>aspect</td>
                    <td>increasing</td>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="sorter in sort"
                    :key="sorter.name"
                    :class="
                      sorter.name === 'year' && !$root.settings.by_year
                        ? 'hide'
                        : ''
                    "
                  >
                    <td>{{ sorter.name }}</td>
                    <td>
                      <v-select
                        aria-label="aspect"
                        :disabled="sorter.name === 'year'"
                        :items="['label', 'max', 'min', 'sum', 'mean']"
                        v-model="sorter.specs.aspect"
                        @change="refilter"
                        dense
                        hide-details
                      ></v-select>
                    </td>
                    <td>
                      <v-switch
                        aria-label="increasing"
                        v-model="sorter.specs.increasing"
                        @change="refilter"
                        hide-details
                      ></v-switch>
                    </td>
                  </tr>
                </tbody>
              </table>
            </v-card>
          </v-row>
          <v-row v-if="$root.settings.split1">
            <v-subheader class="sort-header">Filter</v-subheader>
            <v-row class="criteria-row" v-for="(s, i) in this.splits" :key="i">
              <v-btn
                v-if="
                  s &&
                    !Object.prototype.hasOwnProperty.call(
                      $root.$options.display.options,
                      s
                    )
                "
                color="primary"
                block
                @click="add_filter(s)"
                >{{ "Filter " + s }}</v-btn
              >
              <v-card v-else-if="s" elevation="4" outlined>
                <v-app-bar flat height="35" class="criteria-header">
                  <v-card-title v-text="s"></v-card-title>
                  <v-spacer></v-spacer>
                  <v-btn
                    aria-label="remove filter"
                    @click="remove_variable(s)"
                    icon
                    color="error"
                    ><v-icon>
                      mdi-close
                    </v-icon></v-btn
                  >
                </v-app-bar>
                <v-row
                  class="conditions"
                  v-for="(condition, i) in options[s]"
                  :key="condition.aspect + condition.type + condition.value + i"
                >
                  <v-checkbox
                    aria-label="toggle condition"
                    v-model="condition.enabled"
                    hide-details
                    @change="refilter"
                  ></v-checkbox>
                  <v-select
                    label="aspect"
                    :items="['label', 'max', 'min', 'sum', 'mean']"
                    v-model="condition.aspect"
                    @change="refilter(this, condition)"
                    dense
                    hide-details
                  ></v-select>
                  <v-select
                    label="type"
                    :items="
                      condition.aspect === 'label' ? ['=', '!='] : ['>', '<']
                    "
                    v-model="condition.type"
                    @change="refilter(this, condition)"
                    dense
                    hide-details
                  ></v-select>
                  <v-select
                    v-if="
                      condition.aspect === 'label' &&
                        (condition.type === '=' || condition.type === '!=')
                    "
                    label="values"
                    :items="$root.$options.source.levels[s].label"
                    v-model="condition.display_value"
                    @blur="refilter(this, condition)"
                    dense
                    hide-details
                    multiple
                    clearable
                  >
                    <template v-slot:selection="{ index }">
                      <span v-if="index === 0">{{
                        condition.display_value.length
                      }}</span>
                    </template>
                  </v-select>
                  <v-text-field
                    type="number"
                    v-else
                    label="value"
                    v-model="condition.display_value"
                    @change="refilter"
                    dense
                    hide-details
                  ></v-text-field>
                  <v-btn
                    aria-label="remove condition"
                    class="condition-remove"
                    icon
                    small
                    color="error"
                    @click="condition_remove(s, condition.type)"
                    ><v-icon>
                      mdi-close
                    </v-icon></v-btn
                  >
                </v-row>
                <v-card-actions class="condition-foot">
                  <v-btn
                    aria-label="add condition"
                    class="add-condition"
                    icon
                    color="success"
                    @click="condition_add(s)"
                    ><v-icon>
                      mdi-plus
                    </v-icon></v-btn
                  >
                </v-card-actions>
              </v-card>
            </v-row>
          </v-row>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script>
function get_splits() {
  var o = this.$root.$options.display.options,
    s = this.$root.settings;
  this.splits[0] = this.splits[1] = "";
  if (!Object.prototype.hasOwnProperty.call(o, "sort")) o.sort = {};
  if (!Object.prototype.hasOwnProperty.call(o.sort, "year"))
    o.sort.year = { aspect: "label", increasing: true };
  this.sort = [{ name: "year", specs: o.sort.year }];
  if (s.split1) {
    this.splits[0] = s.split1;
    if (!Object.prototype.hasOwnProperty.call(o.sort, s.split1))
      o.sort[s.split1] = { aspect: "label", increasing: true };
    this.sort.push({ name: s.split1, specs: o.sort[s.split1] });
    if (s.split2) {
      this.splits[1] = s.split2;
      if (!Object.prototype.hasOwnProperty.call(o.sort, s.split2))
        o.sort[s.split2] = { aspect: "label", increasing: true };
      this.sort.push({ name: s.split2, specs: o.sort[s.split2] });
    }
  }
}

export default {
  data: function() {
    return {
      splits: ["", ""],
      sort: [],
      options: this.$root.$options.display.options,
    };
  },
  methods: {
    flip_splits: function() {
      var s = this.$root.settings.split1;
      this.$root.settings.split1 = this.$root.settings.split2;
      this.$root.settings.split2 = s;
    },
    add_filter: function(v) {
      if (!Object.prototype.hasOwnProperty.call(this.options, v)) {
        this.options[v] = [
          {
            enabled: false,
            aspect: "mean",
            type: ">=",
            display_value: 0,
            value: 0,
          },
        ];
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
          if (!c.display_value.push) c.display_value = "";
          c.value = c.display_value;
        } else {
          if (c.display_value.push) c.display_value = 0;
        }
      }
      get_splits.bind(this)();
      this.$root.queue_update();
    },
  },
  watch: {
    "$root.settings.split1": get_splits,
    "$root.settings.split2": get_splits,
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
  },
};
</script>

<style>
.data-menu-advanced {
  z-index: 0;
}
.data-menu-advanced .v-expansion-panel-content__wrap {
  padding: 0.3em;
}
.v-application--is-ltr .v-input__slider--inverse-label .v-input__slot .v-label {
  margin-left: 0 !important;
  margin-right: 12px !important;
}
.v-messages__message {
  line-height: 1.2em;
}
</style>

<style scoped>
.v-input--range-slider {
  margin: 2.5em 1em 0 0;
  height: 40px;
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
.v-input--switch {
  width: 65px;
  margin: auto;
}
.sort-table .v-input {
  margin: 0;
}
.v-divider {
  margin: 2em 0.5em 0.5em 0.5em;
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
  padding: 0.6em 0 0 0.3em;
  display: inline-block;
}
.conditions .v-input:nth-child(1) {
  width: 12%;
  margin: 0 -6px 0 4px;
}
.conditions .v-input:nth-child(2) {
  width: 19%;
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
