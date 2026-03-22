import React from 'react';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Form from "./Form.jsx";
import Home from "./Home.jsx";
import Semester from "./Semester.jsx";
import MainPage from "./MainPage.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path={"/"} element={<Home />} />
                <Route path={"/form"} element={<Form />} />
                <Route path={"/semester"} element={<Semester />} />
                <Route path={"/main"} element={<MainPage />} />
            </Routes>
        </BrowserRouter>
    )
}
