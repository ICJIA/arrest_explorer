<template>
  <v-navigation-drawer
    absolute
    temporary
    v-model="$root.settings.app_menu_open"
    transition="dialog-bottom-transition"
    width="340"
  >
    <template v-slot:prepend>
      <v-list-item>
        <v-list-item-avatar tile size="90">
          <v-img
            contain
            alt="Illinois Criminal Justice Information Authority logo"
            src="https://icjia.illinois.gov/researchhub/icjia-logo.png"
          />
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>Arrest Explorer</v-list-item-title>
          <v-list-item-subtitle
            >Illinois Criminal Justice Information
            Authority</v-list-item-subtitle
          >
        </v-list-item-content>
      </v-list-item>
    </template>
    <v-list id="about_list_items" aria-label="list label">
      <v-list-item
        v-for="link in links"
        :key="link.label"
        :href="link.href"
        target="_blank"
        rel="noreferrer"
        aria-label="item label"
      >
        <v-list-item-icon aria-label="external link"
          ><v-icon>mdi-open-in-new</v-icon></v-list-item-icon
        >
        <v-list-item-title
          aria-label="title label"
          v-text="link.label"
        ></v-list-item-title>
      </v-list-item>
      <v-list-item
        @click="
          $root.settings.app_menu_open = false;
          $root.settings.intro = true;
        "
      >
        <v-list-item-icon aria-label="button"
          ><v-icon>mdi-help</v-icon></v-list-item-icon
        >
        <v-list-item-title>Show Initial Landing Screen Again</v-list-item-title>
      
      </v-list-item>
      <v-list-item
        @click="
          $root.settings.app_menu_open = false;
          $root.settings.examples_open = true;
        "
      >
        <v-list-item-icon aria-label="button"
          ><v-icon>mdi-lightbulb</v-icon></v-list-item-icon
        >
        <v-list-item-title>Examples</v-list-item-title>
      </v-list-item>
      <v-divider></v-divider>
      <div class="options">
        <v-switch
          label="Dark Theme"
          v-model="$root.settings.theme_dark"
          inset
        ></v-switch>

        <v-switch
          label="Share Interaction Data"
          v-model="$root.settings.send_data"
          inset
        ></v-switch>
        <v-btn block @click="reset" class="error">Reset All Options</v-btn>
      </div>
    </v-list>
    <template v-slot:append>
      <v-list class="side-menu-close">
        <v-list-item @click="$root.settings.app_menu_open = false">
          <v-list-item-icon aria-label="button"
            ><v-icon>mdi-close</v-icon></v-list-item-icon
          >
          <v-list-item-title>Close</v-list-item-title>
        </v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script>
export default {
  data: function() {
    return {
      links: [
        {
          label: "Documentation",
          href: "https://icjia.illinois.gov/arrestexplorer/docs/",
          external: true,
        },
        {
          label: "About ICJIA",
          href: "http://www.icjia.state.il.us",
          external: true,
        },
        {
          label: "Code Repository",
          href: this.$root.settings.repo,
          external: true,
        },
      ],
    };
  },
  methods: {
    reset: function() {
      localStorage.clear();
      window.location.replace(this.$root.settings.url);
    },
  },
};
</script>

<style scoped>
.options {
  padding: 0 16px 16px 16px;
}
.v-navigation-drawer__prepend .v-list-item__title {
  font-size: 1.5rem;
}
.v-list-item__title,
.v-list-item__subtitle {
  white-space: pre-wrap;
}
.v-divider {
  margin: 1em 0.5em;
}
.side-menu-close {
  padding: 0;
}
.side-menu-close.theme--dark {
  background: #565656 !important;
}
.side-menu-close.theme--light {
  background: #efefef !important;
}
</style>
