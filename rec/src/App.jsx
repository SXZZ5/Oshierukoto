// import { useEffect } from "react";

export default function App() {
    return <>
        <video id="cnv" autoPlay controls></video>
        <video id="vid" autoPlay controls></video>
        <button id="btn" onClick={launch_worker}>Watch.</button>
    </>
}

function getStreamId() {
    return "SkStream"
}

function launch_worker() {
    const streamId = getStreamId();
    let vid = document.getElementById("vid");
    vid.onpause = () => {
        vid.play();
    }
    vid.onended = () => {
        vid.play();
    }
    let cnv = document.getElementById("cnv");
    cnv.onpause = () => {
        cnv.play();
    }
    cnv.onended = () => {
        cnv.play();
    }
    let myworker = new Worker(new URL("./mse.js", import.meta.url), { type: "module" });
    myworker.postMessage({ signal: "init", data: streamId });
    
    myworker.onmessage = (e) => {
        if(e.data.signal === "download") {
            return;
        }
        else if(e.data.signal === "handle") {
            const handle = e.data.handle;
            console.log("handle: ", handle);
            let vid = document.getElementById("vid");
            vid.srcObject = handle;
        } else if(e.data.signal === "canvas_handle") {
            let vid2 = document.getElementById("cnv");
            vid2.srcObject = e.data.handle;
        }
    }
}












// function download_video(buff) {
//     const blob = new Blob([buff], { type: 'video/mp4' });

//     // Create a URL for the Blob
//     const url = URL.createObjectURL(blob);

//     // Create a temporary anchor element to trigger a download
//     const anchor = document.createElement('a');
//     anchor.href = url;
//     anchor.download = 'received_video.mp4'; // Specify the file name
//     document.body.appendChild(anchor);

//     // Trigger the download
//     anchor.click();

//     // Clean up
//     document.body.removeChild(anchor);
//     URL.revokeObjectURL(url);
// }

