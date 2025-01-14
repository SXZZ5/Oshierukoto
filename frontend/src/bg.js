let conn = null;
let canvas_conn = null;
onmessage = (e) => {
    // console.log("bg: got message");
    // console.log(e.data);
    if(e.data.signal == "init") {
        console.log("bg: doing init")
        console.log(e.data.data);
        startConnection(e.data.data);
    } else if(e.data.signal == "data") {
        let blob = e.data.data;
        sendData(blob);
    } else if(e.data.signal == "canvas_data") {
        let blob = e.data.data;
        console.log(blob);
        sendCanvasData(blob);
    }
}

var declaredOpen = false;
function startConnection(streamId) {
    let ws = new WebSocket("wss://oshierukoto-backend.sxzzfive.site/publisher/" + streamId);
    let ws2 = new WebSocket("wss://oshierukoto-backend.sxzzfive.site/publisher/" + streamId + "/canvas");
    // let ws = new WebSocket("ws://localhost:8080/publisher/" + streamId);
    // let ws2 = new WebSocket("ws://localhost:8080/publisher/" + streamId + "/canvas");
    ws.onopen = () => {
        console.log("bg: connected to ws")
        if(ws2.readyState === WebSocket.OPEN && !declaredOpen) {
            self.postMessage({ signal: "connections open" });
            declaredOpen = true;
        }
    }
    ws2.onopen = () => {
        console.log("bg: connected to canvas ws")
        if(ws.readyState === WebSocket.OPEN && !declaredOpen) {
            self.postMessage({ signal: "connections open" });
            declaredOpen = true;
        }
    }
    conn = ws;
    canvas_conn = ws2;
    
}

function sendData(blob) {
    if(conn === null) {
        return;
    }
    if(conn.readyState !== WebSocket.OPEN) {
        return;
    }
    console.log("bg: sending FaceCamData time: ", performance.now());
    conn.send(blob);
}

function sendCanvasData(blob) {
    if(canvas_conn === null) {
        return;
    }
    if(canvas_conn.readyState !== WebSocket.OPEN) {
        return;
    }
    console.log("bg: sending CanvasData time: ", performance.now());
    canvas_conn.send(blob);
}
