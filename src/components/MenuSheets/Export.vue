<template>
  <v-row justify="center">
    <v-dialog
      v-model="$root.settings.export_open"
      open-delay="0"
      overlay-opacity=".8"
      max-width="1200px"
    >
      <v-card>
        <v-card-title>
          <span class="headline">Export Image or Data</span>
        </v-card-title>
        <v-card-text>
          <v-col>
            <v-row class="block-row">
              <v-col>
                <v-btn block @click="save_image">Save Image</v-btn>
                <v-row>
                  <v-col>
                    <v-select
                      :items="['svg', 'png', 'jpeg']"
                      label="Image Format"
                      class="image-format"
                      v-model="$root.settings.format_image"
                    ></v-select>
                  </v-col>
                  <v-col v-if="$root.settings.format_image !== 'svg'">
                    <v-row class="input-row">
                      <v-text-field
                        label="Width"
                        :rules="valid_dim"
                        v-model="$root.settings.image_dim[0]"
                      ></v-text-field>
                      <v-icon slot="append">mdi-close</v-icon>
                      <v-text-field
                        label="Height"
                        :rules="valid_dim"
                        v-model="$root.settings.image_dim[1]"
                      ></v-text-field>
                    </v-row>
                  </v-col>
                </v-row>
              </v-col>
              <v-col>
                <v-btn block @click="download_data">Download Data</v-btn>
                <v-row>
                  <v-col>
                    <v-select
                      :items="['csv', 'json', 'tsv']"
                      label="file format"
                      v-model="$root.settings.format_file"
                    ></v-select>
                  </v-col>
                  <v-col v-if="$root.settings.format_file === 'json'">
                    <v-select
                      :items="['raw', 'arrays', 'objects']"
                      label="JSON format"
                      v-model="$root.settings.format_json"
                    ></v-select> </v-col
                  ><v-col
                    v-if="
                      $root.settings.format_file !== 'json' ||
                        $root.settings.format_json !== 'raw'
                    "
                  >
                    <v-select
                      :items="['tall', 'mixed', 'wide']"
                      label="table format"
                      v-model="$root.settings.format_table"
                    ></v-select> </v-col
                  ><v-col>
                    <v-select
                      v-if="
                        $root.settings.format_file !== 'json' ||
                          $root.settings.format_json !== 'raw'
                      "
                      :items="['labels', 'indices', 'codes']"
                      label="category format"
                      v-model="$root.settings.format_category"
                    ></v-select>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
            <h3>Download through the API:</h3>
            <div class="api-display">
              <a :href="api_url.string" target="_blank">
                <span class="url-base">{{ $root.settings.base_url }}</span>
                <span v-if="api_url.parts.length" class="url-param-inital"
                  >?</span
                >
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
                  <span
                    v-if="index !== api_url.parts.length - 1"
                    class="url-param-sep"
                    >&</span
                  >
                </span>
              </a>
            </div>
          </v-col>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="$root.settings.export_open = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
function save(uri, name) {
  var e = document.createElement("a");
  e.setAttribute("rel", "noopener");
  e.setAttribute("target", "_blank");
  if ("string" !== typeof uri) {
    uri = URL.createObjectURL(uri);
    setTimeout(URL.revokeObjectURL.bind(null, uri), 1e4);
  }
  e.setAttribute("href", uri);
  e.setAttribute("download", name);
  document.body.appendChild(e);
  setTimeout(function() {
    e.dispatchEvent(new MouseEvent("click"));
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
      api_url: { parts: [], string: "" },
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
      if (this.$root.settings.as_table) {
        this.$root.settings.as_table = false;
        setTimeout(this.save_image, 1100);
        return;
      }
      if (!this.$root.settings.svg) {
        this.$root.settings.svg = true;
        setTimeout(
          function() {
            this.save_image();
            this.$root.settings.svg = false;
          }.bind(this),
          1100
        );
        return;
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
  watch: {
    "$root.settings.export_open": function() {
      this.api_url = this.$root.display_query(defaults);
    },
  },
};
</script>

<style scoped>
.block-row > .col:first-of-type {
  margin: 0 1em 0 0;
}
.input-row > .v-input {
  width: 24%;
}
.image-format {
  margin-right: 5px;
}

@media screen and (max-width: 750px) {
  .block-row {
    display: block;
  }
}
</style>
