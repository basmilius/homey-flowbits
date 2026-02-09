import { ref, getCurrentInstance, type Ref } from 'vue'

interface HomeyApiReturn {
    isLoading: Ref<boolean>
    items: Ref<any[]>
    load: () => Promise<void>
}

export function useHomeyApi(endpoint: string): HomeyApiReturn {
    const instance = getCurrentInstance()
    const Homey = instance?.appContext.config.globalProperties.$homey

    const items = ref<any[]>([])
    const isLoading = ref(true)

    const load = async (): Promise<void> => {
        if (!Homey) return
        isLoading.value = true
        try {
            items.value = await Homey.api('GET', endpoint)
        } catch (error) {
            console.error(`Failed to load ${endpoint}:`, error)
            items.value = []
        }
        isLoading.value = false
    }

    return {
        isLoading,
        items,
        load
    }
}

export function useColors(): HomeyApiReturn {
    return useHomeyApi('/colors')
}

export function useIcons(): HomeyApiReturn {
    return useHomeyApi('/icons')
}

export function useEvents(): HomeyApiReturn {
    return useHomeyApi('/events')
}

export function useFlags(): HomeyApiReturn {
    return useHomeyApi('/flags')
}

export function useLabels(): HomeyApiReturn {
    return useHomeyApi('/labels')
}

export function useModes(): HomeyApiReturn {
    return useHomeyApi('/modes')
}

export function useSets(): HomeyApiReturn {
    return useHomeyApi('/sets')
}

export function useTimers(): HomeyApiReturn {
    return useHomeyApi('/timers')
}
