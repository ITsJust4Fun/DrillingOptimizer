import { writable } from 'svelte/store'
import TRANSLATIONS from "../translations"

export let languages = [{option: 'en', label: 'english', id: "en_radio"},
                        {option: 'ru', label: 'russian', id: "ru_radio"}]

export function getTranslation(lang: string, key: string) {
    const phrase: { [key: string]: string } = TRANSLATIONS[key]
    return Object.keys(phrase).includes(lang) ? phrase[lang] : phrase["en"]
}

export const lang = writable<string>(
    localStorage.getItem('lang') === null ? 'en'
                                                    : localStorage.lang
)

lang.subscribe((value) => localStorage.lang = value)
