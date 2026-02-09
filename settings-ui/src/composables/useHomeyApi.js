import { ref, getCurrentInstance } from 'vue';

export function useHomeyApi(endpoint) {
  const instance = getCurrentInstance();
  const Homey = instance?.appContext.config.globalProperties.$homey;
  
  const items = ref([]);
  const isLoading = ref(true);

  const load = async () => {
    if (!Homey) return;
    isLoading.value = true;
    try {
      items.value = await Homey.api('GET', endpoint);
    } catch (error) {
      console.error(`Failed to load ${endpoint}:`, error);
      items.value = [];
    }
    isLoading.value = false;
  };

  return {
    isLoading,
    items,
    load
  };
}

export function useColors() {
  return useHomeyApi('/colors');
}

export function useIcons() {
  return useHomeyApi('/icons');
}

export function useEvents() {
  return useHomeyApi('/events');
}

export function useFlags() {
  return useHomeyApi('/flags');
}

export function useLabels() {
  return useHomeyApi('/labels');
}

export function useModes() {
  return useHomeyApi('/modes');
}

export function useSets() {
  return useHomeyApi('/sets');
}

export function useTimers() {
  return useHomeyApi('/timers');
}
