// const str = 'video/mp4; codecs="avc1.42E01E"'
// function startmedia() {
//     var media_source = new MediaSource();
//     const msehandle = media_source.handle;
//     self.postMessage({ handle: msehandle }, [msehandle]);
//     // setInterval(() => {
//     //     console.log("media source state: ", media_source.readyState);
//     // }, 500)
//     media_source.addEventListener("sourceopen", (e) => {
//         console.log("sourceopened on media source");
//         helper();
//     });

//     return media_source;
// }

// // var srcbuf = media_source.addSourceBuffer(str);
// const ws = new WebSocket("ws://localhost:8080/receive");
// ws.onmessage = (e) => {
//     e.data.arrayBuffer()
//         .then((buff) => {
//             console.log("received from server: ", typeof (buff))
//             console.log("buff", buff);
//             const mse = startmedia();
//             let srcbuf = mse.addSourceBuffer(str);
//             srcbuf.appendBuffer(buff);
//         })
// }


//----------------------------------------------------------------

const str = 'video/mp4; codecs="avc1.42E01E"'
var media_source = new MediaSource();
const msehandle = media_source.handle;
self.postMessage({ signal: "handle", handle: msehandle }, [msehandle]);

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
        if(srcbuf.updating) return;
        else ws.send("ready");
    }, 1000);
    console.log("websocket opened");
}
ws.onmessage = (e) => {
    if (srcbuf === null) return;
    console.log("received data from server");
    ++counter;
    e.data.arrayBuffer().
        then((buff) => {
            if (!srcbuf.updating) {
                console.log("appending buffer: ", counter);
                self.postMessage({ signal: "download", buff: buff });
                srcbuf.appendBuffer(buff);
           }
        })
}
