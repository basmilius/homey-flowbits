<template>
  <fieldset class="homey-form-fieldset">
    <legend class="homey-form-legend">{{ t(titleKey) }}</legend>
    <div class="homey-form-group" style="margin-top: 6px; text-wrap: pretty">
      {{ t(descriptionKey) }}
    </div>
    <div class="homey-form-group">
      <div v-if="items.length > 0" class="items">
        <div
          v-for="item in items"
          :key="item.name"
          class="item"
          @click="$emit('edit', item)"
        >
          <div
            class="item-icon flowbits-icon"
            :style="{
              '--color': item.color,
              '--icon': JSON.stringify(item.icon),
              '--icon-secondary': JSON.stringify(item.icon + item.icon)
            }"
          ></div>
          <div class="item-caption">{{ item.name }}</div>
          <div class="item-icon-edit flowbits-icon"></div>
        </div>
      </div>
      <div v-else class="items-empty">
        {{ t(emptyKey) }}
      </div>
    </div>
  </fieldset>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'CategorySection',
  props: {
    items: {
      type: Array,
      required: true
    },
    type: {
      type: String,
      required: true
    }
  },
  emits: ['edit'],
  setup(props) {
    const titleKey = computed(() => `settings.${props.type}.title`);
    const descriptionKey = computed(() => `settings.${props.type}.description`);
    const emptyKey = computed(() => `settings.${props.type}.empty`);

    return {
      titleKey,
      descriptionKey,
      emptyKey
    };
  }
};
</script>
