import React from 'react';
import {useNavigate} from "react-router-dom";

export default function Semester() {
    const navigate = useNavigate();
    const goBack = () => {
        navigate('/');
    }

    let semesterName = '';

    return (
        <div className={'fadeInUp-animation flex flex-col gap-10 justify-center items-center min-h-screen '}>
            <div className={'text-4xl font-bold leading-tight'}>
                Select Semester:
            </div>

            <div className={'flex mt-5 gap-7'}>


                <button className={'btn bg-green-700 hover:bg-green-500 hover:scale-115 shadow-md rounded-lg p-7'}>
                    <div className={'flex flex-row items-center'}>
                        <div className={'text-1xl font-bold leading-tight text-white'}>
                            Spring 2026
                        </div>
                    </div>
                </button>

                <button className={'btn bg-amber-700 hover:bg-amber-600 hover:scale-115 shadow-md rounded-lg p-7'}>
                    <div className={'flex flex-row items-center'}>
                        <div className={'text-1xl font-bold leading-tight text-white'}>
                            Summer 2026
                        </div>
                    </div>
                </button>

                <button className={'btn bg-red-800 hover:bg-red-600 hover:scale-115 shadow-md rounded-lg p-7'}>
                    <div className={'flex flex-row items-center'}>
                        <div className={'text-1xl font-bold leading-tight text-white'}>
                            Fall 2026
                        </div>
                    </div>
                </button>

            </div>

            <div className={'p-10'}>
                <button  onClick={goBack} className={'btn bg-primary hover:bg-primary/40 hover:scale-115 shadow-md rounded-lg p-5'}>
                    <div className={'flex flex-row items-center'}>
                        <div className={'text-1xl font-bold leading-tight text-white'}>
                            Go back
                        </div>
                    </div>
                </button>
            </div>

        </div>
    )
}