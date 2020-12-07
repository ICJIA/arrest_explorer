<template>
  <v-card>
    <v-switch label="display as table" v-model="$root.settings.as_table" inset>
    </v-switch>
    <v-select
      v-if="$root.settings.as_table"
      label="table format"
      :items="['tall', 'mixed', 'wide']"
      v-model="$root.settings.format_table"
    ></v-select>
    <v-select
      v-else
      label="plot type"
      :items="$root.settings.plot_types"
      v-model="$root.settings.plot_type"
    ></v-select>
    <v-select
      label="values"
      :items="$root.$options.source.variables.values.values"
      v-model="$root.settings.value"
      hide-details="true"
    ></v-select>
    <v-switch
      v-if="!$root.settings.as_table"
      label="by year"
      title="Show values for each year."
      v-model="$root.settings.by_year"
      inset
    ></v-switch>
    <v-row>
      <v-select
        label="split by"
        :items="
          $root.$options.source.variables.values.splits[$root.settings.value]
        "
        v-model="$root.settings.split1"
        clearable
        hide-details="true"
      ></v-select>
      <v-btn
        text
        block
        v-if="$root.settings.split2"
        @click="flip_splits"
        color="primary"
      >
        flip splits <v-icon>mdi-shuffle-variant</v-icon>
      </v-btn>
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
        hide-details="true"
      ></v-select>
    </v-row>
    <v-range-slider
      label="year range"
      thumb-label="always"
      v-model="$root.year_window"
      :min="$root.settings.year.range[0]"
      :max="$root.settings.year.range[1]"
      inverse-label
    ></v-range-slider>

    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-btn block v-bind="attrs" v-on="on" color="primary">
          Add Filter
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
          <v-app-bar flat height="50">
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
            <v-select
              label="aspect"
              :items="['label', 'max', 'min', 'sum', 'mean']"
              v-model="condition.aspect"
              @change="refilter"
              dense
              hide-details="true"
            ></v-select>
            <v-select
              label="operator"
              :items="['>', '<', '=', '!=']"
              v-model="condition.type"
              @change="refilter"
              dense
              hide-details="true"
            ></v-select>
            <v-text-field
              label="value"
              v-model="condition.display_value"
              @change="refilter"
              dense
              hide-details="true"
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
    </v-col>
  </v-card>
</template>

<script>
function get_criteria() {
  var o = this.$root.$options.display.options,
    s = this.$root.settings,
    k,
    i;
  this.criteria = [];
  this.variables = this.$root.$options.source.variables.values.splits[
    this.$root.settings.value
  ];
  this.available_filters = [s.split1, s.split2];
  for (k in o) {
    if (
      k !== "year" &&
      Object.prototype.hasOwnProperty.call(o, k) &&
      (s.split1 == k || s.split2 == k)
    ) {
      this.criteria.push({ name: k, conditions: o[k] });
      if ((i = this.available_filters.indexOf(k)) !== -1)
        this.available_filters.splice(i, 1);
    }
  }
}

export default {
  data: function() {
    return {
      criteria: [],
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
        d[v] = [{ aspect: "mean", type: ">=", display_value: 0, value: 0 }];
        this.criteria.push({ name: v, conditions: d[v] });
        this.$root.queue_update();
      }
    },
    remove_variable: function(v) {
      var d = this.$root.$options.display.options,
        i;
      if (Object.prototype.hasOwnProperty.call(d, v)) {
        delete d[v];
        for (i = this.criteria.length; i--; )
          if (this.criteria[i].name === v) {
            this.criteria.splice(i, 1);
            break;
          }
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
};
</script>

<style scoped>
.v-input--range-slider {
  margin: 3em 1em 0 0;
}
.criteria-row {
  margin: 0.3em 0;
  padding: 0 0.2em;
}
.v-card__title {
  padding: 0;
}
.conditions div {
  width: 24%;
  padding: 0.6em 0 0 0.3em;
  display: inline-block;
}
.conditions .v-input:first-of-type {
  width: 30%;
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
