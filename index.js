'use strict'

const CONFIG = {
  http: {
    port: 3000,
  },
  atem: {
    ip: '10.40.1.20'
  }
}

const ATEM = require('applest-atem')
const Koa = require('koa')
const Router = require('koa-trie-router')
const serve = require('koa-static')
const { resolve } = require('path')

const atem = new ATEM()
const app = new Koa()
const router = new Router()

const inputs = {
	GFX: 5,
	CAM: 3,
	MIX_MAIN: 10020,
	LINK: 12,
	PLAYBACK: 13,
}

const mix = {
	PARENTS: 0,
	MAIN: 1,
}

const usk = {
	BANNER: 0,
	TEXT: 1,
}

const macros = {
	FL_TEXT_DOWN: 1,
	FL_TEXT_NORMAL: 2,
}

const states = {
	video: {
		[mix.MAIN]: {
			input: inputs.PLAYBACK,
			usk: {
				[usk.BANNER]: false,
				[usk.TEXT]: false,
			},
		},
		[mix.PARENTS]: {
			input: inputs.GFX,
			usk: {
				[usk.BANNER]: false,
				[usk.TEXT]: false,
			},
			macro: macros.FL_TEXT_DOWN,
		}
	},
	animations: {
		[mix.MAIN]: {
			input: inputs.GFX,
			usk: {
				[usk.BANNER]: false,
				[usk.TEXT]: true,
			},
		},
		[mix.PARENTS]: {
			input: inputs.GFX,
			usk: {
				[usk.BANNER]: false,
				[usk.TEXT]: false,
			},
			macro: macros.FL_TEXT_DOWN,
		}
	},
}

const nextTransition = {}

router.post('/go/:option', function (ctx) {
  const withParents = ctx.params.option === 'with_parents'

  if (nextTransition.macro) {
    atem.runMacro(nextTransition.macro)
    nextTransition.macro = undefined
  }

  atem.autoTransition(mix.MAIN)

  if (withParents) {
    atem.autoTransition(mix.PARENTS)
  }

  ctx.status = 204
})

router.post('/state/:id/:option', function (ctx) {
  const stateId = ctx.params.id
  const withParents = ctx.params.option === 'with_parents'

// const state = states[stateId]

// for (const outputId of Object.keys(state)) {
// 	if (!withParents && outputId === mix.PARENTS) {
// 		continue
// 	}

// 	const output = state[outputId]

// 	atem.changePreviewInput(output.input, outputId)

// 	nextTransition.macro = output.macro

// 	for (const uskId of Object.keys(output.usk)) {
// 		keyPreview(outputId, uskId, output.usk[uskId])
// 	}
// }

  switch (stateId) {
    case 'pre-post':
    case 'video':
      // Main
      atem.changePreviewInput(inputs.PLAYBACK, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, false)
      keyPreview(mix.MAIN, usk.TEXT, false)

    if (withParents) {
      // Parents
      atem.changePreviewInput(inputs.PLAYBACK, mix.PARENTS)
      nextTransition.macro = undefined
        keyPreview(mix.PARENTS, usk.BANNER, false)
        keyPreview(mix.PARENTS, usk.TEXT, false)
    }
    break

    case 'animations':
      // Main
      atem.changePreviewInput(inputs.GFX, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, false)
      keyPreview(mix.MAIN, usk.TEXT, true)

    if (withParents) {
      // Parents
      atem.changePreviewInput(inputs.CAM, mix.PARENTS)
      nextTransition.macro = macros.FL_TEXT_DOWN
        keyPreview(mix.PARENTS, usk.BANNER, false)
        keyPreview(mix.PARENTS, usk.TEXT, true)
    }
    break

    case 'cyc':
      // Main
      atem.changePreviewInput(inputs.PLAYBACK, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, false)
      keyPreview(mix.MAIN, usk.TEXT, false)

    if (withParents) {
      // Parents
      atem.changePreviewInput(inputs.CAM, mix.PARENTS)
      nextTransition.macro = undefined
        keyPreview(mix.PARENTS, usk.BANNER, false)
        keyPreview(mix.PARENTS, usk.TEXT, false)
    }
    break

    case 'cyc-text':
      // Main
      atem.changePreviewInput(inputs.PLAYBACK, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, false)
      keyPreview(mix.MAIN, usk.TEXT, true)

    if (withParents) {
      // Parents
      atem.changePreviewInput(inputs.CAM, mix.PARENTS)
      nextTransition.macro = macros.FL_TEXT_NORMAL
        keyPreview(mix.PARENTS, usk.BANNER, false)
        keyPreview(mix.PARENTS, usk.TEXT, false)
    }
    break

    case 'cam':
      atem.changePreviewInput(inputs.CAM, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, false)
      keyPreview(mix.MAIN, usk.TEXT, false)

    if (withParents) {
      atem.changePreviewInput(inputs.CAM, mix.PARENTS)
      nextTransition.macro = undefined
        keyPreview(mix.PARENTS, usk.BANNER, false)
        keyPreview(mix.PARENTS, usk.TEXT, false)
    }
    break

    case 'cam-lyrics':
      atem.changePreviewInput(inputs.CAM, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, false)
      keyPreview(mix.MAIN, usk.TEXT, true)

    if (withParents) {
      atem.changePreviewInput(inputs.CAM, mix.PARENTS)
      nextTransition.macro = macros.FL_TEXT_NORMAL
        keyPreview(mix.PARENTS, usk.BANNER, false)
        keyPreview(mix.PARENTS, usk.TEXT, true)
    }
    break

    case 'cam-banner':
      atem.changePreviewInput(inputs.CAM, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, true)
      keyPreview(mix.MAIN, usk.TEXT, false)

    if (withParents) {
      atem.changePreviewInput(inputs.CAM, mix.PARENTS)
      nextTransition.macro = undefined
        keyPreview(mix.PARENTS, usk.BANNER, true)
        keyPreview(mix.PARENTS, usk.TEXT, false)
    }
    break

    case 'cam-banner-text':
      atem.changePreviewInput(inputs.CAM, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, true)
      keyPreview(mix.MAIN, usk.TEXT, true)

    if (withParents) {
      atem.changePreviewInput(inputs.CAM, mix.PARENTS)
      nextTransition.macro = macros.FL_TEXT_NORMAL
        keyPreview(mix.PARENTS, usk.BANNER, true)
        keyPreview(mix.PARENTS, usk.TEXT, true)
    }
    break

    case 'link':
      atem.changePreviewInput(inputs.CAM, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, false)
      keyPreview(mix.MAIN, usk.TEXT, false)

    if (withParents) {
      atem.changePreviewInput(inputs.CAM, mix.PARENTS)
      nextTransition.macro = undefined
        keyPreview(mix.PARENTS, usk.BANNER, false)
        keyPreview(mix.PARENTS, usk.TEXT, false)
    }
    break

    case 'link-lyrics':
      atem.changePreviewInput(inputs.LINK, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, false)
      keyPreview(mix.MAIN, usk.TEXT, true)

    if (withParents) {
      atem.changePreviewInput(inputs.LINK, mix.PARENTS)
      nextTransition.macro = macros.FL_TEXT_NORMAL
        keyPreview(mix.PARENTS, usk.BANNER, false)
        keyPreview(mix.PARENTS, usk.TEXT, true)
    }
    break

    case 'link-banner':
      atem.changePreviewInput(inputs.LINK, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, true)
      keyPreview(mix.MAIN, usk.TEXT, false)

    if (withParents) {
      atem.changePreviewInput(inputs.LINK, mix.PARENTS)
      nextTransition.macro = undefined
        keyPreview(mix.PARENTS, usk.BANNER, true)
        keyPreview(mix.PARENTS, usk.TEXT, false)
    }
    break

    case 'link-banner-text':
      atem.changePreviewInput(inputs.LINK, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, true)
      keyPreview(mix.MAIN, usk.TEXT, true)

    if (withParents) {
      atem.changePreviewInput(inputs.LINK, mix.PARENTS)
      nextTransition.macro = macros.FL_TEXT_NORMAL
        keyPreview(mix.PARENTS, usk.BANNER, true)
        keyPreview(mix.PARENTS, usk.TEXT, true)
    }
    break
  }

  ctx.status = 204
})

router.get('/config', ctx => {
  ctx.body = CONFIG
})

app.use(serve(resolve(__dirname, 'dist')))
app.use(router.middleware())

console.log('Starting web server..')
app.listen(CONFIG.http.port)

console.log('Connecting to ATEM..')
atem.connect(CONFIG.atem.ip)

atem.on('connect', connect)

function parentsFromMain () {
	atem.changePreviewInput(inputs.MIX_MAIN, mix.PARENTS)
	keyPreview(mix.PARENTS, usk.BANNER, false)
	keyPreview(mix.PARENTS, usk.TEXT, false)
	// atem.autoTransition(mix.PARENTS)
}

function keyPreview (me, number, value) {
	// value === true -> should be on
	// value === false -> should be off
	if (value) {
		// Bring it on if off
		value = !atem.state.video.ME[me].upstreamKeyState[number]
	} else {
		// Take it off if on
		value = atem.state.video.ME[me].upstreamKeyState[number]
	}

	atem.changeUpstreamKeyNextState(number, value, me)
}

//   atem.changeProgramInput(1) // ME1(0)
  // atem.changePreviewInput(1) // ME1(0)
//   atem.autoTransition() // ME1(0)
//   atem.changeProgramInput(3, 1) // ME2(1)
// })

function connect () {
	console.log('Running')
	// console.log(JSON.stringify(atem.state, null, 2));
}

// atem.on('stateChanged', function(err, newState) {
// 	state = newState
// 	// console.error(err)
//  //  console.log(state) // catch the ATEM state.
// })

// console.log(state)
// console.log(atem.state); // or use this.
