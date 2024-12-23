
export default function App() {
    return <div>
        <div>Video Element below this.</div>
        <video id="vid" autoPlay controls></video>
    </div>
}


function launch_worker(){
    let myworker = new Worker(new URL("./mse.js", import.meta.url));
    myworker.onmessage = (e) => {
        console.log("worker message received: ", e.data);
        const handle = e.data.handle;
        console.log("handle: ", handle);
        let vid = document.getElementById("vid");
        vid.srcObject = handle;
    }
}

export {launch_worker};
