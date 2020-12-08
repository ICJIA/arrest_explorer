<template>
  <v-card outlined>
    <v-card-title>Options</v-card-title>

    <v-row>
      <v-col><v-subheader>Dark theme</v-subheader></v-col>
      <v-col>
        <v-switch
          v-model="$root.settings.theme_dark"
          inset
          hide-details="true"
        ></v-switch>
      </v-col>
    </v-row>

    <v-row>
      <v-col><v-subheader>Plot as SVG</v-subheader></v-col>
      <v-col>
        <v-switch v-model="$root.settings.svg" inset></v-switch>
      </v-col>
    </v-row>

    <v-row>
      <v-col><v-subheader>Plot width</v-subheader></v-col>
      <v-col>
        <v-text-field
          label="Pixels or Percentage"
          :rules="valid_dim"
          v-model="$root.settings.plot_area[1]"
          dense
          hide-details="true"
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col><v-subheader>Plot height</v-subheader></v-col>
      <v-col>
        <v-text-field
          label="Pixels or Percentage"
          :rules="valid_dim"
          v-model="$root.settings.plot_area[0]"
          dense
          hide-details="true"
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-btn block @click="reset" class="error">Reset options</v-btn>
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
      window.location.reload();
    },
  },
};
</script>
