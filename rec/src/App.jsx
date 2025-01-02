import { useEffect } from "react";

export default function App() {
    useEffect(() => {
        launch_worker();
    })
    return <div>
        <div style={{ height: "100vh", width: "100vw" }}>
            <canvas id="cnv" style={{ height: "100vh", width: "100vw" }}></canvas>
        </div>
        <video id="vid" autoPlay controls></video>
    </div>
}


function launch_worker() {
    let myworker = new Worker(new URL("./mse.js", import.meta.url));
    var cnv = document.getElementById("cnv");
    cnv.width = cnv.offsetWidth;
    cnv.height = cnv.offsetHeight;
    console.log(cnv);
    const ofsc = cnv.transferControlToOffscreen();
    console.log(ofsc)
    myworker.postMessage({signal: "cnv_init", data: ofsc}, [ofsc])
    myworker.onmessage = (e) => {
        if(e.data.signal === "download") {

        }
        else if(e.data.signal === "handle") {
            const handle = e.data.handle;
            console.log("handle: ", handle);
            let vid = document.getElementById("vid");
            vid.srcObject = handle;
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
