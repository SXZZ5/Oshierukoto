import { useEffect, useState, useRef } from "react";

export default function App() {
    const stream = useRef(null)
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
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
        <video id='vid' autoPlay></video>
    </div>
}



function start_recording(stream) {
    console.log("inside start_recording");
    let myworker = new Worker(new URL("bg.js", import.meta.url))
    myworker.postMessage({ signal: "init" });
    let recorder = new MediaRecorder(stream, {
        mimeType: 'video/mp4; codecs="avc1.42E01E"'
    });

    recorder.addEventListener("dataavailable", (e) => {
        console.log("some data got");
        myworker.postMessage({ signal: "data", data: e.data });
    })
    console.log("recorder created");
    console.log(recorder);
    // schedule(recorder);
    recorder.addEventListener("stop", (e) => {
        recorder.start(3000);
    })
    recorder.start(3000);
    // setTimeout(() => {
    //     recorder.stop();
    // }, 35000);
}

// function schedule(recorder) {
//     recorder.start(5000);
//     setInterval(() => {
//         if (recorder.state === "recording") {
//             recorder.stop();
//             recorder.start(5000);
//         }
//     }, 3000)
// }
