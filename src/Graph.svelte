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
    export let verticesGenerationCount = 30
    export let showEdgeLabel = true
    export let edgeLabelDistance = 30
    export let edgeLabelSize = 8
    export let edgeLabelColor = 'hsl(0, 0%, 100%)'
    export let totalDistance = '0'
    export let totalDistanceWithStart = '0'
    export let connectAlgorithm = ''

    interface Vertex {
        x: number
        y: number
    }

    interface Edge {
        i: number
        j: number
    }

    let vertices: Vertex[] = []
    let edges: Edge[] = []
    let minDistance = 80
    let startPosition = { x: 0, y: 0 }

    let mouse: Vertex = null
    let movingVertexId = -1
    let mouseDown = false
    let time = -1

    const CLICK_TIME_MS = 100

    renderable((props) => {
        const { context } = props

        if (mouseDown && movingVertexId !== -1 && Date.now() - time > CLICK_TIME_MS) {
            let x = mouse.x
            let y = mouse.y

            if (x > $width) {
                x = $width
            } else if (x < 0) {
                x = 0
            }

            if (y > $height) {
                y = $height
            } else if (y < 0) {
                y = 0
            }

            vertices[movingVertexId] = { x, y }

            if (removeEdgesOnMoving) {
                removeAllEdges()
            } else {
                calculateDistances()
            }
        }

        for (let edge of edges) {
            drawLine(context, vertices[edge.i], vertices[edge.j])
        }

        for (let vertex of vertices) {
            context.lineCap = 'round'
            context.beginPath()
            context.fillStyle = vertexColor
            context.strokeStyle = vertexColor
            context.lineWidth = 3
            context.arc(vertex.x, vertex.y, vertexSize, 0, Math.PI * 2)
            context.fill()
        }

        if (showVertexLabel) {
            for (let vertex of vertices) {
                let text = `(${Math.round(vertex.x)}, ${Math.round(vertex.y)})`
                drawVertexLabel({ context, text, x: vertex.x, y: vertex.y + vertexSize + 10 })
            }
        }

        if (showEdgeLabel) {
            for (let edge of edges) {
                drawEdgeLabel(context, vertices[edge.i], vertices[edge.j])
            }
        }
    })

    export function handleClick(ev) {
        if (Date.now() - time > CLICK_TIME_MS && time !== -1) {
            time = -1
            return
        }

        time = -1
        removeAllEdges()

        let x = ev.clientX
        let y = ev.clientY

        let nearest = getNearestVertex(x, y)

        if (nearest.value <= vertexSize && nearest.index !== -1) {
            vertices = [...vertices.slice(0, nearest.index), ...vertices.slice(nearest.index + 1, vertices.length)]
            return
        }

        let vertex: Vertex = { x, y }
        vertices = [...vertices, vertex]
    }

    export function handleMouseDown(ev) {
        let x = ev.clientX
        let y = ev.clientY

        let nearest = getNearestVertex(x, y)

        if (nearest.value > vertexSize || nearest.index === -1) {
            return
        }

        movingVertexId = nearest.index
        mouse = vertices[movingVertexId]
        mouseDown = true
        time = Date.now()
    }

    function handleMouseMove(ev) {
        if (!mouse) {
            return
        }

        mouse.x += ev.movementX
        mouse.y += ev.movementY
    }

    function handleMouseUp() {
        mouseDown = false
        movingVertexId = -1
        previousTouch = null
    }

    export function handleTouchStart(ev) {
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

    export function removeAllEdges() {
        edges = []
        totalDistance = '0'
        totalDistanceWithStart = '0'
        resetDistances()
    }

    export function removeAllVertices() {
        removeAllEdges()
        vertices = []
    }

    function getRandomInt(min: number, max:number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    export function generateVertices() {
        removeAllVertices()
        let attempts = 0

        while (vertices.length !== verticesGenerationCount && attempts !== 5000) {
            let x = getRandomInt(0, $width - 1)
            let y = getRandomInt(0, $height - 1)

            let nearest = getNearestVertex(x, y)

            if (nearest.value < minDistance && nearest.index != -1) {
                attempts++
                continue
            }

            let vertex: Vertex = { x, y }
            vertices = [...vertices, vertex]

            attempts = 0
        }

        console.log(`Generated ${vertices.length} vertices`)
    }

    function fillEdges() {
        removeAllEdges()

        for (let i = 0; i < vertices.length; i++) {
            let j = i + 1

            if (j < vertices.length) {
                edges = [...edges, { i, j }]
            }
        }

        calculateDistances()
    }

    export function connectEdges() {

        switch (connectAlgorithm) {
            case 'greedy':
                greedy()
                break
            case 'prim':
                prim()
                break
            case 'salesman':
                salesman()
                break
            case 'spanningTree':
                spanningTree()
                break
            case 'lastOrder':
                fillEdges()
        }
    }

    function greedy() {
        console.log('greedy')
        fillEdges()
    }

    function prim() {
        console.log('prim')
        fillEdges()
    }

    function salesman() {
        console.log('salesman')
        fillEdges()
    }

    function spanningTree() {
        console.log('spanningTree')
        fillEdges()
    }

    function calculateDistances() {
        let totalDistanceCount = 0

        for (let edge of edges) {
            totalDistanceCount += getDistance(vertices[edge.i], vertices[edge.j])
        }

        let totalDistanceWithStartCount = totalDistanceCount

        if (vertices.length) {
            totalDistanceWithStartCount += getDistance(startPosition, vertices[0])
            totalDistanceWithStartCount += getDistance(startPosition, vertices.at(-1))
        }

        totalDistance = Math.round(totalDistanceCount).toString()
        totalDistanceWithStart = Math.round(totalDistanceWithStartCount).toString()
    }

    function resetDistances() {
        totalDistance = '0'
        totalDistanceWithStart = '0'
    }

    function drawVertexLabel(props) {
        const { context, text, x, y } = props

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
    }

    function drawEdgeLabel(context, vertexI: Vertex, vertexJ: Vertex) {
        if (!context) {
            return
        }

        let label = String(Math.round(getDistance(vertexI, vertexJ)))

        let x = (vertexI.x + vertexJ.x) / 2
        let y = (vertexI.y + vertexJ.y) / 2

        let thetaVertices = angle(vertexI.x, vertexI.y, vertexJ.x, vertexJ.y)

        let radius = edgeLabelDistance
        let resultX = radius * Math.cos(thetaVertices + 3 * Math.PI / 2) + x
        let resultY = radius * Math.sin(thetaVertices + 3 * Math.PI / 2) + y

        let align = 'center'
        let baseline = 'top'
        let fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica'

        context.beginPath()
        context.fillStyle = edgeLabelColor
        context.font = `${edgeLabelSize}px ${fontFamily}`
        context.textAlign = align
        context.textBaseline = baseline
        context.save()
        context.translate(resultX, resultY)
        context.rotate(thetaVertices)
        context.fillText(label, 0, 0)
        context.restore()
    }

    function angle(cx, cy, ex, ey) {
        let dy = ey - cy
        let dx = ex - cx
        let theta = Math.atan2(dy, dx) // range (-PI, PI]
        return theta >= -(Math.PI / 2) && theta <= (Math.PI / 2) ? theta : theta + Math.PI
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

    function getNearestVertex(x: number, y: number, verticesList = vertices): {index: number, value: number} {
        let nearestIndex: number = -1
        let nearestValue: number = -1

        for (let i = 0; i < verticesList.length; i++) {
            let vertex: Vertex = verticesList[i]

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
        on:touchend={handleMouseUp}
        on:mousemove={handleMouseMove}
        on:touchmove={handleTouchMove}

/>

<!-- The following allows this component to nest children -->
<slot></slot>
