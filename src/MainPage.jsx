import React, {useEffect, useState} from 'react';
import {Calendar, momentLocalizer, Views} from "react-big-calendar";
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './App.css'
import { Search, SlidersHorizontal, Clock, User } from 'lucide-react';
import semesterName from './Semester.jsx';
import universityName from './Form.jsx';

// page for the calendar/schedule setup

export default function MainPage(){
    const localizer = momentLocalizer(moment);
    const [debounced, setDebounced] = useState('');
    const [subject, setSubject] = useState('');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);

    // TODO: update database for scheduler (create table schedule)

    const changeSubject = (event) => {
        setSubject(event);
    }

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebounced(subject);
        }, 500); // wait 500s after the last letter

        return () => {
            clearTimeout(handler); // cancel timer if user types again
        };
    }, [subject]);

    useEffect(() => {
        // only fetch if subject is returned
        if (!debounced || debounced.length < 4) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCourses([]);
            return;
        }

        setLoading(true);

        const query = new URLSearchParams({
            subjectName: debounced,
            semesterName: semesterName,
            universityName: universityName,
        }).toString();

        fetch(`http://localhost:3001/api/courses?${query}`)
            .then(res => res.json())
            .then(data => {
                setCourses(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching courses:", err);
                setLoading(false);
            });
    }, [debounced]); // rerun when subject changes


    const CourseCard = ({ course }) => (
        <div className={"p-5 rounded-2xl bg-slate-900 border border-white hover:border-primary/50 hover:bg-slate-800 transition-all shadow-xl"}>
            <div className={"flex flex-wrap justify-between items-center gap-2 mb-2"}>
                <div className={"flex items-center gap-2"}>
                    <span className="text-xs text-primary uppercase tracking-widest">
                        CRN {course.crn}
                    </span>
                    <span className="text-primary  badge badge-outline badge-sm opacity-100">{course.credits} Credits </span>
                </div>

                <h2 className="text-lg font-bold text-white leading-tight mb-1">
                    {course.subject}
                </h2>
                <p className="text-sm text-slate-400 font-medium mb-4 line-clamp-1">
                    {course.title}
                </p>

                <div className="space-y-3 text-xs text-slate-300 mb-5">
                    <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-100">{course.days}</span>
                            <span className="opacity-70">{course.time}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-primary shrink-0" />
                        <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                        </div>
                        <span className="italic opacity-80">{course.campus}</span>
                    </div>
                </div>

            </div>

            <button className="btn btn-sm btn-primary btn-block shadow-lg rounded-full">
                Add
            </button>

            {/* TODO: add hover:courses on calendar */}

        </div>
    )


    return (
        <div className={'fadeInUp-animation bg-base-200 h-screen flex overflow-hidden'}>
            <aside className={'w-[400px] h-full flex flex-col border-r bg-base-100 overflow-hidden'}>

                {/* Search for courses here: (dont forgett) */}
                <div className={'p-4 space-y-4 flex-none'}>
                    <div className={'relative group'}>
                        <input
                            type={"text"}
                            placeholder={"CSCI..."}
                            onChange={(e) => changeSubject(e.target.value)}
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

            <main className={'flex-1 h-full p-4 overflow-y-auto'}>
                <div className={'h-full bg-primary/30 rounded-2xl p-4 shadow-2xl border border-slate-950'}>
                    <Calendar
                        localizer={localizer}
                        events={[]}
                        style={{height:'100%'}}
                        view={Views.WEEK}
                        toolbar={false}
                        formats={{
                            dayFormat: 'ddd MM/DD',
                        }}
                        min={new Date(2026, 0, 1, 6, 0)}
                        max={new Date(2026, 0, 1, 22, 0)}
                    />
                </div>
            </main>
        </div>
    )
}