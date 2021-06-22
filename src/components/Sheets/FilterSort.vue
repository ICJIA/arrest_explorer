<template>
  <v-dialog
    v-model="$root.settings.filter_open"
    open-delay="0"
    overlay-opacity=".8"
    max-width="1200px"
  >
    <v-card>
      <v-card-title role="header" aria-level="2">
        <h1 class="headline">
          Sort &amp; Filter <strong>{{ $root.settings.filter_showing }}</strong>
        </h1>
        <v-spacer></v-spacer>
        <v-btn text @click="reset_filter"> Reset </v-btn
        ><v-btn icon title="close" @click="$root.settings.filter_open = false"
          ><v-icon>mdi-close</v-icon></v-btn
        >
      </v-card-title>
      <v-card-text v-if="$root.settings.filter_showing && filter.length">
        <v-row>
          <v-subheader class="inline-subheader">Sort by</v-subheader>
          <v-select
            :aria-label="
              'sort by ' + sort.aspects[0] + ' or ' + sort.aspects[1] + '?'
            "
            :items="sort.aspects"
            v-model="sort.aspect_proxy"
            @change="update_direction"
            style="max-width: 255px"
          ></v-select>
          <p class="inline-p">in</p>
          <v-select
            :aria-label="
              'sort in ' +
                (sort.aspect === 'label'
                  ? 'alphabetical or reverse alphabetical'
                  : 'increasing or decreasing') +
                ' order'
            "
            :items="
              sort.aspect === 'label'
                ? ['alphabetical', 'reverse alphabetical']
                : ['increasing', 'decreasing']
            "
            v-model="sort.direction"
            @change="update_increasing"
            style="max-width: 255px"
          ></v-select>
          <p class="inline-p">order.</p>
        </v-row>
        <v-row class="levels-row">
          <v-col>
            <v-combobox
              :label="
                'Select ' +
                  $root.variable_parts[$root.settings.filter_showing].multi +
                  ' from this list:'
              "
              :aria-label="
                'Select ' +
                  $root.variable_parts[$root.settings.filter_showing].multi +
                  ' from this list; ' +
                  selected_levels.length +
                  ' selected.'
              "
              v-model="selected_levels"
              :items="levels"
              chips
              clearable
              counter
              deletable-chips
              hide-selected
              multiple
              @click:clear="clear_selection"
            >
              <template v-slot:selection="{ item, attrs }">
                <v-chip
                  :aria-label="item"
                  v-bind="attrs"
                  :input-value="item"
                  close
                  :close-label="
                    'exclude ' +
                      $root.variable_parts[$root.settings.filter_showing]
                        .single +
                      ' ' +
                      item
                  "
                  @click:close="remove_level(item)"
                  >{{ item }}</v-chip
                >
              </template>
            </v-combobox></v-col
          >
          <v-col
            ><v-btn
              :title="
                'include all ' +
                  $root.variable_parts[$root.settings.filter_showing].multi
              "
              @click="selected_levels = [...levels]"
              >All</v-btn
            ></v-col
          >
        </v-row>
        <v-subheader>{{
          "Then further filter the above selected " +
            $root.variable_parts[$root.settings.filter_showing].multi +
            " if their associated average " +
            $root.settings.value +
            " also meet the following criteria:"
        }}</v-subheader>
        <v-row>
          <v-text-field
            label="min average"
            :aria-label="
              'exclude selected ' +
                $root.variable_parts[$root.settings.filter_showing].multi +
                ' with average ' +
                $root.settings.value +
                ' under this amount'
            "
            v-model="min"
            type="number"
            dense
            clearable
            :step="step_size"
            @change="refilter"
            style="max-width: 150px"
          ></v-text-field>
          <v-spacer></v-spacer>
          <v-text-field
            label="max average"
            :aria-label="
              'exclude selected ' +
                $root.variable_parts[$root.settings.filter_showing].multi +
                ' with average ' +
                $root.settings.value +
                ' over this amount'
            "
            v-model="max"
            type="number"
            dense
            clearable
            :step="step_size"
            @change="refilter"
            style="max-width: 150px"
          ></v-text-field>
        </v-row>
        <p class="caption">
          Note that each variable is filtered independently, even when the
          dataset is broken by two variables. For example, if you break by
          county then race, minimum and maximum averages for race are overall
          (as shown), not within counties.
        </p>
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
      this.selected_levels = this.$root.get_filter(
        this.$root.settings.filter_showing,
        "="
      ).display_value =
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
    update_direction: function(label) {
      this.sort.aspect =
        this.sort.aspects.indexOf(this.sort.aspect_proxy) === 0
          ? "label"
          : "mean";
      this.sort.direction =
        this.sort.aspect === "label"
          ? this.sort.increasing
            ? "alphabetical"
            : "reverse alphabetical"
          : this.sort.increasing
          ? "increasing"
          : "decreasing";
      if ("string" === typeof label) this.$root.update_data();
    },
    update_increasing: function() {
      this.sort.increasing =
        this.sort.direction === "increasing" ||
        this.sort.direction === "alphabetical";
      this.$root.update_data();
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
        this.update_direction();
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
  },
  updated() {
    this.$nextTick(this.$root.addListenersToSelects.bind(this));
  },
};
</script>

<style scoped>
.v-input--dense.v-select:last-of-type {
  margin-left: 0.5em;
}
.v-card {
  max-height: 100%;
}
.v-card__text {
  max-height: 70%;
  overflow-y: auto;
}
.v-application .text-h5 {
  line-height: 2.25rem;
}
.v-chip.v-size--default {
  white-space: break-spaces;
  height: auto;
  min-height: 32px;
  display: inline-grid;
}
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
  margin: 0;
}
.level-mean-bar {
  position: relative;
  height: 10em;
}
.level-mean-bar div {
  width: 100%;
  margin: 0 0.1em;
  position: absolute;
  bottom: 0;
}
.v-subheader {
  padding: 2.3em 0.5em 0 0;
}
.inline-subheader {
  padding-bottom: 1.2em;
}
.inline-p {
  padding: 0;
  margin: 1.5em 0.5em 0 0.5em;
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
  min-height: 230px;
}
.theme--dark .level-average-hist {
  background: #272727;
}
.theme--light .level-average-hist {
  background: #e0e0e0;
}
.row,
.row + .row {
  margin: 0.5em 0 0 0;
}
</style>
