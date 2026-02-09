<template>
  <div v-if="$homey">
    <header class="homey-header">
      <h1 class="homey-title">{{ t('settings.title') }}</h1>
      <p class="homey-subtitle">{{ t('settings.subtitle') }}</p>
    </header>

    <form class="homey-form">
      <CategorySection
        v-if="modes.items.value.length > 0"
        :items="modes.items.value"
        type="modes"
        @edit="onEditMode"
      />

      <CategorySection
        v-if="flags.items.value.length > 0"
        :items="flags.items.value"
        type="flags"
        @edit="onEditFlag"
      />

      <CategorySection
        v-if="timers.items.value.length > 0"
        :items="timers.items.value"
        type="timers"
        @edit="onEditTimer"
      />

      <CategorySection
        v-if="labels.items.value.length > 0"
        :items="labels.items.value"
        type="labels"
        @edit="onEditLabel"
      />

      <CategorySection
        v-if="events.items.value.length > 0"
        :items="events.items.value"
        type="events"
        @edit="onEditEvent"
      />

      <CategorySection
        v-if="sets.items.value.length > 0"
        :items="sets.items.value"
        type="sets"
        @edit="onEditSet"
      />

      <Statistics />
    </form>

    <EditDialog
      v-if="editingItem"
      :name="editingItem.name"
      :color="editingItem.color"
      :icon="editingItem.icon"
      :saving="isSaving"
      :colors="colors.items.value"
      :icons="icons.items.value"
      @close="editingItem = null"
      @save="onSave"
    />
  </div>
  <div v-else class="homey-form">
    <p>Loading settings...</p>
  </div>
</template>

<script>
import { ref, onMounted, getCurrentInstance } from 'vue';
import { useColors, useIcons, useEvents, useFlags, useLabels, useModes, useSets, useTimers } from './composables/useHomeyApi';
import CategorySection from './components/CategorySection.vue';
import EditDialog from './components/EditDialog.vue';
import Statistics from './components/Statistics.vue';

export default {
  name: 'App',
  components: {
    CategorySection,
    EditDialog,
    Statistics
  },
  setup() {
    const instance = getCurrentInstance();
    const Homey = instance?.appContext.config.globalProperties.$homey;

    const colors = useColors();
    const icons = useIcons();
    const events = useEvents();
    const flags = useFlags();
    const labels = useLabels();
    const modes = useModes();
    const sets = useSets();
    const timers = useTimers();

    const editingItem = ref(null);
    const editingType = ref(null);
    const isSaving = ref(false);

    const loadData = async () => {
      await Promise.all([
        colors.load(),
        icons.load(),
        events.load(),
        flags.load(),
        labels.load(),
        modes.load(),
        sets.load(),
        timers.load()
      ]);
    };

    onMounted(() => {
      if (Homey) {
        loadData();
      }
    });

    const onEditMode = (item) => {
      editingItem.value = item;
      editingType.value = 'mode';
    };

    const onEditFlag = (item) => {
      editingItem.value = item;
      editingType.value = 'flag';
    };

    const onEditTimer = (item) => {
      editingItem.value = item;
      editingType.value = 'timer';
    };

    const onEditLabel = (item) => {
      editingItem.value = item;
      editingType.value = 'label';
    };

    const onEditEvent = (item) => {
      editingItem.value = item;
      editingType.value = 'event';
    };

    const onEditSet = (item) => {
      editingItem.value = item;
      editingType.value = 'set';
    };

    const onSave = async (formData) => {
      if (!Homey || !editingItem.value) return;
      
      isSaving.value = true;

      try {
        const endpoint = `/${editingType.value}s/look`;
        await Homey.api('POST', endpoint, {
          name: editingItem.value.name,
          color: formData.color,
          icon: formData.icon
        });

        // Reload the appropriate data
        switch (editingType.value) {
          case 'mode': await modes.load(); break;
          case 'flag': await flags.load(); break;
          case 'timer': await timers.load(); break;
          case 'label': await labels.load(); break;
          case 'event': await events.load(); break;
          case 'set': await sets.load(); break;
        }

        editingItem.value = null;
        editingType.value = null;
      } catch (error) {
        console.error('Failed to save:', error);
      } finally {
        isSaving.value = false;
      }
    };

    return {
      colors,
      icons,
      events,
      flags,
      labels,
      modes,
      sets,
      timers,
      editingItem,
      isSaving,
      onEditMode,
      onEditFlag,
      onEditTimer,
      onEditLabel,
      onEditEvent,
      onEditSet,
      onSave
    };
  }
};
</script>
