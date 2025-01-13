import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const str = "video/mp4";
console.log(MediaSource.isTypeSupported(str));

createRoot(document.getElementById('root')).render(
        <App />
)
