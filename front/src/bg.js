let conn = null;
let counter = 0;
onmessage = (e) => {
    console.log("bg: got message");
    console.log(e.data);
    if(e.data.signal == "init") {
        console.log("bg: doing init")
        startConnection();
    } else if(e.data.signal == "data") {
        let blob = e.data.data;
        sendData(blob);
    }
}

function startConnection() {
    let ws = new WebSocket("ws://localhost:8080");
    conn = ws;
    ws.onopen = () => {
        console.log("bg: connected to ws")
    }
}

function sendData(blob) {
    if(conn === null) {
        return;
    }
    if(conn.readyState !== WebSocket.OPEN) {
        return;
    }
    ++counter;
    console.log("bg: sending data: ", counter);
    conn.send(blob);
}

