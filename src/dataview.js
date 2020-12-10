const format = /^(?:cs|c$|[jt])/,
  value = /^(?:[ao]|c[^s])/,
  operators = /([!><]?=|[><])/g,
  equality = /[!=]/,
  space = /%20/g,
  greater = /%3e/g,
  lesser = /%3c/g,
  seps = /\s*(?:[,|])+\s*/g,
  not = /^[!-]/,
  number = /^[+-]?\d*(?:e[+-]?|\.)?\d*$/,
  quotes = /%27|%22/g,
  aspect = { has: /\[/, name: /\[.*$/, aspect: /^.*\[|\]/g },
  defaults = {
    value: "arrests",
    format: "csv",
  };

function which_format(s) {
  switch (s.substr(0, 1).toLowerCase()) {
    case "c":
      return "csv";
    case "t":
      return "tsv";
    default:
      return "json";
  }
}

function which_value(s) {
  return /^[op]|ee|^criminal$/.test(s)
    ? "arrestees"
    : /c/.test(s)
    ? "arrest_charges"
    : "arrests";
}

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

function attach_criteria(arr) {
  for (var i = arr.length, v = [], vi; i--; ) {
    if (!Object.prototype.hasOwnProperty.call(arr[i], "display_value")) {
      arr[i].display_value = arr[i].value;
    } else {
      if (
        equality.test(arr[i].type) &&
        typeof arr[i].display_value === "string"
      ) {
        arr[i].value = {};
        for (v = arr[i].display_value.split(seps), vi = v.length; vi--; ) {
          arr[i].value[v[vi]] = not.test(v[vi]);
        }
      } else
        arr[i].value = number.test(arr[i].display_value)
          ? Number(arr[i].display_value)
          : arr[i].display_value;
    }
    arr[i].fun = conditions(arr[i]);
    if (!Object.prototype.hasOwnProperty.call(arr[i], "aspect"))
      arr[i].aspect = equality.test(arr[i].type) ? "label" : "mean";
  }
}

function check_value(v, c) {
  for (var i = c.length; i--; ) {
    if (!c[i].fun(v)) return false;
  }
  return true;
}

function check_object(o, c) {
  for (var i = c.length; i--; ) {
    if (!c[i].fun(o[c[i].aspect])) return false;
  }
  return true;
}

function Dataview(data, levels, options) {
  this.raw = data;
  this.levels = levels || {};
  this.options = options || {};
  this.criteria = {};
  this.variables = function() {
    var vars = { values: { values: [], splits: {}, total: {} } },
      val,
      s1,
      s2,
      ckt,
      ckot = false,
      k,
      i;
    function add_covars(value, v1, v2) {
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
    function calculate_totals(s, l, o) {
      var i = 0,
        n = 0,
        k,
        ck = !vars[l].levels.length;
      for (k in s)
        if (Object.prototype.hasOwnProperty.call(s, k)) {
          if (!n) {
            n = s[k].length;
            if (o && ckt) for (; i < n; i++) o.push(0);
          }
          if (ck && l) vars[l].levels.push(k);
          if (o && ckt) for (i = 0; i < n; i++) o[i] += s[k][i];
        }
    }
    vars.year = vars.values;
    for (val in this.raw)
      if (
        val !== "year" &&
        val !== "levels" &&
        Object.prototype.hasOwnProperty.call(this.raw, val)
      ) {
        ckt = false;
        if (Object.prototype.hasOwnProperty.call(this.raw[val], "total")) {
          vars.values.total[val] = this.raw[val].total;
        } else {
          ckt = true;
        }
        for (s1 in this.raw[val])
          if (
            s1 !== "total" &&
            Object.prototype.hasOwnProperty.call(this.raw[val], s1)
          ) {
            if (!Object.prototype.hasOwnProperty.call(vars, s1))
              vars[s1] = {
                levels: [],
                values: [],
                splits: {},
              };
            add_covars(val, "values", s1);

            for (s2 in this.raw[val][s1])
              if (Object.prototype.hasOwnProperty.call(this.raw[val][s1], s2)) {
                if (s2 === "total") {
                  if (ckt) vars.values.total[val] = [];
                  calculate_totals(
                    this.raw[val][s1].total,
                    s1,
                    vars.values.total[val]
                  );
                  ckt = false;
                } else {
                  if (
                    !Object.prototype.hasOwnProperty.call(
                      this.raw[val][s1],
                      "total"
                    )
                  ) {
                    this.raw[val][s1].total = {};
                    ckt = true;
                    if (
                      !Object.prototype.hasOwnProperty.call(
                        this.raw[val],
                        "total"
                      )
                    ) {
                      ckot = true;
                      this.raw[val].total = vars.values.total[val] = [];
                      for (i = this.raw.year.length; i--; )
                        this.raw[val].total.push(0);
                    }
                    for (k in this.raw[val][s1][s2])
                      if (
                        Object.prototype.hasOwnProperty.call(
                          this.raw[val][s1][s2],
                          k
                        )
                      ) {
                        this.raw[val][s1].total[k] = [];
                        calculate_totals(
                          this.raw[val][s1][s2][k],
                          s1,
                          this.raw[val][s1].total[k]
                        );
                        if (ckot)
                          for (i = this.raw.year.length; i--; )
                            this.raw[val].total[i] += this.raw[val][s1].total[
                              k
                            ][i];
                      }
                    ckt = ckot = false;
                  }
                  if (!Object.prototype.hasOwnProperty.call(vars, s2))
                    vars[s2] = {
                      levels: [],
                      values: [],
                      splits: {},
                    };
                  add_covars(val, s1, s2);
                  add_covars(val, s2, s1);
                  add_covars(val, "values", s2);
                  if (
                    !Object.prototype.hasOwnProperty.call(this.raw[val], s2)
                  ) {
                    this.raw[val][s2] = this.invert_nest(
                      this.raw[val][s1][s2],
                      true
                    );
                  }
                  if (
                    !Object.prototype.hasOwnProperty.call(this.raw[val][s2], s1)
                  ) {
                    this.raw[val][s2][s1] = this.invert_nest(
                      this.raw[val][s1][s2]
                    );
                  }
                }
              }
            if (!Object.prototype.hasOwnProperty.call(vars.values.total, val)) {
              this.raw[val][s1][s2];
            }
          }
      }
    return vars;
  }.bind(this)();
  this.filter = this.vector_filter();
  this.prepare_view();
}

Dataview.prototype = {
  constructor: Dataview,
  update: function(options) {
    var k,
      ckf = true;
    if (options) {
      for (k in options)
        if (Object.prototype.hasOwnProperty.call(options, k)) {
          this.options[k] =
            typeof options[k] === "object" &&
            Object.prototype.hasOwnProperty.call(options[k], "value") &&
            !options[k].aspect
              ? options[k].value
              : options[k];
          if (
            ckf &&
            (k === "year" ||
              (k === "sort" &&
                Object.prototype.hasOwnProperty.call(options.sort, "year")))
          )
            this.filter = this.vector_filter();
        }
    } else this.filter = this.vector_filter();
    this.prepare_view();
  },
  validate_options: function() {
    if (Object.prototype.hasOwnProperty.call(this.options, "format_category")) {
      switch (this.options.format_category[0].toLowerCase()) {
        case "i":
          this.options.format_category = "index";
          break;
        case "c":
          this.options.format_category = "code";
          break;
        default:
          this.options.format_category = "label";
      }
    }
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
              for (y = o[e][i].length; y--; ) r.total[i][y] += o[e][i][y];
          }
      }
    return r;
  },
  vector_filter: function() {
    var i,
      v,
      s = [],
      rows = [];
    if (Object.prototype.hasOwnProperty.call(this.raw, "year")) {
      if (Object.prototype.hasOwnProperty.call(this.criteria, "year")) {
        for (i = this.raw.year.length; i--; ) {
          if (check_value(this.raw.year[i], this.criteria.year))
            rows.splice(0, 0, i);
        }
      } else for (i = this.raw.year.length; i--; ) rows.splice(0, 0, i);
      if (
        Object.prototype.hasOwnProperty.call(this.options, "sort") &&
        Object.prototype.hasOwnProperty.call(this.options.sort, "year") &&
        this.options.sort.year
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
              sum = 0,
              min = Infinity,
              max = -Infinity,
              r = [];
            i < n;
            i++
          ) {
            r.push(arr[s[i]]);
            if (arr[s[i]]) sum += arr[s[i]];
            if (min > arr[s[i]]) min = arr[s[i]];
            if (max < arr[s[i]]) max = arr[s[i]];
          }
          return { sum, min, max, mean: sum / n, filtered: r };
        }
      : rows.length < this.raw.year.length
      ? function(arr) {
          for (
            var i = 0,
              n = rows.length,
              sum = 0,
              min = Infinity,
              max = -Infinity,
              r = [];
            i < n;
            i++
          ) {
            r.push(arr[rows[i]]);
            if (arr[rows[i]]) sum += arr[rows[i]];
            if (min > arr[rows[i]]) min = arr[rows[i]];
            if (max < arr[rows[i]]) max = arr[rows[i]];
          }
          return { sum, min, max, mean: sum / n, filtered: r };
        }
      : function(arr) {
          for (
            var i = 0,
              n = arr.length,
              sum = 0,
              min = Infinity,
              max = -Infinity,
              r = [];
            i < n;
            i++
          ) {
            r.push(arr[i]);
            if (arr[i]) sum += arr[i];
            if (min > arr[i]) min = arr[i];
            if (max < arr[i]) max = arr[i];
          }
          return { sum, min, max, mean: sum / n, filtered: r };
        };
  },
  get_variable_label: function(variable, level, type) {
    return (
      "" +
      (Object.prototype.hasOwnProperty.call(this.levels[variable], level)
        ? this.levels[variable][level][type]
        : level)
    );
  },
  filter_levels: function(o, crit, split) {
    var r, l, i, c, f;
    r = {
      sum: 0,
      min: Infinity,
      max: -Infinity,
      display_info: { maxlen: 0, sumlen: 0 },
      labels: [],
      display: [],
      levels: [],
    };
    if (o) {
      if (crit) attach_criteria(crit);
      f =
        Object.prototype.hasOwnProperty.call(this.options, "sort") &&
        Object.prototype.hasOwnProperty.call(this.options.sort, split) &&
        this.options.sort[split]
          ? function(c, l, d) {
              if (r.display.length) {
                for (i = r.display.length; i--; ) if (r.display[i] >= d) break;
                if (i === -1) i = 0;
                r.levels.splice(i, 0, c);
                r.labels.splice(i, 0, l);
                r.display.splice(i, 0, d);
              } else {
                r.levels.push(c);
                r.labels.push(l);
                r.display.push(d);
              }
              r.display_info.sumlen += d.length;
              if (d.length > r.display_info.maxlen)
                r.display_info.maxlen = d.length;
            }
          : function(c, l, d) {
              r.levels.push(c);
              r.labels.push(l);
              r.display.push(d);
              r.display_info.sumlen += d.length;
              if (d.length > r.display_info.maxlen)
                r.display_info.maxlen = d.length;
            };
      for (l in o) {
        if (Object.prototype.hasOwnProperty.call(o, l)) {
          c = this.filter(o[l]);
          c.label = this.get_variable_label(
            split,
            l,
            this.options.format_category
          );
          if (!crit || check_object(c, crit)) {
            f(c, l, c.label);
            if (c.sum) r.sum += c.sum;
            if (r.min > c.sum) r.min = c.sum;
            if (r.max < c.sum) r.max = c.sum;
          }
        }
      }
    }
    r.mean = r.sum / r.labels.length;
    return r;
  },
  filter_sublevels: function(split, h, within) {
    var l, o, c, r, i, n, il, nl, g;
    if (!Object.prototype.hasOwnProperty.call(h, split))
      h[split] = this.filter_levels(
        this.raw[this.options.value][split].total,
        this.options[split],
        split
      );
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
          if (c.sum) r.sum += c.sum;
          if (r.min > c.sum) r.min = c.sum;
          if (r.max < c.sum) r.max = c.sum;
        }
        if (r.labels.length) r.mean = r.sum / r.labels.length;
      }
    }
  },
  prepare_view: function() {
    this.validate_options();
    var r = { slot: { value: this.options.value } },
      split1,
      split2;
    this.view = r;
    if (
      Object.prototype.hasOwnProperty.call(this.options, "split") &&
      this.options.split.length
    ) {
      split1 = this.options.split[0];
      if (this.options.split.length > 1) split2 = this.options.split[1];
    }
    this.criteria = {};
    if (Object.prototype.hasOwnProperty.call(this.raw, "year")) {
      if (Object.prototype.hasOwnProperty.call(this.options, "year")) {
        this.criteria.year = this.options.year;
        attach_criteria(this.options.year);
        if ((this.criteria.year, length)) this.filter = this.vector_filter();
      }
      r.year = this.filter(this.raw.year);
      r.slot.year = { name: "year", data: r.year };
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
  reformat: function(format, to_object) {
    function init_getter(v, fun, rep, s2) {
      const write = to_object
          ? function(p, n) {
              row[n] = p;
            }
          : function(p) {
              row.push(p);
            },
        getter = {
          rep: function() {
            if (this.value)
              write(this.value.filtered[this.row], header[this.adj]);
            if (this.rep === 1) {
              this.row++;
            } else if (++this.repped >= this.rep) {
              this.repped = 0;
              this.row++;
            }
          },
          down: function() {
            if (this.value.length > this.group) {
              write(this.value[this.group].label, header[1]);
              if (!this.anys2)
                write(
                  this.value[this.group].filtered.length > this.row
                    ? this.value[this.group].filtered[this.row]
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
              write(this.value[this.group].display[this.level], header[2]);
              write(
                this.value[this.group].levels[this.level].filtered.length >
                  this.row
                  ? this.value[this.group].levels[this.level].filtered[this.row]
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
                  ? this.value[i].filtered[this.row]
                  : 0,
                header[i + this.adj]
              );
            }
            if (this.rep === 1) {
              this.row++;
            } else if (++this.repped >= this.rep) {
              this.repped = 0;
              this.row++;
            }
          },
          across_s2: function() {
            for (var i = 0, n = this.levels; i < n; i++) {
              write(
                this.value[this.group].levels.length > i &&
                  this.value[this.group].levels[i].filtered.length > this.row
                  ? this.value[this.group].levels[i].filtered[this.row]
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
                    ? this.value[j].levels[i].filtered[this.row]
                    : 0,
                  header[1 + j + i * g]
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
        get_label: function(o, g, l) {
          return this.s2 ? o[g][l].label : o[g].label;
        },
        get_value: function(o, g, l, i) {
          return this.s2
            ? o[g].length > l && o[g][l].filtered.length > i
              ? o[g][l].filtered[i]
              : 0
            : o[g].filtered.length > i
            ? o[g].filtered[i]
            : 0;
        },
        s2: is_split2,
        anys2: s2,
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
            ? 1
            : is_split2
            ? 1 + (format === "mixed" ? 1 : n1)
            : 1,
        n: nr,
        get: getter[fun],
      };
    }
    var j,
      i,
      s1 = Object.prototype.hasOwnProperty.call(this.view.slot, "split1"),
      s2 = Object.prototype.hasOwnProperty.call(this.view.slot, "split2"),
      matrix = [],
      row,
      header = ["year"],
      n1 = s1 ? this.view.slot.split1.data.length : 1,
      n2 = s2 ? this.view.slot.split2.data[0].labels.length : 1,
      rep =
        format === "wide" || (format === "mixed" && !s2)
          ? 1
          : n1 * (format === "tall" ? n2 : 1),
      nr = this.view.slot.year.data.filtered.length * rep,
      nc,
      s1f =
        format === "wide" || (format === "mixed" && !s2) ? "across" : "down",
      s2f =
        s2 && format === "wide"
          ? "across_full"
          : format === "mixed"
          ? "across_s2"
          : "down_s2",
      // initialize row mappers
      map = {
        year: init_getter(this.view.slot.year, "rep", rep),
        total: init_getter(this.view.slot.total, "rep", rep),
        split1: s1
          ? init_getter(
              this.view.slot.split1,
              s1f,
              format === "tall" && s2 ? n2 : 1,
              s2
            )
          : null,
        split2: s2 ? init_getter(this.view.slot.split2, s2f) : null,
      };

    // push to header row
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
      map.year.get();
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
    for (var n = m.rows.length, i = 0, o = [m.header.join(sep)]; i < n; i++)
      o.push(m.rows[i].join(sep));
    return o.join("\n");
  },
  parse_query: function(q) {
    if ("string" !== typeof q) q = "";
    var arr = q
        .toLowerCase()
        .replace(/^\?+/, "")
        .split(/&+/g),
      arg = [],
      lvs = [],
      i = arr.length,
      l = 0,
      par = {};
    for (; i--; ) {
      arg = arr[i]
        .replace(greater, ">")
        .replace(lesser, "<")
        .replace(operators, " $1 ")
        .split(" ");
      if (arg.length === 1) {
        if (value.test(arg[0])) {
          par.value = {
            type: "=",
            display_value: which_value(arg.length === 1 ? arg[0] : arg[2]),
          };
          par.value.value = par.value.display_value;
        } else if (format.test(arg[0])) {
          par.format = { type: "=", display_value: which_format(arg[0]) };
          par.format.value = par.format.display_value;
        }
      } else if (arg.length === 3) {
        arg[2] =
          arg[0] === "value"
            ? which_value(arg[2])
            : arg[0] === "format"
            ? which_format(arg[2])
            : arg[2].replace(space, " ");
        if (!arg[2]) arg[2] = "";
        if (number.test(arg[2])) {
          arg[2] = Number(arg[2]);
        } else arg[2] = arg[2].replace(quotes, "");
        if (aspect.has.test(arg[0])) {
          arg[3] = arg[0].replace(aspect.aspect, "");
          arg[0] = arg[0].replace(aspect.name, "");
        }
        if (Object.prototype.hasOwnProperty.call(par, arg[0])) {
          if (!par[arg[0]].length) par[arg[0]] = [par[arg[0]]];
          par[arg[0]].push({
            type: arg[1],
            display_value: arg[2],
            value: arg[2],
          });
          if (arg.length > 3)
            par[arg[0]][par[arg[0]].length - 1].aspect = arg[3];
        } else
          par[arg[0]] = {
            type: arg[1],
            display_value: arg[2],
            value: arg[2],
          };
        if (arg.length > 3) par[arg[0]].aspect = arg[3];
        if (
          typeof par[arg[0]].value === "string" &&
          !Object.prototype.hasOwnProperty.call(defaults, arg[0]) &&
          equality.test(par[arg[0]].type)
        ) {
          par[arg[0]].value = {};
          seps.lastIndex = 0;
          if (seps.test(par[arg[0]].display_value)) {
            if (arg[0] === "split") {
              par[arg[0]].value = arg[2].split(seps);
            } else {
              lvs = arg[2].split(seps);
              for (l = lvs.length; l--; )
                if (lvs[l] !== "")
                  par[arg[0]].value[lvs[l].replace(not, "")] = not.test(lvs[l]);
            }
          } else if (arg[0] === "split") {
            par[arg[0]].value = [arg[2]];
          } else par[arg[0]].value[arg[2].replace(not, "")] = not.test(arg[2]);
        }
      }
    }
    if (
      !Object.prototype.hasOwnProperty.call(par, "value") ||
      !par.value.value
    ) {
      par.value = { type: "=", display_value: "arrests", value: "arrests" };
    }
    if (
      !Object.prototype.hasOwnProperty.call(par, "format") ||
      !par.format.value
    )
      par.format = { type: "=", display_value: "csv", value: "csv" };
    return par;
  },
};

module.exports = Dataview;
