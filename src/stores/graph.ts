import { writable } from 'svelte/store'

export const showVertexLabel = writable<boolean>(
    localStorage.getItem('showVertexLabel') === null ? true : localStorage.showVertexLabel === 'true'
)

showVertexLabel.subscribe(
    (value) => localStorage.showVertexLabel = String(value)
)
