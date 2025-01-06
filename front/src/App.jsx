// import { useRef } from "react";
import { useEffect } from "react";
var connworker = null;

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
    // const stream = useRef(null)
    useEffect(() => {
        initialise();
    }, [])
    return <div>
        <div style={{ height: "100vh", width: "100vw" }}>
            <canvas id="cnv" style={{ height: "100vh", width: "100vw" }}></canvas>
        </div>
        <video id="vid" autoPlay muted></video>
        <button id="btn">Go Live</button>
    </div>
}

function initialise() {
    drawer();
    navigator.mediaDevices.getUserMedia({ video: videoconf, audio: audioconf })
        .then((got_stream) => {
            let vid = document.getElementById("vid");
            vid.srcObject = got_stream.clone();
            let btn = document.getElementById("btn");
            btn.onclick = () => {
                start_recording(got_stream);
            }
        })
        .catch((err) => {
            console.log("could not get stream", err);
        })
}


function getStreamId() {
    return "SkStream"
}

var canvas_ready = false;
var connection_ready = false;
var recording = false;
var recorder = null;

async function start_recording(stream) {
    const streamId = getStreamId();
    console.log("inside start_recording");
    connworker = new Worker(new URL("bg.js", import.meta.url))
    connworker.postMessage({ signal: "init", data: streamId });
    connworker.onmessage = (e) => {
        if (e.data.signal === "connections open") {
            connection_ready = true;
            console.log("connready: " + connection_ready + ", canvasReady: " + canvas_ready)
            console.log("recording: " + recording);
            if (connection_ready && canvas_ready && !recording) {
                console.log("beginning to record inside start_recording( ) call");
                console.log("recording start time: " + performance.now());
                worker.postMessage({ signal: "start_recording" });
                recording = true;
                recorder.start(3000);
            }
        }
    }

    recorder = new MediaRecorder(stream, {
        //VideoAndAudioVersions
        mimeType: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        // mimeType: 'video/mp4; codecs="avc1.58A01E, mp4a.40.2"',

        // VideoOnlyVersions
        // mimeType: 'video/mp4; codecs="avc1.58A01E"',
        // mimeType: 'video/mp4; codecs="avc1.58A00A"',  // extended profile supposedly
        // mimeType: 'video/mp4; codecs="avc1.42C00A"', //level 1 + constrained baseline profile
        // mimeType: 'video/mp4; codecs="avc1.42E01E"',
        videoBitsPerSecond: 500_000,
        keyFrameInterval: 100,
    });

    recorder.addEventListener("dataavailable", (e) => {
        console.log("recorder dataavailable time: " + performance.now());
        let c = collection[active - 1];
        if (active == 1) active = 2;
        else active = 1;
        const blob = new Blob(c, { type: "video/mp4" });
        connworker.postMessage({ signal: "canvas_data", data: blob });
        connworker.postMessage({ signal: "data", data: e.data });
        console.log("canvas size: " + blob.size + ", facecam size: " + e.data.size);
        c = null;
        if (active == 1) collection[1] = [];
        else collection[0] = [];
    })
    console.log("recorder created");
    console.log(recorder);
    recorder.addEventListener("stop", (e) => {
        recorder.start(3000);
    })
    // recorder.start(3000);           //moved this to the callback when bg.js tells that connections are ready.
}

var collection = new Array(2);
collection[0] = [], collection[1] = []
var active = 1;
var worker = null;

async function drawer() {
    worker = new Worker(new URL("draw.js", import.meta.url));
    var cnv = document.getElementById("cnv");
    cnv.width = cnv.offsetWidth;
    cnv.height = cnv.offsetHeight;
    const offscreen_canvas = cnv.transferControlToOffscreen();
    worker.postMessage({ signal: "init", data: offscreen_canvas }, [offscreen_canvas]);
    worker.onmessage = (e) => {
         if(e.data.signal === "canvas_ready") {   
            canvas_ready = true;
            console.log("connready: " + connection_ready + ", canvasReady: " + canvas_ready)
            console.log("recording: " + recording);
            if(connection_ready && canvas_ready && !recording) {
                console.log("beginning to record inside drawer( ) call");
                console.log("recording start time: " + performance.now()); 
                worker.postMessage({ signal: "start_recording" });
                recording = true;
                recorder.start(3000);
            }
        }

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
        // console.log("encframe_tstmp: " + enc.timestamp);
        // console.log("encframe_duration: " + enc.duration);
        const abf = new ArrayBuffer(enc.byteLength);
        enc.copyTo(abf);
        collection[active - 1].push(abf);
    }
    function encErr(err) {
        console.log("encoder error: ", err);
    }
    const encoder = new VideoEncoder({
        output: encOut,
        error: encErr,
    });
    const config = {
        // codec: "av01.0.05M.10.0.110.09.16.09.0",
        // codec: "av01.0.05M.08.0.100.09.16.09.0",
        codec: 'av01.0.05M.08',
        height: cnv.height,
        width: cnv.width,
        frameRate: 20,
        bitrate: 500_000,
    };
    encoder.configure(config);

    worker.onmessage = (e) => {
       if (e.data.signal === "imgData") {
            const vframe = e.data.data;
            // console.log("vframe_tstmp: " + vframe.timestamp);
            // console.log("vframe_duration: " + vframe.duration);
            encoder.encode(vframe, { keyFrame: true });
            vframe.close();
        } 
    }
    
    }
}
