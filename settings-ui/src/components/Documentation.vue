<template>
    <FormGroup
        :title="t('settings.documentation.title')"
        :description="t('settings.documentation.description')">
        <div :class="$style.documentation">
            <a
                :class="$style.documentationLink"
                href="https://flowbits.nl"
                target="_blank"
                rel="noopener noreferrer">
                {{ t('settings.documentation.button') }}
            </a>
        </div>
    </FormGroup>
</template>

<script
    lang="ts"
    setup>
    import { useTranslate } from '../composables';
    import FormGroup from './FormGroup.vue';

    const t = useTranslate();
</script>

<style
    lang="scss"
    module>
    .documentation {
        display: flex;
        justify-content: flex-start;
    }

    .documentationLink {
        display: inline-flex;
        padding: var(--homey-su-1-5) var(--homey-su-2-5);
        align-items: center;
        justify-content: center;
        background: var(--homey-color-primary);
        border-radius: var(--homey-border-radius-large);
        color: var(--homey-color-mono-0);
        font-weight: var(--homey-font-weight-semibold);
        text-decoration: none;
        transition: background-color 150ms ease-in-out;
    }

    .documentationLink:hover {
        background: var(--homey-color-primary-hover);
    }

    .documentationLink:active {
        background: var(--homey-color-primary-active);
    }
</style>
