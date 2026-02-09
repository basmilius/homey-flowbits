<template>
    <button
        class="homey-button-transparent"
        type="button"
        @click="onClick">
        {{ label }}
    </button>
</template>

<script
    lang="ts"
    setup>
    const emit = defineEmits<{
        click: [MouseEvent];
    }>();

    defineProps<{
        readonly label: string;
    }>();

    function onClick(evt: MouseEvent): void {
        emit('click', evt);
    }
</script>
