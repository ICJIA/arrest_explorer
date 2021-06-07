"use-strict";
const Dataview = require("../src/dataview.js"),
  numcomp = /^[<>]/,
  data = new Dataview(
    require("../src/data.json"),
    require("../src/levels.json")
  ),
  argument_values = {
    value: ["arrests", "arrestees", "arrests_per_arrestee", "arrest_charges"],
    split: 0,
    format_file: ["json", "csv", "tsv"],
    format_json: ["raw", "arrays", "objects"],
    format_table: ["tall", "mixed", "wide"],
    format_category: ["labels", "indices", "codes"],
    average: [true, false],
    sort: 0,
  };

function make_name(d, o) {
  var n =
    "arrest_explorer-" + d.raw.version.replace(/\//g, "") + "-" + o.value.value;
  if (o.split) {
    if (o.split.value[0]) {
      n += "-" + o.split.value[0];
      if (o.split.value[1]) n += "-" + o.split.value[1];
    }
  }
  n += "-" + (o.format_table ? o.format_table.value : "mixed");
  if (o.average && o.average.value !== "true") n += "-averages";
  n += "." + o.format_file.value;
  return n;
}

exports.handler = async function(event) {
  var k,
    i,
    l,
    query = "",
    o = {},
    r = {
      statusCode: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: "invalid request",
    };
  try {
    for (k in event.queryStringParameters)
      if (
        Object.prototype.hasOwnProperty.call(event.queryStringParameters, k)
      ) {
        query +=
          (query ? "&" : "") +
          (event.queryStringParameters[k] === ""
            ? k
            : k + "=" + event.queryStringParameters[k]);
      }
    await data.prepare_view();
    o = data.parse_query(query);
    for (k in o)
      if (Object.prototype.hasOwnProperty.call(o, k)) {
        if (
          k === "values" ||
          (!Object.prototype.hasOwnProperty.call(argument_values, k) &&
            !Object.prototype.hasOwnProperty.call(data.variables, k))
        ) {
          r.body = "unrecognized parameter: " + k;
          return r;
        } else {
          if (k === "sort") {
            for (query in o.sort)
              if (Object.prototype.hasOwnProperty.call(o.sort, query)) {
                if (
                  !Object.prototype.hasOwnProperty.call(data.variables, query)
                ) {
                  r.body = "unrecognized variable name in sort: " + query;
                  return r;
                }
              }
          } else if (k === "split") {
            i = o.split.value.length;
            if (i > 2) {
              r.body = "split can only contain up to 2 variables";
              return r;
            }
            for (; i--; )
              if (
                !Object.prototype.hasOwnProperty.call(
                  data.variables,
                  o.split.value[i]
                )
              ) {
                r.body = "unrecognized split variable: " + o.split.value[i];
                return r;
              }
            if (
              !Object.prototype.hasOwnProperty.call(
                data.variables[o.split.value[0]].splits,
                o.value.value
              )
            ) {
              r.body =
                o.value.value + " cannot be split by " + o.split.value[0];
              return r;
            }
            if (
              o.split.value.length === 2 &&
              data.variables[o.split.value[0]].splits[o.value.value].indexOf(
                o.split.value[1]
              ) === -1
            ) {
              r.body =
                o.split.value[1] +
                " cannot be split in conjunction with " +
                o.split.value[0];
              return r;
            }
          } else if (Object.prototype.hasOwnProperty.call(argument_values, k)) {
            if (argument_values[k].indexOf(o[k].value) === -1) {
              r.body =
                "unrecognized " +
                k +
                " (" +
                o[k].value +
                "); should be one of " +
                argument_values[k].join(", ");
              return r;
            }
          } else {
            i = o[k].length;
            if (!i) {
              r.body = "invalid filter format for " + k;
              return r;
            }
            if (
              !Object.prototype.hasOwnProperty.call(o, "split") ||
              (k !== "year" && o.split.value.indexOf(k) === -1)
            ) {
              r.body =
                k +
                " must be specified as a split in order to be included as a filter";
              return r;
            }
            for (; i--; ) {
              if (numcomp.test(o[k][i].type)) {
                if (!"number" === typeof o[k][i].value) {
                  r.body = "only numbers can be compared with > or <";
                  return r;
                }
              } else {
                if ("string" === typeof o[k][i].value) {
                  if (data.variables[k].levels.indexOf(o[k][i].value) === -1) {
                    r.body =
                      "invalid level specified for " + k + ": " + o[k][i].value;
                    return r;
                  }
                } else
                  for (l in o[k][i].value)
                    if (
                      Object.prototype.hasOwnProperty.call(o[k][i].value, l)
                    ) {
                      if (data.variables[k].levels.indexOf(l) === -1) {
                        r.body = "invalid level specified for " + k + ": " + l;
                        return r;
                      }
                    }
              }
            }
          }
        }
      }
    await data.update(o);
    if (o.format_file.value === "json") {
      r.headers["Content-Type"] = "application/json; charset=utf-8";
      r.body = JSON.stringify(
        data.reformat(
          o.format_table ? o.format_table.value : "mixed",
          o.format_json ? o.format_json.value !== "arrays" : true
        )
      );
    } else {
      r.headers["Content-Type"] =
        "text/" +
        (o.format_file.value === "tsv" ? "plain" : "csv") +
        "; charset=utf-8";
      r.headers["Content-Disposition"] =
        "attachment; filename=" + make_name(data, o);
      r.body = data.to_string(
        data.reformat(o.format_table ? o.format_table.value : "mixed"),
        o.format_file.value !== "csv" ? "\t" : ","
      );
    }
    r.statusCode = 200;
  } catch (e) {
    console.log("failed request", e);
    r.body = "invalid request";
  }
  return r;
};
