import React, {useEffect, useState} from 'react';
import {Calendar, momentLocalizer, Views} from "react-big-calendar";
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './App.css'
import { Search, SlidersHorizontal } from 'lucide-react';
import semesterName from './Semester.jsx';

// page for the calendar/schedule setup

export default function MainPage(){
    const localizer = momentLocalizer(moment);
    const [subject, setSubject] = useState('');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const changeSubject = (text) => {
        setSubject(text);
    }

    const params = {
        subject: subject,
        semester: semesterName,
    }

    // TODO: update database for scheduler (create table schedule)

    useEffect(() => {
        fetch(`http://localhost:3001/api/courses?param=${params}`)
            .then(res => res.json())
            .then(data => {
                setCourses(data);
                setLoading(false);
            })
            .catch(err => console.error("Error fetching courses:", err));
    }, [params]);


    const CourseCard = ({ course }) => (
        <div className={"p-5 rounded-2xl bg-primary-content border border-primary/50 hover:border-primary/30 transition-all"}>
            <div className={"flex justify-between items-start mb-1"}>
                <div className={"flex items-center gap-2"}>
                    <h2 className={'text-xl font-bold'}>
                        {course.crn}
                        <span className={'text-slate-950 font-medium'}>{course.subject}</span>
                        <span className={'text-slate-950 font-medium'}>{course.credits}</span>
                    </h2>
                </div>
            </div>
            <p className={"text-primary/20"}>
                {course.title}
            </p>

            <div className={"flex gap-2 mb-4"}>
                <span className={"badge badge-sm bg-primary-content/50 border-none"}>{semesterName}</span>
            </div>

            <div className="space-y-2 text-sm text-primary/40 mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> <span>{course.days}{course.time}</span>
                </div>
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4" /> <span>{course.instructor}</span>
                </div>

                <div className="flex items-center gap-2">
                    <h2 className="w-4 h-4">{course.campus}</h2>
                </div>
            </div>

            <button className="btn btn-sm btn-primary btn-block shadow-lg rounded-full">
                Add
            </button>

        </div>
    )


    return (
        <div className={'fadeInUp-animation bg-base-200 min-h-screen flex'}>
            <aside className={'w-[400px] flex flex-col border-r bg-base-100'}>

                {/* Search for courses here: (dont forgett) */}
                <div className={'p-4 space-y-4'}>
                    <div className={'relative group'}>
                        <input
                            type={"text"}
                            placeholder={"CSCI..."}
                            onSubmit={changeSubject}
                            className={"input border w-full pl-10 bg-primary/20 border-bg-primary focus:border-primary text-slate-950"}
                        />
                        <Search className={"absolute left-3 top-3 w-5 h-5 text-slate-950"} />
                        <SlidersHorizontal className={"absolute right-3 top-3 w-5 h-5 text-slate-950"} />
                    </div>
                </div>

                {/* courses */}
                <div className={"flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"}>
                    {loading ? (
                        <div className={"flex flex-col gap-4"}>
                            <div className="skeleton h-32 w-full bg-primary"></div>
                            <div className="skeleton h-32 w-full bg-primary"></div>
                            <div className="skeleton h-32 w-full bg-primary"></div>

                        </div>
                    ) : (
                        courses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))
                    )}
                </div>

            </aside>

            <main className={'flex-1 p-4'}>
                <div className={'h-full bg-primary/30 rounded-2xl p-4 shadow-2xl border border-slate-950'}>
                    <Calendar
                        localizer={localizer}
                        events={[]}
                        startAccessor={"start"}
                        endAccessor={"end"}
                        style={{height:'100%'}}
                        view={Views.WEEK}
                        min={new Date(2026, 0, 1, 6, 0)}
                        max={new Date(2026, 0, 1, 22, 0)}
                    />
                </div>
            </main>
        </div>
    )
}