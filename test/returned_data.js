"use strict";

const assert = require("assert"),
  Dataview = require("../src/dataview.js"),
  data = new Dataview(
    require("../src/data.json"),
    require("../src/levels.json")
  );

describe("When selecting variables...", function() {
  it("default returns total arrests by year", async function() {
    await data.update();
    assert.deepStrictEqual(data.view.total.filtered, data.raw.arrests.total);
  });
  it("different values are returned when requested", async function() {
    await data.update({ value: { value: "arrestees" } });
    assert.deepStrictEqual(data.view.total.filtered, data.raw.arrestees.total);
  });
  it("a single split works", async function() {
    await data.update(data.parse_query("split=gender"));
    assert.deepStrictEqual(
      data.view.slot.split1.data[0].filtered,
      data.raw.arrests.gender.total.female
    );
    assert.deepStrictEqual(
      data.view.slot.split1.data[1].filtered,
      data.raw.arrests.gender.total.male
    );
  });
  it("non-existent variables are dropped", async function() {
    await data.update(data.parse_query("value=arrest_charges&split=race"));
    assert(!Object.prototype.hasOwnProperty.call(data.view, "race"));
    assert.deepStrictEqual(
      data.view.total.filtered,
      data.raw.arrest_charges.total
    );
  });
  it("two slits work", async function() {
    await data.update(data.parse_query("split=race,age_group"));
    assert(
      Object.prototype.hasOwnProperty.call(data.view, "race") &&
        Object.prototype.hasOwnProperty.call(data.view.race, "subgroups")
    );
    for (var j = data.view.race.subgroups.age_group.length, i; j--; ) {
      for (i = data.view.age_group.levels.length; i--; ) {
        assert.deepStrictEqual(
          data.view.race.subgroups.age_group[j].levels[i].filtered,
          data.raw.arrests.race.age_group[data.view.race.labels[j]][
            data.view.age_group.labels[i]
          ]
        );
      }
    }
  });
});
data
  .update(
    data.parse_query("value=arrest_charges&split=crime_type,offense_class")
  )
  .then(function() {
    describe("When formatting data...", function() {
      var tall = data.reformat("tall"),
        mixed = data.reformat("mixed"),
        wide = data.reformat("wide");
      it("tall works", function() {
        assert.deepStrictEqual(tall.header, [
          "Year",
          "crime_type",
          "offense_class",
          "arrest_charges",
        ]);
        assert(
          (function() {
            for (var i = tall.rows.length; i--; )
              if (tall.rows[i].length !== 4) return false;
            return true;
          })()
        );
      });
      it("mixed works", function() {
        for (
          var header = ["Year", "crime_type"],
            header1 = data.levels.offense_class.display.sort(),
            i = header1.length;
          i--;

        ) {
          header[2 + i] = "offense_class_" + header1[i].toLowerCase();
        }
        assert.deepStrictEqual(mixed.header, header);
        assert(
          (function() {
            for (
              var i = mixed.rows.length,
                l = 2 + data.levels.offense_class.display.length;
              i--;

            )
              if (mixed.rows[i].length !== l) return false;
            return true;
          })()
        );
      });
      it("wide works", function() {
        for (
          var header = ["Year"],
            header1 = data.levels.crime_type.display.sort(),
            header2 = data.levels.offense_class.display.sort(),
            i,
            n = header1.length,
            j = header2.length;
          j--;

        ) {
          for (i = n; i--; )
            header[1 + i + j * n] =
              "crime_type_" +
              header1[i].toLowerCase() +
              ":" +
              "offense_class_" +
              header2[j].toLowerCase();
        }
        assert.deepStrictEqual(wide.header, header);
        assert(
          (function() {
            for (var i = wide.rows.length, ncol = header.length; i--; ) {
              if (wide.rows[i].length !== ncol) return false;
            }
            return true;
          })()
        );
      });
      it("csv and tsv work", function() {
        assert(/^(?:(?:[^,]+,){3}[^,]+\n?)+$/.test(data.to_string(tall, ",")));
        assert(
          /^(?:(?:[^\t]+\t){3}[^\t]+\n?)+$/.test(data.to_string(tall, "\t"))
        );
      });
    });
  });

describe("When filtering by variables...", function() {
  it("single year works", async function() {
    await data.update(data.parse_query("year=2019"));
    assert.deepStrictEqual(data.view.year.filtered, [2019]);
  });
  it("year range works", async function() {
    await data.update(data.parse_query("year>2015&year<2018"));
    assert(data.view.total.filtered.length === 2);
    assert(data.view.year.min === 2016);
    assert(data.view.year.max === 2017);
  });
  it("single variable label works", async function() {
    await data.update(data.parse_query("split=race&race=african american"));
    assert.deepStrictEqual(data.view.race.labels, ["african american"]);
  });
  it("single variable mean works", async function() {
    await data.update(data.parse_query("split=race&race[mean]>1e5"));
    assert.deepStrictEqual(data.view.race.labels, [
      "african american",
      "white",
    ]);
  });
  it("multi variable label works", async function() {
    await data.update(
      data.parse_query("split=race,gender&race=hispanic&gender=male")
    );
    assert.deepStrictEqual(data.view.race.labels, ["hispanic"]);
    assert.deepStrictEqual(data.view.gender.labels, ["male"]);
  });
  it("multi variable mean works", async function() {
    await data.update(
      data.parse_query("split=race,gender&race[mean]>1e5&gender[mean]<9e4")
    );
    assert.deepStrictEqual(data.view.race.labels, [
      "african american",
      "white",
    ]);
    assert.deepStrictEqual(data.view.gender.labels, ["female"]);
  });
  it("single variable multiple criteria works", async function() {
    await data.update(
      data.parse_query("split=race&race[mean]>1e5&race!=african american")
    );
    assert.deepStrictEqual(data.view.race.labels, ["white"]);
  });
  it("multi variable multiple criteria works", async function() {
    await data.update(
      data.parse_query(
        "split=race,age_group&race[mean]>1e3&race!=african american&" +
          "age_group<1e5&age_group!=65 - 99"
      )
    );
    assert.deepStrictEqual(data.view.race.labels, [
      "asian",
      "hispanic",
      "white",
    ]);
    assert.deepStrictEqual(data.view.age_group.labels, ["18 - 24", "45 - 64"]);
  });
  it("(sorted) multi variable multiple criteria works", async function() {
    await data.update(
      data.parse_query(
        "split=race,age_group&race[mean]>1e3&race!=african american&" +
          "age_group<1e5&age_group!=65 - 99&sort=race[sum],-age_group[min]"
      )
    );
    assert.deepStrictEqual(data.view.race.labels, [
      "white",
      "hispanic",
      "asian",
    ]);
    assert.deepStrictEqual(data.view.age_group.labels, ["45 - 64", "18 - 24"]);
  });
});
