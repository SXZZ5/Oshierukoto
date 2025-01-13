export default function Card() {
    const css = `
        #dg {
            box-shadow: 0 4px #c1a23c;
            color: #5e4800;
            background-color: #ffd95e;
            text-transform: uppercase;
            padding: 10px 20px;
            border-radius: 5px;
            transition: all .2s ease;
            font-weight: 900;
            cursor: pointer;
            letter-spacing: 1px;
            width: fit-content;
            height: fit-content;
            margin: 0;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        #dg:active {
            box-shadow: 0 1px #c1a23c;
            transform: translate(calc(-50% + 3px), calc(-50%));
        }
    
        #dg::backdrop {
            backdrop-filter: blur(2px);
        }
    `;
    return (
        <div>
            <style>{css}</style>
            <dialog id="dg">
                {/* <button className="push-button-3d"> Ready to Go ?</button> */}
                Ready to Go ?
            </dialog>
        </div>
    );
}