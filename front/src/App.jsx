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
        let cdata = null;
        if (c.length > 0) cdata = c;
        connworker.postMessage({ signal: "canvas_data", data: JSON.stringify(cdata) })
        if (active == 1) collection[1] = [];
        else if (active == 2) collection[0] = [];
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

    let lineWidth = 2,
        lineStyle = "black",
        timeOld = performance.now();

    let drawing = false;
    // cnv.onpointerdown = (e) => {
    //     drawing = true;
    //     let coord = { x: e.offsetX, y: e.offsetY };
    //     worker.postMessage({ signal: "ptrdown", data: coord });
    //     let curTime = Date.now();
    //     let deltaTime = curTime - timeOld;
    //     timeOld = curTime
    //     console.log("POINTER DOWN");
    //     let data = {
    //         type: "beginPath",
    //         coord: coord,
    //         style: lineWidth + lineStyle,
    //         deltaTime: deltaTime
    //     }
    //     collection[active - 1].push(data);
    // }
    // cnv.onpointerup = (e) => {
    //     console.log("ptrUp");
    //     let coord = { x: e.offsetX, y: e.offsetY };
    //     worker.postMessage({ signal: "ptrup", data: coord });
    //     // if(!drawing) return;
    //     // drawing = false;
    //     let curTime = Date.now();
    //     let deltaTime = curTime - timeOld;
    //     timeOld = curTime
    //     let data = {
    //         type: "endPath",
    //         coord: coord,
    //         style: lineWidth + lineStyle,
    //         deltaTime: deltaTime
    //     }
    //     collection[active - 1].push(data);
    // }
    // cnv.onpointerleave = (e) => {
    //     console.log("POINTER LEAVE");
    //     let coord = { x: e.offsetX, y: e.offsetY };
    //     worker.postMessage({ signal: "ptrlv", data: coord });
    //     // if(!drawing) return;
    //     // drawing = false;
    //     let curTime = Date.now();
    //     let deltaTime = curTime - timeOld;
    //     timeOld = curTime
    //     let data = {
    //         type: "endPath",
    //         coord: coord,
    //         style: lineWidth + lineStyle,
    //         deltaTime: deltaTime
    //     }
    //     collection[active - 1].push(data);
    // }
    // cnv.onpointerrawupdate = (e) => {
    //     let coord = { x: e.offsetX, y: e.offsetY };
    //     worker.postMessage({ signal: "ptrmove", data: coord });
    //     // if(!drawing) return;
    //     let curTime = Date.now();
    //     let deltaTime = curTime - timeOld;
    //     timeOld = curTime
    //     let data = {
    //         type: "lineTo",
    //         coord: coord,
    //         style: lineWidth + lineStyle,
    //         deltaTime: deltaTime
    //     }
    //     collection[active - 1].push(data);
    // }

    cnv.onpointerdown = (e) => {
        let coord = { x: e.offsetX, y: e.offsetY };
        worker.postMessage({ signal: "ptrdown", data: coord });
        let curTime = performance.now();
        let deltaTime = curTime - timeOld;
        timeOld = curTime
        console.log("POINTER DOWN");
        let data = {
            type: "ptrDown",
            coord: coord,
            style: lineWidth + lineStyle,
            deltaTime: deltaTime
        };
        collection[active - 1].push(data);
    };
    cnv.onpointerup = (e) => {
        console.log("ptrUp");
        let coord = { x: e.offsetX, y: e.offsetY };
        worker.postMessage({ signal: "ptrup", data: coord });
        let curTime = performance.now();
        let deltaTime = curTime - timeOld;
        timeOld = curTime
        let data = {
            type: "ptrUp",
            coord: coord,
            style: lineWidth + lineStyle,
            deltaTime: deltaTime
        };
        collection[active - 1].push(data);
    };
    cnv.onpointerleave = (e) => {
        console.log("POINTER LEAVE");
        let coord = { x: e.offsetX, y: e.offsetY };
        worker.postMessage({ signal: "ptrlv", data: coord });
        let curTime = performance.now();
        let deltaTime = curTime - timeOld;
        timeOld = curTime;
        let data = {
            type: "ptrLeave",
            coord: coord,
            style: lineWidth + lineStyle,
            deltaTime: deltaTime
        };
        collection[active - 1].push(data);
    };
    cnv.onpointerrawupdate = (e) => {
        let coord = { x: e.offsetX, y: e.offsetY };
        worker.postMessage({ signal: "ptrmove", data: coord });
        let curTime = performance.now();
        let deltaTime = curTime - timeOld;
        timeOld = curTime;
        let data = {
            type: "ptrMove",
            coord: coord,
            style: lineWidth + lineStyle,
            deltaTime: deltaTime
        };
        collection[active - 1].push(data);
    };
}
