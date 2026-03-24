import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    const goToForm = () => {
        navigate('/form');
    };

    return (
        <div className="hero bg-base-200 min-h-screen">
            <div className="hero-content text-center fadeInUp-animation">
                <div className="max-w-md">
                    <h1 className="text-5xl font-bold">Course Planning Tool</h1>
                    <p className="py-6">
                        For those who want ease in scheduling courses.
                    </p>
                    <button onClick={goToForm} className="btn btn-primary">Get Started</button>
                </div>
            </div>
        </div>
    )
}
