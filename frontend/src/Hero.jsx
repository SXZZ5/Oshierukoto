import { useNavigate } from 'react-router'
import { usePubStateStore } from './stores';
import { useSubsStateStore } from './stores';
import './hero.css'
export default function Hero() {
    const navigate = useNavigate();
    const pub_state = usePubStateStore();
    const sub_state = useSubsStateStore();

    const fn = () => {
        pub_state.changeStreamId(document.getElementById("streamIDPub").value);
        pub_state.setStreamIdFinalised();
        navigate("/stream");
    }

    const gn = () => {
        sub_state.changeStreamId(document.getElementById("streamIDSub").value);
        sub_state.setStreamIdFinalised();
        navigate("/watch");
    }

    return (
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
    )
}