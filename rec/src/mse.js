
//----------------------------------------------------------------

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
                try {
                    srcbuf.appendBuffer(buff);
                } catch(e) {
                    console.log("error appending buffer: ", e);
                }
           }
        })
}
