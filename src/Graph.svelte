<script lang="ts">
    import { renderable, width, height } from './game.js'

    export let color = '#ffe554'
    export let size = 10

    interface Vertex {
        x: number
        y: number
    }

    interface Edge {
        i: number
        j: number
    }

    let vertexes: Vertex[] = []
    let edges: Edge[] = []
    let minDistance = 45

    renderable((props) => {
        const { context } = props

        for (let vertex of vertexes) {
            context.lineCap = 'round'
            context.beginPath()
            context.fillStyle = color
            context.strokeStyle = color
            context.lineWidth = 3
            context.arc(vertex.x, vertex.y, size, 0, Math.PI * 2)
            context.fill()

            let text = `(${vertex.x}, ${vertex.y})`
            drawText({ context, text, x: vertex.x, y: vertex.y + size + 10 })
        }
    });

    export function handleClick(ev) {
        let x = ev.clientX
        let y = ev.clientY

        let nearest = getNearestVertex(x, y)

        if (nearest.value <= size && nearest.index != -1) {
            vertexes = [...vertexes.slice(0, nearest.index), ...vertexes.slice(nearest.index + 1, vertexes.length)]
        }

        if (nearest.value < minDistance && nearest.index != -1) {
            return
        }

        let vertex: Vertex = { x, y }
        vertexes = [...vertexes, vertex]
    }

    function drawText(props) {
        const { context, text, x, y } = props

        let color = 'hsl(0, 0%, 100%)';
        let align = 'center';
        let baseline = 'top';

        let fontSize = 8;
        let fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica';

        if (text && context) {
            context.fillStyle = color;
            context.font = `${fontSize}px ${fontFamily}`;
            context.textAlign = align;
            context.textBaseline = baseline;
            context.fillText(text, x, y);
        }
    }

    function getDistance(vertexI: Vertex, vertexJ: Vertex): number {
        if (vertexI.x === vertexJ.x && vertexI.y === vertexJ.y) {
            return 0
        }

        let x1: number = vertexI.x
        let x2: number = vertexJ.x
        let y1: number = vertexI.y
        let y2: number = vertexJ.y

        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    }

    function getNearestVertex(x: number, y: number): {index: number, value: number} {
        let nearestIndex: number = -1
        let nearestValue: number = -1

        for (let i = 0; i < vertexes.length; i++) {
            let vertex: Vertex = vertexes[i]

            let value: number = getDistance(vertex, { x, y })

            if (nearestIndex === -1 || nearestValue > value) {
                nearestIndex = i
                nearestValue = value
            }
        }

        return { value: nearestValue, index: nearestIndex }
    }
</script>

<svelte:component on:click={handleClick} this={this}/>

<!--<svelte:window
        on:mousedown={handleMouseDown}/> -->

<!-- The following allows this component to nest children -->
<slot></slot>
