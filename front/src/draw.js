self.onmessage = (e) => {
    if (e.data.signal === "init") {
        let mydata = e.data.data;
        console.log("draw: received data and init signal");
        init(mydata);
    }
}

function init(cnv) {
    const ctx = cnv.getContext("2d");
    console.log(ctx);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.fillStyle = "white";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.fillRect(0, 0, cnv.width, cnv.height);

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
        q.push(cord(x, y));
    }

    const ptrmove = ({ x, y }) => {
        if (!drawing) return;
        ctx.lineTo(x, y);
        ctx.stroke();
        q.push(cord(x, y));
        // drawPoints();
    }

    const ptrup = ({ x, y }) => {
        drawing = false;
        // console.log(q);
        q = [];
    }

    const ptrlv = ({ x, y }) => {
        drawing = false;
        // console.log(q);
        q = [];
    }
}


