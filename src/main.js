// Made with the help of Nathan Altice's "Mappy"
// Debugged with the help of ChatGPT

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true
    },
    width: 640,
    height: 640,
    zoom: 2,
    scene: [ ArrayMapContext, ArrayMapWFC ]
}

const game = new Phaser.Game(config)

// globals
const centerX = game.config.width / 2
const centerY = game.config.height / 2
const w = game.config.width
const h = game.config.height
let cursors = null