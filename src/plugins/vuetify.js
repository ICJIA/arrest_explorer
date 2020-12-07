import Vue from "vue";
import Vuetify from "vuetify/lib";
import theme_dark from "../assets/theme-dark.json";
import theme_light from "../assets/theme-light.json";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: true,
    themes: {
      light: {
        primary: theme_light.color[0],
        secondary: theme_light.color[6],
        accent: theme_light.color[2],
        error: theme_light.color[5],
        info: theme_light.color[3],
        success: theme_light.color[4],
        warning: theme_light.color[1],
      },
      dark: {
        primary: theme_dark.color[0],
        secondary: theme_dark.color[6],
        accent: theme_dark.color[2],
        error: theme_dark.color[5],
        info: theme_dark.color[3],
        success: theme_dark.color[4],
        warning: theme_dark.color[1],
      },
    },
  },
});
