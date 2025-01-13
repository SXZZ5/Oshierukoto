import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router'
import { Routes } from 'react-router'
import { Route } from 'react-router'
import Pub from './pub.jsx'
import Sub from './sub.jsx'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <Routes>
        <Route path="/" element={<App/>}></Route>
        <Route path="/stream" element={<Pub/>}></Route>
        <Route path="/watch" element={<Sub/>}></Route>
        </Routes>
    </BrowserRouter>
)
