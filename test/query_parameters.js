const assert = require("assert"),
  Dataview = require("../src/dataview.js"),
  defaults = {
    value: { type: "=", display_value: "arrests", value: "arrests" },
    format: { type: "=", display_value: "csv", value: "csv" },
  };

console.log(Dataview.prototype.parse_query("?var>=0&var<=100&var!=50"));

describe("Data Structuring", function() {
  it("no input returns default value and format", function() {
    assert.deepStrictEqual(Dataview.prototype.parse_query(), defaults);
  });
  it("defaults are returned when specified value and format are not recognized", function() {
    assert.deepStrictEqual(
      Dataview.prototype.parse_query("?value=xxxxx&format=xxxx"),
      defaults
    );
  });
  it("specified value and format are returned when found", function() {
    assert.deepStrictEqual(
      Dataview.prototype.parse_query("?value=charges&format=json"),
      {
        value: {
          type: "=",
          display_value: "arrest_charges",
          value: "arrest_charges",
        },
        format: { type: "=", display_value: "json", value: "json" },
      }
    );
  });
  it("specified value and format are recognized without names", function() {
    assert.deepStrictEqual(Dataview.prototype.parse_query("?offender&tsv"), {
      value: { type: "=", display_value: "arrestees", value: "arrestees" },
      format: { type: "=", display_value: "tsv", value: "tsv" },
    });
  });
  it("separate variable criteria are recognized", function() {
    assert.deepStrictEqual(
      Dataview.prototype.parse_query("?a!=f&b>45&c<20&d>=1&e<=0"),
      {
        e: { type: "<=", display_value: 0, value: 0 },
        d: { type: ">=", display_value: 1, value: 1 },
        c: { type: "<", display_value: 20, value: 20 },
        b: { type: ">", display_value: 45, value: 45 },
        a: { type: "!=", display_value: "f", value: { f: false } },
        ...defaults,
      }
    );
  });
  it("multiple criteria on a single variable are handled", function() {
    assert.deepStrictEqual(
      Dataview.prototype.parse_query("?var>=0&var<=100&var!=50").var,
      [
        { type: "!=", display_value: 50, value: 50 },
        { type: "<=", display_value: 100, value: 100 },
        { type: ">=", display_value: 0, value: 0 },
      ]
    );
  });
});
