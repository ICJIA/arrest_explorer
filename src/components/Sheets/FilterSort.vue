<template>
  <v-dialog
    v-model="$root.settings.filter_open"
    open-delay="0"
    overlay-opacity=".8"
    max-width="1200px"
  >
    <v-card>
      <v-card-title>
        <span class="headline"
          >Sort and Filter
          <strong>{{ $root.settings.filter_showing }}</strong></span
        >
        <v-spacer></v-spacer
        ><v-btn icon title="close" @click="$root.settings.filter_open = false"
          ><v-icon>mdi-close</v-icon></v-btn
        >
      </v-card-title>
      <v-card-text v-if="filter.length">
        <v-row>
          <v-subheader class="inline-subheader">Sort by</v-subheader>
          <v-btn
            label="sort direction"
            @click="sort.increasing = !sort.increasing"
            text
            >{{ sort.increasing ? "increasing" : "decreasing" }}</v-btn
          >
          <v-select
            aria-label="sort aspect"
            :items="['label', 'mean']"
            v-model="sort.aspect"
            @change="$root.update_data"
            dense
            hide-details
            solo-inverted
            >{{ sort.aspect }}</v-select
          >
        </v-row>
        <v-row class="levels-row">
          <v-col>
            <v-combobox
              label="include levels"
              v-model="selected_levels"
              :items="levels"
              chips
              clearable
              hide-selected
              multiple
              @click:clear="clear_selection"
            >
              <template v-slot:selection="{ item }">
                <v-chip close @click:close="remove_level(item)">{{
                  item
                }}</v-chip>
              </template>
            </v-combobox></v-col
          >
          <v-col
            ><v-btn @click="selected_levels = [...levels]">All</v-btn></v-col
          >
        </v-row>
        <v-subheader>{{
          "Exclude levels based on average " +
            $root.settings.value +
            " per year:"
        }}</v-subheader>
        <v-row>
          <v-text-field
            label="min average per year"
            v-model="min"
            type="number"
            dense
            clearable
            :step="step_size"
            @change="refilter"
          ></v-text-field>
          <v-spacer></v-spacer>
          <v-text-field
            label="max average per year"
            v-model="max"
            type="number"
            dense
            clearable
            :step="step_size"
            @change="refilter"
          ></v-text-field>
        </v-row>
        <v-row class="level-average-hist">
          <p class="text-h5">
            {{
              "Average " +
                $root.format_name($root.settings.value) +
                " by " +
                $root.format_name($root.settings.filter_showing)
            }}
          </p>
          <v-row class="level-mean-display-wraper">
            <v-row class="level-mean-display" id="level_mean_display">
              <v-col v-for="(level, i) in level_info" v-bind:key="i">
                <v-row class="level-mean-bar"
                  ><div
                    color="primary"
                    :class="
                      'mean-bar' +
                        (level.mean < limit[0] || level.mean > limit[1]
                          ? ' excluded'
                          : '')
                    "
                    :style="
                      'height: ' +
                        Math.max(0.1, (level.mean / limit[1]) * 100) +
                        '%'
                    "
                  ></div
                ></v-row>
                <v-row>{{
                  step_size === 1
                    ? Math.round(level.mean)
                    : Math.round(level.mean * 1e3) / 1e3
                }}</v-row>
                <v-row>{{ level.label }}</v-row>
              </v-col>
            </v-row>
          </v-row>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="reset_filter">
          Reset
        </v-btn>
        <v-btn text @click="$root.settings.filter_showing = ''">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data: function() {
    return {
      step_size: 1,
      sort: {},
      filter: {},
      levels: [],
      level_info: [],
      selected_levels: [],
      min: void 0,
      max: void 0,
      limit: [1, 1000],
      level_mean_display: document.getElementById("level_mean_display"),
    };
  },
  methods: {
    refilter: function() {
      var f = this.$root.get_filter(this.$root.settings.filter_showing, "="),
        i;
      if ("object" === typeof f.display_value && f.display_value.length) {
        for (i = f.display_value.length; i--; )
          if (this.selected_levels.indexOf(f.display_value[i]) === -1)
            this.selected_levels.splice(0, 0, f.display_value[i]);
      }
      f.display_value = this.selected_levels;
      f.value = {};
      f.enabled = true;
      f = this.$root.get_filter(this.$root.settings.filter_showing, "<");
      f.display_value =
        "string" === typeof this.max ? Number(this.max) : this.max;
      f.enabled = Number.isFinite(f.display_value);
      f = this.$root.get_filter(this.$root.settings.filter_showing, ">");
      f.display_value =
        "string" === typeof this.min ? Number(this.min) : this.min;
      f.enabled = Number.isFinite(f.display_value);
      this.step_size =
        this.$root.settings.value === "arrests_per_arrestee" ? 0.001 : 1;
      this.$root.update_data();
      this.get_levels_info();
    },
    clear_selection: function() {
      this.selected_levels = [];
      this.$root.get_filter(
        this.$root.settings.filter_showing,
        "="
      ).display_value = [];
    },
    remove_level: function(level) {
      this.selected_levels.splice(this.selected_levels.indexOf(level), 1);
    },
    reset_filter: function() {
      this.min = void 0;
      this.max = void 0;
      this.selected_levels =
        this.$root.settings.filter_showing === "county"
          ? [
              "cook chicago",
              "cook county suburbs",
              "dupage",
              "kane",
              "lake",
              "madison",
            ]
          : [...this.levels];
    },
    get_levels_info: function() {
      this.limit[0] = Infinity;
      this.limit[1] = -Infinity;
      this.level_info = [];
      for (
        var l = this.$root.$options.source.view[
            this.$root.settings.filter_showing
          ].levels,
          i = l.length,
          c,
          f;
        i--;

      ) {
        if (l[i].mean < this.limit[0]) this.limit[0] = l[i].mean;
        if (l[i].mean > this.limit[1]) this.limit[1] = l[i].mean;
        if (!this.level_info.length || l[i].mean < this.level_info[0]) {
          this.level_info.splice(0, 0, l[i]);
        } else {
          for (c = this.level_info.length; c--; ) {
            if (l[i].mean > this.level_info[c].mean) {
              this.level_info.splice(c + 1, 0, l[i]);
              break;
            }
            if (!c) this.level_info.splice(0, 0, l[i]);
          }
        }
      }
      f = this.$root.get_filter(this.$root.settings.filter_showing, ">");
      if (f.value) {
        this.min = f.value;
      }
      f = this.$root.get_filter(this.$root.settings.filter_showing, "<");
      if (f.value) {
        this.max = f.value;
      }
      setTimeout(function() {
        var e = document.getElementById("level_mean_display");
        if (e && e.lastElementChild) e.lastElementChild.scrollIntoView();
      }, 1);
    },
  },
  watch: {
    "$root.settings.filter_showing": function() {
      this.$root.settings.filter_open = !!this.$root.settings.filter_showing;
      this.min = void 0;
      this.max = void 0;
      if (this.$root.settings.filter_showing) {
        this.$root.validate_filter_sort(this.$root.settings.filter_showing);
        this.filter = this.$root.$options.display.options[
          this.$root.settings.filter_showing
        ];

        this.sort = this.$root.$options.display.options.sort[
          this.$root.settings.filter_showing
        ];
        this.levels = [];
        for (
          var i = this.$root.$options.source.variables[
            this.$root.settings.filter_showing
          ].levels.length;
          i--;

        )
          this.levels[i] = this.$root.$options.source.variables[
            this.$root.settings.filter_showing
          ].levels[i].toLowerCase();
        this.selected_levels = [];
        for (
          i = this.$root.$options.source.view[
            this.$root.settings.filter_showing
          ].labels.length;
          i--;

        )
          this.selected_levels[i] = this.$root.$options.source.view[
            this.$root.settings.filter_showing
          ].labels[i].toLowerCase();
        this.get_levels_info();
      }
    },
    "$root.settings.filter_open": function() {
      if (!this.$root.settings.filter_open)
        this.$root.settings.filter_showing = "";
    },
    selected_levels: function() {
      this.refilter();
    },
    sort: {
      handler: function() {
        this.$root.update_data();
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
.theme--dark .mean-bar {
  background: #999;
}
.theme--light .mean-bar {
  background: #333;
}
.level-mean-display-wraper {
  overflow-x: auto;
}
.level-mean-display {
  flex-wrap: nowrap;
}
.level-mean-display .col {
  margin: 0 0.1em;
}
.level-mean-display .row {
  text-align: center;
  display: block;
}
.level-mean-bar {
  position: relative;
  height: 15em;
}
.level-mean-bar div {
  width: 100%;
  margin: 0 0.1em;
  position: absolute;
  bottom: 0;
}
.v-subheader {
  padding: 0;
}
.inline-subheader {
  padding-bottom: 1em;
}
.levels-row .col:last-child {
  max-width: 60px;
  padding: 1.2em 0 0 0.5em;
}
.text-h5 {
  width: 100%;
  text-align: center;
}
.level-average-hist {
  padding: 0.3em 1em;
  border-radius: 10px;
  min-height: 330px;
}
.theme--dark .level-average-hist {
  background: #272727;
}
.theme--light .level-average-hist {
  background: #e0e0e0;
}
</style>
