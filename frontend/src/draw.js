var cnv = null;
var setIntervalId = null;
self.onmessage = (e) => {
    if (e.data.signal === "init") {
        let mydata = e.data.data;
        console.log("draw: received data and init signal");
        cnv = mydata
        init();
    }
}

function init() {
    const ctx = cnv.getContext("2d");
    ctx.willReadFrequently = true;
    console.log(ctx);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.fillStyle = "white";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.fillRect(0, 0, cnv.width, cnv.height);
    console.log("inside init(), strokestyle: " + ctx.strokeStyle);

    console.log(cnv.height + " " + cnv.width);
    self.onmessage = (msg) => {
        if (msg.data.signal === "ptrdown") {
            ptrdown(msg.data.data);
        } else if (msg.data.signal === "ptrmove") {
            ptrmove(msg.data.data);
        } else if (msg.data.signal === "ptrup") {
            ptrup(msg.data.data);
        } else if (msg.data.signal === "ptrlv") {
            ptrlv(msg.data.data);
        } else if (msg.data.signal === "start_recording") {
            console.log("draw: start recording");
            setIntervalId = setInterval(() => {
                const vframe = new VideoFrame(cnv, { timestamp: performance.now() });
                self.postMessage({ signal: "imgData", data: vframe }, [vframe]);
            }, 1000 / 20);
        } else if (msg.data.signal === "stop_recording") {
            console.log("draw: stop recording");
            clearInterval(setIntervalId);
        } else if (msg.data.signal === "modify_strokestyle") {
            console.log("draw: set_pencil_color");
            ctx.strokeStyle = msg.data.data;
        } else if (msg.data.signal === "modify_linewidth") {
            console.log("draw: set_linewidth");
            ctx.lineWidth = msg.data.data;
        }
    }

    let lastx = 0;
    let lasty = 0;
    let cnt = 0;
    var drawing = false;

    const cord = (x, y) => {
        return {
            x: x,
            y: y,
        }
    }

    const ptrdown = ({ x, y }) => {
        drawing = true
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    const ptrmove = ({ x, y }) => {
        if (!drawing) return;
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    const ptrup = ({ x, y }) => {
        drawing = false;
    }

    const ptrlv = ({ x, y }) => {
        drawing = false;
    }

    self.postMessage({ signal: "canvas_ready" });
}
