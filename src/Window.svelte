<script lang="ts">
    import {height, width} from "./game"
    import {afterUpdate} from "svelte"

    let window

    export let title = ''
    export let isOpened = true
    export let zIndex = 0
    export let onCloseHandler = null
    export let onClickHandler = null
    export let x = 100
    export let y = 100

    let isMouseDown = false
    let isFirstRender = true
    let mouse: { x: Number, y: Number }
    let outOfBoundLimitX = 100
    let outOfBoundLimitY = 100

    afterUpdate(() => {
        if (isFirstRender && window) {
            x = Math.floor($width / 2) - Math.floor(window.clientWidth / 2)
            y = Math.floor($height / 2) - Math.floor(window.clientHeight / 2)

            isFirstRender = false
        }

        if (window) {
            outOfBoundLimitX = Math.floor(window.clientWidth / 2)
            outOfBoundLimitY = Math.floor(window.clientHeight / 2)

            checkPosition()
        }
    })

    function onClose() {
        isOpened = false

        if (onCloseHandler) {
            onCloseHandler()
        }
    }

    function checkPosition() {
        if (x > $width - outOfBoundLimitX) {
            x = $width - outOfBoundLimitX
        } else if (x < -outOfBoundLimitX) {
            x = -outOfBoundLimitX
        }

        if (y > $height - outOfBoundLimitY) {
            y = $height - outOfBoundLimitY
        } else if (y < -outOfBoundLimitY) {
            y = -outOfBoundLimitY
        }
    }

    function handleTouchStart(ev) {
        let touch = ev.touches[0]

        handleMouseDown(touch)
    }

    let previousTouch = null
    function handleTouchMove(ev) {
        let touch = ev.touches[0]

        if (previousTouch) {
            touch.movementX = touch.pageX - previousTouch.pageX
            touch.movementY = touch.pageY - previousTouch.pageY
            handleMouseMove(touch)
        }

        previousTouch = touch
    }

    function handleMouseDown(ev) {
        const classes = ev.target.className
        const moveClasses = ['controls', 'controls-block', 'controls-block__title']
        const dy = ev.clientY - y

        if (moveClasses.some(classes.includes.bind(classes)) && dy < 50) {
            isMouseDown = true
            mouse = { x, y }
        }

        if (onClickHandler) {
            onClickHandler()
        }
    }

    function handleMouseMove(ev) {
        if (isMouseDown && mouse) {
            mouse.x += ev.movementX
            mouse.y += ev.movementY
            x = mouse.x
            y = mouse.y

            checkPosition()
        }
    }

    function handleMouseUp() {
        isMouseDown = false
        previousTouch = null
    }
</script>

<svelte:window
        on:mouseup={handleMouseUp}
        on:touchend={handleMouseUp}
        on:mousemove={handleMouseMove}
        on:touchmove={handleTouchMove}
/>

{#if isOpened}
    <div class="controls"
         style="z-index: {zIndex + 1}; left: {x}px; top: {y}px;"
         on:mousedown={handleMouseDown}
         on:touchstart={handleTouchStart}
         bind:this={window}
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
