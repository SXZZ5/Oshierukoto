// import {motion} from 'motion/react'
import { useEffect } from "react";
import { usePubStateStore } from "./stores";
import { useCanvasStateStore } from "./stores";
import pencil from "./assets/pencil.png";
import eraser from "./assets/erase.png";
import webcamDisconnected from "./assets/webcam-disconnected.png";
import Card from "./card";



const audioconf = {
    channelCount: 1,
    sampleRate: 48000,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    voiceIsolation: true,
}

const videoconf = {
    height: 150,
    width: 150*1.6,
    framerate: 20,
}

export default function Pub() {
    const streamIdFinalised = usePubStateStore((state) => state.streamIdFinalised);
    if (streamIdFinalised) {
        return <StreamComponent />
    } else {
        return <StreamInitialisations />
    }
}

function StreamInitialisations() {
    const streamId = usePubStateStore((state) => state.streamId);
    const changeStreamId = usePubStateStore((state) => state.changeStreamId);
    const setStreamIdFinalised = usePubStateStore((state) => state.setStreamIdFinalised);
    const fn = () => {
        let txt = document.getElementById("streamTxt").value;
        changeStreamId(txt);
        console.log(txt);
        console.log(streamId);
    }
    const gn = () => {
        setStreamIdFinalised();
    }
    return <>
        <input id="streamTxt" type="text" placeholder="Enter a stream ID" onChange={fn}></input>
        <button onClick={gn}>Finalise</button>
    </>
}

const FaceCamVidStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    padding: 0,
    margin: 0,
    // height: "200px",
    // width: "332px",
    height: "150px",
    width: "auto",
    border: "1px solid black",
    boxShadow: "0 0 5px rgba(0, 0, 0, 0.5)",
    borderRadius: "15px",
}

function StreamComponent() {
    // const stream = useRef(null)
    useEffect(() => {
        document.getElementById("dg").showModal();
        initialise();
        return cleanupWork;
    }, [])
    return <div>
        <canvas id="cnv" style={{ height: "100vh", width: "100vw" }}></canvas>
        <video id="vid" autoPlay muted style={FaceCamVidStyle} poster={webcamDisconnected}></video>
        <Tools />
        <Card />
    </div>
}

function cleanupWork() {
    stream.getTracks().forEach(track => track.stop());
    recorder.stop();
    connworker.terminate();
    worker.terminate();
    connworker = null;
    worker = null;
    recorder = null;
    stream = null;
    return;
}

function initialise() {
    drawer();
    navigator.mediaDevices.getUserMedia({ video: videoconf, audio: audioconf })
        .then((got_stream) => {
            let vid = document.getElementById("vid");
            stream = got_stream;
            vid.srcObject = got_stream;
            let dg = document.getElementById("dg");
            dg.onclick = () => {
                start_recording();
                dg.close();
            }
        })
        .catch((err) => {
            console.log("could not get stream", err);
        })
}


function getStreamId() {
    const { streamId } = usePubStateStore.getState();
    return streamId;
}

var canvas_ready = false;
var connection_ready = false;
var recording = false;
var recorder = null;
var stream = null;
var connworker = null;

async function start_recording() {
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
                recorder.start(3500);
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
    recorder.addEventListener("stop", () => {
        recorder.start(3500);
    })
    // recorder.start(3000);           //moved this to the callbacks when bg.js tells that connections are ready.
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
    let offscreen_canvas = cnv.transferControlToOffscreen();
    worker.postMessage({ signal: "init", data: offscreen_canvas }, [offscreen_canvas]);
    worker.onmessage = (e) => {
        if (e.data.signal === "canvas_ready") {
            canvas_ready = true;
            console.log("connready: " + connection_ready + ", canvasReady: " + canvas_ready)
            console.log("recording: " + recording);
            if (connection_ready && canvas_ready && !recording) {
                console.log("beginning to record inside drawer( ) call");
                console.log("recording start time: " + performance.now());
                worker.postMessage({ signal: "start_recording" });
                recording = true;
                recorder.start(3500);
            }
        } else if (e.data.signal === "imgData") {
            const vframe = e.data.data;
            // console.log("vframe_tstmp: " + vframe.timestamp);
            // console.log("vframe_duration: " + vframe.duration);
            encoder.encode(vframe, { keyFrame: true });
            vframe.close();
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
}

function Tools() {
    const strokeStyle = useCanvasStateStore((state) => state.strokeStyle);
    const lineWidth = useCanvasStateStore((state) => state.lineWidth);

    useEffect(() => {
        console.log("UseEffect: strokeStyle changed to: " + strokeStyle);
        if(worker == null) return;
        worker.postMessage({ signal: "modify_strokestyle", data: strokeStyle });
        worker.postMessage({signal: "modify_linewidth", data: lineWidth});
    }, [strokeStyle, lineWidth]);

    const style = {
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: "0px",
        top: "50%",
        transform: "translate(0, -50%)",
        border: "1px solid black", // Added black border
        borderRadius: "10px",
        padding: "2px",
        margin: "2px",
        boxShadow: "0 0 5px rgba(0, 0, 0, 0.5)",
    };
    return <div style={style}>
        <Eraser />
        <Pencil />
        <LineWidths />
        <Colors />
    </div>
}

function LineWidths() {
    const setLineWidth = useCanvasStateStore((state) => state.setLineWidth);
    const style = {
        display: "flex",
        flexDirection: "column",
        border: "1px",
        margin: "2px 2px 10px 2px",
    }

    const style2 = {
        width: "30px",
        margin: "2px",
        backgroundColor: "black",
        borderRadius: "2px",
    }

    const fn = (lw) => {
        setLineWidth(lw);
    }

    return <div style={style}>
        <div style={{ height: "3px", ...style2 }} onClick={() => fn(3)}></div>
        <div style={{ height: "6px", ...style2 }} onClick={() => fn(6)}></div>
        <div style={{ height: "8px", ...style2 }} onClick={() => fn(8)}></div>
        <div></div>
    </div>
}

function Eraser() {
    const ActivateEraser = useCanvasStateStore((state) => state.ActivateEraser)
    const eraserActive = useCanvasStateStore((state) => state.eraserActive)
    const style = {
        width: "30px",
        height: "30px",
        margin: "2px 2px 10px 2px",
        border: (eraserActive) ? "1px solid black" : "none",
        padding: (eraserActive) ? "2px" : "0px",
        boxShadow: (eraserActive) ? "3px 3px 3px rgb(0,0,0)" : "none",
    }
    const fn = () => {
        ActivateEraser();
    }
    return <div onClick={fn}>
        <img src={eraser} alt="Eraser" style={style}></img>
    </div>
}

function Pencil() {
    const pencilActive = useCanvasStateStore((state) => state.pencilActive);
    const pencilColor = useCanvasStateStore((state) => state.pencilColor);
    const ActivatePencil = useCanvasStateStore((state) => state.ActivatePencil);
    const style = {
        width: "30px",
        height: "30px",
        margin: "2px 2px 10px 2px",
        padding: (pencilActive) ? "2px" : "0px",
        border: (pencilActive) ? `1px solid ${pencilColor}` : "none",
        borderRadius: "2px",
        boxShadow: (pencilActive) ? `3px 3px 3px ${pencilColor}` : "none",
    }

    const fn = () => {
        ActivatePencil();
    }

    return <div onClick={fn}>
        <img src={pencil} alt="Pencil" style={style}></img>
    </div>
}

function Colors() {
    const style = {
        display: "flex",
        flexDirection: "column",
        margin: "2px"
    }
    return <div style={style}>
        <C1 color1="black" color2="red"/>
        <C1 color1="blue" color2="green"/>
        <C1 color1="yellow" color2="deeppink"/>
    </div>
}

// eslint-disable-next-line react/prop-types
function C1 ({ color1, color2 }) {
    const setPencilColor = useCanvasStateStore((state) => state.setPencilColor);
    const style = {
        height: "13px",
        width: "13px",
        borderRadius: "50%",
        border: "1px solid black",
        margin : "1px",
    }

    const fn = (col) => {setPencilColor(col);}

    return <div style={{display: "flex", justifyContent: "center", margin: "2px 2px 4px 2px"}}>
        <div style={{ backgroundColor: color1, ...style}} onClick={()=> fn(color1)}></div>
        <div style={{ backgroundColor: color2, ...style}} onClick={()=> fn(color2)}></div>
    </div>
}
