const fs = require('fs')
const { createCanvas, loadImage } = require('canvas')

const MAX_ICONS = 99
const OUT_DIR = "test_images/"  // must end with /
const WIDTH = 200
const HEIGHT = 200

const canvas = createCanvas(WIDTH, HEIGHT)
const context = canvas.getContext('2d')

context.fillStyle = '#000' // TODO: set background color
context.fillRect(0, 0, WIDTH, HEIGHT)

context.font = (WIDTH/4).toString() + 'pt Monaco'  // TODO: set font
context.textAlign = 'right'
context.textBaseline = "middle"
context.fillStyle = '#fff'  // TODO: set font size

if (!fs.existsSync(OUT_DIR)){
    fs.mkdirSync(OUT_DIR);
}

for(var i = 0; i <= MAX_ICONS; ++i) {
    context.clearRect(0, 0, WIDTH, HEIGHT);

    console.log(i.toString())
    context.fillText(i.toString(), WIDTH, HEIGHT/2)
    const buffer = canvas.toBuffer('image/png')

    fs.writeFileSync(OUT_DIR + i.toString() + '.png', buffer)
}


