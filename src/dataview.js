"use strict";

const format = /^(?:cs|c$|[jt])/i,
  value = /^(?:ar|ch)/i,
  operators = /([!><]?=|[><])/g,
  equality = /^[!=]/,
  space = /%20/g,
  greater = /%3e/gi,
  lesser = /%3c/gi,
  seps = /\s*(?:[,|])+\s*/g,
  not = /^[!-]/,
  bool = /true|false/i,
  number = /^[+-]?\d*(?:e[+-]?|\.)?\d*$/i,
  integer = /^\d+$/,
  letter = /[A-Za-z]/,
  digit = /\d/,
  whitespace = /\s/,
  upper = /[A-Z]/,
  quotes = /%27|%22/g,
  aspect = { has: /\[/, name: /\[.*$/, aspect: /^.*\[|\]/g };

// standardizes the format_file option, defaulting to "csv"
function which_format(s) {
  switch (s.substr(0, 1).toLowerCase()) {
    case "j":
      return "json";
    case "t":
      return "tsv";
    default:
      return "csv";
  }
}

// standardizes the value option, defaulting to "arrests"
function which_value(s) {
  return /per/.test(s)
    ? "arrests_per_arrestee"
    : /^[op]|ee|^criminal$/.test(s)
    ? "arrestees"
    : /c/.test(s)
    ? "arrest_charges"
    : "arrests";
}

// Maps filter types to functions.
// These are assigned to "fun" in a criteria object (entry in an options.['variable name'] array) by attach_criteria
// - v: the value associated with a level (as passed to fun in check_value or check_object)
// - o: the criteria object
function conditions(o) {
  switch (o.type) {
    case ">":
      return function(v) {
        return v > o.value;
      };
    case ">=":
      return function(v) {
        return v >= o.value;
      };
    case "<":
      return function(v) {
        return v < o.value;
      };
    case "<=":
      return function(v) {
        return v <= o.value;
      };
    case "=":
      return function(v) {
        return Object.prototype.hasOwnProperty.call(o.value, v);
      };
    case "!=":
      return function(v) {
        return !Object.prototype.hasOwnProperty.call(o.value, v);
      };
    default:
      return function() {
        return true;
      };
  }
}

// used by filter_levels to check years against a set of criteria
function check_value(v, c) {
  if (!c.length) c = [c];
  for (var i = c.length; i--; ) {
    if (!c[i].fun(v)) return false;
  }
  return true;
}

// used by filter_levels to check split levels against a set of criteria
function check_object(o, c) {
  if (!c.length) c = [c];
  for (var i = c.length; i--; ) {
    if (
      c[i].enabled &&
      !c[i].fun(
        c[i].aspect === "label" ? o.labels[c[i].format] : o[c[i].aspect]
      )
    )
      return false;
  }
  return true;
}

// used to preprocess data, allowing views to be specified
// - data: main data object in the format of src/data.json
// - levels: map of variable levels in the format of src/levels.json
function Dataview(data, levels) {
  this.raw = data;
  this.dim = { nrow: 0, ncol: 0 };
  this.levels = levels || {};
  this.options = {};
  this.prepare_data = async function(data) {
    // initial, one-time data processing in preparation for later views
    var vars = {
        // stores information about each variable;
        // filled in by make_entry, make_covars
        values: { values: [], splits: {}, total: {} },
      },
      val,
      s1,
      s2,
      ckt,
      ckot = false,
      k,
      l,
      i;
    function make_entry(name, vars, dim, levels) {
      // adds a template for a variable to vars
      // - name: variable's name
      // - vars: output object
      // - dim: overall dimension object -- increments the column count
      // - levels: variable's entry from the overall levels object
      if (!Object.prototype.hasOwnProperty.call(levels, "display")) {
        levels.display = [];
        for (var n = levels.label.length, i = 0; i < n; i++) {
          levels.display.push(levels.label[i]);
          levels.label[i] = levels.label[i].toLowerCase();
        }
      }
      vars[name] = {
        levels: levels.display,
        values: [],
        splits: {},
      };
      dim.ncol++;
    }
    function add_covars(value, v1, v2) {
      // adds to an array of covariates (variables that can be split by one another),
      // and to an array of values (data, table; e.g., "arrests") in which the variable appears
      // - value: name of the value
      // - v1: name of first variable; the array added to
      // - v2: name of second variable; the entry in v1's array
      if (!Object.prototype.hasOwnProperty.call(vars[v1].splits, value)) {
        vars[v1].splits[value] = [];
        vars[v1].values.push(value);
      }
      if (!Object.prototype.hasOwnProperty.call(vars[v2].splits, value)) {
        vars[v2].splits[value] = [];
        vars[v2].values.push(value);
      }
      if (vars[v1].splits[value].indexOf(v2) === -1) {
        vars[v1].splits[value].push(v2);
      }
    }
    function calculate_totals(s, o) {
      // calculates totals from splits (sums across splits)
      // - s: split data; data[value][split1][total] or data[value][split1][split2][level]
      // - o: output object; vars.values[total][value] or vars[value][split1][total]
      var i = 0,
        n = 0,
        k;
      for (k in s)
        if (Object.prototype.hasOwnProperty.call(s, k)) {
          if (!n) {
            n = s[k].length;
            if (o && ckt) for (; i < n; i++) o.push(0);
          }
          if (o && ckt) {
            for (i = 0; i < n; i++)
              if ("number" === typeof s[k][i]) o[i] += s[k][i];
          }
        }
      if (o && ckt)
        for (k in s)
          if (Object.prototype.hasOwnProperty.call(s, k)) {
            for (i = 0; i < n; i++) if (o[i] === 0) o[i] = "NA";
          }
    }
    function calculate_part(k, o, a, b) {
      // calculates a vector of arrests / arrestees
      // - k: variable or level name
      // - o: output; the entry in data.arrests_per_arrestee
      // - a: arrests vector (e.g., data.arrests, data.arrests[split1][split2])
      // - b: arrestees vector
      o[k] = [];
      for (var i = a[k].length; i--; )
        o[k][i] =
          b[k][i] && "number" === typeof b[k][i]
            ? Math.round((a[k][i] / b[k][i]) * 1000) / 1000
            : "NA";
    }
    // processing each dataset (value) in the top level of `data`
    for (val in data) {
      if (val === "year") {
        vars.year = data.year;
        this.dim.nrow = vars.year.length;
      } else if (
        val !== "levels" &&
        val !== "version" &&
        Object.prototype.hasOwnProperty.call(data, val)
      ) {
        ckt = false; // flag to calculate top-level totals from lower-level totals
        if (Object.prototype.hasOwnProperty.call(data[val], "total")) {
          vars.values.total[val] = data[val].total;
        } else {
          ckt = true;
        }
        // processing each variable (split) in the given dataset
        for (s1 in data[val]) {
          if (
            s1 !== "total" &&
            Object.prototype.hasOwnProperty.call(data[val], s1)
          ) {
            if (!Object.prototype.hasOwnProperty.call(vars, s1))
              make_entry(s1, vars, this.dim, this.levels[s1]);
            add_covars(val, "values", s1);
            // processing each second-level split
            for (s2 in data[val][s1]) {
              if (Object.prototype.hasOwnProperty.call(data[val][s1], s2)) {
                if (s2 === "total") {
                  if (ckt) vars.values.total[val] = [];
                  calculate_totals(data[val][s1].total, vars.values.total[val]);
                  ckt = false;
                } else {
                  if (
                    !Object.prototype.hasOwnProperty.call(
                      data[val][s1],
                      "total"
                    )
                  ) {
                    data[val][s1].total = {};
                    ckt = true;
                    if (
                      !Object.prototype.hasOwnProperty.call(data[val], "total")
                    ) {
                      ckot = true;
                      data[val].total = vars.values.total[val] = [];
                      for (i = data.year.length; i--; ) data[val].total.push(0);
                    }
                    for (k in data[val][s1][s2]) {
                      if (
                        Object.prototype.hasOwnProperty.call(
                          data[val][s1][s2],
                          k
                        )
                      ) {
                        data[val][s1].total[k] = [];
                        calculate_totals(
                          data[val][s1][s2][k],
                          data[val][s1].total[k]
                        );
                        if (ckot)
                          for (i = data.year.length; i--; )
                            if ("number" === typeof data[val][s1].total[k][i])
                              data[val].total[i] += data[val][s1].total[k][i];
                      }
                    }
                    ckt = ckot = false;
                  }
                  if (!Object.prototype.hasOwnProperty.call(vars, s2))
                    make_entry(s2, vars, this.dim, this.levels[s2]);
                  add_covars(val, s1, s2);
                  add_covars(val, s2, s1);
                  add_covars(val, "values", s2);
                  if (!Object.prototype.hasOwnProperty.call(data[val], s2)) {
                    data[val][s2] = this.invert_nest(data[val][s1][s2], true);
                    data[val][s2] = { total: data[val][s2].total };
                  }
                  if (
                    !Object.prototype.hasOwnProperty.call(data[val][s2], s1)
                  ) {
                    data[val][s2][s1] = this.invert_nest(data[val][s1][s2]);
                  }
                }
              }
            }
            if (!Object.prototype.hasOwnProperty.call(vars.values.total, val)) {
              data[val][s1][s2];
            }
          }
        }
      }
    }
    // adding arrests / arrestees table
    data.arrests_per_arrestee = {};
    for (s1 in data.arrests) {
      if (Object.prototype.hasOwnProperty.call(data.arrestees, s1)) {
        if (data.arrestees[s1].length) {
          calculate_part(
            s1,
            data.arrests_per_arrestee,
            data.arrests,
            data.arrestees
          );
        } else {
          data.arrests_per_arrestee[s1] = {};
          for (s2 in data.arrests[s1]) {
            if (Object.prototype.hasOwnProperty.call(data.arrestees[s1], s2)) {
              data.arrests_per_arrestee[s1][s2] = {};
              for (k in data.arrests[s1][s2]) {
                if (
                  Object.prototype.hasOwnProperty.call(
                    data.arrestees[s1][s2],
                    k
                  )
                ) {
                  if (data.arrests[s1][s2][k].length) {
                    calculate_part(
                      k,
                      data.arrests_per_arrestee[s1][s2],
                      data.arrests[s1][s2],
                      data.arrestees[s1][s2]
                    );
                  } else {
                    data.arrests_per_arrestee[s1][s2][k] = {};
                    for (l in data.arrests[s1][s2][k]) {
                      if (
                        Object.prototype.hasOwnProperty.call(
                          data.arrestees[s1][s2][k],
                          l
                        )
                      ) {
                        data.arrests_per_arrestee[s1][s2][k][l] = [];
                        calculate_part(
                          l,
                          data.arrests_per_arrestee[s1][s2][k],
                          data.arrests[s1][s2][k],
                          data.arrestees[s1][s2][k]
                        );
                      }
                    }
                  }
                }
              }
            }
          }
          if (Object.prototype.hasOwnProperty.call(vars, s1)) {
            vars[s1].splits.arrests_per_arrestee = vars[s1].splits.arrests;
            vars[s1].values.push("arrests_per_arrestee");
          }
        }
      }
    }
    vars.values.splits.arrests_per_arrestee = vars.values.splits.arrestees;
    vars.values.total.arrests_per_arrestee = data.arrests_per_arrestee.total;
    vars.values.values.splice(2, 0, "arrests_per_arrestee");
    return vars;
  };
  this.filter = this.vector_filter();
  this.prepare_view();
}

Dataview.prototype = {
  constructor: Dataview,
  options: {},
  // resets options, applied any specified, then calls prepare_view
  update: async function(options) {
    var k;
    options = options || {};
    this.options = {
      round:
        Object.prototype.hasOwnProperty.call(options, "value") &&
        options.value === "arrests_per_arrestee"
          ? 1000
          : 10,
    };
    if (options) {
      for (k in options)
        if (Object.prototype.hasOwnProperty.call(options, k)) {
          this.options[k] = options[k];
        }
      if (
        Object.prototype.hasOwnProperty.call(options, "year") ||
        (Object.prototype.hasOwnProperty.call(options, "sort") &&
          Object.prototype.hasOwnProperty.call(options.sort, "year"))
      )
        this.filter = this.vector_filter();
    } else this.filter = this.vector_filter();
    try {
      await this.prepare_view();
    } catch (e) {
      console.log("prepare_view failed:", e);
    }
  },
  add_level_spec: function(o, s, n) {
    if (
      !Object.prototype.hasOwnProperty.call(o, "value") ||
      typeof o.value !== "object" ||
      o.value.push
    )
      o.value = {};
    s = String(s);
    for (var level, format, lvs = s.split(seps), i = lvs.length; i--; ) {
      level = lvs[i].replace(not, "").replace(aspect.name, "");
      if (level) {
        if (!format) {
          format =
            n &&
            Object.prototype.hasOwnProperty.call(this.levels, n) &&
            this.levels[n].label.indexOf(level) !== -1
              ? "label"
              : integer.test(level)
              ? "index"
              : level.length === 1 ||
                (!whitespace.test(level) && digit.test(level))
              ? "code"
              : upper.test(level)
              ? "display"
              : "label";
        } else if (format === "index" && letter.test(level)) format = "code";
        o.value[level] = {
          aspect: aspect.has.test(lvs[i])
            ? lvs[i].replace(aspect.aspect, "")
            : "label",
          format: format,
          increasing: not.test(lvs[i]),
        };
      }
    }
    o.format = format;
  },
  attach_criteria: function(arr, name) {
    if (!arr.length) arr = [arr];
    for (var i = arr.length; i--; ) {
      if (!Object.prototype.hasOwnProperty.call(arr[i], "display_value")) {
        arr[i].display_value =
          typeof arr[i].value === "object" && !arr[i].value.push
            ? Object.keys(arr[i].value)
            : arr[i].value;
        arr[i].enabled = arr[i].display_value === 0 || !!arr[i].display_value;
      }
      if (equality.test(arr[i].type) && arr[i].display_value.length) {
        this.add_level_spec(arr[i], arr[i].display_value, name);
      } else
        arr[i].value = number.test(arr[i].display_value)
          ? Number(arr[i].display_value)
          : void 0;
      arr[i].fun = conditions(arr[i]);
      if (!Object.prototype.hasOwnProperty.call(arr[i], "aspect"))
        arr[i].aspect = equality.test(arr[i].type) ? "label" : "mean";
    }
  },
  validate_options: function() {
    var k, v;
    for (k in this.options)
      if (Object.prototype.hasOwnProperty.call(this.options, k)) {
        if (k === "format_category") {
          switch (
            typeof this.options[k] === "string"
              ? this.options[k].substr(0, 1).toLowerCase()
              : "object" === typeof this.options[k] &&
                Object.prototype.hasOwnProperty.call(this.options[k], "value")
              ? this.options[k].value.substr(0, 1).toLowerCase()
              : ""
          ) {
            case "i":
              this.options[k] = "index";
              break;
            case "c":
              this.options[k] = "code";
              break;
            default:
              this.options[k] = "display";
          }
        } else if (k === "sort") {
          for (v in this.options[k])
            if (Object.prototype.hasOwnProperty.call(this.options[k], v)) {
              if (
                Object.prototype.hasOwnProperty.call(
                  this.options[k][v],
                  "aspect"
                )
              ) {
                switch (this.options[k][v].aspect.substr(0, 2).toLowerCase()) {
                  case "su":
                    this.options[k][v].aspect = "sum";
                    break;
                  case "me":
                    this.options[k][v].aspect = "mean";
                    break;
                  case "ma":
                    this.options[k][v].aspect = "max";
                    break;
                  case "mi":
                    this.options[k][v].aspect = "min";
                    break;
                  default:
                    this.options[k][v].aspect = "label";
                }
              } else this.options[k][v].aspect = "label";
            }
        } else if (
          !Object.prototype.hasOwnProperty.call(this.variables, k) &&
          typeof this.options[k] === "object" &&
          Object.prototype.hasOwnProperty.call(this.options[k], "value")
        ) {
          this.options[k] = this.options[k].value;
        }
      }
    if (!Object.prototype.hasOwnProperty.call(this.options, "value"))
      this.options.value = "arrests";
  },
  invert_nest: function(o, sum) {
    var y,
      i,
      e,
      r = {};
    if (sum) r.total = {};
    for (e in o)
      if (Object.prototype.hasOwnProperty.call(o, e)) {
        for (i in o[e])
          if (Object.prototype.hasOwnProperty.call(o[e], i)) {
            if (!Object.prototype.hasOwnProperty.call(r, i)) {
              r[i] = {};
              if (sum) {
                r.total[i] = [];
                for (y = o[e][i].length; y--; ) r.total[i].push(0);
              }
            }
            r[i][e] = o[e][i];
            if (sum)
              for (y = o[e][i].length; y--; )
                if ("number" === typeof o[e][i][y]) r.total[i][y] += o[e][i][y];
          }
      }
    return r;
  },
  vector_filter: function() {
    // makes a function to filter and potentially sort vectors with entries for each year
    // based on criteria included in this.options.year and this.options.sort.year.
    // also incidentally calculates descriptive statistics of the vector
    var i,
      v,
      s = [],
      rows = [];
    if (Object.prototype.hasOwnProperty.call(this.raw, "year")) {
      if (Object.prototype.hasOwnProperty.call(this.options, "year")) {
        this.attach_criteria(this.options.year);
        for (i = this.raw.year.length; i--; ) {
          if (check_value(this.raw.year[i], this.options.year))
            rows.splice(0, 0, i);
        }
      } else for (i = this.raw.year.length; i--; ) rows[i] = i;
      if (
        Object.prototype.hasOwnProperty.call(this.options, "sort") &&
        Object.prototype.hasOwnProperty.call(this.options.sort, "year") &&
        !this.options.sort.year.increasing
      ) {
        for (i = rows.length; i--; ) {
          v = s.length;
          if (v && this.raw.year[rows[i]] >= this.raw.year[s[v - 1]]) {
            for (; v--; )
              if (this.raw.year[s[v]] >= this.raw.year[rows[i]]) break;
            s.splice(v, 0, rows[i]);
          } else s.push(rows[i]);
        }
      }
    }
    return s.length
      ? function(arr) {
          for (
            var i = 0,
              n = s.length,
              v = 0,
              sum = 0,
              min = Infinity,
              max = -Infinity,
              r = [];
            i < n;
            i++
          ) {
            r.push(arr[s[i]]);
            v = "number" === typeof arr[s[i]] ? arr[s[i]] : NaN;
            sum += v;
            if (min > v) min = v;
            if (max < v) max = v;
          }
          return {
            sum,
            min,
            max,
            mean: isNaN(sum)
              ? "NA"
              : Math.round((sum / n) * this.options.round) / this.options.round,
            filtered: r,
          };
        }
      : rows.length < this.raw.year.length
      ? function(arr) {
          for (
            var i = 0,
              n = rows.length,
              v = 0,
              sum = 0,
              min = Infinity,
              max = -Infinity,
              r = [];
            i < n;
            i++
          ) {
            r.push(arr[rows[i]]);
            v = "number" === typeof arr[rows[i]] ? arr[rows[i]] : NaN;
            sum += v;
            if (min > v) min = v;
            if (max < v) max = v;
          }
          return {
            sum,
            min,
            max,
            mean: isNaN(sum)
              ? "NA"
              : Math.round((sum / n) * this.options.round) / this.options.round,
            filtered: r,
          };
        }
      : function(arr) {
          for (
            var i = 0,
              n = arr.length,
              v = 0,
              sum = 0,
              min = Infinity,
              max = -Infinity,
              r = [];
            i < n;
            i++
          ) {
            r.push(arr[i]);
            v = "number" === typeof arr[i] ? arr[i] : NaN;
            sum += v;
            if (min > v) min = v;
            if (max < v) max = v;
          }
          return {
            sum,
            min,
            max,
            mean: isNaN(sum)
              ? "NA"
              : Math.round((sum / n) * this.options.round) / this.options.round,
            filtered: r,
          };
        };
  },
  get_variable_label: function(variable, level) {
    var i = this.levels[variable].label.indexOf(level);
    return i === -1
      ? {}
      : {
          label: this.levels[variable].label[i],
          display: this.levels[variable].display[i],
          code: this.levels[variable].code[i],
          index: this.levels[variable].index[i],
        };
  },
  filter_levels: function(o, crit, split) {
    // filters and potentially sorts the levels of a splitting variable,
    // applying a vector filter to each lowest-level, and making inclusion
    // and ordering decisions about higher levels
    // - o: Object containing levels (e.g., this.raw[value][split].total)
    // - crit: Array containing criteria for the variable (e.g., this.options[split])
    // - split: name of the variable
    var r, l, i, c, f;
    r = {
      sum: 0,
      present: 0,
      min: Infinity,
      max: -Infinity,
      display_info: { maxlen: 0, sumlen: 0 },
      labels: [],
      display: [],
      levels: [],
    };
    if (!Object.prototype.hasOwnProperty.call(this.options, "sort"))
      this.options.sort = {};
    if (o) {
      if (crit) {
        if (!crit.length) crit = [crit];
        this.attach_criteria(crit, split);
      }
      // function to assess each level
      // - c: Object containing level information (aspects; o[level])
      // - l: level name
      // - s: Object containing sorting options
      f =
        Object.prototype.hasOwnProperty.call(this.options.sort, split) &&
        (this.options.sort[split].aspect !== "label" ||
          !this.options.sort[split].increasing)
          ? function(c, l, s) {
              if (r.display.length) {
                if (s.increasing) {
                  for (i = r.levels.length; i--; )
                    if (r.levels[i][s.aspect] <= c[s.aspect]) break;
                } else {
                  for (i = r.levels.length; i--; )
                    if (r.levels[i][s.aspect] >= c[s.aspect]) break;
                }
                r.levels.splice(++i, 0, c);
                r.labels.splice(i, 0, l);
                r.display.splice(i, 0, c.label);
              } else {
                r.levels.push(c);
                r.labels.push(l);
                r.display.push(c.label);
              }
              r.display_info.sumlen += c.label.length;
              if (c.label.length > r.display_info.maxlen)
                r.display_info.maxlen = c.label.length;
            }
          : function(c, l) {
              r.levels.push(c);
              r.labels.push(l);
              r.display.push(c.label);
              r.display_info.sumlen += c.label.length;
              if (c.label.length > r.display_info.maxlen)
                r.display_info.maxlen = c.label.length;
            };
      // applying vector filters to and assessing each level
      for (l in o) {
        if (Object.prototype.hasOwnProperty.call(o, l)) {
          c = this.filter(o[l]);
          c.labels = this.get_variable_label(split, l);
          if (
            !Object.prototype.hasOwnProperty.call(
              c.labels,
              this.options.format_category
            )
          )
            c.labels[this.options.format_category] = l;
          c.label = c.labels[this.options.format_category];
          if (!crit || check_object(c, crit)) {
            f(c, l, this.options.sort[split]);
            r.present++;
            if (c.sum) r.sum += c.sum;
            if (r.min > c.sum) r.min = c.sum;
            if (r.max < c.sum) r.max = c.sum;
          }
        }
      }
    }
    r.mean = isNaN(r.sum)
      ? "NA"
      : Math.round((r.sum / r.present) * this.options.round) /
        this.options.round;
    return r;
  },
  // applies filter_levels to a (child) variable within levels of another (parent) variable
  // - split: name of child variable
  // - h: The current view object (this.view) for output
  // - within: name of the parent variable
  filter_sublevels: function(split, h, within) {
    var l, o, c, r, i, n, il, nl, g;
    if (!Object.prototype.hasOwnProperty.call(h, split)) {
      h[split] = this.filter_levels(
        this.raw[this.options.value][split].total,
        this.options[split],
        split
      );
    }
    if (!Object.prototype.hasOwnProperty.call(h[within], "subgroups"))
      h[within].subgroups = {};
    h[within].subgroups[split] = [];
    o = this.raw[this.options.value][within][split];
    for (n = h[within].labels.length, i = 0; i < n; i++) {
      g = h[within].labels[i];
      h[within].subgroups[split].push(
        (r = {
          label: h[within].display[i],
          sum: 0,
          present: 0,
          mean: 0,
          min: Infinity,
          max: -Infinity,
          labels: [],
          display: [],
          levels: [],
        })
      );
      if (Object.prototype.hasOwnProperty.call(o, g)) {
        for (il = 0, nl = h[split].labels.length; il < nl; il++) {
          l = h[split].labels[il];
          r.labels.push(l);
          r.display.push(h[split].display[il]);
          r.levels.push((c = this.filter(o[g][l])));
          c.label = h[split].display[il];
          r.present++;
          if (c.sum) r.sum += c.sum;
          if (r.min > c.sum) r.min = c.sum;
          if (r.max < c.sum) r.max = c.sum;
        }
        if (r.present)
          r.mean = isNaN(r.sum)
            ? "NA"
            : Math.round((r.sum / r.present) * this.options.round) /
              this.options.round;
      }
    }
  },
  // creates a new view (this.view) from the previously specified options (this.options)
  prepare_view: async function() {
    // calls prepare_data if this is the first call
    if (!Object.prototype.hasOwnProperty.call(this, "variables"))
      try {
        this.variables = await this.prepare_data(this.raw);
      } catch (e) {
        console.log("prepare_data failed:", e);
        return void 0;
      }
    this.validate_options();
    var r = { slot: { value: this.options.value } },
      split1,
      split2;
    this.view = r;
    if (this.options.split && this.options.split[0]) {
      split1 = this.options.split[0];
      if (this.options.split[1]) split2 = this.options.split[1];
    }
    if (Object.prototype.hasOwnProperty.call(this.raw, "year")) {
      if (Object.prototype.hasOwnProperty.call(this.options, "year")) {
        this.attach_criteria(this.options.year);
        if (this.options.year.length) this.filter = this.vector_filter();
      }
      r.year = this.filter(this.raw.year);
      r.slot.year = { name: "year", data: r.year };
    }
    if (!Object.prototype.hasOwnProperty.call(this.variables, "values")) {
      console.log("no values in variables", this.variables);
      return void 0;
    }
    if (
      Object.prototype.hasOwnProperty.call(
        this.variables.values.total,
        this.options.value
      )
    )
      r.total = this.filter(this.variables.values.total[this.options.value]);
    r.slot.total = { name: this.options.value, data: r.total };
    if (
      split1 &&
      Object.prototype.hasOwnProperty.call(this.raw[this.options.value], split1)
    ) {
      r[split1] = this.filter_levels(
        this.raw[this.options.value][split1].total,
        this.options[split1],
        split1
      );
      r[split1].label = split1;
      r.slot.split1 = { name: split1, data: r[split1].levels };
      if (
        split2 &&
        this.variables[split1].splits[this.options.value].indexOf(split2) !== -1
      ) {
        if (
          !Object.prototype.hasOwnProperty.call(
            this.raw[this.options.value],
            split1
          )
        ) {
          this.raw[this.options.value][split1][split2] = this.invert_nest(
            this.raw[this.options.value][split2][split1]
          );
        }
        this.filter_sublevels(split2, r, split1);
        r.slot.split2 = { name: split2, data: r[split1].subgroups[split2] };
      }
    }
    return r;
  },
  // converts the internal dataset to a table or more explicit object
  // used for the table view and file export in the UI, and response to API requests
  // - format: Format of the table, same as format_table option
  // - to_object: Boolean; if true, returns an object with a header and body entry
  reformat: function(format, to_object) {
    function init_getter(v, fun, rep, average, s2) {
      // returns a sort of iterator for a variable (year, total, split1, or split2),
      // which will retrieve data for a single row of the given format.
      // - v: slot of the current view (this.view.slot[split])
      // - fun: name of the getter function, as defined in this environment
      // - rep: number of times to repeat the current index
      // - average: Boolean; if true, aggregates rows
      // - s2: Boolean indicating if there is a second split, and v is the first
      const write = to_object
          ? function(p, n) {
              row[n] = p;
            }
          : function(p) {
              row.push(p);
            },
        getter = {
          rep: function() {
            if (this.value) {
              write(
                this.average ? this.value.mean : this.value.filtered[this.row],
                header[this.adj]
              );
              if (this.rep === 1) {
                this.row++;
              } else if (++this.repped >= this.rep) {
                this.repped = 0;
                this.row++;
              }
            }
          },
          down: function() {
            if (this.value.length > this.group) {
              write(this.value[this.group].label, header[this.adj]);
              if (!this.anys2)
                write(
                  this.value[this.group].filtered.length > this.row
                    ? this.average
                      ? this.value[this.group].mean
                      : this.value[this.group].filtered[this.row]
                    : 0,
                  header[nc]
                );
            }
            if (this.rep === 1) {
              if (++this.group >= this.groups) {
                this.group = 0;
                this.row++;
              }
            } else if (++this.repped >= this.rep) {
              this.repped = 0;
              this.row++;
              if (++this.group >= this.groups) this.group = 0;
            }
          },
          down_s2: function() {
            if (
              this.value.length > this.group &&
              this.value[this.group].labels.length > this.level
            ) {
              write(
                this.value[this.group].display[this.level],
                header[this.adj]
              );
              write(
                this.value[this.group].levels[this.level].filtered.length >
                  this.row
                  ? this.average
                    ? this.value[this.group].levels[this.level].mean
                    : this.value[this.group].levels[this.level].filtered[
                        this.row
                      ]
                  : 0,
                header[nc]
              );
            }
            if (++this.level >= this.levels) {
              this.level = 0;
              if (++this.group >= this.groups) {
                this.group = 0;
                this.row++;
              }
            }
          },
          across: function() {
            for (var i = 0, n = this.groups; i < n; i++) {
              write(
                this.value[i].filtered.length > this.row
                  ? this.average
                    ? this.value[i].mean
                    : this.value[i].filtered[this.row]
                  : 0,
                header[i + this.adj]
              );
            }
            this.row++;
          },
          across_s2: function() {
            for (var i = 0, n = this.levels; i < n; i++) {
              write(
                this.value[this.group].levels.length > i &&
                  this.value[this.group].levels[i].filtered.length > this.row
                  ? this.average
                    ? this.value[this.group].levels[i].mean
                    : this.value[this.group].levels[i].filtered[this.row]
                  : 0,
                header[i + this.adj]
              );
            }
            if (++this.group >= this.groups) {
              this.group = 0;
              this.row++;
            }
          },
          across_full: function() {
            for (var i = 0, j, n = this.levels, g = this.groups; i < n; i++) {
              for (j = 0; j < g; j++) {
                write(
                  this.value.length > j &&
                    this.value[j].levels.length > i &&
                    this.value[j].levels[i].filtered.length > i
                    ? this.average
                      ? this.value[j].levels[i].mean
                      : this.value[j].levels[i].filtered[this.row]
                    : 0,
                  header[this.adj + j + i * g]
                );
              }
            }
            this.row++;
          },
        },
        is_split2 =
          v.data.length &&
          Object.prototype.hasOwnProperty.call(v.data[0], "levels");
      return {
        s2: is_split2,
        anys2: s2,
        average: average,
        value: v.data,
        rep: rep || 1,
        repped: 0,
        row: 0,
        group: 0,
        groups: v.data.length,
        level: 0,
        levels: is_split2 ? v.data[0].labels.length : v.data.length,
        adj:
          v.name === "year"
            ? 0
            : v.name === "total"
            ? Number(!average)
            : is_split2
            ? !average + (format !== "wide")
            : Number(!average),
        n: nr,
        get: getter[fun],
      };
    }
    if (
      format === "mixed" &&
      !Object.prototype.hasOwnProperty.call(this.view.slot, "split2")
    )
      format = "tall";
    if (!Object.prototype.hasOwnProperty.call(this.options, "average"))
      this.options.average = false;
    var j,
      i,
      s1 = Object.prototype.hasOwnProperty.call(this.view.slot, "split1"),
      s2 = Object.prototype.hasOwnProperty.call(this.view.slot, "split2"),
      matrix = [],
      row,
      header = [],
      n1 = s1 ? this.view.slot.split1.data.length : 1,
      n2 = s2 ? this.view.slot.split2.data[0].labels.length : 1,
      rep = format === "wide" ? 1 : n1 * (format === "tall" ? n2 : 1),
      nr = this.options.average
        ? rep
        : this.view.slot.year.data.filtered.length * rep,
      nc,
      s1f = format === "wide" ? "across" : "down",
      s2f =
        s2 && format === "wide"
          ? "across_full"
          : format === "mixed"
          ? "across_s2"
          : "down_s2",
      // initialize row mappers
      map = {
        year: init_getter(
          this.view.slot.year,
          "rep",
          rep,
          this.options.average
        ),
        total: init_getter(
          this.view.slot.total,
          "rep",
          rep,
          this.options.average
        ),
        split1: s1
          ? init_getter(
              this.view.slot.split1,
              s1f,
              format === "tall" && s2 ? n2 : 1,
              this.options.average,
              s2
            )
          : null,
        split2: s2
          ? init_getter(this.view.slot.split2, s2f, 1, this.options.average)
          : null,
      };
    // push to header row
    if (!this.options.average) header.push("Year");
    if (s1) {
      if (s1f === "across") {
        if (!s2)
          for (i = 0; i < n1; i++)
            header.push(
              this.view.slot.split1.name +
                "_" +
                this.view.slot.split1.data[i].label
            );
      } else header.push(this.view.slot.split1.name);
      if (s2) {
        if (s2f === "across_full") {
          for (j = 0; j < n2; j++)
            for (i = 0; i < n1; i++)
              header.push(
                this.view.slot.split1.name +
                  "_" +
                  this.view.slot.split1.data[i].label +
                  ":" +
                  this.view.slot.split2.name +
                  "_" +
                  this.view.slot.split2.data[i].display[j]
              );
        } else if (s2f === "across_s2") {
          for (i = 0; i < n2; i++)
            header.push(
              this.view.slot.split2.name +
                "_" +
                this.view.slot.split2.data[0].display[i]
            );
        } else header.push(this.view.slot.split2.name);
      }
    }
    if (format === "tall" || !s1) header.push(this.view.slot.value);
    nc = header.length - 1;
    // write rows
    for (i = 0; i < nr; i++) {
      matrix.push((row = to_object ? {} : []));
      if (!this.options.average) map.year.get();
      if (s2f !== "across_full") map[s1 ? "split1" : "total"].get();
      if (s2) map.split2.get();
    }
    if (to_object) {
      for (i = 0, nc = header.length; i < nc; i++) {
        header[i] = { text: header[i], value: header[i] };
      }
    }
    return { header: header, rows: matrix };
  },
  to_string: function(m, sep) {
    // prepares formatted dataset for file output
    // - m: formatted data, returned from `reformat`
    // - sep: column separating character (e.g., ',' or '\t')
    for (var n = m.rows.length, i = 0, o = [m.header.join(sep)]; i < n; i++)
      o.push(m.rows[i].join(sep));
    if (o.length < 3) o.push("");
    return o.join("\n");
  },
  parse_query: function(q) {
    // extracts options from a query string
    // - q: query string, as (in a browser) from window.location.search
    if ("string" !== typeof q) q = "";
    var arr = q.replace(/^\?+/, "").split(/&+/g),
      arg = [],
      i = arr.length,
      par = {},
      po;
    for (; i--; ) {
      arg = arr[i]
        .replace(greater, ">")
        .replace(lesser, "<")
        .replace(operators, "..$1..")
        .split("..");
      if (arg.length === 1) {
        if (value.test(arg[0])) {
          par.value = { type: "=", value: which_value(arg[0]) };
        } else if (format.test(arg[0])) {
          par.format_file = { type: "=", value: which_format(arg[0]) };
        } else if (arg[0]) par[arg[0]] = { type: "=", value: true };
      } else if (arg.length === 3) {
        arg[2] =
          arg[0] === "value"
            ? which_value(arg[2])
            : arg[0] === "format_file"
            ? which_format(arg[2])
            : arg[2].replace(space, " ");
        if (!arg[2]) continue;
        if (number.test(arg[2])) {
          arg[2] = Number(arg[2]);
        } else if (bool.test(arg[2])) {
          arg[2] = arg[2] === "true";
        } else arg[2] = arg[2].replace(quotes, "");
        if (aspect.has.test(arg[0])) {
          arg[3] = arg[0].replace(aspect.aspect, "");
          arg[0] = arg[0].replace(aspect.name, "");
        }
        if (Object.prototype.hasOwnProperty.call(par, arg[0])) {
          if (!par[arg[0]].length) par[arg[0]] = [par[arg[0]]];
          par[arg[0]].push({
            type: arg[1],
            value: arg[2],
            aspect: arg[3] || (equality.test(arg[1]) ? "label" : "mean"),
            format: "label",
          });
        } else if (arg[0] === "sort") {
          par.sort = {};
          this.add_level_spec(par.sort, arg[2]);
          par.sort = par.sort.value;
        } else if (
          arg[1] !== "=" ||
          (Object.prototype.hasOwnProperty.call(this, "variables") &&
            Object.prototype.hasOwnProperty.call(this.variables, arg[0]))
        ) {
          if (arg[0] === "year" && arg[1] === "=") {
            par.year = [
              { type: ">=", value: arg[2] },
              { type: "<=", value: arg[2] },
            ];
          } else {
            par[arg[0]] = [
              {
                type: arg[1],
                value: arg[2],
                aspect: arg[3] || (equality.test(arg[1]) ? "label" : "mean"),
                format: "label",
              },
            ];
          }
        } else par[arg[0]] = { type: arg[1], value: arg[2] };
        po = par[arg[0]].length
          ? par[arg[0]][par[arg[0]].length - 1]
          : par[arg[0]];
        if (typeof po.value !== "object" && equality.test(po.type)) {
          po.value = {};
          seps.lastIndex = 0;
          if (
            seps.test(arg[2]) ||
            (Object.prototype.hasOwnProperty.call(this, "variables") &&
              Object.prototype.hasOwnProperty.call(this.variables, arg[0]))
          ) {
            if (!Object.prototype.hasOwnProperty.call(par[arg[0]], "format"))
              par[arg[0]].format = "label";
            if (arg[0] === "split") {
              po.value = arg[2].split(seps);
            } else {
              this.add_level_spec(po, arg[2], arg[0]);
            }
          } else if (arg[0] === "split") {
            po.value = [arg[2]];
          } else {
            po.type = arg[1];
            po.value = arg[2];
          }
        }
      }
    }
    if (
      !Object.prototype.hasOwnProperty.call(par, "value") ||
      !par.value.value
    ) {
      par.value = { type: "=", value: "arrests" };
    }
    if (
      !Object.prototype.hasOwnProperty.call(par, "format_file") ||
      !par.format_file.value
    )
      par.format_file = { type: "=", value: "csv" };
    return par;
  },
};

module.exports = Dataview;
