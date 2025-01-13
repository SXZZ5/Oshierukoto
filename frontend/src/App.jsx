import { NavLink } from 'react-router-dom'

function App() {
    return <>
        <button>
            <NavLink style={{ textDecoration: 'none' }} to={"/stream"}>Stream</NavLink>
        </button>
        <button>
            <NavLink style={{ textDecoration: 'none' }} to={"/watch"}>Watch</NavLink>
        </button>
    </>
}

export default App
