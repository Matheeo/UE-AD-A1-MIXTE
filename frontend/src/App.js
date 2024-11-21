import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import UserList from "./components/UserList";
import ApiDocumentation from "./components/ApiDocumentation";
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <nav style={styles.navbar}>
                    <Link to="/" style={styles.link}>User List</Link>
                    <Link to="/documentation" style={styles.link}>Movies API Documentation</Link>
                </nav>

                <Routes>
                    <Route path="/" element={<UserList />} />
                    <Route path="/documentation" element={<ApiDocumentation />} />
                </Routes>
            </div>
        </Router>
    );
}

const styles = {
    navbar: {
        display: "flex",
        justifyContent: "center",
        padding: "10px",
        backgroundColor: "#007bff",
        marginBottom: "20px",
    },
    link: {
        color: "white",
        textDecoration: "none",
        margin: "0 15px",
        fontSize: "18px",
    },
};

export default App;
