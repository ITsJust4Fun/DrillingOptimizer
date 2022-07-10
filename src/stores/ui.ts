import { writable } from 'svelte/store'

export const COLORS = [
    "#fa1414",
    "#c88c64",
    "#50aa8c",
    "#0096e6",
    "#0a14e6",
    "#8200c8",
    "#fa96d2",
    "#828282",
    "#417530",
    "white",
    "#1a1a1a",
]

export const showMenu = writable<boolean>(
    localStorage.getItem('showMenu') === null ? true : localStorage.showMenu === 'true'
)

showMenu.subscribe(
    (value) => localStorage.showMenu = String(value)
)

export const showFPS = writable<boolean>(
    localStorage.getItem('showFPS') === null ? true : localStorage.showFPS === 'true'
)

showFPS.subscribe(
    (value) => localStorage.showFPS = String(value)
)

export const showHint = writable<boolean>(
    localStorage.getItem('showHint') === null ? true : localStorage.showHint === 'true'
)

showHint.subscribe(
    (value) => localStorage.showHint = String(value)
)
