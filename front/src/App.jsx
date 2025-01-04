import { useEffect, useState, useRef } from "react";
let connworker = null;

const audioconf = {
    channelCount: 1,
    sampleRate: 48000,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    voiceIsolation: true,
}

const videoconf = {
    width: 400,
    height: 280,
    frameRate: 20,
}

export default function App() {
    const stream = useRef(null)
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: videoconf, audio: audioconf })
            .then((got_stream) => {
                stream.current = got_stream.clone();
                let vid = document.getElementById("vid");
                vid.srcObject = stream.current;
                start_recording(got_stream);
                drawer();
            })
            .catch((err) => {
                console.log("could not get stream", err);
            })
        // setInterval(() => {
        //     console.log("stream", stream.current);
        // }, 2000)
    }, [])
    return <div>
        <div style={{ height: "100vh", width: "100vw" }}>
            <canvas id="cnv" style={{ height: "100vh", width: "100vw" }}></canvas>
        </div>
        <video id='vid' autoPlay muted></video>
    </div>
}



async function start_recording(stream) {
    console.log("inside start_recording");
    connworker = await new Worker(new URL("bg.js", import.meta.url))
    connworker.postMessage({ signal: "init" });
    let recorder = new MediaRecorder(stream, {
        //VideoAndAudioVersions
        mimeType: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        // mimeType: 'video/mp4; codecs="avc1.58A01E, mp4a.40.2"',

        // VideoOnlyVersions
        // mimeType: 'video/mp4; codecs="avc1.58A01E"',
        // mimeType: 'video/mp4; codecs="avc1.58A00A"',  // extended profile supposedly
        // mimeType: 'video/mp4; codecs="avc1.42C00A"', //level 1 + constrained baseline profile
        // mimeType: 'video/mp4; codecs="avc1.42E01E"',
        videoBitsPerSecond: 1000_000,
        keyFrameInterval: 100,
    });

    recorder.addEventListener("dataavailable", (e) => {
        let c = collection[active - 1];
        if (active == 1) active = 2;
        else active = 1;
        console.log("some data got");
        connworker.postMessage({ signal: "data", data: e.data });
    })
    console.log("recorder created");
    console.log(recorder);
    recorder.addEventListener("stop", (e) => {
        recorder.start(2000);
    })
    recorder.start(2000);
}

var collection = new Array(2);
collection[0] = [], collection[1] = []
var active = 1;


async function drawer() {
    const worker = new Worker(new URL("draw.js", import.meta.url));
    var cnv = document.getElementById("cnv");
    cnv.width = cnv.offsetWidth;
    cnv.height = cnv.offsetHeight;
    const offscreen_canvas = cnv.transferControlToOffscreen();
    worker.postMessage({ signal: "init", data: offscreen_canvas }, [offscreen_canvas]);

    cnv.onpointerdown = (e) => {
        let coord = { x: e.offsetX, y: e.offsetY };
        worker.postMessage({ signal: "ptrdown", data: coord });
    }
    cnv.onpointerup = (e) => {
        let coord = { x: e.offsetX, y: e.offsetY };
        worker.postMessage({ signal: "ptrup", data: coord });
    }
    cnv.onpointerleave = (e) => {
        let coord = { x: e.offsetX, y: e.offsetY };
        worker.postMessage({ signal: "ptrlv", data: coord });
    }
    cnv.onpointerrawupdate = (e) => {
        let coord = { x: e.offsetX, y: e.offsetY };
        worker.postMessage({ signal: "ptrmove", data: coord });
    }

    function encOut(enc) {
        const abf = new ArrayBuffer(enc.byteLength);
        enc.copyTo(abf);
        connworker.postMessage({ signal: "canvas_data", data: abf});
    }
    function encErr(err) {
        console.log("encoder error: ", err);    
    }
    const encoder = new VideoEncoder({ 
        output: encOut,
        error: encErr,
    });
    const config = {
        // codec: "avc1.640028",
        // codec: "av01.0.05M.10.0.110.09.16.09.0",
        codec: "av01.0.05M.08.0.100.09.16.09.0",
        // codec: "avc1.42E01E",
        width: cnv.width,
        height: cnv.height,
        bitrate: 1000_000,
        framerate: 20,
    };
    encoder.configure(config);

    const invisibleCanvas = document.createElement("canvas");
    invisibleCanvas.width = cnv.width;
    invisibleCanvas.height = cnv.height;
    const invisibleCtx = invisibleCanvas.getContext("2d");
    const cptstream = invisibleCanvas.captureStream(20);
    const track = cptstream.getVideoTracks()[0];
    const proc = new MediaStreamTrackProcessor({
        track: track,
    });

    worker.onmessage = (e) => {
        if (e.data.signal === "imgData") {
            invisibleCtx.putImageData(e.data.data, 0, 0);
            // track.requestFrame();
        }
    }

    const reader = proc.readable.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            await encoder.flush();
            encoder.close();
            break;
        }
        encoder.encode(value);
        value.close();
    }
}
