import { useEffect } from "react";

export default function App() {
    useEffect(() => {
        launch_worker();
    })
    return <>
        <video id="cnv" autoPlay controls></video>
        <video id="vid" autoPlay controls></video>
    </>
}

function launch_worker() {
    let myworker = new Worker(new URL("./mse.js", import.meta.url));
    
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

function download_video(buff) {
    const blob = new Blob([buff], { type: 'video/mp4' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger a download
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'received_video.mp4'; // Specify the file name
    document.body.appendChild(anchor);

    // Trigger the download
    anchor.click();

    // Clean up
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

export { launch_worker };
