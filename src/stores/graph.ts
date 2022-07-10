import { writable } from 'svelte/store'

export const showVertexLabel = writable<boolean>(
    localStorage.getItem('showVertexLabel') === null ? true : localStorage.showVertexLabel === 'true'
)

showVertexLabel.subscribe(
    (value) => localStorage.showVertexLabel = String(value)
)

export const showEdgeLabel = writable<boolean>(
    localStorage.getItem('showEdgeLabel') === null ? true : localStorage.showEdgeLabel === 'true'
)

showEdgeLabel.subscribe(
    (value) => localStorage.showEdgeLabel = String(value)
)

export const removeEdgesOnMoving = writable<boolean>(
    localStorage.getItem('removeEdgesOnMoving') === null ? false : localStorage.removeEdgesOnMoving === 'true'
)

removeEdgesOnMoving.subscribe(
    (value) => localStorage.removeEdgesOnMoving = String(value)
)

export const isSimulationMode = writable<boolean>(
    localStorage.getItem('isSimulationMode') === null ? false : localStorage.isSimulationMode === 'true'
)

isSimulationMode.subscribe(
    (value) => localStorage.isSimulationMode = String(value)
)

export const vertexColorId = writable<Number>(
    localStorage.getItem('vertexColorId') === null ? 0 : parseInt(localStorage.vertexColorId)
)

vertexColorId.subscribe(
    (value) => localStorage.vertexColorId = String(value)
)

export const edgeColorId = writable<Number>(
    localStorage.getItem('edgeColorId') === null ? 0 : parseInt(localStorage.edgeColorId)
)

edgeColorId.subscribe(
    (value) => localStorage.edgeColorId = String(value)
)
