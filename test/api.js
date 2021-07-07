const assert = require("assert"),
  api = require("../functions/api.js").handler;

describe("When entering invalid queries...", async function() {
  it("unrecognized parameters fails", async function() {
    res = await api({ queryStringParameters: { a: "1" } });
    assert(res.body === "unrecognized parameter: a");
  });
  it("unrecognized sort variables fails", async function() {
    res = await api({ queryStringParameters: { sort: "fefwd[mean]" } });
    assert(res.body === "unrecognized variable name in sort: fefwd");
  });
  it("too many splits fails", async function() {
    res = await api({
      queryStringParameters: { split: "race,age_group,gender" },
    });
    assert(res.body === "split can only contain up to 2 variables");
  });
  it("unrecognized splits fails", async function() {
    res = await api({ queryStringParameters: { split: "a,b" } });
    assert(res.body === "unrecognized split variable: b");
  });
  it("invalid splits fails", async function() {
    res = await api({ queryStringParameters: { split: "race,crime_type" } });
    assert(res.body === "crime_type cannot be split in conjunction with race");
  });
  it("invalid parameter value fails", async function() {
    res = await api({ queryStringParameters: { format_json: "sdsd" } });
    assert(
      res.body ===
        "unrecognized format_json (sdsd); should be one of raw, arrays, objects"
    );
  });
  it("filter without split fails", async function() {
    res = await api({ queryStringParameters: { race: "Asian" } });
    assert(
      res.body ===
        "race must be specified as a split in order to be included as a filter"
    );
  });
  it("invalid value-split combination fails", async function() {
    res = await api({ queryStringParameters: { split: "crime_type" } });
    assert(res.body === "arrests cannot be split by crime_type");
  });
  it("invalid type with value fails", async function() {
    res = await api({ queryStringParameters: { "race>": "Asian" } });
    assert(
      res.body ===
        "race must be specified as a split in order to be included as a filter"
    );
  });
  it("invalid filter level fails", async function() {
    res = await api({
      queryStringParameters: { split: "race", race: "wdw,Asian,white" },
    });
    assert(res.body === "invalid level specified for race: wdw");
  });
});
