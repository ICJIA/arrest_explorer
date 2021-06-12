<template>
  <div>
    <p>Site Settings</p>
    <v-row>
      <v-col
        ><v-subheader
          ><label for="theme_dark_toggle">Dark Theme</label></v-subheader
        ></v-col
      >
      <v-col>
        <v-switch
          id="theme_dark_toggle"
          v-model="$root.settings.theme_dark"
          inset
          hide-details
        ></v-switch>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        ><v-subheader
          ><label for="remember_data_toggle"
            >Remember Data View</label
          ></v-subheader
        ></v-col
      >
      <v-col>
        <v-switch
          id="remember_data_toggle"
          v-model="$root.settings.remember_view"
          inset
          hide-details
        ></v-switch>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        ><v-subheader
          ><label for="share_data_toggle"
            >Share Interaction Data</label
          ></v-subheader
        ></v-col
      >
      <v-col>
        <v-switch
          id="share_data_toggle"
          v-model="$root.settings.send_data"
          inset
          hide-details
        ></v-switch>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        ><v-subheader
          ><label for="renderer_toggle">Plot as SVG</label></v-subheader
        ></v-col
      >
      <v-col>
        <v-switch
          id="renderer_toggle"
          v-model="$root.settings.svg"
          inset
          hide-details
        ></v-switch>
      </v-col>
    </v-row>

    <v-divider></v-divider>
    <p>Display Settings</p>

    <v-row>
      <v-col
        ><v-subheader
          ><label for="category_format_select"
            >Category Format</label
          ></v-subheader
        ></v-col
      >
      <v-col>
        <v-select
          id="category_format_select"
          :items="$root.settings.category_formats"
          v-model="$root.settings.format_category"
          hide-details
        ></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        ><v-subheader
          ><label for="table_toggle">Display as Table</label></v-subheader
        ></v-col
      >
      <v-col>
        <v-switch
          id="table_toggle"
          v-model="$root.settings.as_table"
          inset
          hide-details
        ></v-switch>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        ><v-subheader
          ><label for="table_format_select">Table Format</label></v-subheader
        ></v-col
      >
      <v-col>
        <v-select
          id="table_format_select"
          :items="$root.settings.table_formats"
          v-model="$root.settings.format_table"
          hide-details
        ></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        ><v-subheader
          ><label for="plot_type_select">Plot Type</label></v-subheader
        ></v-col
      >
      <v-col>
        <v-select
          id="plot_type_select"
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
          aria-label="animation type"
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
          aria-label="animation duration"
          label="Duration"
          type="number"
          v-model="$root.settings.animation_time"
          step="100"
          min="0"
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        ><v-subheader
          ><label for="unlock_yaxis_max_toggle"
            >Unlock Y-Axis Max</label
          ></v-subheader
        ></v-col
      >
      <v-col>
        <v-switch
          id="unlock_yaxis_max_toggle"
          v-model="$root.settings.unlock_yaxis_max"
          inset
          hide-details
        ></v-switch>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        ><v-subheader
          ><label for="unlock_yaxis_min_toggle"
            >Unlock Y-Axis Min</label
          ></v-subheader
        ></v-col
      >
      <v-col>
        <v-switch
          id="unlock_yaxis_min_toggle"
          v-model="$root.settings.unlock_yaxis_min"
          inset
          hide-details
        ></v-switch>
      </v-col>
    </v-row>

    <v-row>
      <v-btn block @click="reset" class="error">Reset Options</v-btn>
    </v-row>
  </div>
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
