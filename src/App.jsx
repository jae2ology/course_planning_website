import React from 'react';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Form from "./Form.jsx";
import Home from "./Home.jsx";
import Semester from "./Semester.jsx";
import MainPage from "./MainPage.jsx";
import Degree from "./Degree.jsx";
import Prereqs from "./Prereqs.jsx";

export default function App() {
    // route:
    // 1: home
    // 2: choose university (form)
    // 3: choose major (degree)
    // 4: choose courses taken (prereqs)
    // 5: choose semester (semester)
    // 6: main page (mainpage)

    return (
        <BrowserRouter>

            <Routes>
                <Route path={"/"} element={<Home />} />
                <Route path={"/form"} element={<Form />} />
                <Route path={"/semester"} element={<Semester />} />
                <Route path={"/mainPage"} element={<MainPage />} />
                <Route path={"/degree"} element={<Degree />} />
                <Route path={"/courses"} element={<Prereqs />} />
            </Routes>
        </BrowserRouter>
    )
}
