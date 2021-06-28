import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import rawdata from "./data.json";
import levels from "./levels.json";
import Dataview from "./dataview.js";
import { intervalScaleNiceTicks } from "echarts/lib/scale/helper";
import { addListenersToSelects } from "./plugins/select_labeler.js";

Vue.config.productionTip = false;

const data_options = [
    // data-view-related settings
    "value",
    "average",
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
    "average",
    "split1",
    "split2",
    "unlock_yaxis_min",
    "unlock_yaxis_max",
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
        display_value: [
          "cook chicago",
          "cook county suburbs",
          "dupage",
          "kane",
          "lake",
          "madison",
        ],
      },
    ],
  },
  variable_parts = {
    county: { single: "county", multi: "counties", label: "county name" },
    race: {
      single: "racial group",
      multi: "racial groups",
      label: "racial label",
    },
    age_group: { single: "age group", multi: "age groups", label: "age group" },
    gender: {
      single: "gender group",
      multi: "gender groups",
      label: "gender label",
    },
    crime_type: {
      single: "crime type",
      multi: "crime types",
      label: "crime type name",
    },
    offense_category: {
      single: "offense category",
      multi: "offense categories",
      label: "offense category name",
    },
    offense_class: {
      single: "offense class",
      multi: "offense classes",
      label: "offense class name",
    },
  };

var store_options = [
    // settings to store on change
    "svg",
    "theme_dark",
    "format_file",
    "format_image",
    "intro",
    "unlock_yaxis_min",
    "unlock_yaxis_max",
    "remember_view",
    "disable_plot_animation",
  ],
  settings = {
    year: {
      range: [Infinity, -Infinity],
      window: [{ start: 0, end: 100, show: false }],
    },
    active: false,
    examples_open: false,
    options_open: false,
    export_open: false,
    filter_open: false,
    filter_showing: "",
    category_formats: ["labels", "indices", "codes"],
    table_formats: ["tall", "mixed", "wide"],
    plot_types: ["line", "bar"],
    svg: false,
    plot_type: "line",
    value: "arrests",
    average: false,
    split1: "",
    split2: "",
    data_menu_open: false,
    app_menu_open: false,
    as_table: false,
    value_mean: 0,
    theme_dark: false,
    format_file: "csv",
    format_json: "arrays",
    format_table: "mixed",
    format_category: "labels",
    format_image: "png",
    image_dim: ["100%", "100%"],
    animation_time: 700,
    animation_type: "elasticOut",
    intro: true,
    version: rawdata.version,
    send_data: false,
    repo: "https://github.com/ICJIA/arrest_explorer",
    bottom_offset: 120,
    unlock_yaxis_min: false,
    unlock_yaxis_max: false,
    remember_view: false,
    disable_plot_animation: false,
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
        for (var i = this.$options.display.graphic.length; i--; )
          this.$options.display.graphic[i].style.fill = this.color;
        if (!this.settings.as_table) this.draw_plot();
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
    "settings.disable_plot_animation": [
      function() {
        this.settings.animation_time = this.settings.disable_plot_animation
          ? 0
          : 700;
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
    specs: {
      split1: {
        entry: "split1",
        name: "",
        displaying: 0,
        levels: 0,
        vars: [],
        sort: {},
      },
      split2: {
        entry: "split2",
        name: "",
        displaying: 0,
        levels: 0,
        vars: [],
        sort: {},
      },
    },
    tooltip: {
      trigger: "axis",
      transitionDuration: 0,
      axisPointer: {
        type: "shadow",
      },
      borderWidth: 0,
      order: "valueDesc",
      textStyle: {
        fontWeight: "normal",
      },
      confine: true,
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
    yAxis: [
      {
        type: "value",
        gridIndex: 0,
        scale: true,
        axisLabel: {
          showMinLabel: true,
          showMaxLabel: true,
        },
      },
    ],
    series: [],
    grid: [],
  },
  data: {
    variable_parts,
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
    this.$options.display.yAxis[0].min = this.get_min;
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
              if (
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
          } else if (k === "sort") {
            if (!Object.prototype.hasOwnProperty.call(d, "sort")) {
              d.sort = p;
            } else {
              for (l in p)
                if (Object.prototype.hasOwnProperty.call(p, l))
                  d.sort[l] = p[l];
            }
          }
        };
      if (!this.settings.embed)
        window.history.replaceState("", "", this.settings.url);
      for (k in params) {
        if (Object.prototype.hasOwnProperty.call(params, k)) {
          if (k === "year") {
            if (!params[k].length) params[k] = [params[k]];
            for (i = params[k].length; i--; ) {
              if (params[k][i].type === "=") {
                this.$options.display.options.year[0].value =
                  params[k][i].value;
                this.$options.display.options.year[1].value =
                  params[k][i].value;
                break;
              } else if (
                params[k][i].type === ">" ||
                params[k][i].type === ">="
              ) {
                this.$options.display.options.year[0].value =
                  params[k][i].value;
              } else if (
                params[k][i].type === "<" ||
                params[k][i].type === "<="
              ) {
                this.$options.display.options.year[1].value =
                  params[k][i].value;
              }
            }
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
    for (var i = this.$options.display.options.year.length, e; i--; ) {
      if (this.$options.display.options.year[i].type === ">=") {
        this.year_window[0] = this.$options.display.options.year[i].value;
      } else if (this.$options.display.options.year[i].type === "<=")
        this.year_window[1] = this.$options.display.options.year[i].value;
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
    addListenersToSelects: addListenersToSelects,
    intervalScaleNiceTicks: intervalScaleNiceTicks,
    display_query: function(args, type, defaults) {
      // converts an object containing settings to a query string
      // - args: Object with settings to be displayed.
      // - type: string indicating whether display ('plot') or file ('api')
      //   related settings from this.settings should be added
      // - defaults: Object with default settings to be excluded.
      defaults = defaults || {};
      var api = type === "api",
        plot = type === "plot",
        all = !api && !plot,
        parts = [],
        string = "",
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
      } else {
        if (this.settings.svg) add_settings_param("svg", true);
        if (!Object.prototype.hasOwnProperty.call(defaults, "plot_type"))
          defaults.plot_type = "line";
        if (
          (args.plot_type || this.settings.plot_type) !== defaults.plot_type
        ) {
          add_settings_param(
            "plot_type",
            args.plot_type || this.settings.plot_type
          );
        }
      }
      for (k in args)
        if (
          Object.prototype.hasOwnProperty.call(args, k) &&
          k !== "plot_type"
        ) {
          if (
            !Object.prototype.hasOwnProperty.call(defaults, k) ||
            args[k] !== defaults[k]
          ) {
            if (k === "split") {
              if (args[k][0]) {
                parts.push({
                  slot: k,
                  type: "=",
                  value: args[k][0] + (args[k][1] ? "," + args[k][1] : ""),
                });
                string +=
                  (string ? "&" : "?") +
                  k +
                  "=" +
                  args[k][0] +
                  (args[k][1] ? "," + args[k][1] : "");
              }
            } else {
              if (typeof args[k] === "object") {
                if (k === "sort") {
                  i = parts.length;
                  parts.push({
                    slot: k,
                    aspect: null,
                    type: "=",
                    value: "",
                  });
                  for (l in args[k])
                    if (Object.prototype.hasOwnProperty.call(args[k], l)) {
                      if (
                        (all ||
                          l === this.settings.split1 ||
                          l === this.settings.split2) &&
                        (!args[k][l].increasing ||
                          args[k][l].aspect !== "label")
                      )
                        parts[i].value +=
                          (parts[i].value ? "," : "") +
                          (args[k][l].increasing ? "-" : "") +
                          l +
                          (args[k][l].aspect === "label"
                            ? ""
                            : "[" + args[k][l].aspect + "]");
                    }
                  if (parts[i].value) {
                    string += (string ? "&" : "?") + "sort=" + parts[i].value;
                  } else parts.splice(i, 1);
                } else {
                  for (i = args[k].length; i--; ) {
                    if (
                      Object.prototype.hasOwnProperty.call(
                        args[k][i],
                        "display_value"
                      ) &&
                      args[k][i].enabled &&
                      (all ||
                        ((k === this.settings.split1 ||
                          k === this.settings.split2) &&
                          (args[k][i].aspect !== "label" ||
                            args[k][i].display_value.length <
                              this.$options.source.variables[k].levels
                                .length)) ||
                        (this.$options.source.variables &&
                          !Object.prototype.hasOwnProperty.call(
                            this.$options.source.variables,
                            k
                          )) ||
                        (k === "year" &&
                          isFinite(args.year[0].value) &&
                          args.year[0].value !== 1000 &&
                          args[k][i].value !==
                            this.settings.year.range[
                              args[k][i].type === ">=" ? 0 : 1
                            ]))
                    ) {
                      parts.push({
                        slot: k,
                        aspect: k === "year" ? "" : args[k][i].aspect,
                        type: args[k][i].type,
                        value: args[k][i].display_value.join
                          ? args[k][i].display_value.join(",")
                          : args[k][i].display_value,
                      });
                      string +=
                        (string ? "&" : "?") +
                        k +
                        (k !== "year" && args[k][i].aspect
                          ? "[" + args[k][i].aspect + "]"
                          : "") +
                        args[k][i].type +
                        (args[k][i].display_value.join
                          ? args[k][i].display_value.join(",")
                          : args[k][i].display_value);
                    }
                  }
                }
              } else {
                parts.push({ slot: k, type: "=", value: args[k] });
                string += (string ? "&" : "?") + k + "=" + args[k];
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
      if (this.$options.plot) {
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
        this.$options.plot.options.animationDuration = this.settings.animation_time;
        this.$options.plot.options.animationDurationUpdate = this.settings.animation_time;
        this.$options.plot.options.animationEasing = this.settings.animation_type;
        this.$options.plot.options.animationEasingUpdate = this.settings.animation_type;
        this.$options.plot.options.stateAnimation.duration = this.settings.animation_time;
        this.$options.plot.options.stateAnimation.easing = this.settings.animation_type;
        this.$options.plot.instance.setOption(this.$options.plot.options);
      }
    },
    make_grid: function(top, height) {
      var aslegend = this.settings.split2
          ? this.settings.split2
          : this.settings.split1 && !this.settings.average
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
        this.settings.average &&
        this.settings.split1 &&
        this.$options.source.view[this.settings.split1].display_info.sumlen *
          12 >
          dim.width - 470
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
    validate_filter_sort: function(split) {
      if (
        !Object.prototype.hasOwnProperty.call(
          this.$options.display.options,
          split
        )
      ) {
        this.$options.display.options[split] = [
          {
            aspect: "label",
            type: "=",
            value: 0,
            display_value: 0,
            enabled: false,
          },
          {
            aspect: "mean",
            type: ">",
            value: void 0,
            display_value: void 0,
            enabled: false,
          },
          {
            aspect: "mean",
            type: "<",
            value: void 0,
            display_value: void 0,
            enabled: false,
          },
        ];
      }
      if (
        !Object.prototype.hasOwnProperty.call(
          this.$options.display.options,
          "sort"
        )
      )
        this.$options.display.options.sort = {};
      if (
        !Object.prototype.hasOwnProperty.call(
          this.$options.display.options.sort,
          split
        )
      ) {
        this.sort = this.$options.display.options.sort[split] = {
          aspect: "label",
          increasing: true,
        };
      }
    },
    get_filter: function(split, type) {
      type = type || "=";
      for (var i = this.$options.display.options[split].length; i--; ) {
        if (this.$options.display.options[split][i].type === type)
          return this.$options.display.options[split][i];
      }
      this.$options.display.options[split].push({
        aspect: type === "=" || type === "!=" ? "label" : "mean",
        type: type,
        value: void 0,
        display_value: 0,
        enabled: false,
      });
      return this.$options.display.options[split][
        this.$options.display.options[split].length - 1
      ];
    },
    update_data: async function() {
      if (this.settings.active) {
        if (this.settings.as_table && !this.$options.plot) {
          this.settings.as_table = false;
          return setTimeout(
            function() {
              this.update_data();
              this.settings.as_table = true;
            }.bind(this),
            0
          );
        }
        this.settings.active = false;
        var s = this.settings,
          vars = this.$options.source.variables,
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
                    pos =
                      d.options[s[split]][i].display_value.length <
                      vars[s[split]].levels.length
                        ? 1
                        : 0;
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
        d.specs.split1.vars = this.$options.source.variables.values.splits[
          s.value
        ];
        // validate splits
        if (s.split1) {
          if (
            !Object.prototype.hasOwnProperty.call(vars, s.split1) ||
            vars.values.splits[s.value].indexOf(s.split1) === -1
          ) {
            s.split1 = "";
          }
        }
        if (s.split2) {
          if (
            !s.split1 ||
            vars.values.splits[s.value].indexOf(s.split2) === -1 ||
            vars[s.split1].splits[s.value].indexOf(s.split2) === -1
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
          this.gtag("event", "update_data", {
            event_category: s.value,
            event_label: s.split1
              ? s.split1 + (s.split2 ? "," + s.split2 : "")
              : "overall",
          });
        }
        d.options.value = s.value;
        d.options.average = s.average;
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
        if (
          !(
            s.split1 ||
            (!s.average && this.year_window[0] !== this.year_window[1])
          )
        ) {
          this.settings.value_mean = sd.total.mean;
        } else {
          this.resize_plot(dim.height - this.settings.bottom_offset + "px");
          d.legend.data = [];
          d.legend.selected = {};
          d.series = [];
          d.grid = [];
          d.title = [
            { left: "center", top: "6%", subtextStyle: { fontSize: 14 } },
          ];
          d.yAxis = [
            {
              type: "value",
              scale: true,
              min: this.get_min,
              axisLabel: {
                showMinLabel: true,
                showMaxLabel: true,
              },
            },
          ];
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
                text: (s.average ? "Average " : "") + f.value,
                font: "20px 'Lato', sans-serif",
                fill: this.color,
              },
            },
            {
              type: "text",
              id: "subtitle-label",
              right: "center",
              top: !s.average && s.split2 ? "50" : "55",
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
                text: s.average ? f.split1 : "Year",
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
                  !s.average || f.split2
                    ? f.split2
                      ? f.split2
                      : f.split1
                    : "",
                font: "16px 'Lato', sans-serif",
                fill: this.color,
                textAlign: "left",
              },
            },
          ];
          if (!s.average) {
            d.graphic[0].style.text = f.value;
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
            this.validate_filter_sort(s.split1);
            this.fill_spec("split1");
            add_to_subheading(1);
            d.specs.split2.vars = vars[s.split1].splits[s.value];
            if (s.split2) {
              this.validate_filter_sort(s.split2);
              this.fill_spec("split2");
              add_to_subheading(2);
              d.legend.data = sd[s.split2].display;
              if (!s.average) {
                d.graphic[0].style.text +=
                  " by " +
                  f.split1 +
                  ", " +
                  (s.average ? "and" + f.split2 : f.split2 + ", and Year");
                d.xAxis.splice(0, 1);
                d.yAxis.splice(0, 1);
                d.title[0].top = this.$options.display.graphic[1].style.text
                  ? 70
                  : 50;
                pos = d.title[0].top + 33;
                step = Math.max(
                  150,
                  (dim.height - (this.settings.bottom_offset + pos + 10)) /
                    sd[s.split1].display.length
                );
                this.resize_plot(
                  Math.max(
                    5 + pos + step * sd[s.split1].display.length,
                    dim.height - this.settings.bottom_offset
                  ) + "px"
                );
                for (i = 0, n = sd[s.split1].display.length; i < n; i++) {
                  if (i) {
                    d.title.push({
                      left: "85",
                      subtext: f.split1 + ": " + sd[s.split1].display[i],
                      top: pos - 23,
                      itemGap: 0,
                      subtextStyle: {
                        fontSize: 14,
                      },
                    });
                  } else {
                    d.title[0].left = "85";
                    d.title[0].subtext =
                      f.split1 + ": " + sd[s.split1].display[i];
                  }
                  d.grid.push(this.make_grid(pos, step - 65));
                  d.yAxis.push({
                    type: "value",
                    gridIndex: i,
                    scale: true,
                    min: this.get_min,
                    max: this.get_max,
                    axisLabel: {
                      showMinLabel: true,
                      showMaxLabel: true,
                    },
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
              this.$options.display.specs.split2.name = "";
              d.grid.push(this.make_grid());
              sd = this.$options.source.view[s.split1];
              if (!s.average) {
                d.graphic[0].style.text +=
                  " by " + f.split1 + (s.average ? "" : " and Year");
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
            this.$options.display.specs.split1.name = "";
            d.grid.push(this.make_grid());
            if (!s.average) {
              d.graphic[0].style.text += " by Year";
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
          if (s.as_table) {
            this.table = this.$options.source.reformat(s.format_table, true);
          } else {
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
        }
        this.settings.active = true;
      }
    },
    gtag: function() {
      if (this.settings.send_data) window.dataLayer.push(arguments);
    },
    refresh_data: function() {
      this.settings.bottom_offset = screen.height < 550 ? 0 : 120;
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
        }
      }
    },
    get_min: function() {
      return this.settings.unlock_yaxis_min ? void 0 : 0;
    },
    get_max: function() {
      var range = [Infinity, -Infinity],
        m,
        j,
        i,
        g;
      if (
        !this.settings.unlock_yaxis_max &&
        !this.settings.average &&
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
          average: false,
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
    fill_spec: function(id) {
      var s = this.$options.display.specs[id];
      s.name = this.settings[id];
      if (s.name) {
        this.validate_filter_sort(this.settings[id]);
        s.sort = this.$options.display.options.sort[this.settings[id]];
        s.sort.direction =
          s.sort.aspect === "label"
            ? s.sort.increasing
              ? "alphabetical"
              : "reverse alphabetical"
            : s.sort.increasing
            ? "increasing"
            : "decreasing";
        s.sort.aspects = [
          this.variable_parts[s.name].label,
          "average " + this.settings.value,
        ];
        s.sort.aspect_proxy = s.sort.aspects[Number(s.sort.aspect !== "label")];
        s.levels = this.$options.source.variables[
          this.settings[id]
        ].levels.length;
        s.displaying = Object.prototype.hasOwnProperty.call(
          this.$options.source.view,
          this.settings[id]
        )
          ? this.$options.source.view[this.settings[id]].levels.length
          : s.levels;
      }
    },
    toggleDataMenu: function() {
      var w = document.body.getBoundingClientRect().width,
        data_container = document.getElementById("data-container"),
        data_menu = document.getElementById("data-menu");
      if (this.settings.data_menu_open) {
        data_menu.style.visibility = "hidden";
        data_container.style.right = "0px";
        data_menu.style.right = "-330px";
        data_menu.style.width = "330px";
        this.settings.data_menu_open = false;
      } else {
        data_menu.style.visibility = "";
        data_menu.style.right = "0px";
        if (w < 600) {
          data_menu.style.width = "100%";
        } else {
          data_container.style.right = "330px";
          data_menu.style.width = "330px";
        }
        this.settings.data_menu_open = true;
        data_menu.firstElementChild.firstElementChild.focus();
        this.gtag("event", "click", {
          event_category: "open_menu",
          event_label: "data",
        });
      }
      this.resize_plot();
    },
  },
  render: h => h(App),
}).$mount("#app");
