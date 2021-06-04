<template>
  <v-system-bar role="heading" aria-level="1" height="35">
    <v-img
      eager
      contain
      alt="ICJIA logo"
      src="https://icjia.illinois.gov/researchhub/icjia-logo.png"
      before
    />
    <v-btn plain @click="$root.reset_view">Arrest Explorer</v-btn>
  </v-system-bar>
</template>

<style scoped>
.v-system-bar {
  padding: 0;
  width: 100%;
}
.v-system-bar .v-image {
  position: absolute;
  height: 35px;
  width: 50px;
}
.v-system-bar button {
  font-size: 1.3em;
  padding: 0 20px 0 60px !important;
}
</style>
