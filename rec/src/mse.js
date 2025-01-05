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
var canvas_source = new MediaSource();
const msecanvashandle = canvas_source.handle;
self.postMessage({ signal: "canvas_handle", handle: msecanvashandle }, [msecanvashandle]);

onmessage = (e) => {
    if (e.data.signal == "cnv_init") {
        console.log("Canvas Initialisation message received by the mse.js file");
        // drawer(e.data.data);
        return;
    }
}

var counter = 0;
var srcbuf = null;
media_source.addEventListener("sourceopen", (e) => {
    console.log("sourceopened on media source");
    srcbuf = media_source.addSourceBuffer(str);
    srcbuf.mode = "sequence";
    console.log("srcbuf: ", srcbuf);
});

var canvas_str = 'video/mp4; codecs="av01.0.05M.08"';
console.log(MediaSource.isTypeSupported(canvas_str));

var canvas_srcbuf = null;
canvas_source.addEventListener("sourceopen", (e) => {
    console.log("canvas sourceopened on media source");
    canvas_srcbuf = canvas_source.addSourceBuffer(canvas_str);
    canvas_srcbuf.mode = "sequence";
    console.log("canvas srcbuf: ", canvas_srcbuf);
});

const ws = new WebSocket("ws://localhost:8080/receive");
ws.onopen = (e) => {
    setInterval(() => {
        if (srcbuf.updating) return;
        else ws.send("ready");
    }, 1000);
    console.log("websocket opened");
}

var facecam_q = [];
var canvas_q = [];
var msgparity = 0;

function pushToSrcBufs() {
    if (srcbuf.updating || canvas_srcbuf.updating) return;
    let cq = canvas_q.shift();
    let fq = facecam_q.shift();
    try {
        srcbuf.appendBuffer(fq);
    } catch (e) {
        console.log("error appending facecam buffer: ", e);
    }

    try {
        canvas_srcbuf.appendBuffer(cq);
    } catch (e) {
        console.log("error appending canvas buffer: ", e);
    }
}


ws.onmessage = (e) => {
    if (srcbuf === null) return;
    if (canvas_srcbuf === null) return;
    ++counter;
    console.log("received data from server");
    if (msgparity == 0) {
        msgparity = (msgparity + 1) % 2;
        console.log("this should be a facecam message");
        e.data.arrayBuffer().then((buff) => {
            facecam_q.push(buff);
        })
        pushToSrcBufs();
        return;
    } else {
        msgparity = (msgparity + 1) % 2;
        console.log("this should be a canvas message");
        console.log(typeof (e.data));
        e.data.arrayBuffer().then((buff) => {
            canvas_q.push(buff);
        })
        pushToSrcBufs();
        return;
    }
}

let canvasBuffer = [];
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
            if (cpy.type == "ptrDown") {
                ptrdown(cpy.coord)
            } else if (cpy.type == "ptrUp") {
                ptrup(cpy.coord)
            } else if (cpy.type == "ptrLeave") {
                ptrlv(cpy.coord)
            } else if (cpy.type == "ptrMove") {
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
        // setTimeout(g, 5);
        // setTimeout(g, cpy.deltaTime);
    }
    setInterval(f, 1);
}