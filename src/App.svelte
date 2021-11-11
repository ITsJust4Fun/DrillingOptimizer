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
	import Window from "./Window.svelte"

	import TRANSLATIONS from "./translations"
	import RadioButtons from "./RadioButtons.svelte"

	function getTranslation(lang: string, key: string) {
		const phrase: { [key: string]: string } = TRANSLATIONS[key]
		return Object.keys(phrase).includes(lang) ? phrase[lang] : phrase["en"]
	}

	let languages = [{option: 'en', label: 'english', id: "en_radio"},
					 {option: 'ru', label: 'russian', id: "ru_radio"}]

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
	let showMenu = true
	let showFPS = true
	let showHint = true
	let showVertexLabel = true
	let showEdgeLabel = true
	let removeEdgesOnMoving = false
	let isFullscreen = false
	let vertexColorId = 0
	let edgeColorId = 0
	let vertexSize = 10
	let edgeSize = 3
	let vertexLabelColorId = 9
	let vertexLabelSize = 8
	let vertexesGenerationCount = 30
	let edgeLabelDistance = 30
	let edgeLabelSize = 8
	let edgeLabelColorId = 9
	let totalDistance = '0'
	let totalDistanceWithStart = '0'

	let graphComponent
	let graphClickHandler
	let graphMouseDownHandler
	let graphTouchStartHandler
	let graphRemoveVertexesHandler
	let graphRemoveEdgesHandler
	let graphGenerateVertexesHandler
	let graphFillEdgesInAddingOrderHandler

	onMount(function(){
		graphClickHandler = function(ev) {
			graphComponent.handleClick(ev)
		}
		graphMouseDownHandler = function(ev) {
			graphComponent.handleMouseDown(ev)
		}
		graphTouchStartHandler = function (ev) {
			graphComponent.handleTouchStart(ev)
		}
		graphRemoveVertexesHandler = function() {
			graphComponent.removeAllVertexes()
		}
		graphRemoveEdgesHandler = function() {
			graphComponent.removeAllEdges()
		}
		graphGenerateVertexesHandler = function() {
			graphComponent.generateVertexes()
		}
		graphFillEdgesInAddingOrderHandler = function() {
			graphComponent.fillEdgesInAddingOrder()
		}
	})

	enum Windows {
		VertexSettings,
		EdgeSettings,
		OtherSettings,
		About,
		TotalDistance,
		Size,
	}

	let windowsOrder = [...Array(Windows.Size).keys()]
	let windowsStatus = new Array<boolean>(Windows.Size)
	windowsStatus.fill(false)

	function makeWindowActive(window: Windows) {
		windowsStatus[window] = true

		for (let i = 0; i < windowsOrder.length; i++) {
			if (windowsOrder[i] > windowsOrder[window]) {
				windowsOrder[i] -= 1
			}
		}

		windowsOrder[window] = Windows.Size - 1
	}

	function makeWindowInactive(window: Windows) {
		windowsStatus[window] = false

		for (let i = 0; i < windowsOrder.length; i++) {
			if (windowsOrder[i] < windowsOrder[window]) {
				windowsOrder[i] += 1
			}
		}

		windowsOrder[window] = 0
	}

	function switchFullscreen() {
		if (document.fullscreenElement) {
			document.exitFullscreen()
				.then(function() {
					// element has exited fullscreen mode
				})
				.catch(function(error) {
					// element could not exit fullscreen mode
					// error message
					console.log(error.message);
				})

			isFullscreen = false
		} else {
			document.documentElement.requestFullscreen()
				.then(function() {
					// element has entered fullscreen mode successfully
				})
				.catch(function(error) {
					// element could not enter fullscreen mode
					// error message
					console.log(error.message);
				})

			isFullscreen = true
		}
	}

</script>

<Canvas
		onClick={graphClickHandler}
		onMouseDown={graphMouseDownHandler}
		onTouchStart={graphTouchStartHandler}
>
	<Background color='hsl(0, 0%, 10%)'>
		<DotGrid divisions={30} color='hsla(0, 0%, 100%, 0.5)' />
	</Background>
	<Graph
			bind:this={graphComponent}
			bind:totalDistance={totalDistance}
			bind:totalDistanceWithStart={totalDistanceWithStart}
			vertexColor={COLORS[vertexColorId]}
			edgeColor={COLORS[edgeColorId]}
			vertexSize={vertexSize}
			edgeSize={edgeSize}
			showVertexLabel={showVertexLabel}
			removeEdgesOnMoving={removeEdgesOnMoving}
			vertexLabelSize={vertexLabelSize}
			vertexLabelColor={COLORS[vertexLabelColorId]}
			vertexesGenerationCount={vertexesGenerationCount}
			showEdgeLabel={showEdgeLabel}
			edgeLabelColor={COLORS[edgeLabelColorId]}
			edgeLabelSize={edgeLabelSize}
			edgeLabelDistance={edgeLabelDistance}
	/>
	<Text
			show={showHint}
			text={getTranslation(lang, 'addHint')}
			fontSize={12}
			align='right'
			baseline='bottom'
			x={$width - 20}
			y={$height - 20}
	/>
	<FPS show={showFPS} />
</Canvas>
<div class="controls" class:controls_opened={showMenu}>
	{#if showMenu}
		<div class="controls-block">
			<div class="buttons-row">
				<button on:click={() => {makeWindowActive(Windows.About)}}>
					{getTranslation(lang, "about")}
				</button>
				<button on:click={() => (showMenu = false)}>
					{getTranslation(lang, "hideMenu")}
				</button>
			</div>
		</div>
		<div class="controls-block">
			<h2 class="controls-block__title">
				{getTranslation(lang, "graphControls")}
			</h2>
			<Checkbox
					title={getTranslation(lang, "removeEdgesOnMoving")}
					bind:checked={removeEdgesOnMoving}
			/>
			<div class="buttons-row">
				<button on:click={graphRemoveVertexesHandler}>
					{getTranslation(lang, "removeAllVertexes")}
				</button>
			</div>
			<div class="buttons-row">
				<button on:click={graphRemoveEdgesHandler}>
					{getTranslation(lang, "removeAllEdges")}
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
			<div class="buttons-row">
				<button on:click={() => {makeWindowActive(Windows.TotalDistance)}}>
					{getTranslation(lang, "showTotalDistance")}
				</button>
			</div>
		</div>
		<div class="controls-block">
			<h2 class="controls-block__title">
				{getTranslation(lang, "settings")}
			</h2>
			<div class="buttons-row">
				<button on:click={() => {makeWindowActive(Windows.VertexSettings)}}>
					{getTranslation(lang, "openVertexSettings")}
				</button>
			</div>
			<div class="buttons-row">
				<button on:click={() => {makeWindowActive(Windows.EdgeSettings)}}>
					{getTranslation(lang, "openEdgeSettings")}
				</button>
			</div>
			<div class="buttons-row" style="margin-bottom: 0;">
				<button on:click={() => {makeWindowActive(Windows.OtherSettings)}}>
					{getTranslation(lang, "openOtherSettings")}
				</button>
			</div>
		</div>
	{:else}
		<button on:click={() => (showMenu = true)}>
			{getTranslation(lang, "showMenu")}
		</button>
	{/if}
</div>
<Window
		title="{getTranslation(lang, 'vertexSettings')}"
		isOpened={windowsStatus[Windows.VertexSettings]}
		zIndex={windowsOrder[Windows.VertexSettings]}
		onClickHandler={() => { makeWindowActive(Windows.VertexSettings) }}
		onCloseHandler={() => { makeWindowInactive(Windows.VertexSettings) }}
>
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
</Window>
<Window
		title="{getTranslation(lang, 'edgeSettings')}"
		isOpened={windowsStatus[Windows.EdgeSettings]}
		zIndex={windowsOrder[Windows.EdgeSettings]}
		onClickHandler={() => { makeWindowActive(Windows.EdgeSettings) }}
		onCloseHandler={() => { makeWindowInactive(Windows.EdgeSettings) }}
>
	<Checkbox
			title={getTranslation(lang, "showEdgeLabel")}
			bind:checked={showEdgeLabel}
	/>
	<InputRange
			name={getTranslation(lang, "edgeSize")}
			min={1}
			max={10}
			step={0.3}
			bind:value={edgeSize}
	/>
	{#if showEdgeLabel}
		<InputRange
				name={getTranslation(lang, "edgeLabelSize")}
				min={8}
				max={16}
				step={1}
				bind:value={edgeLabelSize}
		/>
		<InputRange
				name={getTranslation(lang, "edgeLabelDistance")}
				min={0}
				max={40}
				step={0.3}
				bind:value={edgeLabelDistance}
		/>
	{/if}
	<div class="controls-block">
		<h2 class="controls-block__title">
			{getTranslation(lang, "edgeColor")}
		</h2>
		<ColorSelector
				colors={COLORS}
				bind:selectedId={edgeColorId}
		/>
	</div>
	{#if showEdgeLabel}
		<div class="controls-block">
			<h2 class="controls-block__title">
				{getTranslation(lang, "edgeLabelColor")}
			</h2>
			<ColorSelector
					colors={COLORS}
					bind:selectedId={edgeLabelColorId}
			/>
		</div>
	{/if}
</Window>
<Window
		title="{getTranslation(lang, 'otherSettings')}"
		isOpened={windowsStatus[Windows.OtherSettings]}
		zIndex={windowsOrder[Windows.OtherSettings]}
		onClickHandler={() => { makeWindowActive(Windows.OtherSettings) }}
		onCloseHandler={() => { makeWindowInactive(Windows.OtherSettings) }}
>
	<div class="controls-block">
		<Checkbox
				title={getTranslation(lang, "showFPS")}
				bind:checked={showFPS}
		/>
		<Checkbox
				title={getTranslation(lang, "showHint")}
				bind:checked={showHint}
		/>
	</div>
	<div class="controls-block">
		<h2 class="controls-block__title">
			{getTranslation(lang, 'language')}
		</h2>
		<RadioButtons
				options={languages}
				bind:group={lang}
				groupName="lang"
				getTranslation={getTranslation}
				lang={lang}
		/>
	</div>
	<div class="controls-block">
		<div class="buttons-row" style="margin-bottom: 0;">
			<button on:click={switchFullscreen}>
				{#if isFullscreen}
					{getTranslation(lang, 'exitFullsceen')}
				{:else}
					{getTranslation(lang, 'enterFullsceen')}
				{/if}
			</button>
		</div>
	</div>
</Window>
<Window
		title="{getTranslation(lang, 'about')}"
		isOpened={windowsStatus[Windows.About]}
		zIndex={windowsOrder[Windows.About]}
		onClickHandler={() => { makeWindowActive(Windows.About) }}
		onCloseHandler={() => { makeWindowInactive(Windows.About) }}
>
	<p style="text-align: center">
		{getTranslation(lang, 'pcbDrillingOptimazer')}<br>
		<a
				href="https://github.com/ITsJust4Fun/DrillingOptimizer"
				target="_blank"
		>
			{getTranslation(lang, 'githubPage')}
		</a>
	</p>
	<p style="text-align: center">{getTranslation(lang, 'developedUsingSvelte')}</p>
</Window>
<Window
		title="{getTranslation(lang, 'distance')}"
		isOpened={windowsStatus[Windows.TotalDistance]}
		zIndex={windowsOrder[Windows.TotalDistance]}
		onClickHandler={() => { makeWindowActive(Windows.TotalDistance) }}
		onCloseHandler={() => { makeWindowInactive(Windows.TotalDistance) }}
>
	<div>
		{getTranslation(lang, 'totalDistance')}: {totalDistance}
	</div>
	<div>
		{getTranslation(lang, 'totalDistanceWithStart')}: {totalDistanceWithStart}
	</div>
</Window>

<svelte:window
		on:fullscreenchange={() => { isFullscreen = document.fullscreenElement !== null }}
/>

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
		right: 20px;
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
