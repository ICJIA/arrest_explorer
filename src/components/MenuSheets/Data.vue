<template>
  <v-card>
    <v-select
      label="Which values would you like to view?"
      :items="$root.$options.source.variables.values.values"
      v-model="$root.settings.value"
      hide-details
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
    <v-range-slider
      label="Year Range"
      thumb-label="always"
      v-model="$root.year_window"
      :min="$root.settings.year.range[0]"
      :max="$root.settings.year.range[1]"
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
                sorter.name === 'year' && !$root.settings.by_year ? 'hide' : ''
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
    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          :disabled="!filterable"
          block
          v-bind="attrs"
          v-on="on"
          color="primary"
        >
          {{ filterable ? "Add Filter" : "Add splits to filter" }}
        </v-btn>
      </template>
      <v-list>
        <v-list-item-group>
          <v-list-item v-for="(item, i) in available_filters" :key="i">
            <v-list-item-title
              v-text="item"
              @click="add_filter(item, i)"
            ></v-list-item-title>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-menu>
    <v-col class="criteria-container">
      <v-row
        class="criteria-row"
        v-for="(criterion, index) in criteria"
        :key="index"
      >
        <v-card elevation="4" outlined>
          <v-app-bar flat height="35" class="criteria-header">
            <v-card-title v-text="criterion.name"></v-card-title>
            <v-spacer></v-spacer>
            <v-btn @click="remove_variable(criterion.name)" icon color="error"
              ><v-icon>
                mdi-close
              </v-icon></v-btn
            >
          </v-app-bar>
          <v-row
            class="conditions"
            v-for="condition in criterion.conditions"
            :key="condition.aspect + condition.type + condition.value"
          >
            <v-checkbox
              v-model="condition.enabled"
              hide-details
              @change="refilter"
            ></v-checkbox>
            <v-select
              label="aspect"
              :items="['label', 'max', 'min', 'sum', 'mean']"
              v-model="condition.aspect"
              @change="refilter"
              dense
              hide-details
            ></v-select>
            <v-select
              label="type"
              :items="condition.aspect === 'label' ? ['=', '!='] : ['>', '<']"
              v-model="condition.type"
              @change="refilter"
              dense
              hide-details
            ></v-select>
            <v-select
              v-if="
                condition.aspect === 'label' &&
                  (condition.type === '=' || condition.type === '!=')
              "
              label="values"
              :items="$root.$options.source.variables[criterion.name].levels"
              v-model="condition.display_value"
              @blur="refilter"
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
              v-else
              label="value"
              v-model="condition.display_value"
              @change="refilter"
              dense
              hide-details
            ></v-text-field>
            <v-btn
              class="condition-remove"
              icon
              small
              color="error"
              @click="condition_remove(criterion.name, condition.type)"
              ><v-icon>
                mdi-close
              </v-icon></v-btn
            >
          </v-row>
          <v-card-actions class="condition-foot">
            <v-btn
              class="add-condition"
              icon
              color="success"
              @click="condition_add(criterion.name)"
              ><v-icon>
                mdi-plus
              </v-icon></v-btn
            >
          </v-card-actions>
        </v-card>
      </v-row>
      <v-divider></v-divider>
      <v-select
        label="Category Format"
        :items="['labels', 'indices', 'codes']"
        v-model="$root.settings.format_category"
      ></v-select>
      <v-select
        v-if="$root.settings.as_table"
        label="Table Format"
        :items="['tall', 'mixed', 'wide']"
        v-model="$root.settings.format_table"
      ></v-select>
      <v-select
        v-else
        label="Plot Type"
        :items="$root.settings.plot_types"
        v-model="$root.settings.plot_type"
      ></v-select>
    </v-col>
  </v-card>
</template>

<script>
function get_criteria() {
  var o = this.$root.$options.display.options,
    s = this.$root.settings;
  this.variables = this.$root.$options.source.variables.values.splits[
    this.$root.settings.value
  ];
  this.available_filters = [];
  this.filterable = false;
  this.criteria = [];
  if (!Object.prototype.hasOwnProperty.call(o, "sort")) o.sort = {};
  if (!Object.prototype.hasOwnProperty.call(o.sort, "year"))
    o.sort.year = { aspect: "label", increasing: true };
  this.sort = [{ name: "year", specs: o.sort.year }];
  if (s.split1) {
    if (Object.prototype.hasOwnProperty.call(o, s.split1)) {
      this.criteria.push({ name: s.split1, conditions: o[s.split1] });
    } else {
      this.filterable = true;
      this.available_filters.push(s.split1);
    }
    if (!Object.prototype.hasOwnProperty.call(o.sort, s.split1))
      o.sort[s.split1] = { aspect: "label", increasing: true };
    this.sort.push({ name: s.split1, specs: o.sort[s.split1] });
    if (s.split2) {
      if (Object.prototype.hasOwnProperty.call(o, s.split2)) {
        this.criteria.push({ name: s.split2, conditions: o[s.split2] });
      } else {
        this.filterable = true;
        this.available_filters.push(s.split2);
      }
      if (!Object.prototype.hasOwnProperty.call(o.sort, s.split2))
        o.sort[s.split2] = { aspect: "label", increasing: true };
      this.sort.push({ name: s.split2, specs: o.sort[s.split2] });
    }
  }
}

export default {
  data: function() {
    return {
      filterable: false,
      criteria: [],
      sort: [],
      available_filters: [],
      variables: [],
    };
  },
  methods: {
    flip_splits: function() {
      var s = this.$root.settings.split1;
      this.$root.settings.split1 = this.$root.settings.split2;
      this.$root.settings.split2 = s;
    },
    add_filter: function(v) {
      var d = this.$root.$options.display.options;
      if (!Object.prototype.hasOwnProperty.call(d, v)) {
        d[v] = [
          {
            enabled: false,
            aspect: "mean",
            type: ">=",
            display_value: 0,
            value: 0,
          },
        ];
        this.criteria.push({ name: v, conditions: d[v] });
        this.available_filters.splice(this.available_filters.indexOf(v), 1);
        this.filterable = this.available_filters.length;
        this.$root.queue_update();
      }
    },
    remove_variable: function(v) {
      var d = this.$root.$options.display.options;
      if (Object.prototype.hasOwnProperty.call(d, v)) {
        delete d[v];
        get_criteria.bind(this)();
        this.$root.queue_update();
      }
    },
    condition_remove: function(variable, type) {
      var d = this.$root.$options.display.options,
        i;
      if (Object.prototype.hasOwnProperty.call(d, variable)) {
        for (i = d[variable].length; i--; )
          if (d[variable][i].type === type) {
            d[variable].splice(i, 1);
            break;
          }
        this.$root.queue_update();
      }
    },
    condition_add: function(variable) {
      var d = this.$root.$options.display.options,
        i;
      if (Object.prototype.hasOwnProperty.call(d, variable)) {
        for (i = d[variable].length; i--; )
          if (d[variable][i].type === "") return;
        d[variable].push({ aspect: "", type: "", display_value: "" });
      }
    },
    refilter: function() {
      this.$root.queue_update();
    },
  },
  watch: {
    "$root.settings.split1": get_criteria,
    "$root.settings.split2": get_criteria,
  },
  mounted() {
    get_criteria.bind(this)();
  },
};
</script>

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
  margin: 1em 0 0.5em 0;
}
.criteria-header {
  padding: 0 0.5em;
}
.criteria-row {
  margin: 0.3em 0;
  padding: 0;
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
