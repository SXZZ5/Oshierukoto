import { useEffect, useState, useRef } from "react";

let myworker = null;

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
        drawer();
        navigator.mediaDevices.getUserMedia({ video: videoconf, audio: audioconf })
            .then((got_stream) => {
                stream.current = got_stream.clone();
                let vid = document.getElementById("vid");
                vid.srcObject = stream.current;
                start_recording(got_stream);
            })
            .catch((err) => {
                console.log("could not get stream", err);
            })
        setInterval(() => {
            console.log("stream", stream.current);
        }, 2000)
    }, [])
    return <div>
        <div style={{ height: "100vh", width: "100vw" }}>
            <canvas id="cnv" style={{ height: "100vh", width: "100vw" }}></canvas>
        </div>
        <video id='vid' autoPlay muted></video>
    </div>
}



function start_recording(stream) {
    console.log("inside start_recording");
    myworker = new Worker(new URL("bg.js", import.meta.url))
    myworker.postMessage({ signal: "init" });
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
        console.log("some data got");
        myworker.postMessage({ signal: "data", data: e.data });
    })
    console.log("recorder created");
    console.log(recorder);
    recorder.addEventListener("stop", (e) => {
        recorder.start(3000);
    })
    recorder.start(3000);
}

function drawer() {
    const worker = new Worker(new URL("draw.js", import.meta.url));
    var cnv = document.getElementById("cnv");
    cnv.width = cnv.offsetWidth;
    cnv.height = cnv.offsetHeight;
    
    const canvas_Stream = cnv.captureStream(20);
    console.log(canvas_Stream);
    const canvas_recorder = new MediaRecorder(canvas_Stream, {
        mimeType: 'video/mp4; codecs="avc1.42E01E"',
        videoBitsPerSecond: 500_000,
        keyFrameInterval: 100,
    });

    canvas_recorder.addEventListener("dataavailable", (e) => {
        console.log("some data got");
        myworker.postMessage({ signal: "canvas_data", data: e.data });
    })

    canvas_recorder.addEventListener("stop", (e) => {
        canvas_recorder.start(3000);
    })

    canvas_recorder.start(3000);

    const offscreen_canvas = cnv.transferControlToOffscreen();
    worker.postMessage({ signal: "init", data: offscreen_canvas }, [offscreen_canvas]);

    cnv.onpointerdown = (e) => {
        var coord = { x: e.offsetX, y: e.offsetY };
        worker.postMessage({ signal: "ptrdown", data: coord });
    }
    cnv.onpointermove = (e) => {
        var coord = { x: e.offsetX, y: e.offsetY };
        worker.postMessage({ signal: "ptrmove", data: coord });
    }
    cnv.onpointerup = (e) => {
        var coord = { x: e.offsetX, y: e.offsetY };
        worker.postMessage({ signal: "ptrup", data: coord });
    }
    cnv.onpointerleave = (e) => {
        var coord = { x: e.offsetX, y: e.offsetY };
        worker.postMessage({ signal: "ptrlv", data: coord });
    }
}