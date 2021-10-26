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
	import ParticleSelector from "./ParticleSelector.svelte"

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
	let simulationsPerFrame = 5
	let drawConnections = true
	let selectedId = 0

	let graphComponent
	let graphClickHandler

	onMount(function(){
		graphClickHandler = function(ev){
			graphComponent.handleClick(ev)
		}
	})


</script>

<Canvas onClick={graphClickHandler}>
	<Background color='hsl(0, 0%, 10%)'>
		<DotGrid divisions={30} color='hsla(0, 0%, 100%, 0.5)' />
	</Background>
	<Graph bind:this={graphComponent} />
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
		<!-- <div class="controls__col"> -->
		<div class="controls-block">
			<div class="buttons-row">
				<button on:click={() => (showSettings = false)}>
					{getTranslation(lang, "hideSettings")}
				</button>
				<button on:click={{}}>
					{getTranslation(lang, "copyLink")}
				</button>
			</div>
		</div>
		<div class="controls-block">
			<h2 class="controls-block__title">
				{getTranslation(lang, "currentWorldSettings")}
			</h2>
			<InputRange
					name={getTranslation(lang, "simulationsPerFrame")}
					min={1}
					max={100}
					bind:value={simulationsPerFrame}
			/>
			<InputRange
					name={getTranslation(lang, "temperature")}
					min={0.1}
					max={40}
					step={0.1}
					bind:value={simulationsPerFrame}
			/>
			<InputRange
					name={getTranslation(lang, "friction")}
					min={0}
					max={1}
					step={0.01}
					bind:value={simulationsPerFrame}
			/>
			<InputRange
					name={getTranslation(lang, "particleRadius")}
					min={3}
					max={10}
					step={0.01}
					bind:value={simulationsPerFrame}
			/>
			<div class="buttons-row">
				<button
						on:click={() => {}}
				>
					{getTranslation(lang, "killAllParticles")}
				</button>
			</div>
		</div>
		<div class="controls-block">
			<h2 class="controls-block__title">
				{getTranslation(lang, "newWorldSettings")}
			</h2>
			<InputRange
					name={getTranslation(lang, "particleTypesAmount")}
					bind:value={simulationsPerFrame}
					min={1}
					max={100}
			/>
			<InputRange
					name={getTranslation(lang, "particleCount")}
					bind:value={simulationsPerFrame}
					min={0}
					max={5000}
			/>
			<div class="buttons-row">
				<button on:click={() => {}}>
					{getTranslation(lang, "createNewWorld")}
				</button>
			</div>
		</div>
		<div class="controls-block">
			<h2 class="controls-block__title">
				{getTranslation(lang, "particleBrush")}
			</h2>
			<ParticleSelector
					colors={COLORS}
					bind:selectedId
			/>
		</div>

		<div class="controls-block">
			<h2 class="controls-block__title">
				{getTranslation(lang, "graphicalSettings")}
			</h2>
			<Checkbox
					title={getTranslation(lang, "showFPS")}
					bind:checked={showFPS}
			/>
			<Checkbox
					title={getTranslation(lang, "changeFormBySpeed")}
					bind:checked={drawConnections}
			/>
			{#if drawConnections}
				<InputRange
						name={getTranslation(lang, "displacementMultiplier")}
						min={1}
						max={10}
						step={1}
						bind:value={simulationsPerFrame}
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
