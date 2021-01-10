"use-strict";
const Dataview = require("../src/dataview.js"),
  data = new Dataview(
    require("../src/data.json"),
    require("../src/levels.json")
  );

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
  if (o.by_year && o.by_year.value !== "true") n += "-averages";
  n += "." + o.format_file.value;
  return n;
}

exports.handler = async function(event) {
  var k,
    query = "",
    o = {},
    r = {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
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
    o = data.parse_query(query);
    await data.update(o);
    if (o.format_file.value === "json") {
      r.body = JSON.stringify(
        data.reformat(
          o.format_table ? o.format_table.value : "mixed",
          o.format_json ? o.format_json.value !== "arrays" : true
        )
      );
    } else {
      r.headers["Content-Type"] =
        "text/" + (o.format_file.value === "tsv" ? "plain" : "csv");
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
