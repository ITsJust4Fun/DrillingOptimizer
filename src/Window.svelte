<script lang="ts">
    export let title = ''
    export let isOpened = true
    export let zIndex = 0
    export let onCloseHandler = null
    export let onClickHandler = null
    export let x = 100
    export let y = 100

    let isMouseDown = false

    function onClose() {
        isOpened = false

        if (onCloseHandler) {
            onCloseHandler()
        }
    }

    function handleMouseDown(ev) {
        const classes = ev.target.className
        const moveClasses = ['controls', 'controls-block', 'controls-block__title']
        const dy = ev.clientY - y

        if (moveClasses.some(classes.includes.bind(classes)) && dy < 50) {
            isMouseDown = true
        }

        if (onClickHandler) {
            onClickHandler()
        }
    }

    function handleMouseMove(ev) {
        if (isMouseDown) {
            x += ev.movementX;
            y += ev.movementY;
        }
    }

    function handleMouseUp() {
        isMouseDown = false
    }
</script>

<svelte:window
        on:mouseup={handleMouseUp}
        on:mousemove={handleMouseMove} />

{#if isOpened}
    <div class="controls"
         style="z-index: {zIndex + 1}; left: {x}px; top: {y}px;"
         on:mousedown={handleMouseDown}
    >
        <div class="controls-block">
            <h2 class="controls-block__title">
                {title}
            </h2>
            <button on:click="{onClose}" class="close"></button>
            <slot></slot>
        </div>
    </div>
{/if}

<style>
    .controls {
        overflow-y: scroll;
        box-shadow: 0 0 10px 0 black;
        position: fixed;
        max-height: calc(100% - 40px);
        background-color: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
        padding: 10px;
        width: 300px;
        border-radius: 10px;
    }
    .controls::-webkit-scrollbar {
        display: none;
    }
    .controls-block > * {
        margin-bottom: 0;
    }
    .controls-block:not(:last-child) {
        margin-bottom: 20px;
    }
    .controls-block__title {
        margin: 0;
        margin-bottom: 5px;
        text-transform: uppercase;
        font-size: 100%;
    }
    @supports (not (backdrop-filter: blur())) and
    (not (-webkit-backdrop-filter: blur())) {
        .controls {
            background-color: rgba(150, 150, 150, 0.95);
        }
    }
    .close {
        display: block;
        box-sizing: border-box;
        position: absolute;
        top: 10px;
        right: 10px;
        margin: 0;
        padding: 0;
        width: 15px;
        height: 15px;
        border: 0;
        color: black;
        border-radius: 1.5rem;
        background: transparent;
        box-shadow: 0 0 0 1px black;
        transition: transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1),
        background 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
        -webkit-appearance: none;
    }

    .close:before,
    .close:after {
        content: '';
        display: block;
        box-sizing: border-box;
        position: absolute;
        top: 50%;
        width: 9px;
        height: 1px;
        background: black;
        transform-origin: center;
        transition: height 0.2s cubic-bezier(0.25, 0.1, 0.25, 1),
        background 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
    }

    .close:before {
        -webkit-transform: translate(0, -50%) rotate(45deg);
        -moz-transform: translate(0, -50%) rotate(45deg);
        transform: translate(0, -50%) rotate(45deg);
        left: 3px;
        top: 7px;
    }

    .close:after {
        -webkit-transform: translate(0, -50%) rotate(-45deg);
        -moz-transform: translate(0, -50%) rotate(-45deg);
        transform: translate(0, -50%) rotate(-45deg);
        left: 3px;
        top: 7px;
    }

    .close:hover {
        background: black;
    }

    .close:hover:before,
    .close:hover:after {
        height: 2px;
        background: white;
    }

    .close:focus {
        border-color: #3399ff;
        box-shadow: 0 0 0 2px #3399ff;
    }

    .close:active {
        transform: scale(0.9);
    }

    .close:hover,
    .close:focus,
    .close:active {
        outline: none;
    }
</style>
