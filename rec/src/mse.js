//VideoAndAudioVersions
const str = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
// const str = 'video/mp4; codecs="avc1.58A01E, mp4a.40.2"'


//VideoOnlyVersions
// const str = 'video/mp4; codecs="avc1.58A01E"'
// const str = 'video/mp4; codecs="avc1.58A00A"'
// const str = 'video/mp4; codecs="avc1.42C00A"' //level 1 + constrained baseline profile
// const str = 'video/mp4; codecs="avc1.42E01E"'

var media_source = new MediaSource();
const msehandle = media_source.handle;
self.postMessage({ signal: "handle", handle: msehandle }, [msehandle]);
onmessage = (e) => {
    if (e.data.signal == "cnv_init") {
        console.log("Canvas Initialisation message received by the mse.js file");
        drawer(e.data.data);
    }
}

let counter = 0;
let srcbuf = null;
media_source.addEventListener("sourceopen", (e) => {
    console.log("sourceopened on media source");
    srcbuf = media_source.addSourceBuffer(str);
    srcbuf.mode = "sequence";
    console.log("srcbuf: ", srcbuf);
});

const ws = new WebSocket("ws://localhost:8080/receive");
ws.onopen = (e) => {
    setInterval(() => {
        if (srcbuf.updating) return;
        else ws.send("ready");
    }, 1000);
    console.log("websocket opened");
}

let msgparity = 0;
ws.onmessage = (e) => {
    if (srcbuf === null) return;
    console.log("received data from server");
    if (msgparity == 0) {
        console.log("this should be a json message");
        let newdata = JSON.parse(e.data);
        if (newdata !== null) {
            canvasBuffer.push(...newdata)
        }
        msgparity = (msgparity + 1) % 2;
        return;
    }
    ++counter;
    console.log("this should be a binary message");
    console.log(typeof (e.data));
    msgparity = (msgparity + 1) % 2;
    e.data.arrayBuffer().
        then((buff) => {
            if (!srcbuf.updating) {
                console.log("appending buffer: ", counter);
                self.postMessage({ signal: "download", buff: buff });
                try {
                    srcbuf.appendBuffer(buff);
                } catch (e) {
                    console.log("error appending buffer: ", e);
                }
            }
        })
}

var canvasBuffer = [];
async function drawer(ocanvas) {
    const ctx = ocanvas.getContext("2d");
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    console.log(ocanvas.height + " " + ocanvas.width);

    // Add these to ensure we have a visible stroke
    ctx.strokeStyle = "black"; // Set a default color
    ctx.lineWidth = 2; // Set a default width
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, ocanvas.width, ocanvas.height);


    let drawing = false;
    const ptrdown = ({ x, y }) => {
        drawing = true
        ctx.beginPath(x, y)
        ctx.moveto(x, y);
    }

    const ptrmove = ({ x, y }) => {
        if (!drawing) return;
        ctx.lineTo(x, y);
        ctx.stroke();
        // drawPoints();
    }

    const ptrup = ({ x, y }) => {
        drawing = false;
    }

    const ptrlv = ({ x, y }) => {
        drawing = false;
    }


    // let drawing = false;
    const f = () => {
        if (canvasBuffer.length <= 0) return;
        let cpy = canvasBuffer.shift();

        console.log("Complete cpy object:", JSON.stringify(cpy));
        console.log(ocanvas.height + " " + ocanvas.width);

        // Debug the incoming style values
        console.log("Style object:", cpy.style);

        const colorStr = cpy.style.slice(1);
        const color = colorStr.startsWith('#') ? colorStr : '#' + colorStr;

        ctx.lineWidth = parseFloat(cpy.style[0]);
        ctx.strokeStyle = color;

        const g = () => {
            if(cpy.type == "ptrDown") {
                ptrdown(cpy.coord)
            } else if(cpy.type == "ptrUp") {
                ptrup(cpy.coord)
            } else if(cpy.type == "ptrLeave") {
                ptrlv(cpy.coord)
            } else if(cpy.type == "ptrMove") {
                ptrmove(cpy.coord);
            }
        }

        // const g = () => {   
        //     if(cpy.type == "beginPath") {
        //         drawing = true
        //         ctx.beginPath();
        //         ctx.moveTo(cpy.coord.x, cpy.coord.y);
        //     } else if(cpy.type == "lineTo") {
        //         if(!drawing) return
        //         ctx.lineTo(cpy.coord.x, cpy.coord.y);
        //         ctx.stroke(); 
        //     } else if(cpy.type == "endPath") {
        //         drawing = false;
        //         return;
        //     }
        // }

        g();
        // setTimeout(g, cpy.deltaTime);
    }
    setInterval(f, 1);
}