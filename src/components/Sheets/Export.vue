<template>
  <v-dialog
    role="dialog"
    v-model="$root.settings.export_open"
    open-delay="0"
    overlay-opacity=".8"
    max-width="1200px"
  >
    <v-card>
      <v-card-title>
        <h1 role="heading" class="headline">Export Image or Data</h1>
        <v-spacer></v-spacer
        ><v-btn icon title="close" @click="$root.settings.export_open = false"
          ><v-icon>mdi-close</v-icon></v-btn
        >
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
                    <v-combobox
                      label="Width"
                      aria-label="image width"
                      :items="['500%', '4096', '2560', '1920', '100%']"
                      :rules="valid_dim"
                      v-model="$root.settings.image_dim[0]"
                    ></v-combobox>
                    <v-icon slot="append">mdi-close</v-icon>
                    <v-combobox
                      label="Height"
                      aria-label="image height"
                      :items="['500%', '2160', '1440', '1080', '100%']"
                      :rules="valid_dim"
                      v-model="$root.settings.image_dim[1]"
                    ></v-combobox>
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
                    label="File Format"
                    v-model="$root.settings.format_file"
                  ></v-select>
                </v-col>
                <v-col v-if="$root.settings.format_file === 'json'">
                  <v-select
                    :items="['raw', 'arrays', 'objects']"
                    label="JSON Format"
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
                    label="Table Format"
                    v-model="$root.settings.format_table"
                  ></v-select> </v-col
                ><v-col>
                  <v-select
                    v-if="
                      $root.settings.format_file !== 'json' ||
                        $root.settings.format_json !== 'raw'
                    "
                    :items="['labels', 'indices', 'codes']"
                    label="Category Format"
                    v-model="$root.settings.format_category"
                  ></v-select>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-row v-for="url in urls" :key="url.header">
            <v-subheader>{{ url.header }}</v-subheader>
            <div class="api-display">
              <a
                :title="url.description"
                :href="url.base + url.query.string"
                target="_blank"
              >
                <span class="url-base">{{ url.base }}</span>
                <span v-if="url.query.parts.length" class="url-param-inital"
                  >?</span
                >
                <span
                  v-for="(part, index) in url.query.parts"
                  :key="part.slot + part.type + part.value"
                >
                  <span class="url-param-key">{{ part.slot }}</span>
                  <span v-if="part.aspect" class="url-param-aspect">{{
                    "[" + part.aspect + "]"
                  }}</span>
                  <span class="url-param-type">{{ part.type }}</span>
                  <span class="url-param-value">{{ part.value }}</span>
                  <span
                    v-if="index !== url.query.parts.length - 1"
                    class="url-param-sep"
                    >&</span
                  >
                </span>
              </a>
            </div>
            <v-spacer></v-spacer>
            <v-btn v-if="url.embed" small text @click="copy_embed(url)"
              >Copy Embed Code</v-btn
            >
          </v-row>
        </v-col>
      </v-card-text>
      <v-card-actions>
        <span class="note" v-show="$root.settings.version"
          >Data updated {{ $root.settings.version }}</span
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
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
      urls: [
        {
          header: "Link to this plot:",
          description: "link the the current data view",
          base: this.$root.settings.url,
          refresh: this.$root.display_query.bind(this, {
            value: "arrests",
            average: false,
            as_table: false,
            format_table: "mixed",
            format_category: "labels",
            plot_type: "line",
          }),
          query: { parts: [], string: "" },
          embed: true,
        },
        {
          header: "Download through the API:",
          description:
            "link to download the current data view through the programing interface",
          base: this.$root.settings.url + "api/",
          refresh: this.$root.display_query.bind(this, {
            value: "arrests",
            average: false,
            format_file: "csv",
            format_table: "mixed",
            format_category: "labels",
          }),
          query: { parts: [], string: "" },
        },
      ],
    };
  },
  methods: {
    make_name: function(format, data_out) {
      var s = this.$root.settings,
        n =
          "arrest_explorer-" +
          this.$root.$options.source.raw.version.replace(/\//g, "") +
          "-" +
          s.value;
      if (s.split1) n += "-" + s.split1;
      if (s.split2) n += "-" + s.split1;
      if (data_out) n += "-" + s.format_table;
      if (s.average) n += "-averages";
      n += "." + format;
      return n;
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
                s.format_json === "objects"
              )
        );
      } else {
        data = this.$root.$options.source.to_string(
          this.$root.$options.source.reformat(s.format_table),
          s.format_file === "csv" ? "," : "\t"
        );
      }
      save(
        new Blob([data], {
          type:
            s.format_file === "json"
              ? "application/json"
              : "text/" + (s.format_file === "tsv" ? "plain" : "csv"),
        }),
        s.format_file === "json" && s.format_json === "raw"
          ? "arrest_explorer-" +
              this.$root.$options.source.raw.version.replace(/\//g, "") +
              ".json"
          : this.make_name(s.format_file, true)
      );
      this.$root.gtag("event", "download_data", {
        event_category: s.value,
        event_label: s.split1 + (s.split2 ? "," + s.split2 : ""),
      });
    },
    save_image: function() {
      if (this.$root.settings.as_table) {
        this.$root.settings.as_table = false;
        setTimeout(this.save_image, this.$root.settings.animation_time + 100);
        return;
      }
      if (!this.$root.settings.svg) {
        this.$root.settings.svg = true;
        setTimeout(
          function() {
            this.save_image();
            this.$root.settings.svg = false;
          }.bind(this),
          this.$root.settings.animation_time + 100
        );
        return;
      }
      var uri = this.$root.$options.plot.instance,
        type = this.$root.settings.format_image,
        data = "";
      if (uri) {
        data = uri.getDataURL();
        if (type === "svg") {
          save(data, this.make_name(type));
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
            save(data, this.make_name(type));
          }.bind(this);
        }
        this.$root.gtag("event", "download_image", {
          event_category: this.$root.settings.value,
          event_label:
            this.$root.settings.split1 +
            (this.$root.settings.split2
              ? "," + this.$root.settings.split2
              : ""),
        });
      }
    },
    copy_embed: function(url) {
      navigator.clipboard.writeText(
        '<iframe title="Plot of Illinois ' +
          this.$root.$options.display.graphic[0].style.text +
          '" width="100%" height="' +
          (!this.$root.settings.average &&
          this.$root.settings.split2 &&
          this.$root.$options.source.view.slot.split2.data.length > 4
            ? 100 *
              (this.$root.$options.source.view.slot.split2.data.length + 1)
            : 435) +
          '" frameborder="0" src="' +
          url.base +
          url.query.string +
          '&embed"></iframe>'
      );
    },
  },
  watch: {
    "$root.settings": {
      handler: function() {
        if (
          this.$root.settings.active &&
          this.$root.settings.export_open &&
          Object.prototype.hasOwnProperty.call(
            this.$root.$options.source,
            "variables"
          )
        ) {
          for (var i = this.urls.length; i--; )
            this.urls[i].query = this.urls[i].refresh();
        }
      },
      deep: true,
    },
  },
  updated() {
    this.$nextTick(this.$root.addListenersToSelects.bind(this));
  },
};
</script>

<style scoped>
.row {
  margin: 0 0 1em 0;
}
.row:last-of-type {
  margin: 0;
}
.v-dialog > .v-card > .v-card__text {
  padding: 0 1.5em;
}
.block-row > .col:first-of-type {
  margin: 0 1em 0.5em 0;
}
.input-row > .v-input {
  width: 24%;
}
.image-format {
  margin-right: 5px;
}
.note {
  font-size: 0.7em;
}
@media screen and (max-width: 750px) {
  .block-row {
    display: block;
  }
}
</style>
