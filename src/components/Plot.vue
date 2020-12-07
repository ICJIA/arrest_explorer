<template>
  <div id="plot"></div>
</template>

<script>
import echarts from "echarts";
import theme_dark from "../assets/theme-dark.json";
import theme_light from "../assets/theme-light.json";

echarts.registerTheme("dark", theme_dark);
echarts.registerTheme("light", theme_light);

export default {
  mounted() {
    this.$root.$options.plot = {
      engine: echarts,
      element: document.getElementById("plot"),
      initOptions: {
        renderer: this.$root.settings.svg ? "svg" : "canvas",
        locale: "EN",
      },
      options: {
        textStyle: {
          fontFamily: "Lucida Sans",
        },
        tooltip: {
          trigger: "axis",
        },
        animationDurationUpdate: 1000,
        animationEasingUpdate: "quinticInOut",
      },
    };
  },
};
</script>

<style scoped>
#plot {
  width: 100%;
  height: 500px;
  min-width: 0.5em;
}
svg {
  overflow: visible;
}
</style>
