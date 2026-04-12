import {React, useState} from "react";
import {useNavigate} from "react-router-dom";

export default function Prereqs() {
    const navigate = useNavigate();
    const universityName = location.state?.universityName;
    const semesterName = location.state?.semesterName;
    const degree = location.state?.degree;
    const [prereq, setPrereq] = useState([]);

    const handleAddPrereq = (course) => {
        // TODO: add prereqs taken
    }


    const goToMain = (text) => {
        navigate("/mainPage", {state: {
            universityName: universityName,
                semesterName: semesterName,
                degree: degree,
                prerequisites: text
            }})
    }

    return (
        <div className={"fadeInUp-animation flex flex-col justify-center items-center min-h-screen "}>
            <div className={'text-4xl font-bold leading-tight'}>
                Select Completed Courses
            </div>
        </div>
    )
}