<script lang="ts">
  import { onMount } from 'svelte'

  export let colors: string[] = []
  export let selectedId: number = 0

  let checkmarkColor = 'white'

  onMount(function(){
    checkmarkColor = invertColor(colors[selectedId])
  })

  function invertColor(hex) {
    if (hex === 'white') {
      hex = '#FFFFFF'
    } else if (hex === 'black') {
      hex = '#000000'
    }

    if (hex.indexOf('#') === 0) {
      hex = hex.slice(1)
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    if (hex.length !== 6) {
      throw new Error('Invalid HEX color.')
    }

    let r = parseInt(hex.slice(0, 2), 16),
            g = parseInt(hex.slice(2, 4), 16),
            b = parseInt(hex.slice(4, 6), 16)

    return (r * 0.299 + g * 0.587 + b * 0.114) > 186
            ? 'black'
            : 'white'
  }
</script>

<div class="wrapper">
  {#each Array(...colors.entries()) as idAndColor}
    <button
      class="{selectedId === idAndColor[0] ? 'selected' : ''} {checkmarkColor}"
      name="color"
      type="radio"
      style={`background-color: ${idAndColor[1]};`}
      on:click={() => {
        selectedId = idAndColor[0]
        checkmarkColor = invertColor(colors[selectedId])
      }}
    />
  {/each}
</div>

<style>
  .selected.white:before {
    content: "";
    display: block;
    width: 6px;
    height: 14px;
    border-bottom: 3px solid white;
    border-right: 3px solid white;
    transform: translateY(-2px) rotate(45deg);
  }
  .selected.black:before {
    content: "";
    display: block;
    width: 6px;
    height: 14px;
    border-bottom: 3px solid black;
    border-right: 3px solid black;
    transform: translateY(-2px) rotate(45deg);
  }
  .wrapper {
    display: flex;
    /* flex-wrap: wrap; */
    overflow: hidden;
    border-radius: 5px;
    /* border: 2px dotted rgba(0, 0, 0, 0.5); */
  }
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 29px;
    padding: 0;
    margin: 0;
    border-radius: 0;
  }
  /* label {
    font-size: 75%;
    text-align: center;
    width: 30px;
    line-height: 30px;
    overflow: hidden;
    cursor: pointer;
    width: 100%;
  }
  label:hover {
    box-shadow: inset 0 0 0 100px rgba(0, 0, 0, 0.1);
  }
  input {
    appearance: none;
    width: 100%;
    height: 100%;
    margin: 0;
  }
  input:checked::before {
    content: "";
    display: block;
    width: 5px;
    height: 10px;
    border-bottom: 3px solid white;
    border-right: 3px solid white;
    transform: rotate(45deg) translateY(-1px);
    margin-right: 7px;
  } */
</style>
