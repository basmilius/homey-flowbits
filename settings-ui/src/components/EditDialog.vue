<template>
  <div class="edit-overlay">
    <div class="edit">
      <div
        class="edit-icon flowbits-icon"
        :style="{
          '--color': form.color,
          '--icon': iconPrimary,
          '--icon-secondary': iconSecondary
        }"
      ></div>
      <div class="edit-name">{{ name }}</div>

      <fieldset class="homey-form-fieldset">
        <legend class="homey-form-legend">{{ t('settings.edit.color') }}</legend>
        <div class="homey-form-group">
          <div class="color-select">
            <div
              v-for="item in colors"
              :key="item.hex"
              class="color-select-item"
              :class="{ active: form.color === item.hex }"
              :style="{ '--color': item.hex }"
              :title="item.label"
              @click="form.color = item.hex"
            />
          </div>
        </div>
      </fieldset>

      <fieldset class="homey-form-fieldset">
        <legend class="homey-form-legend">{{ t('settings.edit.icon') }}</legend>
        <div class="homey-form-group" style="margin-top: 6px">
          <label class="homey-form-label" for="search">{{ t('settings.search') }}</label>
          <input
            class="homey-form-input"
            id="search"
            type="text"
            v-model="search"
          />
        </div>
        <div class="homey-form-group">
          <div class="icon-select">
            <div
              v-for="item in filteredIcons"
              :key="item.unicode"
              class="icon-select-item flowbits-icon"
              :class="{ active: form.icon === item.unicode }"
              :style="{
                '--icon': JSON.stringify(item.unicode),
                '--icon-secondary': JSON.stringify(item.unicode + item.unicode)
              }"
              :title="item.name"
              @click="form.icon = item.unicode"
            />
          </div>
        </div>
      </fieldset>

      <button
        class="homey-button-primary-full"
        :class="{ 'is-loading': saving }"
        @click="save"
      >
        {{ t('settings.save') }}
      </button>
      <button class="homey-button-transparent" @click="close">
        {{ t('settings.close') }}
      </button>
    </div>
  </div>
</template>

<script>
import { reactive, ref, computed } from 'vue';

export default {
  name: 'EditDialog',
  props: {
    name: String,
    color: String,
    icon: String,
    saving: Boolean,
    colors: Array,
    icons: Array
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const form = reactive({
      color: props.color,
      icon: props.icon
    });

    const search = ref('');

    const filteredIcons = computed(() => {
      const query = search.value.toLowerCase().trim();
      return props.icons
        .filter(item => {
          if (query.length > 0) {
            return item.name.toLowerCase().includes(query);
          }
          return item.unicode === form.icon;
        })
        .slice(0, 54);
    });

    const iconPrimary = computed(() => JSON.stringify(form.icon));
    const iconSecondary = computed(() => JSON.stringify(form.icon + form.icon));

    const save = () => {
      emit('save', { ...form });
    };

    const close = () => {
      emit('close');
    };

    return {
      form,
      search,
      filteredIcons,
      iconPrimary,
      iconSecondary,
      save,
      close
    };
  }
};
</script>
