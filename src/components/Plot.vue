<template>
  <div id="plot"></div>
</template>

<script>
import * as echarts from "echarts/core";
import {
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  LegendScrollComponent,
  GraphicComponent,
} from "echarts/components";
import { LineChart, BarChart, ScatterChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import "zrender/lib/svg/svg";
import theme_dark from "../assets/theme-dark.json";
import theme_light from "../assets/theme-light.json";

echarts.use([
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  LegendScrollComponent,
  GraphicComponent,
  LineChart,
  BarChart,
  ScatterChart,
  CanvasRenderer,
]);
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
        animationEasing: "elasticOut",
        animationDuration: 700,
        animationEasingUpdate: "elasticOut",
        animationDurationUpdate: 700,
        stateAnimation: {
          duration: 700,
          easing: "elasticOut",
        },
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
