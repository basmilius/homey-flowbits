<template>
    <div
        :class="$style.uiIcon"
        data-icon
        :style="{
            '--icon': JSON.stringify(icon),
            '--icon-secondary': JSON.stringify(icon + icon)
        }"/>
</template>

<script
    lang="ts"
    setup>
    defineProps<{
        readonly icon: string;
    }>();
</script>

<style
    lang="scss"
    module>
    .uiIcon {
        --color: #64748b;
        --icon: '';
        --icon-secondary: '';
        --size: 42px;

        display: grid;
        height: var(--size);
        width: var(--size);
        align-items: center;
        justify-content: center;
    }

    .uiIcon::before,
    .uiIcon::after {
        grid-column: 1;
        grid-row: 1;
        color: var(--color);
        font-family: 'font-awesome', sans-serif;
        font-size: var(--size);
        line-height: var(--size);
    }

    .uiIcon::before {
        content: var(--icon);
    }

    .uiIcon::after {
        content: var(--icon-secondary);
        opacity: .2;
    }
</style>
