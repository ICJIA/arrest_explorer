"use strict";

const assert = require("assert"),
  api = require("../functions/api.js").handler,
  Dataview = require("../src/dataview.js"),
  data = new Dataview(
    require("../src/data.json"),
    require("../src/levels.json")
  );

describe("When comparing api with manual...", function() {
  const cases = [
      { value: "arrestees", year: "2015" },
      { value: "arrestees", year: "2015", sort: "year" },
      { value: "arrestees", split: "county" },
      { value: "arrestees", split: "county", county: "adams" },
      { value: "arrestees", split: "county", county: "0,1, 2" },
      {
        value: "arrestees",
        split: "county",
        county: "0,1, 2",
        sort: "county[mean]",
      },
      { value: "arrestees", split: "county,age_group" },
      { value: "arrestees", split: "county,age_group", "year>": "2015" },
      {
        value: "arrestees",
        split: "county,age_group",
        "year>": "2015",
        sort: "year,-county[mean],age_group",
      },
      {
        value: "arrestees",
        split: "county",
        "year>": "2015",
        county: "Cook County Suburbs,cook chicago,Kane,madison",
        "county>": 12000,
      },
    ],
    formats = [
      { name: "format_table", values: ["tall", "mixed", "wide"] },
      { name: "format_category", values: ["indices", "codes", "labels"] },
    ];
  for (
    var c = cases.length,
      fn,
      fv,
      fs,
      o = { queryStringParameters: {} },
      args = {},
      k,
      q;
    c--;

  ) {
    for (fn = formats.length; fn--; ) {
      for (fv = formats[fn].values.length; fv--; ) {
        fs = {};
        fs[formats[fn].name] = formats[fn].values[fv];
        o.queryStringParameters = Object.assign({}, cases[c], fs);
        q = "";
        for (k in o.queryStringParameters)
          if (
            Object.prototype.hasOwnProperty.call(o.queryStringParameters, k)
          ) {
            q +=
              (q ? "&" : "?") +
              (o.queryStringParameters[k] === ""
                ? k
                : k + "=" + o.queryStringParameters[k]);
          }
        it(
          "query has the same result: " + q,
          async function(q, o) {
            args = data.parse_query(q);
            await data.update(args);
            var m = data.reformat(data.options.format_table || "mixed"),
              ms = data.to_string(m),
              r = await api(JSON.parse(o));
            assert.deepStrictEqual(ms, r.body);
          }.bind(null, q, JSON.stringify(o))
        );
      }
    }
  }
});

describe("when passing arguments...", async function() {
  it("values, formats, and logical arguments can be entered with no value", async function() {
    assert.deepStrictEqual(
      await api({
        queryStringParameters: {
          arrests_per_arrestee: "",
          tsv: "",
          average: "",
          split: "gender",
        },
      }),
      await api({
        queryStringParameters: {
          value: "arrests_per_arrestee",
          format_file: "tsv",
          average: "true",
          split: "gender",
        },
      })
    );
  });
});

describe("when entering filter levels...", async function() {
  it("capitalized label (display) works", async function() {
    const res = await api({
        queryStringParameters: {
          split: "county",
          county: "Adams,Lake",
          format_file: "json",
        },
      }),
      d = JSON.parse(res.body);
    assert(
      d.rows.length === 2 &&
        d.rows[0].county === "adams" &&
        d.rows[1].county === "lake"
    );
  });
  it("indices work", async function() {
    const res = await api({
        queryStringParameters: {
          split: "gender",
          gender: "0",
          format_file: "json",
        },
      }),
      d = JSON.parse(res.body);
    assert(d.rows.length === 1 && d.rows[0].gender === "female");
  });
  it("codes work", async function() {
    const res = await api({
        queryStringParameters: {
          split: "gender",
          gender: "F",
          format_file: "json",
        },
      }),
      d = JSON.parse(res.body);
    assert(d.rows.length === 1 && d.rows[0].gender === "female");
  });
});

describe("When entering invalid queries...", async function() {
  it("unrecognized parameters fails", async function() {
    const res = await api({ queryStringParameters: { a: "1" } });
    assert(res.body === "unrecognized parameter: a");
  });
  it("unrecognized sort variables fails", async function() {
    const res = await api({ queryStringParameters: { sort: "fefwd[mean]" } });
    assert(res.body === "unrecognized variable name in sort: fefwd");
  });
  it("too many splits fails", async function() {
    const res = await api({
      queryStringParameters: { split: "race,age_group,gender" },
    });
    assert(res.body === "split can only contain up to 2 variables");
  });
  it("unrecognized splits fails", async function() {
    const res = await api({ queryStringParameters: { split: "a,b" } });
    assert(res.body === "unrecognized split variable: b");
  });
  it("invalid splits fails", async function() {
    const res = await api({
      queryStringParameters: { split: "race,crime_type" },
    });
    assert(res.body === "crime_type cannot be split in conjunction with race");
  });
  it("invalid parameter value fails", async function() {
    const res = await api({ queryStringParameters: { format_json: "sdsd" } });
    assert(
      res.body ===
        "unrecognized format_json (sdsd); should be one of raw, arrays, objects"
    );
  });
  it("filter without split fails", async function() {
    const res = await api({ queryStringParameters: { race: "Asian" } });
    assert(
      res.body ===
        "race must be specified as a split in order to be included as a filter"
    );
  });
  it("invalid value-split combination fails", async function() {
    const res = await api({ queryStringParameters: { split: "crime_type" } });
    assert(res.body === "arrests cannot be split by crime_type");
  });
  it("invalid type with value fails", async function() {
    const res = await api({ queryStringParameters: { "race>": "Asian" } });
    assert(
      res.body ===
        "race must be specified as a split in order to be included as a filter"
    );
  });
  it("invalid filter format fails", async function() {
    const res = await api({
      queryStringParameters: { split: "race", race: "" },
    });
    assert(res.body === "invalid filter format for race");
  });
  it("invalid filter level fails", async function() {
    const res = await api({
      queryStringParameters: { split: "race", race: "wdw,Asian,white" },
    });
    assert(res.body === "invalid level specified for race: wdw");
  });
  it("greater than strings fails", async function() {
    const res = await api({
      queryStringParameters: { split: "race", "race>": "white" },
    });
    assert(res.body === "only numbers can be compared with > or <");
  });
});
