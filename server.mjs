import Dataview from "./src/dataview.js";
import rawdata from "./src/data.json";
import levels from "./src/levels.json";
import express from "express";

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

const app = express(),
  port = process.env.PORT || 8080;

var data = new Dataview(rawdata, levels);

app.get("/", async function(req, res) {
  var r = {
    options: data.parse_query(req._parsedUrl.search),
  };
  console.log(r);
  await data.update(r.options);
  if (r.options.format_file.value === "json") {
    res.json(
      data.reformat(
        r.options.format_table ? r.options.format_table.value : "mixed",
        r.options.format_category
          ? r.options.format_category.value === "index"
          : false,
        r.options.format_json ? r.options.format_json.value !== "arrays" : true
      )
    );
  } else {
    res.header(
      "Content-Type",
      "text/" + (r.options.format_file.value === "tsv" ? "plain" : "csv")
    );
    res.attachment(make_name(data, r.options));
    res.send(
      data.to_string(
        data.reformat(
          r.options.format_table ? r.options.format_table.value : "mixed",
          r.options.format_category
            ? r.options.format_category.value === "index"
            : false
        ),
        r.options.format_file.value !== "csv" ? "\t" : ","
      )
    );
  }
});

app.listen(port, function() {
  console.log("listening on port " + port);
});
