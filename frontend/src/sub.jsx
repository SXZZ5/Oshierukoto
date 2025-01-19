import { useSubsStateStore } from "./stores";
import "../styles/claude_loader.css"
import { useEffect } from "react";



export default function Sub() {
    const streamIdFinalised = useSubsStateStore((state) => state.streamIdFinalised);
    if (streamIdFinalised) {
        return <div>
            <Watchers />
        </div>
    } else {
        return <div>
            <WatcherInitialisations />
        </div>
    }
}

function WatcherInitialisations() {
    const streamId = useSubsStateStore((state) => state.streamId);
    const changeStreamId = useSubsStateStore((state) => state.changeStreamId);
    const setStreamIdFinalised = useSubsStateStore((state) => state.setStreamIdFinalised);

    const fn = () => {
        let txt = document.getElementById("streamTxtWatcher").value;
        changeStreamId(txt);
    }

    const gn = () => {
        if (validateStreamId(streamId)) {
            console.log("validating streamId: streamId is " + streamId)
            setStreamIdFinalised();
        } else {
            alert("Invalid Stream ID: No such stream exists.")
        }
    }

    return <>
        <input id="streamTxtWatcher" type="text" placeholder="Enter a stream ID" onChange={fn}></input>
        <button onClick={gn}>Start Watching</button>
    </>
}

const PopoverContainerStyle= {
    position: 'fixed',
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent background
    zIndex: 1000,
    border: "none",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
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
    widht: "auto",
    border: "1px solid black",
    boxShadow: "0 0 5px rgba(0, 0, 0, 0.5)",
    borderRadius: "15px",
}

const MOREFUCKINGcss = `
    #loading::backdrop {
        backdrop-filter: blur(4px);
    }
`

function Watchers() {
    useEffect(() => {
        launch_worker();
        return kill_worker;
    })
    return <div>
        <style>{MOREFUCKINGcss}</style>
        <div id="loading" popover="manual" style={PopoverContainerStyle}>
            <div className="loader">
                <div className="justify-content-center jimu-primary-loading"></div>
            </div>
        </div>
        <video id="cnv" autoPlay preload="auto"></video>
        <video id="vid" autoPlay style={FaceCamVidStyle} playsInline preload="auto"></video>
        {/* <button id="btn" onClick={() => {console.log("btn clicked"); launch_worker()}}>Watch.</button> */}
    </div>
}

function sk_showPopover() {
    const playing = useSubsStateStore.getState().playing;
    let ppv = document.getElementById("loading");
    if(ppv == null) return;
    if (playing && ppv.matches(":popover-open")) {
        ppv.hidePopover();
    } else if (!playing && !ppv.matches(":popover-open")) {
        ppv.showPopover();
    }
}
var myworker = null;
function kill_worker() {
    myworker.terminate();  
    myworker = null;
}
function launch_worker() {
    console.log("launch_worker called");
    const { streamId, setPlaying } = useSubsStateStore.getState();
    let vid = document.getElementById("vid");
    vid.onpause = () => {
        console.log("VPAUSE");
        // console.log("VIDEO IS PAUSED");
        vid.play();
        setPlaying(false);
        sk_showPopover
    }
    vid.onended = () => {
        console.log("VENDED");
        vid.play();
        setPlaying(false);
        sk_showPopover();
    }
    vid.onwaiting = () => {
        // console.log("WAITING FOR DATA TO ARRIVE");
        console.log("VWAITING");
        setPlaying(false);
        sk_showPopover();
    }
    vid.onplay = () => {
        console.log("VPLAY");
        setPlaying(true);
        sk_showPopover();
    }
    vid.onplaying = () => {
        console.log("VPLAYING");
        setPlaying(true);
        sk_showPopover();
    }
    vid.onloadstart = () => {
        console.log("VLOADSTART");
        setPlaying(false);
        sk_showPopover();
    }
    let cnv = document.getElementById("cnv");
    cnv.onpause = () => {
        cnv.play();
    }
    cnv.onended = () => {
        cnv.play();
    }
    myworker = new Worker(new URL("./mse.js", import.meta.url), { type: "module" });
    myworker.postMessage({ signal: "init", data: streamId });

    myworker.onmessage = (e) => {
        if (e.data.signal === "download") {
            return;
        }
        else if (e.data.signal === "handle") {
            const handle = e.data.handle;
            console.log("handle: ", handle);
            let vid = document.getElementById("vid");
            vid.srcObject = handle;
        } else if (e.data.signal === "canvas_handle") {
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

