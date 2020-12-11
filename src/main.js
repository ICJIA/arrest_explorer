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
  },
  seps = /[\s_]/g;

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
    plot_area: ["85%", "100%"],
    image_dim: ["100%", "100%"],
  },
  plot_part_menu = {
    open: false,
    x: 100,
    y: 100,
    options: [],
    part: "value",
    value: "",
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
        if (!this.settings.as_table) {
          for (var i = this.$options.display.graphic.length; i--; )
            this.$options.display.graphic[i].style.fill = this.color;
          this.draw_plot();
        }
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
    graphic: [],
    legend: {
      data: [],
      top: "90",
      align: "right",
      right: "right",
      orient: "vertical",
      type: "plain",
      pageButtonGap: 10,
      formatter: function(l) {
        return l.length > 16 ? l.substr(0, 14) + "\u2026" : l;
      },
    },
    xAxis: [
      {
        type: "category",
        gridIndex: 0,
        data: data.raw.year,
        axisLabel: {
          rotate: 0,
          formatter: function(l) {
            return l.length > 16 ? l.substr(0, 14) + "\u2026" : l;
          },
        },
      },
    ],
    yAxis: [{ type: "value", gridIndex: 0, scale: true }],
    series: [],
    grid: [],
    rows: [],
  },
  data: {
    settings,
    table: {},
    plot_part_menu,
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
    color: function() {
      return this.settings.theme_dark ? "#eeeeee" : "#333333";
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
    format_name: function(n) {
      for (var s = n.split(seps), i = s.length, r = ""; i--; ) {
        r =
          (i ? " " : "") +
          s[i].substr(0, 1).toUpperCase() +
          s[i].substr(1).toLowerCase() +
          r;
      }
      return r;
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
      this.$options.plot.options.title = this.$options.display.title;
      this.$options.plot.options.graphic = this.$options.display.graphic;
      this.$options.plot.options.legend = this.$options.display.legend;
      this.$options.plot.options.xAxis = this.$options.display.xAxis;
      this.$options.plot.options.yAxis = this.$options.display.yAxis;
      this.$options.plot.options.series = this.$options.display.series;
      this.$options.plot.options.grid = this.$options.display.grid.length
        ? this.$options.display.grid
        : null;
      this.$options.plot.instance.setOption(this.$options.plot.options);
    },
    make_grid: function(top, height) {
      var aslegend = this.settings.split2
          ? this.settings.split2
          : this.settings.split1 && this.settings.by_year
          ? this.settings.split1
          : "",
        r = {
          top: (top || 10) + "%",
          left: "100",
          right: aslegend
            ? String(
                9 *
                  Math.max(
                    Math.min(
                      17,
                      this.$options.source.view[aslegend].display_info.maxlen
                    ),
                    aslegend.length + 3,
                    10
                  )
              )
            : "20",
        },
        wheight = this.$el.getBoundingClientRect().height;
      if (!height) height = wheight > 700 ? 83 : wheight > 500 ? 80 : 74;
      if (
        !this.settings.by_year &&
        this.settings.split1 &&
        this.$options.source.view[this.settings.split1].display_info.sumlen *
          12 >
          this.$el.getBoundingClientRect().width - 450
      ) {
        r.bottom =
          Math.min(
            18,
            this.$options.source.view[this.settings.split1].display_info
              .maxlen + 3
          ) *
            8.5 +
          "";
      } else r.height = height + "%";
      return r;
    },
    update_data: function() {
      if (this.settings.active) {
        this.settings.active = false;
        var s = this.settings,
          d = this.$options.display,
          f = { value: this.format_name(s.value) },
          width = this.$el.getBoundingClientRect().width,
          scale = 2,
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
        d.series = [];
        d.grid = [];
        d.title = [{ left: "center", top: "6%" }];
        d.yAxis = [{ type: "value", scale: true }];
        d.xAxis = [
          {
            type: "category",
            splitLine: false,
            axisLabel: {
              rotate: 0,
              formatter: d.legend.formatter,
            },
          },
        ];
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
        if (s.split1) f.split1 = this.format_name(s.split1);
        if (s.split2) f.split2 = this.format_name(s.split2);
        d.graphic = [
          {
            type: "text",
            id: "title-label",
            right: "center",
            top: "3",
            z: 100,
            onclick: function() {
              this.settings.by_year = !this.settings.by_year;
            }.bind(this),
            scale: [2, 2],
            style: {
              text: (s.by_year ? "" : "Average ") + f.value,
              font: "20px 'Lucida Sans', sans-serif",
              fill: this.color,
            },
          },
          {
            type: "text",
            id: "subtitle-label",
            right: "center",
            top: s.by_year && s.split2 ? "45" : "55",
            z: 100,
            cursor: "default",
            style: {
              text: "",
              font: "13px 'Lucida Sans', sans-serif",
              fill: this.color + "E0",
            },
          },
          {
            type: "text",
            id: "y-axis-label",
            z: 100,
            left: "5",
            top: "middle",
            onclick: function(e) {
              var o = this.plot_part_menu;
              o.x = e.offsetX;
              o.y = e.offsetY;
              o.options = this.$options.source.variables.values.values;
              o.part = "value";
              this.plot_part_menu.value = this.settings.value;
              setTimeout(
                function() {
                  this.open = true;
                }.bind(o),
                0
              );
            }.bind(this),
            rotation: 1.58,
            style: {
              text: f.value,
              font: "20px 'Lucida Sans', sans-serif",
              fill: this.color,
            },
          },
          {
            type: "text",
            id: "x-axis-label",
            z: 100,
            left: "center",
            bottom: "5",
            onclick: function(e) {
              var o = this.plot_part_menu;
              o.x = e.offsetX;
              o.y = e.offsetY;
              if (this.settings.by_year) {
                o.options = this.$options.source.variables.values.splits[
                  this.settings.value
                ];
              } else {
                o.options = [
                  "year",
                  ...this.$options.source.variables.values.splits[
                    this.settings.value
                  ],
                ];
              }
              o.part = "split1";
              this.plot_part_menu.value = this.settings.split1;
              setTimeout(
                function() {
                  this.open = true;
                }.bind(o),
                0
              );
            }.bind(this),
            style: {
              text: s.by_year ? "Year" : f.split1,
              font: "20px 'Lucida Sans', sans-serif",
              fill: this.color,
            },
          },
          {
            type: "text",
            id: "legend-label",
            right: "10",
            top: "70",
            onclick: function(e) {
              var o = this.plot_part_menu;
              o.x = e.offsetX;
              o.y = e.offsetY;
              o.options = this.settings.split2
                ? this.$options.source.variables[this.settings.split1].splits[
                    this.settings.value
                  ]
                : this.$options.source.variables.values.splits[
                    this.settings.value
                  ];
              o.part = this.settings.split2 ? "split2" : "split1_by_year";
              this.plot_part_menu.value = this.settings[
                this.settings.split2 ? "split2" : "split1"
              ];
              setTimeout(
                function() {
                  this.open = true;
                }.bind(o),
                0
              );
            }.bind(this),
            style: {
              text:
                s.by_year || f.split2 ? (f.split2 ? f.split2 : f.split1) : "",
              font: "16px 'Lucida Sans', sans-serif",
              fill: this.color,
              textAlign: "left",
            },
          },
        ];

        d.options.value = s.value;
        d.options.by_year = s.by_year;
        d.options.format_category = s.format_category;
        d.options.split[0] = s.split1;
        d.options.split[1] = s.split2;
        this.$options.source.update(d.options);
        sd = this.$options.source.prepare_view();
        if (s.as_table) {
          this.table = this.$options.source.reformat(s.format_table, true);
        } else {
          if (s.by_year) {
            d.graphic[0].style.text = f.value + " by Year";
            d.xAxis[0].data = sd.year.filtered;
          } else {
            d.graphic[1].style.text =
              this.year_window[0] === this.year_window[1]
                ? "Year = " + this.year_window[0]
                : "Year between " +
                  this.year_window[0] +
                  " and " +
                  this.year_window[1];
            if (s.split1) {
              d.graphic[0].style.text += " by " + f.split1;
              d.xAxis[0].data = sd[s.split1].display;
            }
          }
          if (s.split1) {
            if (s.split2) {
              d.legend.data = sd[s.split2].display;
              if (s.by_year) {
                d.graphic[0].style.text +=
                  " within " + f.split1 + " between " + f.split2;
                d.xAxis.splice(0, 1);
                d.yAxis.splice(0, 1);
                step =
                  (80 - (sd[s.split1].display.length - 1) * 6) /
                  sd[s.split1].display.length;

                pos = 10;
                for (i = 0, n = sd[s.split1].display.length; i < n; i++) {
                  if (i) {
                    d.title.push({
                      left: "center",
                      subtext: f.split1 + ": " + sd[s.split1].display[i],
                      top: pos - 3 + "%",
                      itemGap: 0,
                    });
                  } else {
                    d.title[0].subtext =
                      f.split1 + ": " + sd[s.split1].display[i];
                  }
                  d.grid.push(this.make_grid(pos, step));
                  d.yAxis.push({ type: "value", gridIndex: i, scale: true });
                  d.xAxis.push({
                    type: "category",
                    gridIndex: i,
                    data: sd.year.filtered,
                    splitLine: false,
                    axisPointer: {
                      label: {
                        formatter: sd[s.split1].display[i] + ": {value}",
                      },
                    },
                  });
                  pos += step + 6;
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
                sd = this.$options.source.view[s.split1];
                d.grid.push(this.make_grid());
                d.graphic[0].style.text += " between " + f.split2;
                if (
                  sd.display_info.sumlen * 12 >
                  this.$el.getBoundingClientRect().width - 450
                ) {
                  d.xAxis[0].axisLabel.rotate = 90;
                }
                for (i = 0, n = d.legend.data.length; i < n; i++) {
                  for (
                    means = [], l = 0, nl = sd.subgroups[s.split2].length;
                    l < nl;
                    l++
                  ) {
                    means.push(
                      sd.subgroups[s.split2].length > l &&
                        sd.subgroups[s.split2][l].levels.length > i
                        ? sd.subgroups[s.split2][l].levels[i].mean
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
              d.grid.push(this.make_grid());
              sd = this.$options.source.view[s.split1];
              if (s.by_year) {
                d.graphic[0].style.text += " between " + f.split1;
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
                  means.push(sd.levels[i].mean);
                d.series.push({
                  type: s.plot_type,
                  data: means,
                });
                if (
                  sd.display_info.sumlen * 12 >
                  this.$el.getBoundingClientRect().width - 450
                ) {
                  d.xAxis[0].axisLabel.rotate = 90;
                }
                d.legend.data.push(sd.label);
              }
            }
          } else {
            d.grid.push(this.make_grid());
            if (s.by_year) {
              d.series.push({
                type: s.plot_type,
                data: sd.total.filtered,
              });
            } else {
              d.graphic[0].style.text = "Average " + f.value;
              d.xAxis[0].data = [f.value];
              d.graphic[3].style.text = "Average";
              d.series.push({
                type: s.plot_type,
                data: [sd.total.mean],
              });
            }
          }
          if (s.split1) {
            if (Object.prototype.hasOwnProperty.call(d.options, s.split1)) {
              if (d.graphic[1].style.text) d.graphic[1].style.text += "; ";
              d.graphic[1].style.text += f.split1 + " ";
              for (i = d.options[s.split1].length; i--; ) {
                d.graphic[1].style.text +=
                  "(" +
                  d.options[s.split1][i].aspect +
                  ") " +
                  d.options[s.split1][i].type +
                  " " +
                  d.options[s.split1][i].display_value +
                  (i ? " and " : "");
              }
            }
            if (s.split2) {
              if (Object.prototype.hasOwnProperty.call(d.options, s.split2)) {
                if (d.graphic[1].style.text) d.graphic[1].style.text += "; ";
                d.graphic[1].style.text += f.split2 + " ";
                for (i = d.options[s.split2].length; i--; ) {
                  d.graphic[1].style.text +=
                    "(" +
                    d.options[s.split2][i].aspect +
                    ") " +
                    d.options[s.split2][i].type +
                    " " +
                    d.options[s.split2][i].display_value +
                    (i ? " and " : "");
                }
              }
            }
          }
          if (
            d.graphic[0].style.text.length * 12 * d.graphic[0].scale[0] >
            width
          ) {
            scale = Math.max(
              0.6,
              width / (d.graphic[0].style.text.length * 12)
            );
            d.graphic[0].scale = [scale, scale];
            d.graphic[1].top = scale * 20 + 10;
          }
          d.legend.type = d.legend.data.length > 9 ? "scroll" : "plain";
          if (this.$options.plot && this.$options.plot.instance) {
            this.$options.plot.instance.setOption(
              {
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
                graphic: d.graphic,
              },
              {
                notMerge: true,
              }
            );
          } else this.draw_plot();
        }
        this.settings.active = true;
      }
    },
  },
  render: (h) => h(App),
}).$mount("#app");
