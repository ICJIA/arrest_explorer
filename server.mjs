import Dataview from "./src/dataview.js";
import rawdata from "./src/data.json";
import express from "express";

const app = express(),
  port = process.env.PORT || 3000;

var data = new Dataview(rawdata);

app.get("/", function(req, res) {
  var r = {
    status: res.status,
    options: data.parse_query(req._parsedUrl.search),
  };

  data.update(r.options);
  data.view = data.prepare_view();

  console.log(r);

  if (Object.prototype.hasOwnProperty.call(r.options, "format_file"))
    r.options.format = r.options.format_file;
  if (r.options.format.display_value === "json") {
    res.json(
      data.reformat(
        r.options.format_table ? r.options.format_table.display_value : "mixed",
        r.options.format_value
          ? r.options.format_value.display_value === "index"
          : false,
        r.options.format_json
          ? r.options.format_json.display_value !== "arrays"
          : true
      )
    );
  } else {
    res.header(
      "Content-Type",
      "text/" +
        (r.options.format.display_value === "tsv"
          ? "tab-separated-values"
          : "csv")
    );
    res.attachment(
      "arrest_explorer_export." + (r.options.format.display_value || "csv")
    );
    res.send(
      data.to_string(
        data.reformat(
          r.options.format_table
            ? r.options.format_table.display_value
            : "mixed",
          r.options.format_value
            ? r.options.format_value.display_value === "index"
            : false
        ),
        r.options.format.display_value !== "csv" ? "\t" : ","
      )
    );
  }
});

app.listen(port, function() {
  console.log("listening on port " + port);
});
