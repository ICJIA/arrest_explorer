<template>
  <v-system-bar height="35">
    <v-img
      eager
      contain
      alt="ICJIA logo"
      src="https://icjia.illinois.gov/researchhub/icjia-logo.png"
    />
    <span>Arrest Explorer</span>
  </v-system-bar>
</template>

<style scoped>
.v-system-bar {
  padding: 0;
}
.v-system-bar .v-image {
  position: absolute;
  height: 35px;
  width: 50px;
}
.v-system-bar span {
  font-size: 1.3em;
  margin: 0 0 0 60px;
}
</style>
