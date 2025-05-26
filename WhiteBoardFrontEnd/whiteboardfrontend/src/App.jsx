import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WhiteBoardHome from './WhiteBoardHome';
import "./App.css";

// Sätter default routing i applikationen
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<WhiteBoardHome />} />
            </Routes>
        </Router>
    );
}

export default App;
