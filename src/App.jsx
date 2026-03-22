import React from 'react';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Form from "./Form.jsx";
import Home from "./Home.jsx";
import Curriculum from "./Curriculum.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path={"/"} element={<Home />} />
                <Route path={"/form"} element={<Form />} />
                <Route path={"/curr"} element={<Curriculum />} />
            </Routes>
        </BrowserRouter>
    )
}
