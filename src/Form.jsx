import React, {useState} from 'react';
import img from './imgs/img.png';
import { useNavigate } from 'react-router-dom';

export default function Form() {

    const [universityName, setUniversityName] = useState('');

    const changeUniversityName = (newUniversity) => {
        setUniversityName(newUniversity);
        goToSelect(newUniversity);
    }
    const navigate = useNavigate();

    const goToSelect = (newUniversity) => {
        navigate('/degree', { state: { universityName: newUniversity }});
    };

    return (

        <div className={'fadeInUp-animation flex flex-col justify-center items-center min-h-screen '}>
            <div className={'text-4xl font-bold leading-tight'}>
                Select University:
            </div>

            <div className={'flex flex-col mt-10'}>
                <button  id={'gsu'} onClick={() => changeUniversityName('gsu')} className={'btn bg-blue-950 hover:bg-blue-900 hover:scale-115 shadow-md rounded-lg p-7'}>
                    <div className={'flex flex-row items-center'}>
                        <img src={img} className={'w-12 h-8'}/>
                        <div className={'text-1xl font-bold leading-tight text-white'}>
                            Georgia Southern University
                        </div>
                    </div>
                </button>
            </div>



        </div>
    )
}