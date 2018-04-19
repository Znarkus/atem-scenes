'use strict'

const ATEM = require('applest-atem')
const Koa = require('koa')
const Router = require('koa-trie-router')
const serve = require('koa-static')
const io = require('socket.io')
const send = require('koa-send')
const { resolve } = require('path')

const CONFIG = {
  http: {
    port: 3000,
  },
  atem: {
    ip: '10.40.1.20'
  }
}

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
			input: inputs.PLAYBACK,
			usk: {
				[usk.BANNER]: false,
				[usk.TEXT]: false,
			},
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
			input: inputs.CAM,
			usk: {
				[usk.BANNER]: false,
				[usk.TEXT]: true,
			},
			macro: macros.FL_TEXT_DOWN,
		}
	},
  cyc: {
    [mix.MAIN]: {
      input: inputs.PLAYBACK,
      usk: {
        [usk.BANNER]: false,
        [usk.TEXT]: false,
      },
    },
    [mix.PARENTS]: {
      input: inputs.CAM,
      usk: {
        [usk.BANNER]: false,
        [usk.TEXT]: false,
      },
    }
  },
  'cyc-text': {
    [mix.MAIN]: {
      input: inputs.PLAYBACK,
      usk: {
        [usk.BANNER]: false,
        [usk.TEXT]: true,
      },
    },
    [mix.PARENTS]: {
      input: inputs.CAM,
      usk: {
        [usk.BANNER]: false,
        [usk.TEXT]: false,
      },
    }
  },
  cam: {
    [mix.MAIN]: {
      input: inputs.CAM,
      usk: {
        [usk.BANNER]: false,
        [usk.TEXT]: false,
      },
    },
    [mix.PARENTS]: {
      input: inputs.CAM,
      usk: {
        [usk.BANNER]: false,
        [usk.TEXT]: false,
      },
    }
  },
  'cam-lyrics': {
    [mix.MAIN]: {
      input: inputs.CAM,
      usk: {
        [usk.BANNER]: false,
        [usk.TEXT]: true,
      },
    },
    [mix.PARENTS]: {
      input: inputs.CAM,
      usk: {
        [usk.BANNER]: false,
        [usk.TEXT]: true,
      },
      macro: macros.FL_TEXT_NORMAL,
    }
  },
  'cam-banner': {
    [mix.MAIN]: {
      input: inputs.CAM,
      usk: {
        [usk.BANNER]: true,
        [usk.TEXT]: false,
      },
    },
    [mix.PARENTS]: {
      input: inputs.CAM,
      usk: {
        [usk.BANNER]: true,
        [usk.TEXT]: false,
      },
    }
  },
  'cam-banner-text': {
    [mix.MAIN]: {
      input: inputs.CAM,
      usk: {
        [usk.BANNER]: true,
        [usk.TEXT]: true,
      },
    },
    [mix.PARENTS]: {
      input: inputs.CAM,
      usk: {
        [usk.BANNER]: true,
        [usk.TEXT]: true,
      },
      macro: macros.FL_TEXT_NORMAL,
    }
  },
  link: {
    [mix.MAIN]: {
      input: inputs.LINK,
      usk: {
        [usk.BANNER]: false,
        [usk.TEXT]: false,
      },
    },
    [mix.PARENTS]: {
      input: inputs.LINK,
      usk: {
        [usk.BANNER]: false,
        [usk.TEXT]: false,
      },
    }
  },
  'link-lyrics': {
    [mix.MAIN]: {
      input: inputs.LINK,
      usk: {
        [usk.BANNER]: false,
        [usk.TEXT]: true,
      },
    },
    [mix.PARENTS]: {
      input: inputs.LINK,
      usk: {
        [usk.BANNER]: false,
        [usk.TEXT]: true,
      },
      macro: macros.FL_TEXT_NORMAL,
    }
  },
  'link-banner': {
    [mix.MAIN]: {
      input: inputs.LINK,
      usk: {
        [usk.BANNER]: true,
        [usk.TEXT]: false,
      },
    },
    [mix.PARENTS]: {
      input: inputs.LINK,
      usk: {
        [usk.BANNER]: true,
        [usk.TEXT]: false,
      },
    }
  },
  'link-banner-text': {
    [mix.MAIN]: {
      input: inputs.LINK,
      usk: {
        [usk.BANNER]: true,
        [usk.TEXT]: true,
      },
    },
    [mix.PARENTS]: {
      input: inputs.LINK,
      usk: {
        [usk.BANNER]: true,
        [usk.TEXT]: true,
      },
      macro: macros.FL_TEXT_NORMAL,
    }
  },
}

const nextTransition = {}

function go ({ settings }) {
  if (nextTransition.macro) {
    atem.runMacro(nextTransition.macro)
    nextTransition.macro = undefined
  }

  if (settings.main) {
    atem.autoTransition(mix.MAIN)
  }

  if (settings.parents) {
    atem.autoTransition(mix.PARENTS)
  }
}

function triggerScene ({ sceneId, settings }) {
  switch (sceneId) {
    case 'pre-post':
    case 'video':
      // Main
      atem.changePreviewInput(inputs.PLAYBACK, mix.MAIN)
      keyPreview(mix.MAIN, usk.BANNER, false)
      keyPreview(mix.MAIN, usk.TEXT, false)

    if (settings.parents) {
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

    if (settings.parents) {
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

    if (settings.parents) {
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

    if (settings.parents) {
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

    if (settings.parents) {
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

    if (settings.parents) {
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

    if (settings.parents) {
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

    if (settings.parents) {
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

    if (settings.parents) {
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

    if (settings.parents) {
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

    if (settings.parents) {
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

    if (settings.parents) {
      atem.changePreviewInput(inputs.LINK, mix.PARENTS)
      nextTransition.macro = macros.FL_TEXT_NORMAL
        keyPreview(mix.PARENTS, usk.BANNER, true)
        keyPreview(mix.PARENTS, usk.TEXT, true)
    }
    break
  }
}

app.use(serve(resolve(__dirname, 'dist')))
app.use(router.middleware())
app.use(ctx => {
  return send(ctx, 'index.html', { root: resolve(__dirname, 'dist') })
})

console.log('Starting web server..')
const server = app.listen(CONFIG.http.port, httpUp)

const wss = io(server)

console.log('Connecting to ATEM..')
atem.connect(CONFIG.atem.ip)

atem.on('connect', atemConnect)
atem.on('disconnect', atemDisconnect)

function httpUp () {
  wss.on('connection', (socket) => {
    console.log('Client connected')

    socket.emit('load', {
      config: CONFIG,
      connected: atem.connectionState === ATEM.ConnectionState.Established,
      inputNames: atem.state.channels,
      inputs,
      mix,
      usk,
      macros,
      states,
    })

    socket.on('triggerScene', (opts) => {
      triggerScene(opts)
    })

    socket.on('go', (opts) => {
      go(opts)
    })
  })
}

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

function atemConnect () {
	console.log('Connected to ATEM')
	wss.emit('atemConnection', { connected: true })
}

function atemDisconnect () {
	console.log('Disconnected from ATEM')
  wss.emit('atemConnection', { connected: false })
}

// atem.on('stateChanged', function(err, newState) {
// 	state = newState
// 	// console.error(err)
//  //  console.log(state) // catch the ATEM state.
// })

// console.log(state)
// console.log(atem.state); // or use this.
