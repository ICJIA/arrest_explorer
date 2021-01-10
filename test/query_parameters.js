const assert = require("assert"),
  Dataview = require("../src/dataview.js"),
  defaults = {
    value: { type: "=", value: "arrests" },
    format_file: { type: "=", value: "csv" },
  };

describe("When parsing a query...", function() {
  it("no input returns default value and format", function() {
    assert.deepStrictEqual(Dataview.prototype.parse_query(), defaults);
  });
  it("defaults are returned when specified value and format are not recognized", function() {
    assert.deepStrictEqual(
      Dataview.prototype.parse_query("?value=xxxxx&format_file=xxxx"),
      defaults
    );
  });
  it("specified value and format are returned when found", function() {
    assert.deepStrictEqual(
      Dataview.prototype.parse_query("?value=charges&format_file=csv"),
      {
        value: {
          type: "=",
          value: "arrest_charges",
        },
        format_file: { type: "=", value: "csv" },
      }
    );
  });
  it("specified value and format are recognized without names", function() {
    assert.deepStrictEqual(Dataview.prototype.parse_query("?offender&tsv"), {
      value: { type: "=", value: "arrestees" },
      format_file: { type: "=", value: "tsv" },
    });
  });
  it("separate variable criteria are recognized", function() {
    assert.deepStrictEqual(
      Dataview.prototype.parse_query("?a!=f&b>45&c<20&d>=1&e<=0"),
      {
        e: { aspect: "mean", type: "<=", value: 0 },
        d: { aspect: "mean", type: ">=", value: 1 },
        c: { aspect: "mean", type: "<", value: 20 },
        b: { aspect: "mean", type: ">", value: 45 },
        a: { type: "!=", value: "f" },
        ...defaults,
      }
    );
  });
  it("multiple criteria on a single variable are handled", function() {
    assert.deepStrictEqual(
      Dataview.prototype.parse_query("?var>=0&var<=100&var!=50").var,
      [
        { aspect: "label", type: "!=", value: 50 },
        { aspect: "mean", type: "<=", value: 100 },
        { aspect: "mean", type: ">=", value: 0 },
      ]
    );
  });
  it("aspects are handled", function() {
    assert.deepStrictEqual(
      Dataview.prototype.parse_query(
        "?var[mean]>=0&var[label]<=100&var[sum]!=50"
      ).var,
      [
        { type: "!=", aspect: "sum", value: 50 },
        { type: "<=", aspect: "label", value: 100 },
        { type: ">=", aspect: "mean", value: 0 },
      ]
    );
  });
});
