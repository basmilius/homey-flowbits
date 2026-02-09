<template>
    <label
        v-if="label"
        class="homey-form-label"
        :for="id">
        {{ label }}
    </label>

    <input
        class="homey-form-input"
        :disabled="disabled"
        :id="id"
        :type="type"
        v-model="modelValue"/>
</template>

<script
    lang="ts"
    setup>
    import { useId } from 'vue';

    const modelValue = defineModel<string>();

    defineProps<{
        readonly disabled?: boolean;
        readonly label?: string;
        readonly type?: string;
    }>();

    const id = useId();
</script>
