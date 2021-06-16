const labelMenu = function() {
    // looks for a label in the label component, an aria-label attribute of the owner, or a label associated with the input component,
    // then sets it as the menu's aria-label attribute.
    if (
      this.$refs.menu.$refs.content &&
      this.$refs.menu.$refs.content.firstElementChild
    ) {
      var label = this.$refs.label
        ? this.$refs.label.innerText
        : this.$refs.label
        ? this.$refs.label.innerText
        : Object.prototype.hasOwnProperty.call(this.$attrs, "aria-label")
        ? this.$attrs["aria-label"]
        : this.$refs.input &&
          this.$refs.input.labels &&
          this.$refs.input.labels.length
        ? this.$refs.input.labels[0].innerText
        : "";
      if (label)
        this.$refs.menu.$refs.content.firstElementChild.setAttribute(
          "aria-label",
          label
        );
      this.$refs.menu.$refs.content.firstElementChild.style.display = "inherit";
    }
  },
  activateMenu = function() {
    // expands a select element's menu when it is focused (triggered from a focus listener added by addListenersToSelects),
    // then queues labelMenu on the select if it has no menu content (its first time being opened).
    this.isMenuActive = true;
    if (!this.$refs.menu.$refs.content) setTimeout(labelMenu.bind(this), 0);
  },
  addListenersToSelects = function() {
    // gets all v-input elements and adds a focus listener to their input components if they have a menu.
    // if they are comboboxes with no aria-label (on their component with the combobox role), also adds that label.
    for (
      var inputs = this.$el.getElementsByClassName("v-input"),
        i = inputs.length,
        label;
      i--;

    ) {
      if (inputs[i].__vue__ && inputs[i].__vue__.$refs.menu) {
        inputs[i].__vue__.$refs.input.addEventListener(
          "focus",
          activateMenu.bind(inputs[i].__vue__)
        );
        if (
          inputs[
            i
          ].__vue__.$el.firstElementChild.firstElementChild.getAttribute(
            "role"
          ) === "combobox" &&
          !inputs[
            i
          ].__vue__.$el.firstElementChild.firstElementChild.getAttribute(
            "aria-label"
          )
        ) {
          label = Object.prototype.hasOwnProperty.call(
            this.$attrs,
            "aria-label"
          )
            ? this.$attrs["aria-label"]
            : (label = Object.prototype.hasOwnProperty.call(
                inputs[i].__vue__.$refs,
                "label"
              )
                ? inputs[i].__vue__.$refs.label.innerText
                : "");
          if (label)
            inputs[
              i
            ].__vue__.$el.firstElementChild.firstElementChild.setAttribute(
              "aria-label",
              label
            );
          inputs[i].__vue__.$refs.input.setAttribute("role", "textbox");
          inputs[i].__vue__.$refs.input.setAttribute("aria-multiline", false);
        }
      }
    }
  };

export { addListenersToSelects };
