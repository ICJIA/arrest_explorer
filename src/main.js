import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import rawdata from "./data.json";
import levels from "./levels.json";
import Dataview from "./dataview.js";

Vue.config.productionTip = false;

const store_options = [
    "value",
    "by_year",
    "split1",
    "split2",
    "year",
    "svg",
    "plot_type",
    "plot_area",
    "vars",
    "as_table",
    "theme_dark",
    "format_file",
    "format_table",
    "format_category",
    "format_image",
  ],
  update_after = [
    "as_table",
    "format_table",
    "format_category",
    "value",
    "by_year",
    "split1",
    "split2",
  ],
  store_option = function(k, v) {
    localStorage.setItem(k, JSON.stringify(v));
  },
  queue_update = function() {
    window.requestAnimationFrame(this.update_data);
  };

var settings = {
    base_url: "https://icjia.illinois.gov/chri/api/",
    year: {
      range: [Infinity, -Infinity],
      window: [{ start: 0, end: 100, show: false }],
    },
    active: false,
    export_open: false,
    plot_types: ["line", "bar", "scatter"],
    svg: false,
    plot_type: "line",
    value: "arrests",
    by_year: true,
    flip_axes: false,
    split1: "",
    split2: "",
    sheet: "",
    as_table: false,
    theme_dark: true,
    format_file: "csv",
    format_json: "arrays",
    format_table: "mixed",
    format_category: "labels",
    format_image: "svg",
    plot_area: ["75%", "100%"],
    image_dim: ["100%", "100%"],
  },
  watch = {
    "settings.year": [
      {
        handler: function() {
          this.$options.display.options.year = [
            { type: ">=", value: this.year_window[0] },
            { type: "<=", value: this.year_window[1] },
          ];
          this.$options.source.update(this.$options.display.options);
          this.queue_update();
        },
        deep: true,
      },
    ],
    "settings.theme_dark": [
      function() {
        this.$vuetify.theme.dark = this.settings.theme_dark;
        if (!this.settings.as_table) this.draw_plot();
      },
    ],
    "settings.svg": [
      function() {
        this.$options.plot.initOptions.renderer = this.settings.svg
          ? "svg"
          : "canvas";
        if (!this.settings.as_table) this.draw_plot();
      },
    ],
    "settings.plot_area": [
      function() {
        if (!this.settings.as_table) this.draw_plot();
      },
    ],
    "settings.plot_type": [
      function() {
        for (var i = this.$options.display.series.length; i--; ) {
          this.$options.display.series[i].type = this.settings.plot_type;
        }
        if (this.$options.plot.instance)
          this.$options.plot.instance.setOption({
            series: this.$options.display.series,
          });
      },
    ],
  },
  data = new Dataview(rawdata, levels);

// initialize settings and watchers
(function() {
  for (var k, i = store_options.length; i--; ) {
    k = "settings." + store_options[i];
    if (!Object.prototype.hasOwnProperty.call(watch, k)) watch[k] = [];
    watch[k].push({
      handler: store_option.bind(null, store_options[i]),
      deep: "object" === typeof settings[store_options[i]],
    });
    if (update_after.indexOf(store_options[i]) !== -1)
      watch[k].push({
        handler: queue_update,
        deep: "object" === typeof settings[store_options[i]],
      });
  }
  for (i = data.raw.year.length; i--; ) {
    if (settings.year.range[0] > data.raw.year[i])
      settings.year.range[0] = data.raw.year[i];
    if (settings.year.range[1] < data.raw.year[i])
      settings.year.range[1] = data.raw.year[i];
  }
})();

new Vue({
  vuetify,
  source: data,
  display: {
    options: {
      value: settings.value,
      split: [settings.split1, settings.split2],
      county: [{ type: ">", aspect: "mean", display_value: 8000, value: 8000 }],
    },
    table: { header: [], rows: [] },
    title: [{ left: "center" }],
    legend: { data: [], top: "bottom", type: "plain" },
    xAxis: [{ type: "category", gridIndex: 0, data: data.raw.year }],
    yAxis: [{ type: "value", gridIndex: 0, scale: true }],
    series: [],
    grid: [],
    rows: [],
    vars: {},
  },
  data: {
    settings,
    table: {},
  },
  watch,
  mounted() {
    var k, i, v;
    for (i = store_options.length; i--; ) {
      if (
        Object.prototype.hasOwnProperty.call(this.settings, store_options[i])
      ) {
        try {
          v = JSON.parse(localStorage.getItem(store_options[i]));
        } catch (e) {
          v = undefined;
        }
        if (v || "boolean" === typeof v) {
          if (typeof this.settings[store_options[i]] === typeof v) {
            if (typeof v === "object" && !v.length) {
              for (k in v)
                if (Object.prototype.hasOwnProperty.call(v, k)) {
                  this.settings[store_options[i]][k] = v[k];
                }
            } else this.settings[store_options[i]] = v;
          } else
            localStorage.setItem(
              store_options[i],
              JSON.stringify(this.settings[store_options[i]])
            );
        }
      }
    }
    if (window.location.search) {
      var params = data.parse_query(window.location.search),
        s = this.settings,
        d = this.$options.display.options;
      for (k in params) {
        if (k === "split" && params[k].value.length) {
          s.split1 = d.split[0] = params[k].value[0];
          if (params[k].value.length > 1)
            s.split2 = s.split[1] = params[k].value[1];
        } else if (
          Object.prototype.hasOwnProperty.call(s, k) &&
          params[k].type === "="
        ) {
          s[k] =
            typeof s[k] === "boolean"
              ? params[k].display_value === "true"
              : params[k].display_value;
        } else {
          if (
            Object.prototype.hasOwnProperty.call(d, k) &&
            k !== "split" &&
            d[k].push
          ) {
            d[k].push(params[k]);
          } else {
            d[k] = k === "sort" ? params[k].value : [params[k]];
          }
        }
      }
    }
    this.$options.display.options.year = [
      { type: ">=", value: this.year_window[0] },
      { type: "<=", value: this.year_window[1] },
    ];
    setTimeout(
      function() {
        this.settings.active = true;
        this.queue_update();
      }.bind(this),
      0
    );
  },
  computed: {
    year_window: {
      get: function() {
        var o = this.settings.year.window[0],
          r = this.settings.year.range,
          span = r[1] - r[0];
        return [(o.start / 100) * span + r[0], (o.end / 100) * span + r[0]];
      },
      set: function(v) {
        var o = this.settings.year.window[0],
          r = this.settings.year.range,
          span = r[1] - r[0];
        o.start = ((v[0] - r[0]) / span) * 100;
        o.end = ((v[1] - r[0]) / span) * 100;
      },
    },
  },
  methods: {
    display_query: function(ex, d) {
      d = d || this.$options.display.options;
      ex = ex || {};
      var parts = [],
        string = "",
        k,
        i;
      for (k in d)
        if (Object.prototype.hasOwnProperty.call(d, k)) {
          if (!Object.prototype.hasOwnProperty.call(ex, k) || ex[k] !== d[k]) {
            if (k === "split") {
              if (d[k][0]) {
                parts.push({
                  slot: k,
                  type: "=",
                  value: d[k][0] + (d[k][1] ? "," + d[k][1] : ""),
                });
                string +=
                  (string ? "&" : "/?") +
                  k +
                  "=" +
                  d[k][0] +
                  (d[k][1] ? "," + d[k][1] : "");
              }
            } else {
              if (typeof d[k] === "object") {
                for (i = d[k].length; i--; ) {
                  if (
                    k !== "year" ||
                    d[k][i].value !==
                      this.$root.settings.year.range[
                        d[k][i].type === ">=" ? 0 : 1
                      ]
                  ) {
                    parts.push({
                      slot: k,
                      aspect: d[k][i].aspect,
                      type: d[k][i].type,
                      value: d[k][i].display_value,
                    });
                    string +=
                      (string ? "&" : "/?") +
                      k +
                      (d[k][i].aspect ? "[" + d[k][i].aspect + "]" : "") +
                      d[k][i].type +
                      d[k][i].display_value;
                  }
                }
              } else {
                parts.push({ slot: k, type: "=", value: d[k] });
                string += (string ? "&" : "/?") + k + "=" + d[k];
              }
            }
          }
        }
      return { parts, string };
    },
    to_area: function(s) {
      return s.replace(/[^0-9%pxrem]+/, "").replace(/(?<=[0-9])$/, "px");
    },
    queue_update,
    draw_plot: function() {
      var h = this.to_area(this.settings.plot_area[0]);
      this.$options.plot.element.style.height = /%$/.test(h)
        ? (this.$el.getBoundingClientRect().height * parseInt(h)) / 100 + "px"
        : h;
      this.$options.plot.element.style.width = this.to_area(
        this.settings.plot_area[1]
      );
      if (this.$options.plot.instance) {
        this.$options.plot.instance.dispose();
        this.$options.plot.instance = null;
      }
      this.$options.plot.instance = this.$options.plot.engine.init(
        this.$options.plot.element,
        this.settings.theme_dark ? "dark" : "light",
        this.$options.plot.initOptions
      );
      this.$options.plot.options.legend = this.$options.display.legend;
      this.$options.plot.options.title = this.$options.display.title;
      this.$options.plot.options.xAxis = this.$options.display.xAxis;
      this.$options.plot.options.yAxis = this.$options.display.yAxis;
      this.$options.plot.options.series = this.$options.display.series;
      this.$options.plot.options.grid = this.$options.display.grid.length
        ? this.$options.display.grid
        : null;
      this.$options.plot.instance.setOption(this.$options.plot.options);
    },
    make_grid: function(top, height) {
      return {
        top: top + "%",
        left: "15%",
        right: "13%",
        height: height + "%",
      };
    },
    update_data: function() {
      if (this.settings.active) {
        this.settings.active = false;
        var s = this.settings,
          d = this.$options.display,
          options,
          pos = 1,
          step = 50,
          means,
          i,
          n,
          l,
          nl,
          sd;
        d.legend.data = [];
        d.legend.selected = {};
        d.title = [
          { left: "center", text: (s.by_year ? "" : "average ") + s.value },
        ];
        d.series = [];
        d.grid = [];
        d.yAxis = [{ type: "value", name: s.value, scale: true }];
        d.xAxis = [{ type: "category", splitLine: false }];
        options = {
          textStyle: this.$options.plot.options.textStyle,
          tooltip: this.$options.plot.options.tooltip,
          animationDurationUpdate: this.$options.plot.options
            .animationDurationUpdate,
          animationEasingUpdate: this.$options.plot.options
            .animationEasingUpdate,
          title: d.title,
          legend: d.legend,
          xAxis: d.xAxis,
          yAxis: d.yAxis,
          series: d.series,
          grid: d.grid,
        };
        // validate splits
        if (s.split1) {
          if (
            !Object.prototype.hasOwnProperty.call(
              this.$options.source.variables,
              s.split1
            ) ||
            this.$options.source.variables.values.splits[s.value].indexOf(
              s.split1
            ) === -1
          )
            s.split1 = "";
        }
        if (s.split2) {
          if (
            !s.split1 ||
            this.$options.source.variables.values.splits[s.value].indexOf(
              s.split2
            ) === -1 ||
            this.$options.source.variables[s.split1].splits[s.value].indexOf(
              s.split2
            ) === -1
          ) {
            s.split2 = "";
          }
        }
        d.options.value = s.value;
        d.options.format_category = s.format_category;
        d.options.split[0] = s.split1;
        d.options.split[1] = s.split2;
        this.$options.source.update(d.options);
        this.$options.source.view = sd = this.$options.source.prepare_view();
        if (s.as_table) {
          this.table = this.$options.source.reformat(s.format_table, true);
        } else {
          if (s.by_year) {
            d.title[0].text = s.value + " by year";
            d.xAxis[0].name = "year";
            d.xAxis[0].data = sd.year.filtered;
          } else {
            d.title[0].subtext =
              this.year_window[0] === this.year_window[1]
                ? this.year_window[0]
                : this.year_window[0] + " to " + this.year_window[1];
            if (s.split1) {
              d.title[0].text += " by " + s.split1;
              d.xAxis[0].name = s.split1;
              d.xAxis[0].data = sd[s.split1].display;
            }
          }
          if (!s.split1) {
            d.grid.push(this.make_grid(10, 80));
            if (s.by_year) {
              d.series.push({
                type: s.plot_type,
                data: sd.total.filtered,
              });
            } else {
              d.title[0].text = "average " + s.value;
              d.xAxis[0].name = s.split1;
              d.xAxis[0].data = ["average"];
              d.series.push({
                name: s.split1,
                type: s.plot_type,
                data: [Math.round(sd.total.sum / sd.total.filtered.length)],
              });
            }
          } else {
            if (s.split2) {
              d.legend.data = sd[s.split2].display;
              if (s.by_year) {
                d.title[0].text +=
                  " within " + s.split1 + " between " + s.split2;
                d.xAxis.splice(0, 1);
                d.yAxis.splice(0, 1);
                step =
                  (80 - (sd[s.split1].display.length - 1) * 8) /
                  sd[s.split1].display.length;

                pos = 10;
                for (i = 0, n = sd[s.split1].display.length; i < n; i++) {
                  if (i) {
                    d.title.push({
                      left: "center",
                      subtext: s.split1 + ": " + sd[s.split1].display[i],
                      top: pos - 4 + "%",
                      itemGap: 0,
                    });
                  } else {
                    d.title[0].subtext =
                      s.split1 + ": " + sd[s.split1].display[i];
                  }
                  d.grid.push(this.make_grid(pos, step));
                  d.yAxis.push({ type: "value", gridIndex: i, scale: true });
                  d.xAxis.push({
                    type: "category",
                    gridIndex: i,
                    data: sd.year.filtered,
                    splitLine: false,
                  });
                  pos += step + 8;
                  for (
                    l = 0,
                      nl = sd[s.split1].subgroups[s.split2][i].levels.length;
                    l < nl;
                    l++
                  ) {
                    d.series.push({
                      name: sd[s.split1].subgroups[s.split2][i].levels[l].label,
                      type: s.plot_type,
                      data:
                        sd[s.split1].subgroups[s.split2][i].levels[l].filtered,
                      xAxisIndex: i,
                      yAxisIndex: i,
                    });
                  }
                }
              } else {
                d.title[0].text += " between " + s.split2;
                d.grid.push(this.make_grid(10, 80));
                sd = this.$options.source.view[s.split1];
                for (i = 0, n = d.legend.data.length; i < n; i++) {
                  for (
                    means = [], l = 0, nl = sd.subgroups[s.split2].length;
                    l < nl;
                    l++
                  ) {
                    means.push(
                      sd.subgroups[s.split2][l].levels.length > l &&
                        sd.subgroups[s.split2][l].levels.length > i
                        ? Math.round(
                            sd.subgroups[s.split2][l].levels[i].sum /
                              sd.subgroups[s.split2][l].levels[i].filtered
                                .length
                          )
                        : 0
                    );
                  }
                  d.series.push({
                    name: d.legend.data[i],
                    type: s.plot_type,
                    data: means,
                  });
                }
              }
            } else {
              d.grid.push(this.make_grid(10, 80));
              sd = this.$options.source.view[s.split1];
              if (s.by_year) {
                d.title[0].text += " between " + s.split1;
                for (i = 0, n = sd.levels.length; i < n; i++) {
                  d.series.push({
                    name: sd.levels[i].label,
                    type: s.plot_type,
                    data: sd.levels[i].filtered,
                  });
                  d.legend.data.push(sd.levels[i].label);
                }
              } else {
                means = [];
                for (i = 0, n = sd.levels.length; i < n; i++)
                  means.push(
                    Math.round(sd.levels[i].sum / sd.levels[i].filtered.length)
                  );
                d.series.push({
                  type: s.plot_type,
                  data: means,
                });
                d.legend.data.push(sd.label);
              }
            }
          }
          d.legend.type = d.legend.data.length > 9 ? "scroll" : "plain";
          if (this.$options.plot && this.$options.plot.instance) {
            this.$options.plot.instance.setOption(options, {
              notMerge: true,
            });
          } else this.draw_plot();
        }
        this.settings.active = true;
      }
    },
  },
  render: (h) => h(App),
}).$mount("#app");
