<template>
  <v-row>
    <v-select
      v-if="which === 'split1' || $root.settings.split1"
      :label="spec.entry === 'split2' ? 'and by' : 'Break data by'"
      :aria-label="
        'step 3. Break by ' +
          (spec.entry === 'split2' ? 'second' : 'first') +
          ' variable:'
      "
      :items="spec.vars"
      v-model="$root.settings[spec.entry]"
      @change="$root.fill_spec(which)"
      clearable
      hide-details
    ></v-select>
    <v-sheet class="filter-results" v-if="spec.name && $root.settings[which]">
      <v-row class="compact-row">{{
        spec.displaying +
          " / " +
          spec.levels +
          " " +
          $root.variable_parts[spec.name].multi
      }}</v-row>
      <v-row class="compact-row"
        >{{
          "sorted " +
            (spec.sort.aspect === "label"
              ? spec.sort.increasing
                ? "alphabetically"
                : "reverse alphabetically"
              : "by average " +
                $root.settings.value +
                " (" +
                (spec.sort.increasing ? "increasing" : "decreasing") +
                ") ")
        }}
      </v-row>
      <v-row>
        <v-btn
          :title="'edit ' + spec.name + ' filter'"
          text
          block
          color="primary"
          @click="$root.settings.filter_showing = spec.name"
        >
          <span>{{ "Edit " + spec.name + " filter" }}</span
          ><v-icon x-small>mdi-cog</v-icon>
        </v-btn>
      </v-row>
    </v-sheet>
  </v-row>
</template>

<script>
export default {
  data: function() {
    return {
      spec: {},
    };
  },
  props: {
    which: String,
  },
  watch: {
    "$root.settings.data_menu_open": function() {
      this.spec = this.$root.$options.display.specs[this.which];
    },
  },
};
</script>

<style scoped>
.filter-results {
  font-size: 0.65em;
  border-radius: 0 0 25px 25px;
  width: 100%;
  margin: 0 0 0.5em 0;
}
.filter-results.theme--light {
  background: #ececec;
}
.v-sheet .col:first-child {
  max-width: 100px;
}
.v-btn {
  border-radius: 0 0 25px 25px;
}
.v-sheet > .row {
  margin: 0;
  opacity: 0.7;
}
.compact-row {
  padding: 0 0.5em;
}
.v-sheet > .row:first-child {
  padding-top: 0.3em;
}
.v-sheet .col:last-child {
  text-align: right;
}
.v-sheet .row:last-child {
  text-align: center;
}
.v-sheet .v-icon {
  padding: 0 0 0 0.5em;
}
</style>
