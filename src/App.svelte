<script lang="ts">
	import { width, height } from './game.ts'

	import { onMount } from 'svelte'
	import Canvas from './Canvas.svelte'
	import Background from './Background.svelte'
	import DotGrid from './DotGrid.svelte'
	import Graph from './Graph.svelte'
	import Text from './Text.svelte'
	import FPS from './FPS.svelte'
	import InputRange from "./InputRange.svelte"
	import Checkbox from "./Checkbox.svelte"
	import ColorSelector from "./ColorSelector.svelte"

	import TRANSLATIONS from "./translations"

	function getTranslation(lang: string, key: string) {
		const phrase: { [key: string]: string } = TRANSLATIONS[key]
		return Object.keys(phrase).includes(lang) ? phrase[lang] : phrase["en"]
	}

	const COLORS = [
		"#fa1414",
		"#c88c64",
		"#50aa8c",
		"#0096e6",
		"#0a14e6",
		"#8200c8",
		"#fa96d2",
		"#828282",
		"green",
		"white",
	]

	let lang = new URLSearchParams(location.search).get("lang") || "en"
	let showSettings = true
	let showFPS = true
	let showVertexLabel = true
	let vertexColorId = 0
	let vertexSize = 10
	let vertexLabelColorId = 9
	let vertexLabelSize = 8
	let vertexesGenerationCount = 30

	let graphComponent
	let graphClickHandler
	let graphMouseDownHandler
	let graphRemoveVertexesHandler
	let graphGenerateVertexesHandler
	let graphFillEdgesInAddingOrderHandler


	onMount(function(){
		graphClickHandler = function(ev){
			graphComponent.handleClick(ev)
		}
		graphMouseDownHandler = function(ev){
			graphComponent.handleMouseDown(ev)
		}
		graphRemoveVertexesHandler = function(){
			graphComponent.removeAllVertexes()
		}
		graphGenerateVertexesHandler = function(){
			graphComponent.generateVertexes()
		}
		graphFillEdgesInAddingOrderHandler = function(){
			graphComponent.fillEdgesInAddingOrder()
		}
	})


</script>

<Canvas onClick={graphClickHandler} onMouseDown={graphMouseDownHandler}>
	<Background color='hsl(0, 0%, 10%)'>
		<DotGrid divisions={30} color='hsla(0, 0%, 100%, 0.5)' />
	</Background>
	<Graph
			bind:this={graphComponent}
			vertexColor={COLORS[vertexColorId]}
			vertexSize={vertexSize}
			showVertexLabel={showVertexLabel}
			vertexLabelSize={vertexLabelSize}
			vertexLabelColor={COLORS[vertexLabelColorId]}
			vertexesGenerationCount={vertexesGenerationCount}
	/>
	<Text
			text='Click and drag around the page to move the character.'
			fontSize={12}
			align='right'
			baseline='bottom'
			x={$width - 20}
			y={$height - 20}
	/>
	<FPS show={showFPS} />
</Canvas>
<div class="controls" class:controls_opened={showSettings}>
	{#if showSettings}
		<div class="controls-block">
			<div class="buttons-row">
				<button on:click={() => (showSettings = false)}>
					{getTranslation(lang, "hideSettings")}
				</button>
				<button on:click={() => {}}>
					{getTranslation(lang, "copyLink")}
				</button>
			</div>
		</div>
		<div class="controls-block">
			<h2 class="controls-block__title">
				{getTranslation(lang, "graphSettings")}
			</h2>
			<div class="buttons-row">
				<button on:click={graphRemoveVertexesHandler}>
					{getTranslation(lang, "removeAllVertexes")}
				</button>
			</div>
			<div class="buttons-row">
				<button on:click={graphGenerateVertexesHandler}>
					{getTranslation(lang, "generateVertexes")}
				</button>
			</div>
			<InputRange
					name={getTranslation(lang, "vertexesGenerationCount")}
					min={2}
					max={100}
					step={1}
					bind:value={vertexesGenerationCount}
			/>
			<div class="buttons-row">
				<button on:click={graphFillEdgesInAddingOrderHandler}>
					{getTranslation(lang, "fillEdgesInAddingOrder")}
				</button>
			</div>
		</div>
		<div class="controls-block">
			<h2 class="controls-block__title">
				{getTranslation(lang, "vertexColor")}
			</h2>
			<ColorSelector
					colors={COLORS}
					bind:selectedId={vertexColorId}
			/>
		</div>
		{#if showVertexLabel}
			<div class="controls-block">
				<h2 class="controls-block__title">
					{getTranslation(lang, "vertexLabelColor")}
				</h2>
				<ColorSelector
						colors={COLORS}
						bind:selectedId={vertexLabelColorId}
				/>
			</div>
		{/if}
		<div class="controls-block">
			<h2 class="controls-block__title">
				{getTranslation(lang, "graphicalSettings")}
			</h2>
			<Checkbox
					title={getTranslation(lang, "showFPS")}
					bind:checked={showFPS}
			/>
			<Checkbox
					title={getTranslation(lang, "showVertexLabel")}
					bind:checked={showVertexLabel}
			/>
			<InputRange
					name={getTranslation(lang, "vertexSize")}
					min={5}
					max={20}
					step={0.3}
					bind:value={vertexSize}
			/>
			{#if showVertexLabel}
				<InputRange
						name={getTranslation(lang, "vertexLabelSize")}
						min={8}
						max={16}
						step={1}
						bind:value={vertexLabelSize}
				/>
			{/if}
		</div>
	{:else}
		<button on:click={() => (showSettings = true)}>
			{getTranslation(lang, "showSettings")}
		</button>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
	button {
		padding: 8px 15px;
		color: inherit;
		font-size: 13px;
		/* white-space: nowrap; */
		/* overflow: hidden;
        text-overflow: ellipsis; */
	}
	.controls {
		overflow-y: scroll;
		box-shadow: 0 0 10px 0 black;
		/* display: flex; */
		/* flex-direction: row; */
		position: fixed;
		/* width: 300px; */
		max-height: calc(100% - 40px);
		left: 20px;
		top: 20px;
		background-color: rgba(255, 255, 255, 0.5);
		/* padding: 10px; */
		border-radius: 5px;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
		transition-duration: 0.2s;
	}
	.controls::-webkit-scrollbar {
		display: none;
	}
	.controls_opened {
		padding: 10px;
		width: 300px;
		border-radius: 10px;
	}
	.controls-block > * {
		margin-bottom: 0;
	}
	.controls-block:not(:last-child) {
		margin-bottom: 20px;
	}
	.controls-block__title {
		margin: 0;
		margin-bottom: 5px;
		text-transform: uppercase;
		font-size: 100%;
	}
	.buttons-row {
		display: flex;
		margin-bottom: 10px;
	}
	.buttons-row button {
		width: 100%;
	}
	@supports (not (backdrop-filter: blur())) and
    (not (-webkit-backdrop-filter: blur())) {
		.controls {
			background-color: rgba(150, 150, 150, 0.95);
		}
	}
</style>
