<script lang="ts">
    import { renderable, width, height } from './game.js'
    import Drill from "./Drill.svelte"
    import {PriorityQueue} from "./PriorityQueue"

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
    export let isSimulationMode = false
    export let drillColor = '#419e5a'
    export let drillNormalColor = '#ffe554'
    export let drillLabelSize = 8
    export let drillLabelColor = 'hsl(0, 0%, 100%)'
    export let drillMoveSpeed = 0.1
    export let drillSpinSpeed = 0.5
    export let drillRotationsCount = 50
    export let isShowDrillLabel = true
    export let isDrillingFinished = true
    export let isInfiniteSimulation = false
    export let isReturnDrillToStart = true
    export let drillingTime = 0
    export let lastDrillingTime = 0
    export let isBlockDrillControls = false
    export let drilledVertexColor = 'hsl(0, 0%, 100%)'

    interface Vertex {
        x: number
        y: number
    }

    interface Edge {
        i: number
        j: number
    }

    let vertices: Vertex[] = []
    let drilledVertices: number[] = []
    let edges: Edge[] = []
    let minDistance = 80
    let startPosition = { x: 0, y: 0 }

    let mouse: Vertex = null
    let movingVertexId = -1
    let mouseDown = false
    let time = -1

    const CLICK_TIME_MS = 100

    let isDrillingHoleFinished = true
    let moveDrillTo = [ 0, 0 ]
    let drillingEdgeIndex = -1
    let isSpinEnabled = true
    let isMovingToStart = false
    let drillingStartTime = 0
    let drilledVertex = -1

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

        for (let [index, vertex] of vertices.entries()) {
            let vertexDrawColor = vertexColor

            if (isSimulationMode && drilledVertices.includes(index)) {
                vertexDrawColor = drilledVertexColor
            }

            context.lineCap = 'round'
            context.beginPath()
            context.fillStyle = vertexDrawColor
            context.strokeStyle = vertexDrawColor
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

        if (isMovingToStart) {
            finishMovingToStart()
        } else if (isSimulationMode) {
            moveDrill()
        }

        if (drillingStartTime !== 0) {
            drillingTime = Date.now() - drillingStartTime
        }
    })

    export function handleClick(ev) {
        if (isSimulationMode) {
            return
        }

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
        if (isSimulationMode) {
            return
        }

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
        if (isSimulationMode) {
            return
        }

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
        drilledVertices = []
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

    export function moveDrillToStart() {
        moveDrillTo = [ 0, 0 ]
        isSpinEnabled = false
        isMovingToStart = true
        isDrillingFinished = true
        isDrillingHoleFinished = false
        isBlockDrillControls = true
    }

    function finishMovingToStart() {
        if (isDrillingHoleFinished) {
            isSpinEnabled = true
            isMovingToStart = false
            isBlockDrillControls = false

            if (isReturnDrillToStart) {
                stopDrillingTime()
            }
        }
    }

    export function startSimulation() {
        if (edges.length === 0 && vertices.length > 1) {
            connectEdges()
        }

        if (vertices.length === 1) {
            calculateDistances()
        }

        isSpinEnabled = true
        isDrillingFinished = false
        drillingEdgeIndex = -1
        drillingStartTime = Date.now()
        isBlockDrillControls = true
        drilledVertex = -1
        drilledVertices = []
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
        if (vertices.length <= 1) {
            return
        }

        let sortedVertices: Vertex[] = []
        let searchVertexes: Vertex[] = vertices

        let sortVertices = (index) => {
            let vertex: Vertex = searchVertexes[index]
            sortedVertices.push(vertex)
            searchVertexes = vertices.filter(n => !sortedVertices.includes(n))

            if (searchVertexes.length == 0) {
                return sortedVertices
            }

            let nearestVertex = getNearestVertex(vertex.x, vertex.y, searchVertexes)
            return sortVertices(nearestVertex.index)
        }

        let nearestToDrillVertex = getNearestVertex(moveDrillTo[0], moveDrillTo[1], vertices).index

        vertices = sortVertices(nearestToDrillVertex)
        fillEdges()
    }

    function prim() {
        if (vertices.length === 0) {
            return
        }

        let keys: number[] = []
        let p: number[] = []
        let queue = new PriorityQueue<number>()
        let allEdges: Edge[] = []

        for (let i = 0; i < vertices.length; i++) {
            keys.push(Infinity)
            p.push(-1)
        }

        for (let i = 0; i < vertices.length; i++) {
            for (let j = 0; j < i; j++) {
                allEdges.push({ i, j })
            }
        }

        for (let i = 0; i < vertices.length; i++) {
            let minKey = Infinity

            for (let j = 0; j < i; j++) {
                let key = getDistance(vertices[i], vertices[j])

                if (key < minKey) {
                    minKey = key
                }
            }

            queue.enqueue(i, minKey)
        }

        let nearestVertex = getNearestVertex(moveDrillTo[0], moveDrillTo[0], vertices)

        if (nearestVertex.index === -1 || nearestVertex.value === -1) {
            nearestVertex = { index: 0, value: 0 }
        }

        keys[nearestVertex.index]

        while (!queue.isEmpty()) {
            let v = queue.dequeue().value

            for (let edge of allEdges) {
                let u = -1

                if (edge.i === v) {
                    u = edge.j
                }

                if (edge.j === v) {
                    u = edge.i
                }

                if (u !== -1) {
                    let distance = getDistance(vertices[v], vertices[u])

                    if (queue.data.includes(u) && keys[u] > distance) {
                        p[u] = v
                        keys[u] = distance
                    }
                }
            }
        }

        removeAllEdges()

        for (let i = 0; i < p.length; i++) {
            if (p[i] !== -1) {
                edges = [...edges, {i, j: p[i]}]
            }
        }
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

    function moveDrill() {
        if (isDrillingFinished) {
            if (!isInfiniteSimulation) {
                drillingEdgeIndex = -1
                isBlockDrillControls = false
                return
            }

            if (drillingEdgeIndex !== -1) {
                generateVertices()
                startSimulation()
            } else {
                return
            }
        }

        if (drillingEdgeIndex >= edges.length || vertices.length === 0) {
            if (isDrillingHoleFinished) {
                if (drilledVertex !== -1) {
                    drilledVertices = [...drilledVertices, drilledVertex]
                }

                if (!isReturnDrillToStart) {
                    isDrillingFinished = true
                    stopDrillingTime()
                } else {
                    moveDrillToStart()
                }
            }

            return
        }

        if (!isDrillingHoleFinished) {
            return
        }

        if (drilledVertex !== -1) {
            drilledVertices = [...drilledVertices, drilledVertex]
        }

        let moveToVertex

        if (edges.length === 0) {
            moveToVertex = vertices[0]
            drilledVertex = 0
        } else if (drillingEdgeIndex === -1) {
            moveToVertex = vertices[edges[0].i]
            drilledVertex = edges[0].i
        } else {
            moveToVertex = vertices[edges[drillingEdgeIndex].j]
            drilledVertex = edges[drillingEdgeIndex].j
        }

        moveDrillTo = [ moveToVertex.x, moveToVertex.y ]
        isDrillingHoleFinished = false
        drillingEdgeIndex++
    }

    function stopDrillingTime() {
        lastDrillingTime = drillingTime
        drillingStartTime = 0
        drillingTime = 0
    }
</script>

<svelte:window
        on:mouseup={handleMouseUp}
        on:touchend={handleMouseUp}
        on:mousemove={handleMouseMove}
        on:touchmove={handleTouchMove}

/>

<slot>
    <Drill
          bind:isFinished={isDrillingHoleFinished}
          bind:moveTo={moveDrillTo}
          isShow={isSimulationMode}
          size={vertexSize}
          drillColor={drillColor}
          normalColor={drillNormalColor}
          isSpinEnabled={isSpinEnabled}
          moveSpeed={drillMoveSpeed}
          spinSpeed={drillSpinSpeed}
          rotationsCount={drillRotationsCount}
          isShowLabel={isShowDrillLabel}
          labelSize={drillLabelSize}
          labelColor={drillLabelColor}
    />
</slot>
