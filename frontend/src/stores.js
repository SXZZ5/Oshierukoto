import { create } from 'zustand'

//store for managing publisher state.
const usePubStateStore = create((set) => {
    return {
        streamIdFinalised: false,
        streamId: null,
        changeStreamId: (streamId) => { set(() => {
            console.log("change pubstreamID called with: " + streamId);
            return {
            streamId: streamId,
        }})},
        setStreamIdFinalised: () => { set(() => {
            return {
                streamIdFinalised: true,
            }
        })}
    }
})

//store for managin subscriber state
const useSubsStateStore = create((set) => {
    return {
        streamIdFinalised: false,
        streamId: null,
        changeStreamId: (streamId) => { set(() => {
            return {
            streamId: streamId,
        }})},
        setStreamIdFinalised: () => { set(() => {
            return {
                streamIdFinalised: true,
            }
        })},


        playing: false,
        setPlaying: (boolval) => { set(() => ({playing: boolval}))}
    }
})

// store for managing canvas State
const useCanvasStateStore = create((set) => {
    return {
        background: "white",
        strokeStyle: "black",
        pencilActive: true,
        pencilColor: "black",
        eraserActive: false,
        lineWidth: 4,

        ActivatePencil: () => {set((state) => {
            if(state.pencilActive){
                return {
                }
            }
            return {
                pencilActive: true,
                eraserActive: false,
                strokeStyle: state.pencilColor,
                lineWidth: state.lineWidth / 3
            }
        })},

        setPencilColor: (col) => {set((state) => {
            console.log("setPencilColor action in store called");
            return {
                pencilColor: col,
                strokeStyle: (state.pencilActive) ? col : state.strokeStyle
            }
        })},

        ActivateEraser: () => {set((state) => {
            if(state.eraserActive){
                return {
                }
            }
            return {
                strokeStyle: state.background,
                eraserActive: true,
                pencilActive: false,
                lineWidth: 3*state.lineWidth
            }
        })},
        setLineWidth: (lw) => {set((state) => {
            return {
                lineWidth: (state.eraserActive) ? lw*3 : lw 
            }
        })},

        //trivial actions

    }
})

export {usePubStateStore};
export {useSubsStateStore};
export {useCanvasStateStore};