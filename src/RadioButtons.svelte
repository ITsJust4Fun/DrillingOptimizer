<script lang="ts">
    export let options: {option: any, label: string, id: string}[]
    export let group: any = null
    export let groupName: string = ""
    export let lang = 'en'
    export let getTranslation = (lang: string, key: string) => { return key }
</script>

{#each options as { option, label, id }}
    <div class="input_row">
        <div class="option">
            <input id="{id}" type=radio bind:group={group} name="{groupName}" value={option}>
            <label for="{id}">{getTranslation(lang, label)}</label>
        </div>
    </div>
{/each}

<style>
    input[type="radio"] {
        position: absolute;
        clip: rect(0, 0, 0, 0);
    }
    input[type="radio"] + label::before {
        content: '\a0';
        display: inline-block;
        margin: .2em .5em;
        width: .8em;
        height: .8em;
        line-height: .75em;
        transition: all .5s;
        border: 1px solid silver;
    }
    input[type="radio"] + label::before {
        border-radius: 50%;
    }
    input[type="radio"]:checked + label::before {
        content: '\a0';
        background: rgba(255, 255, 255, 0.3);
        box-shadow: inset 0 0 0 2px silver, 0 0 0 2px rgba(255, 255, 255, 0.3);
    }
    .input_row {
        position: relative;
        left: -7px;
        display: flex;
    }
    .input_row:not(:last-child){
        margin-bottom: 5px;
    }
    .input_row .option {
        width: 100%;
    }
</style>
