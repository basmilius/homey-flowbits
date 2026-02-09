<template>
    <button
        class="homey-button-primary-full"
        :class="{'is-loading': isLoading}"
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
        readonly isLoading?: boolean;
        readonly label: string;
    }>();

    function onClick(evt: MouseEvent): void {
        emit('click', evt);
    }
</script>
