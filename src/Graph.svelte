<script lang="ts">
    import { renderable, width, height } from './game.js'

    export let vertexColor = '#ffe554'
    export let edgeColor = '#ffe554'
    export let vertexSize = 10
    export let edgeSize = 3
    export let showVertexLabel = true
    export let removeEdgesOnMoving = false
    export let vertexLabelColor = 'hsl(0, 0%, 100%)'
    export let vertexLabelSize = 8
    export let vertexesGenerationCount = 30

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

    let mouse: Vertex = null
    let movingVertexId = -1
    let mouseDown = false
    let time = -1

    const CLICK_TIME_MS = 100

    renderable((props) => {
        const { context } = props

        if (mouseDown && movingVertexId !== -1 && Date.now() - time > CLICK_TIME_MS) {
            vertexes[movingVertexId] = mouse

            if (removeEdgesOnMoving) {
                edges = []
            }
        }

        for (let edge of edges) {
            drawLine(context, vertexes[edge.i], vertexes[edge.j])
        }

        for (let vertex of vertexes) {
            context.lineCap = 'round'
            context.beginPath()
            context.fillStyle = vertexColor
            context.strokeStyle = vertexColor
            context.lineWidth = 3
            context.arc(vertex.x, vertex.y, vertexSize, 0, Math.PI * 2)
            context.fill()

            let text = `(${vertex.x}, ${vertex.y})`
            drawVertexLabel({ context, text, x: vertex.x, y: vertex.y + vertexSize + 10 })
        }
    })

    export function handleClick(ev) {
        if (Date.now() - time > CLICK_TIME_MS && time !== -1) {
            time = -1
            return
        }

        time = -1
        edges = []

        let x = ev.clientX
        let y = ev.clientY

        let nearest = getNearestVertex(x, y)

        if (nearest.value <= vertexSize && nearest.index !== -1) {
            vertexes = [...vertexes.slice(0, nearest.index), ...vertexes.slice(nearest.index + 1, vertexes.length)]
            return
        }

        let vertex: Vertex = { x, y }
        vertexes = [...vertexes, vertex]
    }

    export function handleMouseDown(ev) {
        let x = ev.clientX
        let y = ev.clientY

        let nearest = getNearestVertex(x, y)

        if (nearest.value > vertexSize || nearest.index === -1) {
            return
        }

        movingVertexId = nearest.index
        handleMouseMove(ev)
        mouseDown = true
        time = Date.now()
    }

    function handleMouseMove({ clientX, clientY }) {
        if (clientX > $width) {
            clientX = $width
        } else if (clientX < 0) {
            clientX = 0
        }

        if (clientY > $height) {
            clientY = $height
        } else if (clientY < 0) {
            clientY = 0
        }

        mouse = { x: clientX, y: clientY }
    }

    function handleMouseUp(ev) {
        handleMouseMove(ev)
        mouseDown = false
        movingVertexId = -1
    }

    export function removeAllEdges() {
        edges = []
    }

    export function removeAllVertexes() {
        edges = []
        vertexes = []
    }

    function getRandomInt(min: number, max:number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    export function generateVertexes() {
        removeAllVertexes()
        let attempts = 0

        while (vertexes.length !== vertexesGenerationCount && attempts !== 5000) {
            let x = getRandomInt(0, $width - 1)
            let y = getRandomInt(0, $height - 1)

            let nearest = getNearestVertex(x, y)

            if (nearest.value < minDistance && nearest.index != -1) {
                attempts++
                continue
            }

            let vertex: Vertex = { x, y }
            vertexes = [...vertexes, vertex]

            attempts = 0
        }

        console.log(`Generated ${vertexes.length} vertexes`)
    }

    export function fillEdgesInAddingOrder() {
        edges = []

        for (let i = 0; i < vertexes.length; i++) {
            let j = i + 1

            if (j < vertexes.length) {
                edges = [...edges, { i, j }]
            }
        }
    }

    function drawVertexLabel(props) {
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

    function drawLine(context, vertexI: Vertex, vertexJ: Vertex) {
        if (!context) {
            return
        }

        context.beginPath()
        context.moveTo(vertexI.x, vertexI.y)
        context.lineTo(vertexJ.x, vertexJ.y)
        context.strokeStyle = edgeColor
        context.lineWidth = edgeSize
        context.stroke()

        drawEdgeLabel(context, vertexI, vertexJ)
    }

    function drawEdgeLabel(context, vertexI: Vertex, vertexJ: Vertex) {
        if (!context) {
            return
        }

        let label = String(Math.round(getDistance(vertexI, vertexJ)))
        let x = (vertexI.x + vertexJ.x) / 2
        let y = (vertexI.y + vertexJ.y + 10) / 2

        let align = 'center'
        let baseline = 'top'
        let fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica'

        context.beginPath()
        context.fillStyle = vertexLabelColor
        context.font = `${vertexLabelSize}px ${fontFamily}`
        context.textAlign = align
        context.textBaseline = baseline
        context.save()
        context.translate(x, y)
        context.rotate(angle(vertexI.x, vertexI.y, vertexJ.x, vertexJ.y))
        context.fillText(label, 0, 0)
        context.restore()
    }

    function angle(cx, cy, ex, ey) {
        let dy = ey - cy
        let dx = ex - cx
        let theta = Math.atan2(dy, dx) // range (-PI, PI]
        //theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
        //if (theta < 0) theta = 360 + theta; // range [0, 360)
        return theta >= -(Math.PI/2) && theta <= (Math.PI/2) ? theta : theta + Math.PI
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

<svelte:window
        on:mouseup={handleMouseUp}
        on:mousemove={handleMouseMove} />

<!-- The following allows this component to nest children -->
<slot></slot>
