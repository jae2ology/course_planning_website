import {React, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";

export default function Degree() {
    const [degree, setDegree] = useState("");
    const navigate = useNavigate();
    const location = useLocation();


    const goToPrerequisites = () => {
        navigate("/courses", {state: {
                universityName: location.state?.universityName,
                degree: degree
            }});
    }

    return (
        <div className={"fadeInUp-animation flex flex-col justify-center items-center min-h-screen "}>
            <div className={'text-4xl font-bold leading-tight'}>
                Enter Degree:
            </div>

            <div className={'flex flex-col mt-10 gap-50 p-2'}>
                <input onChange={(e) => {setDegree(e.target.value)}}
                        type={"text"}
                       placeholder={"Computer Science..."}
                       className={"input border w-full pl-10 bg-primary/20 border-bg-primary focus:border-primary text-slate-950"}
                />

                <button onClick={goToPrerequisites} className={"btn bg-blue-950 hover:bg-blue-900 hover:scale-115 shadow-md rounded-lg p-7 text-white font-bold"}>
                    Next
                </button>
            </div>

        </div>
    )
}