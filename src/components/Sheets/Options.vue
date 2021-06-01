<template>
  <v-card outlined>
    <v-card-title>Options</v-card-title>

    <v-row>
      <v-col><v-subheader>Dark Theme</v-subheader></v-col>
      <v-col>
        <v-switch
          v-model="$root.settings.theme_dark"
          inset
          hide-details
        ></v-switch>
      </v-col>
    </v-row>

    <v-row>
      <v-col><v-subheader>Share Interaction Data</v-subheader></v-col>
      <v-col>
        <v-switch
          v-model="$root.settings.send_data"
          inset
          hide-details
        ></v-switch>
      </v-col>
    </v-row>

    <v-row>
      <v-col><v-subheader>Category Format</v-subheader></v-col>
      <v-col>
        <v-select
          :items="$root.settings.category_formats"
          v-model="$root.settings.format_category"
          hide-details
        ></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col><v-subheader>Table Format</v-subheader></v-col>
      <v-col>
        <v-select
          :items="$root.settings.table_formats"
          v-model="$root.settings.format_table"
          hide-details
        ></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col><v-subheader>Plot as SVG</v-subheader></v-col>
      <v-col>
        <v-switch v-model="$root.settings.svg" inset hide-details></v-switch>
      </v-col>
    </v-row>

    <v-row>
      <v-col><v-subheader>Standardize Y-Axis Range</v-subheader></v-col>
      <v-col>
        <v-switch
          v-model="$root.settings.standardize_yaxis"
          inset
          hide-details
        ></v-switch>
      </v-col>
    </v-row>

    <v-row>
      <v-col><v-subheader>Plot Type</v-subheader></v-col>
      <v-col>
        <v-select
          :items="$root.settings.plot_types"
          v-model="$root.settings.plot_type"
          hide-details
        ></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col><v-subheader>Plot Animation</v-subheader></v-col>
      <v-col>
        <v-select
          label="Type"
          :items="[
            'linear',
            'quadraticIn',
            'quadraticOut',
            'quadraticInOut',
            'cubicIn',
            'cubicOut',
            'cubicInOut',
            'quarticIn',
            'quarticOut',
            'quarticInOut',
            'quinticIn',
            'quinticOut',
            'quinticInOut',
            'sinusoidalIn',
            'sinusoidalOut',
            'sinusoidalInOut',
            'exponentialIn',
            'exponentialOut',
            'exponentialInOut',
            'circularIn',
            'circularOut',
            'circularInOut',
            'elasticIn',
            'elasticOut',
            'elasticInOut',
            'backIn',
            'backOut',
            'backInOut',
            'bounceIn',
            'bounceOut',
            'bounceInOut',
          ]"
          v-model="$root.settings.animation_type"
        ></v-select>
      </v-col>
      <v-col>
        <v-text-field
          label="Duration"
          type="number"
          v-model="$root.settings.animation_time"
          step="100"
          min="0"
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-btn block @click="reset" class="error">Reset Options</v-btn>
    </v-row>
  </v-card>
</template>

<script>
export default {
  data: function() {
    return {
      valid_dim: [
        function(v) {
          return (
            /^\d*\.?\d*(?:px|%)?$/.test(v) ||
            "Must be a number of pixels or a percentage."
          );
        },
      ],
    };
  },
  methods: {
    reset: function() {
      localStorage.clear();
      window.location.replace(this.$root.settings.url);
    },
  },
};
</script>

<style scoped>
.col {
  margin: 0 0.5em 0 0;
}
</style>
