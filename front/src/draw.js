self.onmessage = (e) => {
    if (e.data.signal === "init") {
        data = e.data.data;
        console.log("draw: received data and init signal");
        init(data);
    }
}

function init(cnv) {
    const ctx = cnv.getContext("2d");
    console.log(ctx);
    ctx.imageSmoothingEnabled = true;
    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, cnv.width, cnv.height);
    
    self.onmessage = (msg) => {
        if(msg.data.signal === "ptrdown") {
            ptrdown(msg.data.data);
        } else if(msg.data.signal === "ptrmove") {
            ptrmove(msg.data.data);
        } else if(msg.data.signal === "ptrup") {
            ptrup(msg.data.data);
        } else if(msg.data.signal === "ptrlv") {
            ptrlv(msg.data.data);
        }
    }

    var drawing = false;
    ptrdown = ({x, y}) => {
        ctx.beginPath()
        drawing = true
        ctx.moveTo(x, y)
    }

    ptrmove = ({x, y}) => {
        if(!drawing) return;
        ctx.lineTo(x, y);
        console.log(ctx.strokeStyle);
        ctx.stroke();
        console.log("drawing a tiny line");
    }

    ptrup = ({x, y}) => {
        drawing = false;
    }   

    ptrlv = ({x, y}) => {
        drawing = false;
    }

}

