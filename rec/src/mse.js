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
self.postMessage({ handle: msehandle }, [msehandle]);

let srcbuf = null;
media_source.addEventListener("sourceopen", (e) => {
    console.log("sourceopened on media source");
    srcbuf = media_source.addSourceBuffer(str);
    console.log("srcbuf: ", srcbuf);
});

const ws = new WebSocket("ws://localhost:8080/receive");
ws.onopen = (e) => {
    console.log("websocket opened");
}
ws.onmessage = (e) => {
    console.log("received data from server");
    if(srcbuf === null) return;
    console.log("received data from server");
    e.data.arrayBuffer().
    then((buff) => {
        if (!srcbuf.updating) {
            srcbuf.appendBuffer(buff);
        }
    })
}
