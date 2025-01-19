import { useNavigate } from 'react-router'
import { usePubStateStore } from './stores';
import { useSubsStateStore } from './stores';
import './hero.css'

const css = `
    .dne{
        position: fixed;
        border: 1px solid black;
        padding: 10px;
        border-radius: 5px;
        background-color: rgba(254, 0, 0, 0.5);
        color: white;
        font-weight: 700;
        letter-spacing: 1px;
        width: fit-content;
        height: fit-content;
        margin: 0;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    
    .dne::backdrop {
        backdrop-filter: blur(10px);
    }
`


export default function Hero() {
    const navigate = useNavigate();
    const pub_state = usePubStateStore();
    const sub_state = useSubsStateStore();

    const fn = () => {
        const str = document.getElementById("streamIDPub").value;
        pub_state.changeStreamId(str);
        if(str.length === 0){
            document.getElementById("id_taken").showPopover();
            return;
        }
        console.log(pub_state.streamId);
        console.log(str);
        console.log(pub_state.streamId);
        // fetch("oshierukoto-backend.sxzzfive.site/api/checkpub/" + pub_state.streamId, reqinit)
        fetch("http://localhost:8080/api/checkpub/" + str)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if(data.available === "yes"){
                pub_state.setStreamIdFinalised();
                navigate("/stream");
            } else {
                document.getElementById("id_taken").showPopover();
            }
        })
    }

    const gn = () => {
        const str = document.getElementById("streamIDSub").value;
        sub_state.changeStreamId(str);
        if(str.length === 0){
            document.getElementById("doesnt_exist").showPopover();
            return;
        }
        // fetch("https://www.oshierukoto-backend.sxzzfive.site/api/pubexists/" + str)
        fetch("http://localhost:8080/api/pubexists/" + str)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if(data.exists === "yes"){
                sub_state.setStreamIdFinalised();
                navigate("/watch");
            } else {
                document.getElementById("doesnt_exist").showPopover();
            }
        })
    }

    return <>
        <style>{css}</style>
        <div popover="auto" id="id_taken" className="dne">
            This, stream ID is not available.
        </div>
        <div popover="auto" id="doesnt_exist" className="dne">
            This, stream does not exist.
        </div>
        <section className="hero">
            <div className="gradient-bg"></div>
            <div className="particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="particle"></div>
                ))}
            </div>
            <div className="hero-content">
                <h1 className="hero-title animate-in">
                    All-in-one solution for teaching online
                </h1>
                <p className="hero-subtitle animate-in">
                    No more setting up streaming softwares and whiteboards
                </p>
                <div className="stream-input-container animate-in">
                    <input
                        type="text"
                        placeholder="Put a Stream ID to stream"
                        className="stream-input"
                        id="streamIDPub"
                    />
                    <button className="join-button" onClick={fn}>Start Stream</button>
                </div>
                <div className="stream-input-container animate-in">
                    <input
                        type="text"
                        placeholder="Enter Stream ID to watch"
                        className="stream-input"
                        id="streamIDSub"
                    />
                    <button className="join-button" onClick={gn}>Join Stream</button>
                </div>
            </div>
        </section>
    </>
}