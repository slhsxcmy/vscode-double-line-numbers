const fs = require('fs');
const TextToSVG = require('text-to-svg');
const sharp = require('sharp');

const FONT = 72; 
const OUT_DIR = __dirname + "/../images/"  // must end with /

const textToSVG = TextToSVG.loadSync();
const attributes = {fill: 'blue', stroke: 'red'};
const options = {x: 0, y: FONT/2, fontSize: FONT, anchor: 'left middle', attributes: attributes};

if (!fs.existsSync(OUT_DIR)){
    fs.mkdirSync(OUT_DIR);
}

export function generateImages(start : number, end : number) {
    console.log("generateImages START")
    
    for(var i = start; i <= end; ++i) {
        const svg = textToSVG.getSVG(i.toString(), options);
        fs.writeFileSync(OUT_DIR + i.toString() + ".svg", svg);
        
        sharp(OUT_DIR + i.toString() + ".svg")
        .resize(1000, 1000, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toFile(OUT_DIR + i.toString() + ".png", () => { })
    }
    //  const options = {x: 350, y: 350, fontSize: 70, anchor: 'top', attributes: attributes};
    
    
    // console.log(svg);

    

    
    // svg to png
    
    console.log("generateImages END")
}