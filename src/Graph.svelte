<script lang="ts">
    import { renderable, width, height } from './game.js'

    export let vertexColor = '#ffe554'
    export let vertexSize = 10
    export let showVertexLabel = true
    export let vertexLabelColor = 'hsl(0, 0%, 100%)'
    export let vertexLabelSize = 8

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
    let minDistance = 80

    renderable((props) => {
        const { context } = props

        for (let vertex of vertexes) {
            context.lineCap = 'round'
            context.beginPath()
            context.fillStyle = vertexColor
            context.strokeStyle = vertexColor
            context.lineWidth = 3
            context.arc(vertex.x, vertex.y, vertexSize, 0, Math.PI * 2)
            context.fill()

            let text = `(${vertex.x}, ${vertex.y})`
            drawText({ context, text, x: vertex.x, y: vertex.y + vertexSize + 10 })
        }
    });

    export function handleClick(ev) {
        let x = ev.clientX
        let y = ev.clientY

        let nearest = getNearestVertex(x, y)

        if (nearest.value <= vertexSize + 10 && nearest.index != -1) {
            vertexes = [...vertexes.slice(0, nearest.index), ...vertexes.slice(nearest.index + 1, vertexes.length)]
        }

        if (nearest.value < minDistance && nearest.index != -1) {
            return
        }

        let vertex: Vertex = { x, y }
        vertexes = [...vertexes, vertex]
    }

    export function removeAllVertexes() {
        edges = []
        vertexes = []
    }

    function drawText(props) {
        const { context, text, x, y } = props

        if (!showVertexLabel) {
            return
        }

        let align = 'center'
        let baseline = 'top'
        let fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica'

        if (text && context) {
            context.fillStyle = vertexLabelColor
            context.font = `${vertexLabelSize}px ${fontFamily}`
            context.textAlign = align
            context.textBaseline = baseline
            context.fillText(text, x, y)
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

<!-- The following allows this component to nest children -->
<slot></slot>
