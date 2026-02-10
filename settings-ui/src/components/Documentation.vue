<template>
    <FormGroup
        :title="t('settings.documentation.title')"
        :description="t('settings.documentation.description')">
        <ButtonTransparent
            :label="t('settings.documentation.button')"
            @click="onVisitDocumentation"/>
    </FormGroup>
</template>

<script
    lang="ts"
    setup>
    import { useTranslate } from '../composables';
    import ButtonTransparent from './ButtonTransparent.vue';
    import FormGroup from './FormGroup.vue';

    const t = useTranslate();

    function onVisitDocumentation(): void {
        window.open('https://flowbits.nl', '_blank', 'noopener,noreferrer');
    }
</script>
