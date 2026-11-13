<template>
    <button
        class="homey-button-primary-full"
        :class="{'is-loading': isLoading}"
        type="button"
        :aria-busy="isLoading"
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

    const {
        isLoading
    } = defineProps<{
        readonly isLoading?: boolean;
        readonly label: string;
    }>();

    function onClick(evt: MouseEvent): void {
        if (isLoading) {
            return;
        }

        emit('click', evt);
    }
</script>
