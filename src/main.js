import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import rawdata from "./data.json";
import levels from "./levels.json";
import Dataview from "./dataview.js";
import { intervalScaleNiceTicks } from "echarts/lib/scale/helper";

Vue.config.productionTip = false;

const data_options = [
    // data-view-related settings
    "value",
    "by_year",
    "split1",
    "split2",
    "year",
    "plot_type",
    "as_table",
    "format_table",
    "format_category",
  ],
  update_after = [
    // settings to queue an update on change
    "as_table",
    "format_table",
    "format_category",
    "value",
    "by_year",
    "split1",
    "split2",
    "standardize_yaxis",
  ],
  store_fallback = { setItem: function() {}, getItem: function() {} },
  store_option = function(k, v) {
    local_storage.setItem(k, JSON.stringify(v));
  },
  queue_update = function() {
    window.requestAnimationFrame(this.update_data);
  },
  seps = /[\s_]/g,
  default_display_options = {
    value: "arrests",
    split: ["", ""],
    county: [
      {
        enabled: true,
        type: "=",
        aspect: "label",
        value: [
          "cook chicago",
          "cook county suburbs",
          "dupage",
          "kane",
          "lake",
          "madison",
        ],
      },
    ],
  };

var store_options = [
    // settings to store on change
    "svg",
    "theme_dark",
    "format_file",
    "format_image",
    "animation_time",
    "animation_type",
    "intro",
    "standardize_yaxis",
    "remember_view",
  ],
  settings = {
    year: {
      range: [Infinity, -Infinity],
      window: [{ start: 0, end: 100, show: false }],
    },
    active: false,
    export_open: false,
    category_formats: ["labels", "indices", "codes"],
    table_formats: ["tall", "mixed", "wide"],
    plot_types: ["line", "bar", "scatter"],
    svg: false,
    plot_type: "line",
    value: "arrests",
    by_year: true,
    split1: "",
    split2: "",
    sheet: "",
    data_menu_open: false,
    as_table: false,
    theme_dark: false,
    format_file: "csv",
    format_json: "arrays",
    format_table: "mixed",
    format_category: "labels",
    format_image: "svg",
    image_dim: ["100%", "100%"],
    animation_time: 700,
    animation_type: "elasticOut",
    intro: true,
    version: rawdata.version,
    send_data: false,
    repo: "https://github.com/ICJIA/arrest_explorer",
    bottom_offset: 190,
    standardize_yaxis: true,
    remember_view: false,
  },
  local_storage = store_fallback,
  watch = {
    // special watchers here, with other settings in
    // `store_options` getting stored on change, and those in
    // `update_after` triggering the `queue_update` function
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
        if (this.$options.plot && this.$options.plot.initOptions) {
          this.$options.plot.initOptions.renderer = this.settings.svg
            ? "svg"
            : "canvas";
          if (!this.settings.as_table) this.draw_plot();
        }
      },
    ],
    "settings.plot_type": [
      function() {
        for (var i = this.$options.display.series.length; i--; ) {
          this.$options.display.series[i].type = this.settings.plot_type;
        }
        if (this.$options.plot && this.$options.plot.instance)
          this.$options.plot.instance.setOption({
            series: this.$options.display.series,
          });
      },
    ],
    "settings.animation_time": [
      function() {
        if (this.$options.plot && this.$options.plot.initOptions) {
          this.settings.animation_time = Number(this.settings.animation_time);
          this.$options.plot.options.animationDurationUpdate = this.settings.animation_time;
          this.$options.plot.options.animationDuration = this.settings.animation_time;
          this.$options.plot.options.stateAnimation.duration = this.settings.animation_time;
          for (var i = this.$options.plot.options.series.length; i--; ) {
            this.$options.plot.options.series[
              i
            ].animationDuration = this.$options.plot.options.series[
              i
            ].animationDurationUpdate = this.settings.animation_time;
          }
          if (!this.settings.as_table) this.draw_plot();
        }
      },
    ],
    "settings.animation_type": [
      function() {
        if (this.$options.plot && this.$options.plot.initOptions) {
          this.$options.plot.options.animationEasingUpdate = this.settings.animation_type;
          this.$options.plot.options.animationEasing = this.settings.animation_type;
          this.$options.plot.options.stateAnimation.easing = this.settings.animation_type;
          for (var i = this.$options.plot.options.series.length; i--; ) {
            this.$options.plot.options.series[
              i
            ].animationEasing = this.$options.plot.options.series[
              i
            ].animationEasingUpdate = this.settings.animation_type;
          }
          if (!this.settings.as_table) this.draw_plot();
        }
      },
    ],
  };

// initialize settings and watchers
(function() {
  for (var k, a = [...data_options, ...store_options], i = a.length; i--; ) {
    k = "settings." + a[i];
    if (!Object.prototype.hasOwnProperty.call(watch, k)) watch[k] = [];
    watch[k].push({
      handler: store_option.bind(null, a[i]),
      deep: "object" === typeof settings[a[i]],
    });
    if (update_after.indexOf(a[i]) !== -1)
      watch[k].push({
        handler: queue_update,
        deep: "object" === typeof settings[a[i]],
      });
  }
})();

new Vue({
  vuetify,
  source: new Dataview(rawdata, levels),
  display: {
    options: JSON.parse(JSON.stringify(default_display_options)),
    title: [{ left: "center" }],
    graphic: [],
    legend: {
      data: [],
      top: "80",
      align: "right",
      right: "right",
      orient: "vertical",
      type: "plain",
      pageButtonGap: 10,
      formatter: function(l) {
        return l.length > 16 ? l.substr(0, 14) + "\u2026" : l;
      },
    },
    tooltip: {
      trigger: "axis",
      transitionDuration: 0,
      axisPointer: {
        type: "shadow",
      },
      borderWidth: 0,
    },
    xAxis: [
      {
        type: "category",
        gridIndex: 0,
        data: rawdata.year,
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
  },
  data: {
    settings,
    table: {},
  },
  watch,
  created() {
    var k, l, i, v, params;
    if (screen.height < 550) this.settings.bottom_offset = 0;
    settings.url = window.location.origin + window.location.pathname;
    if (!/\/$/.test(settings.url)) settings.url += "/";
    local_storage = localStorage || store_fallback;
    if (this.settings.standardize_yaxis) {
      this.$options.display.yAxis[0].min = this.get_min;
    }
    params = window.location.search
      ? (params = this.$options.source.parse_query(window.location.search))
      : {};
    if (Object.prototype.hasOwnProperty.call(params, "embed")) {
      local_storage = store_fallback;
      this.settings.intro = false;
      this.settings.embed = true;
      this.settings.bottom_offset = 0;
    } else {
      if (localStorage.getItem("remember_view") === "true")
        store_options.push(...data_options);
      for (i = store_options.length; i--; ) {
        if (
          Object.prototype.hasOwnProperty.call(this.settings, store_options[i])
        ) {
          try {
            v = JSON.parse(local_storage.getItem(store_options[i]));
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
              store_option(store_options[i], this.settings[store_options[i]]);
          }
        }
      }
      if (
        this.settings.remember_view &&
        Object.prototype.hasOwnProperty.call(local_storage, "display_options")
      )
        this.$options.display.options = JSON.parse(
          local_storage.getItem("display_options")
        );
    }
    this.$options.display.options.year = [
      { type: ">=", value: this.year_window[0] },
      { type: "<=", value: this.year_window[1] },
    ];
    if (window.location.search) {
      var s = this.settings,
        d = this.$options.display.options,
        parse_param = function(k, p) {
          if (p.type && (typeof p.value === "boolean" || p.value)) {
            if (k === "split" && p.value.length) {
              s.split1 = d.split[0] = p.value[0];
              store_option("split1", s.split1);
              if (p.value.length > 1) {
                s.split2 = d.split[1] = p.value[1];
              } else s.split2 = "";
            } else if (
              p.type === "=" &&
              Object.prototype.hasOwnProperty.call(s, k)
            ) {
              s[k] =
                typeof p.value === "boolean" || typeof s[k] !== "boolean"
                  ? p.value
                  : p.value === "true";
              store_option(k, s[k]);
            } else {
              if (k === "sort") {
                if (typeof p.value === "object" && !p.value.length) {
                  if (!Object.prototype.hasOwnProperty.call(d, "sort")) {
                    d.sort = p.value;
                  } else {
                    for (l in p.value)
                      if (Object.prototype.hasOwnProperty.call(p.value, l))
                        d.sort[l] = p.value[l];
                  }
                }
              } else if (
                k !== "split" &&
                Object.prototype.hasOwnProperty.call(d, k) &&
                d[k].push
              ) {
                for (var i = d[k].length, v = true; i--; )
                  if (d[k][i].aspect === p.aspect && d[k][i].type === p.type) {
                    d[k][i].value = p.value;
                    v = false;
                    break;
                  }
                if (v) d[k].push(p);
              } else {
                d[k] = [p];
              }
            }
          }
        };
      if (!this.settings.embed)
        window.history.replaceState("", "", this.settings.url);
      for (k in params) {
        if (Object.prototype.hasOwnProperty.call(params, k)) {
          if (k === "year") {
            this.$root.$options.display.options.year = params[k];
          } else if (params[k].length) {
            for (i = params[k].length; i--; ) parse_param(k, params[k][i]);
          } else parse_param(k, params[k]);
        }
      }
    }
    setTimeout(
      function() {
        this.settings.active = true;
        this.queue_update();
      }.bind(this),
      0
    );
  },
  mounted() {
    for (var i = this.$root.$options.display.options.year.length; i--; ) {
      if (this.$root.$options.display.options.year[i].type === ">=") {
        this.year_window[0] = this.$root.$options.display.options.year[i].value;
      } else if (this.$root.$options.display.options.year[i].type === "<=")
        this.year_window[1] = this.$root.$options.display.options.year[i].value;
    }
    window.dataLayer = window.dataLayer || [];
    this.gtag("js", new Date());
    this.gtag("config", process.env.GA_ID, {
      send_page_view: this.settings.send_data,
    });
  },
  computed: {
    year_window: {
      get: function() {
        var o = this.settings.year.window[0],
          r = this.settings.year.range,
          span = r[1] - r[0];
        o.start, o.end;
        return isFinite(span)
          ? [(o.start / 100) * span + r[0], (o.end / 100) * span + r[0]]
          : [1000, 3000];
      },
      set: function(v) {
        var o = this.settings.year.window[0],
          r = this.settings.year.range,
          span = r[1] - r[0];
        if (isFinite(span)) {
          o.start = ((v[0] - r[0]) / span) * 100;
          o.end = ((v[1] - r[0]) / span) * 100;
        }
      },
    },
    color: function() {
      return this.settings.theme_dark ? "#eeeeee" : "#333333";
    },
  },
  methods: {
    intervalScaleNiceTicks: intervalScaleNiceTicks,
    display_query: function(ex, d, all) {
      d = d || this.$options.display.options;
      var api = !all && ex,
        parts = api
          ? []
          : [
              {
                slot: "plot_type",
                type: "=",
                value: Object.prototype.hasOwnProperty.call(d, "plot_type")
                  ? d.plot_type
                  : this.settings.plot_type,
              },
            ],
        string = api ? "" : "?plot_type=" + parts[0].value,
        k,
        l,
        i;
      function add_settings_param(n, v) {
        parts.push({
          slot: n,
          type: "=",
          value: v,
        });
        string += (string ? "&" : "?") + n + "=" + v;
      }
      if (api) {
        if (this.settings.format_file !== "csv") {
          add_settings_param("format_file", this.settings.format_file);
          if (
            this.settings.format_file === "json" &&
            this.settings.format_json !== "arrays"
          )
            add_settings_param("format_json", this.settings.format_json);
        }
        if (
          this.settings.format_table !== "mixed" &&
          (this.settings.format_file !== "json" ||
            this.settings.format_json !== "raw")
        )
          add_settings_param("format_table", this.settings.format_table);
      }
      ex = ex || {};
      for (k in d)
        if (Object.prototype.hasOwnProperty.call(d, k) && k !== "plot_type") {
          if (!Object.prototype.hasOwnProperty.call(ex, k) || ex[k] !== d[k]) {
            if (k === "split") {
              if (d[k][0]) {
                parts.push({
                  slot: k,
                  type: "=",
                  value: d[k][0] + (d[k][1] ? "," + d[k][1] : ""),
                });
                string +=
                  (string ? "&" : "?") +
                  k +
                  "=" +
                  d[k][0] +
                  (d[k][1] ? "," + d[k][1] : "");
              }
            } else {
              if (typeof d[k] === "object") {
                if (k === "sort") {
                  i = parts.length;
                  parts.push({
                    slot: k,
                    aspect: null,
                    type: "=",
                    value: "",
                  });
                  for (l in d[k])
                    if (Object.prototype.hasOwnProperty.call(d[k], l)) {
                      if (
                        (all ||
                          l === this.$root.settings.split1 ||
                          l === this.$root.settings.split2) &&
                        (!d[k][l].increasing || d[k][l].aspect !== "label")
                      )
                        parts[i].value +=
                          (parts[i].value ? "," : "") +
                          (d[k][l].increasing ? "-" : "") +
                          l +
                          (d[k][l].aspect === "label"
                            ? ""
                            : "[" + d[k][l].aspect + "]");
                    }
                  if (parts[i].value) {
                    string += (string ? "&" : "?") + "sort=" + parts[i].value;
                  } else parts.splice(i, 1);
                } else {
                  for (i = d[k].length; i--; ) {
                    if (
                      k === this.$root.settings.split1 ||
                      k === this.$root.settings.split2 ||
                      all ||
                      !Object.prototype.hasOwnProperty.call(
                        this.$root.$options.source.variables,
                        k
                      ) ||
                      (k === "year" &&
                        isFinite(d.year[0].value) &&
                        d.year[0].value !== 1000 &&
                        d[k][i].value !==
                          this.$root.settings.year.range[
                            d[k][i].type === ">=" ? 0 : 1
                          ])
                    ) {
                      parts.push({
                        slot: k,
                        aspect: k === "year" ? "" : d[k][i].aspect,
                        type: d[k][i].type,
                        value: d[k][i].display_value.join
                          ? d[k][i].display_value.join(",")
                          : d[k][i].display_value,
                      });
                      string +=
                        (string ? "&" : "?") +
                        k +
                        (k !== "year" && d[k][i].aspect
                          ? "[" + d[k][i].aspect + "]"
                          : "") +
                        d[k][i].type +
                        (d[k][i].display_value.join
                          ? d[k][i].display_value.join(",")
                          : d[k][i].display_value);
                    }
                  }
                }
              } else {
                parts.push({ slot: k, type: "=", value: d[k] });
                string += (string ? "&" : "?") + k + "=" + d[k];
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
    queue_update,
    draw_plot: function() {
      if (this.$options.plot.instance) this.$options.plot.instance.dispose();
      this.$options.plot.instance = this.$options.plot.engine.init(
        this.$options.plot.element,
        this.settings.theme_dark ? "dark" : "light",
        this.$options.plot.initOptions
      );
      this.$options.plot.options.title = this.$options.display.title;
      this.$options.plot.options.graphic = this.$options.display.graphic;
      this.$options.plot.options.tooltip = this.$options.display.tooltip;
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
          top: top
            ? top
            : this.$options.display.graphic[1].style.text
            ? 75
            : 50,
          left: 85,
          right: aslegend
            ? String(
                9 *
                  Math.max(
                    Math.min(
                      15,
                      this.$options.source.view[aslegend].display_info.maxlen
                    ),
                    aslegend.length + 2,
                    9
                  )
              )
            : 20,
        },
        dim = this.$el.getBoundingClientRect();
      if (
        !this.settings.by_year &&
        this.settings.split1 &&
        this.$options.source.view[this.settings.split1].display_info.sumlen *
          12 >
          dim.width - 450
      ) {
        r.bottom =
          Math.min(
            14,
            this.$options.source.view[this.settings.split1].display_info
              .maxlen + 2
          ) *
            9 +
          "";
      } else {
        r.height = height
          ? height
          : this.$options.plot.element.getBoundingClientRect().height -
            Number(r.top) -
            50;
      }
      return r;
    },
    update_data: async function() {
      if (this.settings.active) {
        this.settings.active = false;
        var dims = this.$el.getBoundingClientRect(),
          s = this.settings,
          d = this.$options.display,
          f = { value: this.format_name(s.value) },
          dim = this.$el.getBoundingClientRect(),
          scale = 2,
          pos = 1,
          step = 50,
          means,
          part,
          i,
          n,
          l,
          nl,
          sd,
          add_to_subheading = function(split) {
            split = split !== 1 ? "split2" : "split1";
            if (Object.prototype.hasOwnProperty.call(d.options, s[split])) {
              for (pos = 0, part = "", i = d.options[s[split]].length; i--; )
                if (d.options[s[split]][i].enabled) {
                  if (d.options[s[split]][i].aspect === "label") {
                    pos = 1;
                  } else {
                    part +=
                      (part ? " and " : "") +
                      "(" +
                      d.options[s[split]][i].aspect +
                      ") " +
                      d.options[s[split]][i].type +
                      " " +
                      d.options[s[split]][i].display_value;
                  }
                }
              if (part || pos) {
                if (d.graphic[1].style.text) d.graphic[1].style.text += " & ";
                if (part) d.graphic[1].style.text += f[split] + " " + part;
                if (pos)
                  d.graphic[1].style.text +=
                    (part ? " & a " : "") + "selection of " + f[split];
              }
            }
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
          ) {
            s.split1 = "";
          }
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
        if (
          d.options.value !== s.value ||
          (s.split1 && d.options.split[0] !== s.split1) ||
          (s.split2 && d.options.split[1] !== s.split2)
        ) {
          this.$root.gtag("event", "update_data", {
            event_category: s.value,
            event_label: s.split1
              ? s.split1 + (s.split2 ? "," + s.split2 : "")
              : "overall",
          });
        }
        d.options.value = s.value;
        d.options.by_year = s.by_year;
        d.options.format_category = s.format_category;
        d.options.split[0] = s.split1;
        d.options.split[1] = s.split2;
        if (s.remember_view) store_option("display_options", d.options);
        await this.$options.source.update(d.options);
        sd = this.$options.source.view;
        if (!Object.prototype.hasOwnProperty.call(sd, s.split1)) {
          s.split1 = "";
        }
        if (
          !s.split1 ||
          (!Object.prototype.hasOwnProperty.call(sd, s.split2) &&
            (!Object.prototype.hasOwnProperty.call(sd[s.split1], "subgroups") ||
              !Object.prototype.hasOwnProperty.call(
                sd[s.split1].subgroups,
                s.split2
              )))
        ) {
          s.split2 = "";
        }
        if (s.as_table) {
          this.table = this.$options.source.reformat(s.format_table, true);
        } else {
          this.resize_plot(dims.height - this.settings.bottom_offset + "px");
          d.legend.data = [];
          d.legend.selected = {};
          d.series = [];
          d.grid = [];
          d.title = [
            { left: "center", top: "6%", subtextStyle: { fontSize: 14 } },
          ];
          d.yAxis = [{ type: "value", scale: true, min: this.get_min }];
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
          d.graphic = [
            {
              type: "text",
              id: "title-label",
              right: "center",
              top: "3",
              z: 100,
              cursor: "default",
              scaleX: scale,
              scaleY: scale,
              style: {
                text: (s.by_year ? "" : "Average ") + f.value,
                font: "20px 'Lato', sans-serif",
                fill: this.color,
              },
            },
            {
              type: "text",
              id: "subtitle-label",
              right: "center",
              top: s.by_year && s.split2 ? "50" : "55",
              z: 100,
              cursor: "default",
              style: {
                text: "",
                font: "15px 'Lato', sans-serif",
                fill: this.color + "E0",
              },
            },
            {
              type: "text",
              id: "y-axis-label",
              z: 100,
              cursor: "default",
              left: "5",
              top: "middle",
              rotation: 1.58,
              style: {
                text: f.value,
                font: "20px 'Lato', sans-serif",
                fill: this.color,
              },
            },
            {
              type: "text",
              id: "x-axis-label",
              z: 100,
              cursor: "default",
              left: "center",
              bottom: "5",
              style: {
                text: s.by_year ? "Year" : f.split1,
                font: "20px 'Lato', sans-serif",
                fill: this.color,
              },
            },
            {
              type: "text",
              id: "legend-label",
              right: "10",
              top: "60",
              cursor: "default",
              style: {
                text:
                  s.by_year || f.split2 ? (f.split2 ? f.split2 : f.split1) : "",
                font: "16px 'Lato', sans-serif",
                fill: this.color,
                textAlign: "left",
              },
            },
          ];
          if (s.by_year) {
            d.graphic[0].style.text = f.value + " by Year";
            d.xAxis[0].data = sd.year.filtered;
          } else {
            if (isFinite(this.year_window[0]) && isFinite(s.year.range[0])) {
              if (this.year_window[0] === 1000) {
                this.year_window[0] = s.year.range[0];
                this.year_window[1] = s.year.range[1];
              }
              d.graphic[1].style.text =
                this.year_window[0] === this.year_window[1]
                  ? "Year = " + this.year_window[0]
                  : "Year between " +
                    this.year_window[0] +
                    " and " +
                    this.year_window[1];
            } else d.graphic[1].style.text = "";
            if (s.split1) {
              d.graphic[0].style.text += " by " + f.split1;
              d.xAxis[0].data = sd[s.split1].display;
            } else d.xAxis[0].show = false;
          }
          if (s.split1) {
            add_to_subheading(1);
            if (s.split2) {
              add_to_subheading(2);
              d.legend.data = sd[s.split2].display;
              if (s.by_year) {
                d.graphic[0].style.text +=
                  ", " + f.split1 + ", and " + f.split2;
                d.xAxis.splice(0, 1);
                d.yAxis.splice(0, 1);
                d.title[0].top = this.$options.display.graphic[1].style.text
                  ? 70
                  : 50;
                pos = d.title[0].top + 33;
                step = Math.max(
                  130,
                  (dim.height - (this.settings.bottom_offset + pos + 10)) /
                    sd[s.split1].display.length
                );
                this.resize_plot(
                  Math.max(
                    5 + pos + step * sd[s.split1].display.length,
                    dims.height - this.settings.bottom_offset
                  ) + "px"
                );
                for (i = 0, n = sd[s.split1].display.length; i < n; i++) {
                  if (i) {
                    d.title.push({
                      left: "center",
                      subtext: f.split1 + ": " + sd[s.split1].display[i],
                      top: pos - 23,
                      itemGap: 0,
                      subtextStyle: {
                        fontSize: 14,
                      },
                    });
                  } else {
                    d.title[0].subtext =
                      f.split1 + ": " + sd[s.split1].display[i];
                  }
                  d.grid.push(this.make_grid(pos, step - 65));
                  d.yAxis.push({
                    type: "value",
                    gridIndex: i,
                    scale: true,
                    min: this.settings.standardize_yaxis ? 0 : void 0,
                    max: this.get_max,
                  });
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
                  pos += step;
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
                      animationEasing: this.settings.animation_type,
                      animationEasingUpdate: this.settings.animation_type,
                      animationDuration: this.settings.animation_time,
                      animationDurationUpdate: this.settings.animation_time,
                      showSymbol: false,
                    });
                  }
                }
              } else {
                sd = this.$options.source.view[s.split1];
                d.grid.push(this.make_grid());
                d.graphic[0].style.text += " and " + f.split2;
                if (
                  sd.display_info.sumlen * 12 >
                  this.$el.getBoundingClientRect().width - 470
                ) {
                  d.xAxis[0].axisLabel.rotate = 60;
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
                    animationEasing: this.settings.animation_type,
                    animationEasingUpdate: this.settings.animation_type,
                    animationDuration: this.settings.animation_time,
                    animationDurationUpdate: this.settings.animation_time,
                    showSymbol: false,
                  });
                }
              }
            } else {
              d.grid.push(this.make_grid());
              sd = this.$options.source.view[s.split1];
              if (s.by_year) {
                d.graphic[0].style.text += " and " + f.split1;
                for (i = 0, n = sd.levels.length; i < n; i++) {
                  d.series.push({
                    name: sd.levels[i].label,
                    type: s.plot_type,
                    data: sd.levels[i].filtered,
                    animationEasing: this.settings.animation_type,
                    animationEasingUpdate: this.settings.animation_type,
                    animationDuration: this.settings.animation_time,
                    animationDurationUpdate: this.settings.animation_time,
                    showSymbol: false,
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
                  animationEasing: this.settings.animation_type,
                  animationEasingUpdate: this.settings.animation_type,
                  animationDuration: this.settings.animation_time,
                  animationDurationUpdate: this.settings.animation_time,
                  showSymbol: false,
                });
                if (
                  sd.display_info.sumlen * 12 >
                  this.$el.getBoundingClientRect().width - 470
                ) {
                  d.xAxis[0].axisLabel.rotate = 60;
                }
              }
            }
          } else {
            d.grid.push(this.make_grid());
            if (s.by_year) {
              d.series.push({
                type: s.plot_type,
                data: sd.total.filtered,
                showSymbol: false,
              });
            } else {
              d.graphic[0].style.text = "Average " + f.value;
              d.xAxis[0].data = [f.value];
              d.graphic[3].style.text = "Overall";
              d.series.push({
                type: s.plot_type,
                data: [sd.total.mean],
                animationEasing: this.settings.animation_type,
                animationEasingUpdate: this.settings.animation_type,
                animationDuration: this.settings.animation_time,
                animationDurationUpdate: this.settings.animation_time,
              });
            }
          }
          if (
            d.graphic[0].style.text.length * 12 * d.graphic[0].scaleX >
            dim.width - (!this.settings.embed && dim.width > 590) * 270
          ) {
            scale = Math.max(
              0.6,
              (dim.width - (!this.settings.embed && dim.width > 590) * 270) /
                (d.graphic[0].style.text.length * 12)
            );
            d.graphic[0].scaleX = d.graphic[0].scaleY = scale;
            d.graphic[1].top = scale * 20 + 10;
          }
          d.legend.type = d.legend.data.length > 9 ? "scroll" : "plain";
          d.tooltip.position =
            screen.width > 500
              ? null
              : function(pos, params, el, elRect, size) {
                  var obj = { top: 45 };
                  obj[pos[0] < size.viewSize[0] / 2 ? "left" : "right"] = 10;
                  return obj;
                };
          if (this.$options.plot && this.$options.plot.instance) {
            this.$options.plot.instance.setOption(
              {
                textStyle: this.$options.plot.options.textStyle,
                tooltip: d.tooltip,
                animationDuration: s.animation_time,
                animationDurationUpdate: s.animation_time,
                animationEasing: s.animation_type,
                animationEasingUpdate: s.animation_type,
                stateAnimation: {
                  duration: s.animation_time,
                  easing: s.animation_type,
                },
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
    gtag: function() {
      if (this.settings.send_data) window.dataLayer.push(arguments);
    },
    refresh_data: function() {
      this.settings.bottom_offset = screen.height < 550 ? 0 : 190;
      if (this.$options.plot && this.$options.plot.instance) {
        this.$options.plot.instance.dispose();
        this.$options.plot.instance = null;
      }
      this.settings.active = true;
      this.update_data();
    },
    resize_plot: function(h) {
      if (this.$options.plot) {
        if (typeof h !== "object") {
          this.$options.plot.element.style.height = h;
        }
        if (this.$options.plot.instance) {
          this.$options.plot.instance.resize();
          this.$root.$options.plot.element.style.width = "100%";
        }
      }
    },
    get_min: function() {
      return this.settings.standardize_yaxis ? 0 : void 0;
    },
    get_max: function() {
      var range = [Infinity, -Infinity],
        m,
        j,
        i,
        g;
      if (
        this.settings.standardize_yaxis &&
        this.settings.by_year &&
        this.settings.split1 &&
        this.settings.split2 &&
        Object.prototype.hasOwnProperty.call(
          this.$options.source.view,
          this.settings.split1
        ) &&
        Object.prototype.hasOwnProperty.call(
          this.$options.source.view[this.settings.split1],
          "subgroups"
        ) &&
        Object.prototype.hasOwnProperty.call(
          this.$options.source.view[this.settings.split1].subgroups,
          this.settings.split2
        )
      ) {
        for (
          j = this.$options.source.view[this.settings.split1].subgroups[
            this.settings.split2
          ].length;
          j--;

        ) {
          g = this.$options.source.view[this.settings.split1].subgroups[
            this.settings.split2
          ][j];
          for (i = g.levels.length; i--; ) {
            if (g.levels[i].min < range[0]) range[0] = g.levels[i].min;
            if (g.levels[i].max > range[1]) range[1] = g.levels[i].max;
          }
        }
        j = range[1];
        m = range[1] + j * (j > 10 ? 0.02 : 0.2);
        i = 100;
        while (m - j > i) i *= 10;
        m = j > 10 ? Math.ceil(m / i) * i : Math.round(m * i) / i;
        m = this.intervalScaleNiceTicks([0, m], 5, 0.01, i).niceTickExtent[1];
      }
      return m;
    },
    reset_view: function() {
      var defaults = {
          plot_type: "line",
          value: "arrests",
          by_year: true,
          split1: "",
          split2: "",
          as_table: false,
          format_table: "mixed",
        },
        k;
      for (k in defaults)
        if (Object.prototype.hasOwnProperty.call(defaults, k)) {
          this.settings[k] = defaults[k];
        }
      this.settings.year.window[0].start = 0;
      this.settings.year.window[0].end = 100;
      for (k in this.$options.display.options)
        if (
          Object.prototype.hasOwnProperty.call(this.$options.display.options, k)
        ) {
          if (
            Object.prototype.hasOwnProperty.call(default_display_options, k)
          ) {
            this.$options.display.options[k] = JSON.parse(
              JSON.stringify(default_display_options[k])
            );
          } else delete this.$options.display.options[k];
        }
      this.update_data();
    },
  },
  render: h => h(App),
}).$mount("#app");
