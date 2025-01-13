import pencil from "./assets/pencil.png";
import eraser from "./assets/erase.png";
import { canvasStateStore } from "./stores.js";

export default function Tools() {
    const style = {
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: "0px",
        top: "50%",
        transform: "translate(0, -50%)",
        border: "1px solid black", // Added black border
        borderRadius: "10px",
        padding: "2px",
        margin: "2px",
        boxShadow: "0 0 5px rgba(0, 0, 0, 0.5)",
    };
    return <div style={style}>
        <Eraser />
        <Pencil />
        <LineWidths />
        <Colors />
    </div>
}

function LineWidths() {
    const style = {
        display: "flex",
        flexDirection: "column",
        border: "1px",
    }

    const style2 = {
        width: "30px",
        margin: "2px",
        backgroundColor: "black",
        borderRadius: "2px",
    }
    return <div style={style}>
        <div style={{ height: "3px", ...style2 }}></div>
        <div style={{ height: "6px", ...style2 }}></div>
        <div style={{ height: "8px", ...style2 }}></div>
        {/* <div style={{height: "12px", ...style2}}></div> */}
        <div></div>
    </div>
}

function Eraser() {
    const style = {
        width: "30px",
        height: "30px",
        margin: "2px",
    }
    return <div onClick={() => {canvasStateStore.getState().toggleEraser()}}>
        <img src={eraser} alt="Eraser" style={style}></img>
    </div>
}

function Pencil() {
    const style = {
        width: "30px",
        height: "30px",
        margin: "2px",
    }
    return <div onClick={() => canvasStateStore.getState().togglePencil()}>
        <img src={pencil} alt="Pencil" style={style}></img>
    </div>
}

function Colors() {
    const style = {
        display: "flex",
        flexDirection: "column",
        margin: "2px"
    }
    return <div style={style}>
        <C1 color1="black" color2="red"/>
        <C1 color1="blue" color2="green"/>
        <C1 color1="yellow" color2="deeppink"/>
    </div>
}

function C1 ({ color1, color2 }) {
    const style = {
        height: "13px",
        width: "13px",
        borderRadius: "50%",
        border: "1px solid black",
        margin: "1px",
    }

    const fn = (col) => {
        console.log("going to change Color to: " + col);
        canvasStateStore.getState().setPencilColor(col);
    }

    return <div style={{display: "flex", justifyContent: "center"}}>
        <div style={{backgroundColor: color1, ...style}} onClick={()=> fn(color1)}></div>
        <div style={{backgroundColor: color2, ...style}} onClick={()=> fn(color2)}></div>
    </div>
}