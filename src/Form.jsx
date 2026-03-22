import React from 'react';
import { pool } from './db.js';
import img from './imgs/img.png';
import { useNavigate } from 'react-router-dom';

export default function Form() {

    // TODO: add some database logic here:
    let school = 'gsu';
    const navigate = useNavigate();

    const goToSelect = () => {
        navigate('/semester');
    };

    return (

        <div className={'fadeInUp-animation flex flex-col justify-center items-center min-h-screen '}>
            <div className={'text-4xl font-bold leading-tight'}>
                Select University:
            </div>

            <div className={'flex flex-col mt-10'}>
                <button  onClick={goToSelect}className={'btn bg-blue-950 hover:bg-blue-900 hover:scale-115 shadow-md rounded-lg p-7'} value={school}>
                    <div className={'flex flex-row items-center'}>
                        <img src={img} className={'w-12 h-8'}/>
                        <div id={'gsu'} className={'text-1xl font-bold leading-tight text-white'}>
                            Georgia Southern University
                        </div>
                    </div>
                </button>
            </div>



        </div>
    )
}