<template>
  <v-col>
    <v-switch
      label="dark theme"
      v-model="$root.settings.theme_dark"
      inset
      dense
    ></v-switch>
    <v-row class="button-row" v-if="!$root.settings.as_table">
      <v-col
        ><v-row class="button-row">
          <v-text-field
            label="plot width"
            class="input-number"
            :rules="valid_dim"
            v-model="$root.settings.plot_area[1]"
          ></v-text-field>
          <v-icon slot="append">mdi-times</v-icon>
          <v-text-field
            label="plot height"
            class="input-number"
            :rules="valid_dim"
            v-model="$root.settings.plot_area[0]"
          ></v-text-field>
          <v-switch
            label="plot as SVG"
            v-model="$root.settings.svg"
            inset
            dense
          ></v-switch> </v-row
      ></v-col>
    </v-row>
    <v-row class="button-row">
      <v-col v-if="!$root.settings.as_table">
        <v-btn block @click="save_image">Save Image</v-btn>
        <v-row>
          <v-select
            :items="['svg', 'png', 'jpeg']"
            label="image format"
            class="image-format"
            v-model="$root.settings.format_image"
          ></v-select>
          <v-text-field
            label="w"
            class="input-number"
            :rules="valid_dim"
            v-model="$root.settings.image_dim[0]"
            v-if="$root.settings.format_image !== 'svg'"
          ></v-text-field>
          <v-icon slot="append" v-if="$root.settings.format_image !== 'svg'"
            >mdi-close</v-icon
          >
          <v-text-field
            label="h"
            class="input-number"
            :rules="valid_dim"
            v-model="$root.settings.image_dim[1]"
            v-if="$root.settings.format_image !== 'svg'"
          ></v-text-field>
        </v-row>
      </v-col>
      <v-col>
        <v-btn block @click="download_data">download data</v-btn>
        <v-row class="input-row">
          <v-select
            :items="['csv', 'json', 'tsv']"
            label="file format"
            v-model="$root.settings.format_file"
          ></v-select>
          <v-select
            v-if="$root.settings.format_file === 'json'"
            :items="['raw', 'arrays', 'objects']"
            label="JSON format"
            v-model="$root.settings.format_json"
          ></v-select>
          <v-select
            v-if="
              $root.settings.format_file !== 'json' ||
                $root.settings.format_json !== 'raw'
            "
            :items="['tall', 'mixed', 'wide']"
            label="table format"
            v-model="$root.settings.format_table"
          ></v-select>
          <v-select
            v-if="
              $root.settings.format_file !== 'json' ||
                $root.settings.format_json !== 'raw'
            "
            :items="['labels', 'indices']"
            label="category format"
            v-model="$root.settings.format_category"
          ></v-select>
        </v-row>
      </v-col>
    </v-row>
    <span class="code-note">download_data through the API:</span>
    <div class="api-display">
      <a :href="api_url.string" target="_blank">
        <span class="url-base">{{ $root.settings.base_url }}</span>
        <span v-if="api_url.parts.length" class="url-param-inital">?</span>
        <span
          v-for="(part, index) in api_url.parts"
          :key="part.slot + part.type"
        >
          <span class="url-param-key">{{ part.slot }}</span>
          <span v-if="part.aspect" class="url-param-aspect">{{
            "[" + part.aspect + "]"
          }}</span>
          <span class="url-param-type">{{ part.type }}</span>
          <span class="url-param-value">{{ part.value }}</span>
          <span v-if="index !== api_url.parts.length - 1" class="url-param-sep"
            >&</span
          >
        </span>
      </a>
    </div>
    <v-row class="button-row">
      <v-col>
        <v-btn block @click="reset" class="error">Reset Options</v-btn>
      </v-col>
    </v-row>
  </v-col>
</template>

<script>
function save(uri, name) {
  var e = document.createElement("a");
  e.setAttribute("rel", "noopener");
  if ("string" !== typeof uri) {
    uri = URL.createObjectURL(uri);
    setTimeout(URL.revokeObjectURL.bind(null, uri), 1e4);
  }
  e.setAttribute("href", uri);
  e.setAttribute("download_data", name);
  document.body.appendChild(e);
  setTimeout(function() {
    e.click();
    document.body.removeChild(e);
  }, 0);
}

const defaults = {
  value: "arrests",
  format: "csv",
  table_format: "mixed",
  category_format: "labels",
};

export default {
  data: function() {
    return {
      valid_dim: [
        function(v) {
          return (
            /^\d*\.?\d*(?:px|%)?$/.test(v) ||
            "Must be a number of pixels or a percentage."
          );
        },
      ],
    };
  },
  methods: {
    reset: function() {
      localStorage.clear();
      window.location.reload();
    },
    download_data: function() {
      this.$root.update_data();
      var s = this.$root.settings,
        data;
      if (s.format_file === "json") {
        data = JSON.stringify(
          s.format_json === "raw"
            ? this.$root.$options.source.raw
            : this.$root.$options.source.reformat(
                s.format_table,
                s.format_categories === "index",
                s.format_json === "objects"
              )
        );
      } else {
        data = this.$root.$options.source.to_string(
          this.$root.$options.source.reformat(
            s.format_table,
            s.format_categories === "index"
          ),
          s.format_file === "csv" ? "," : "\t"
        );
      }
      save(
        new Blob([data], {
          type:
            s.format_file === "json"
              ? "application/json"
              : "text/" +
                (s.format_file === "tsv" ? "tab-separated-values" : "csv"),
        }),
        "arrest_explorer_export." + s.format_file
      );
    },
    save_image: function() {
      if (!this.$root.settings.svg) {
        this.$root.$options.plot.initOptions.renderer = "svg";
        setTimeout(
          function() {
            this.draw_plot();
            this.$options.plot.initOptions.renderer = "canvas";
          }.bind(this.$root),
          0
        );
      }
      var uri = this.$root.$options.plot.instance,
        type = this.$root.settings.format_image,
        data = "";
      if (uri) {
        data = uri.getDataURL();
        if (type === "svg") {
          save(data, "arrest_explorer_image.svg");
        } else {
          var i = document.createElement("img"),
            c = document.createElement("canvas"),
            cx = c.getContext("2d"),
            perc = /%/,
            sdims = this.$root.settings.image_dim,
            edims = this.$root.$options.plot.element.getBoundingClientRect();
          c.width = perc.test(sdims[0])
            ? (edims.width * parseFloat(sdims[0])) / 100
            : parseFloat(sdims[0]);
          c.height = perc.test(sdims[1])
            ? (edims.height * parseFloat(sdims[1])) / 100
            : parseFloat(sdims[1]);
          if (!c.width) c.width = edims.width;
          if (!c.height) c.height = edims.height;
          if (!this.$root.settings.theme_dark) {
            cx.fillStyle = "#ffffff";
            cx.fillRect(0, 0, c.width, c.height);
          }
          i.src = data;
          i.onload = function() {
            cx.drawImage(i, 0, 0, c.width, c.height);
            data = c.toDataURL("image/" + type);
            save(data, "arrest_explorer_image." + type);
          };
        }
      }
    },
  },
  computed: {
    api_url: function() {
      var d = this.$root.$options.display.options,
        parts = [],
        string = this.$root.settings.base_url,
        k,
        i;
      for (k in d)
        if (Object.prototype.hasOwnProperty.call(d, k)) {
          if (
            !Object.prototype.hasOwnProperty.call(defaults, k) ||
            defaults[k] !== d[k]
          ) {
            if (k === "split") {
              if (d[k][0])
                parts.push({
                  slot: k,
                  type: "=",
                  value: d[k][0] + (d[k][1] === "" ? "" : "," + d[k][1]),
                });
            } else {
              if (typeof d[k] === "object") {
                if (
                  !Object.prototype.hasOwnProperty.call(
                    this.$root.$options.source.variables,
                    k
                  ) ||
                  Object.prototype.hasOwnProperty.call(
                    this.$root.$options.source.view,
                    k
                  )
                )
                  for (i = d[k].length; i--; ) {
                    if (
                      k !== "year" ||
                      d[k][i].value !==
                        this.$root.settings.year.range[
                          d[k][i].type === ">=" ? 0 : 1
                        ]
                    ) {
                      parts.push({
                        slot: k,
                        aspect: d[k][i].aspect,
                        type: d[k][i].type,
                        value: d[k][i].display_value,
                      });
                    }
                  }
              } else parts.push({ slot: k, type: "=", value: d[k] });
            }
          }
        }
      return { parts, string };
    },
  },
};
</script>

<style scoped>
.input-row > .v-input {
  width: 24%;
}
.image-format {
  margin-right: 5px;
}
.input-number {
  width: 13%;
}
.button-row {
  margin: 0;
}
.code-note {
  font-size: 0.55em;
  position: absolute;
  left: 2.5em;
  margin: 0.5em 0 0 0;
}
.api-display {
  font-size: 0.7em;
  text-align: center;
  padding: 2em 0.5em 1em 0.5em;
  margin: 0 1em 1em 1em;
  border-radius: 10px;
}
.api-display a {
  padding: 0.5em;
  text-decoration: none;
}

.theme--dark .api-display,
.theme--dark .code-note {
  color: #d6d6d6;
  background: #2f2f2f;
}
.theme--dark .url-param-inital {
  color: #ffbdbd;
}
.theme--dark .url-param-key {
  color: #b3d6ff;
}
.theme--dark .url-param-aspect {
  color: #90e6ce;
}
.theme--dark .url-param-type {
  color: #cccccc;
}
.theme--dark .url-param-value {
  color: #b8efaf;
}
.theme--dark .url-param-sep {
  color: #f5da77;
}

.theme--light .api-display,
.theme--light .code-note {
  color: #5d5d5d;
  background: #f3f3f3;
}
.theme--light .url-param-inital {
  color: #902f2f;
}
.theme--light .url-param-key {
  color: #004ba2;
}
.theme--light .url-param-aspect {
  color: #2d564d;
}
.theme--light .url-param-type {
  color: #525252;
}
.theme--light .url-param-value {
  color: #0c5400;
}
.theme--light .url-param-sep {
  color: #796310;
}

@media screen and (max-width: 750px) {
  .button-row {
    display: block;
  }
}
@media screen and (max-width: 500px) {
  .image-format {
    width: 100%;
    margin-right: 0;
  }
}
</style>
