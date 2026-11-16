<template>
    <div
        :class="$style.overlay"
        @keydown="onKeydown">
        <div
            ref="panel"
            :aria-label="label"
            :class="$style.overlayPanel"
            aria-modal="true"
            role="dialog"
            tabindex="-1">
            <slot/>
        </div>
    </div>
</template>

<script
    lang="ts"
    setup>
    import { onBeforeUnmount, onMounted, ref, type VNode } from 'vue';

    const emit = defineEmits<{
        close: [];
    }>();

    defineProps<{
        readonly label: string;
    }>();

    defineSlots<{
        default: VNode;
    }>();

    const panel = ref<HTMLElement | null>(null);

    let previouslyFocused: HTMLElement | null = null;

    onMounted(() => {
        previouslyFocused = document.activeElement as HTMLElement | null;
        panel.value?.focus();
    });

    onBeforeUnmount(() => previouslyFocused?.focus());

    function onKeydown(evt: KeyboardEvent): void {
        if (evt.key === 'Escape') {
            evt.stopPropagation();
            emit('close');
            return;
        }

        if (evt.key !== 'Tab' || !panel.value) {
            return;
        }

        const focusable = Array.from(panel.value.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])'))
            .filter(element => !element.hasAttribute('disabled'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!first || !last) {
            evt.preventDefault();
            return;
        }

        if (evt.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) {
            evt.preventDefault();
            last.focus();
        } else if (!evt.shiftKey && document.activeElement === last) {
            evt.preventDefault();
            first.focus();
        }
    }
</script>

<style
    lang="scss"
    module>
    .overlay {
        position: fixed;
        display: flex;
        inset: 0;
        padding: 15px;
        overflow: auto;
        overscroll-behavior: contain;
        z-index: 1000;

        &::before {
            position: fixed;
            display: block;
            inset: 0;
            content: '';
            background: rgb(from var(--homey-color-mono-90) r g b / .75);
            z-index: 0;
        }
    }

    .overlayPanel {
        position: relative;
        display: flex;
        padding: 15px;
        margin: auto;
        width: calc(100% - 30px);
        flex-flow: column;
        gap: 15px;
        background: var(--homey-color-mono-0);
        border-radius: var(--homey-border-radius);
        box-shadow: var(--homey-box-shadow);
        z-index: 1;

        &:focus {
            outline: none;
        }
    }

    // The panel animation lives here so it can reach the mangled class name. The transition
    // classes themselves come from the <Transition> wrapper around this component.
    :global(.overlay-enter-active) .overlayPanel,
    :global(.overlay-leave-active) .overlayPanel {
        transition: 420ms cubic-bezier(0.55, 0, 0.1, 1);
        transition-property: opacity, translate;
    }

    :global(.overlay-enter-from) .overlayPanel,
    :global(.overlay-leave-to) .overlayPanel {
        opacity: 0;
        translate: 0 60px;
    }
</style>
