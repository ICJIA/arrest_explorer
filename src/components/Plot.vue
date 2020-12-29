<template>
  <div id="plot"></div>
</template>

<script>
import echarts from "echarts/lib/echarts";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";
import "echarts/lib/component/legend";
import "echarts/lib/component/legendScroll";
import "echarts/lib/component/graphic";
import "echarts/lib/chart/line";
import "echarts/lib/chart/bar";
import "echarts/lib/chart/scatter";
import "zrender/lib/svg/svg";
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
          fontFamily: "Lato",
        },
        tooltip: {
          trigger: "axis",
          transitionDuration: 0,
          axisPointer: {
            type: "shadow",
          },
        },
        animationEasing: "elasticOut",
        animationDuration: 700,
        animationEasingUpdate: "elasticOut",
        animationDurationUpdate: 700,
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
