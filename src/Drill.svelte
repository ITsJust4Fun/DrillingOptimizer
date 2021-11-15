<script>
	import { renderable } from './game.js'
	import Text from './Text.svelte'
	import vec2 from 'gl-vec2'

	export let isShow = true
	export let isShowLabel = true
	export let drillColor = '#419e5a'
	export let normalColor = '#ffe554'
	export let size = 10
	export let thickness = 3
	export let moveTo = [ 0, 0 ]
	export let isSpinEnabled = false
	export let isFinished = true
	export let moveSpeed = 0.1
	export let spinSpeed = 0.5
	export let rotationsCount = 50
	export let labelSize = 8
	export let labelColor = 'hsl(0, 0%, 100%)'
	
	let text
	
	let x = 0
	let y = 0
	let velocity = [ 0, 0 ]
	let lastNormal = [ 1, 0 ]

	let isSpin = false
	let spinOffset = 0
	let rotationsCompleted = 0
	
	renderable((props, dt) => {
		const { context, width, height } = props

		if (!isShow) {
			text.$set({
				text: '',
				x,
				y: y + size + 10
			})

			return
		}
		
		let position = [ x, y ]
		if (!isFinished) {
			const delta = vec2.sub([], moveTo, position)
			vec2.normalize(delta, delta)
			vec2.scaleAndAdd(velocity, velocity, delta, moveSpeed)
		}
		
		if (x < 0 || x > width) {
			velocity = [ 0, 0 ]
		}

		if (y < 0 || y > height) {
			velocity = [ 0, 0 ]
		}

		x += velocity[0]
		y += velocity[1]
		
		position[0] = x
		position[1] = y

		const delta = vec2.sub([], moveTo, position)

		if (checkDistance(delta, 0) && checkDistance(delta, 1)) {
			stop()
		}

		context.lineCap = 'round'

		context.beginPath()
		context.fillStyle = drillColor
		context.strokeStyle = drillColor
		context.lineWidth = thickness
		context.arc(x, y, size, 0, Math.PI * 2)
		context.fill()

		let normal
		
		if (vec2.squaredLength(velocity) > 0) {
			normal = vec2.normalize([], velocity)
			lastNormal = normal
		} else {
			normal = lastNormal
		}

		context.fillStyle = normalColor
		context.strokeStyle = normalColor
		context.lineWidth = thickness

		if (isSpin) {
			spin(context, normal)
		} else {
			drawNormal(context, position, normal, size)
		}

		// We use this to make sure the text is in sync with the character
		// Because regular prop reactivity happens a frame too late
		if (isShowLabel) {
			text.$set({
				text: `(${position.map(n => Math.round(n)).join(', ')})`,
				x,
				y: y + size + 10
			})
		} else {
			text.$set({
				text: '',
				x,
				y: y + size + 10
			})
		}
	})
	
	function drawNormal(context, position, normal, length) {
		const point = vec2.scaleAndAdd([], position, normal, length)
		context.beginPath()
		context.moveTo(position[0], position[1])
		context.lineTo(point[0], point[1])
		context.stroke()
	}

	function stop() {
		x = moveTo[0]
		y = moveTo[1]

		velocity = [ 0, 0 ]

		if (isSpinEnabled) {
			if (!isFinished) {
				isSpin = true
			}
		} else {
			isFinished = true
		}
	}

	function spin(context, normal) {

		let theta = angle(0, 0, normal[0], normal[1]) + spinOffset
		let resultX = Math.cos(theta)
		let resultY = Math.sin(theta)

		drawNormal(context, [ x, y ], vec2.normalize([], [ resultX, resultY ]), size)

		let isFinishingRotation = (spinOffset + spinSpeed) - 2 * Math.PI > 0.01

		if (!isFinishingRotation) {
			spinOffset += spinSpeed
		} else {
			spinOffset = 0
			rotationsCompleted++

			if (rotationsCompleted >= rotationsCount) {
				rotationsCompleted = 0
				isSpin = false
				isFinished = true
			}
		}
	}

	function checkDistance(delta, index) {
		let zone = Math.abs(velocity[index])
		zone = zone !== 0 ? zone : 1

		return Math.abs(delta[index]) < zone
	}

	function angle(cx, cy, ex, ey) {
		let dy = ey - cy
		let dx = ex - cx
		return Math.atan2(dy, dx) // range (-PI, PI]
	}
</script>

<Text
	fontSize={labelSize}
	color={labelColor}
	baseline='top'
	bind:this={text}
/>

<slot></slot>
