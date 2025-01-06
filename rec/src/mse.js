import { Mutex } from 'async-mutex'
var mutex = new Mutex()
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
    if (e.data.signal == "init") {
        console.log("Canvas Initialisation message received by the mse.js file");
        const streamId = e.data.data;
        startConnection(streamId);
        return;
    }
}

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

var ws = null;
function startConnection(streamId) {
    ws = new WebSocket("ws://localhost:8080/receiver/" + streamId);
    ws.onopen = (e) => {
        // I DON'T THINK I NEED TO SEND ANY MESSAGE TO THE BACKEND HERE
        // setInterval(() => {
        //     if (srcbuf.updating) return;
        //     else ws.send("ready");
        // }, 1000);
        console.log("websocket opened");
    }
    ws.onmessage = (e) => {
        console.log("received data from server");
        if ((msgparity % 2) == 0) {
            msgparity = (msgparity + 1)
            console.log("this should be a facecam message");
            e.data.arrayBuffer().then((buff) => {
                mutex.runExclusive(() => {
                    facecam_q.push(buff);
                })
            })
            if (msgparity >= 4) {
                pushToSrcBufs();
            }
            return;
        } else {
            msgparity = (msgparity + 1);
            console.log("this should be a canvas message");
            console.log(typeof (e.data));
            e.data.arrayBuffer().then((buff) => {
                mutex.runExclusive(() => {
                    canvas_q.push(buff);
                })
            })
            if (msgparity >= 4) {
                pushToSrcBufs();
            }
            return;
        }
    }
}
var facecam_q = [];
var canvas_q = [];
var msgparity = 0;

function pushToSrcBufs() {
    if (srcbuf === null || canvas_srcbuf === null) return;
    if (srcbuf.updating || canvas_srcbuf.updating) return;

    mutex.runExclusive(() => {
        if (facecam_q.length < 1 || canvas_q.length < 1) return;
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
    })
}



