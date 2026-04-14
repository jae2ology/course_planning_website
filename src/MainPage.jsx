import React, {useEffect, useState} from 'react';
import {Calendar, momentLocalizer, Views} from "react-big-calendar";
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './App.css'
import {Search, SlidersHorizontal, Clock, User, AlertTriangle} from 'lucide-react';
import {useLocation} from "react-router-dom";

// page for the calendar/schedule setup

export default function MainPage(){
    const localizer = momentLocalizer(moment);
    const [debounced, setDebounced] = useState('');
    const [subject, setSubject] = useState('');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savedSchedule, setSavedSchedule] = useState([]);
    const [onlineCourses, setOnlineCourses] = useState([]);
    const [totalCredits, setTotalCredits] = useState(0);

    const location = useLocation();

    const semester = location.state?.semesterName;
    const university = location.state?.universityName;
    const degree = location.state.degree;
    const completed = location.state.completed;
    const requirements = location.state.requirements;


    const [progress, setProgress] = useState({completed: completed.length, total: 124});

    const changeSubject = (event) => {
        setSubject(event);
    }

    useEffect(() => {
        fetchSchedule();
        fetchCreditTotal();
        fetchProgress();
    }, [savedSchedule]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebounced(subject);
        }, 500);

        return () => clearTimeout(handler);
    }, [subject]);

    useEffect(() => {
        const searchTerm = debounced.trim();
        if (!searchTerm || searchTerm.length < 3) {
            setCourses([]);
            return;
        }

        const fetchCourses = async () => {
            setLoading(true);
            try {
                // get params
                const queryParams = new URLSearchParams({
                    subjectName: searchTerm,
                    semesterName: semester,
                    universityName: university,
                }).toString();

                const queryUrl = `http://localhost:3001/api/courses?${queryParams}`;

                // call get method to check if the courses exist in the database
                const getResponse = await fetch(queryUrl);
                // if it does, return the found data
                let data = await getResponse.json();

                // if they dont, call the post method to scrape the data and insert into database
                if (!data || data.length === 0) {
                    console.log("No courses found, scraping data now");
                    const postResponse = await fetch(queryUrl, {
                        method: "POST",
                    });

                    if (postResponse.ok){
                        // call get method again once courses have been inserted
                        data = await postResponse.json();
                    }
                }

                // set courses on the frontend to the data
                setCourses(data);

            } catch (error){
                console.log(error)
            } finally {
                // stop loading on frontend
                setLoading(false);
            }
        }

        fetchCourses();

    }, [debounced]); // rerun when subject changes

    const fetchProgress = async () => {
        const res = await fetch(`http://localhost:3001/api/progress/${degree}?scheduleId=${semester}`);
        const data = await res.json();
        // avoid division by 0
        setProgress({
            completed: parseInt(data.completed) || 0,
            total: parseInt(data.total) || 124,
        });
    }

    const handleAddCourse = async (course) => {
        try {

            const queryParams = new URLSearchParams({
                crn: course.crn,
                semesterName: semester,
            }).toString();

            const response = await fetch(`http://localhost:3001/api/schedule?${queryParams}`, {
                method: 'POST',
            });

            if (!response.ok){
                const errorData = await response.json();

                alert(`Error: ${errorData.error || 'Something went wrong'}`);
                return; // Stop execution
            }

            alert(`Successfully added ${course.subject} to your schedule`);
            fetchSchedule();
            fetchCreditTotal();

        } catch (error){
            console.log("Error adding course:", error);
            alert("Could not connect to the server.");
        }
    }

    const handleRemoveCourse = async (event) => {
        const confirm = window.confirm(`Remove ${event.title} from your schedule?`);
        if (!confirm) return;

        try {
            const res = await fetch(`http://localhost:3001/api/schedule/${event.crn}`, {
                method: 'DELETE',
            });

            if (res.ok){
                console.log(`${event.title} removed successfully.`);
                fetchSchedule();
                fetchCreditTotal();
            }

        } catch (e) {
            console.error ("Error removing course: ", e.message);
        }
    }

    const changeCourseToEvent = (course) => {
        if (!course.time || !course.day){
            return [];
        }

        const dayMap = {'M' : 1, 'T' : 2, 'W' : 3, 'R' : 4, 'F' : 5};
        const [startStr, endStr] = course.time.split(' - ');

        return course.day.split('').map(dayLetter => {
            const dayNumber = dayMap[dayLetter];
            if (!dayNumber){
                return null;
            }

            return {
                title: `${course.subject} : ${course.title}`,
                start: moment(startStr, 'h:mm A').day(dayNumber).toDate(),
                end: moment(endStr, 'h:mm A').day(dayNumber).toDate(),
                crn: course.crn
            };
        }).filter(Boolean);
    };

    const fetchCreditTotal = async () => {
        if (!semester) return; // if there isn't a semester number yet dont worry abt it

        let scheduleNumber = 0;
        if (semester === "202601"){
            scheduleNumber = 1;
        }

        if (semester === "202605"){
            scheduleNumber = 2;
        }

        if (semester === "202608"){
            scheduleNumber = 3;
        }

        try {
            const res = await fetch(`http://localhost:3001/api/schedule/credits/${scheduleNumber}`);

            if (res.ok){
                console.log('Fetched total credits for current schedule ', scheduleNumber);
                const data = await res.json();
                const credits = data.total_credits || 0;

                setTotalCredits(credits);
            } else {
                console.log("Failed to fetch current credit total");
            }

        } catch (error) {
            console.log("Failed to load credit total ", error.message);
        }
    }

    const fetchSchedule = async () => {
        try {
            const query = new URLSearchParams({
                semesterName: semester,
            }).toString();

            const res = await fetch(`http://localhost:3001/api/schedule?${query}`);
            const data = await res.json();

            const naCourses = data.filter(course =>
                !course.time || course.time.includes('N/A') || !course.day || course.day.includes('N/A')
            );
            setOnlineCourses(naCourses);

            const calendarCourses = data.filter(course =>
                course.time && !course.time.includes('N/A') && course.day && !course.day.includes('N/A')
            );

            // convert database rows to calendar event objects
            const formatted = calendarCourses.flatMap(course => changeCourseToEvent(course));
            setSavedSchedule(formatted);

        } catch (e) {
            console.log("Failed to load schedule", e.message);
        }
    }

    const CourseCard = ({ course }) => {
        const normalize = (str) => str?.replace(/\s+/g, '').toLowerCase();
        const isCompleted = completed.some(c => normalize(c.course_subject) === normalize(course.subject));

        return (
            <div className="flex flex-col p-5 rounded-2xl bg-slate-900 border border-white/10 hover:border-primary/50 transition-shadow shadow-xl h-full relative">

                {/* Top Row: Meta Info */}
                <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-primary font-black tracking-widest uppercase">
                    CRN {course.crn}
                </span>
                    <span className="badge badge-outline badge-primary badge-sm">
                    {course.credits} Credits
                </span>
                </div>

                {/* Course Identity */}
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-white leading-tight">{course.subject}</h2>
                    <p className="text-sm text-slate-400 font-medium line-clamp-1">{course.title}</p>
                </div>

                {/* Details Section */}
                <div className="space-y-2 mb-4 text-xs text-slate-300 border-t border-white/5 pt-3">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-primary shrink-0" />
                        <span>{course.day || 'TBA'} | {course.time || 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-primary shrink-0" />
                        <span className="truncate">{course.instructor}</span>
                    </div>
                </div>

                {/* Prereq Alert - Fixed height to prevent layout shifts */}
                <div className="min-h-[32px] mb-2">
                    {course.prereqs && course.prereqs !== "None" && !isCompleted && (
                        <div className="text-[10px] text-error flex items-center gap-1 font-bold bg-error/10 p-1.5 rounded">
                            <AlertTriangle size={12} /> Requires: {course.prereqs}
                        </div>
                    )}
                </div>

                {/* THE BUTTON: Added z-index and explicit cursor pointer */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddCourse(course);
                    }}
                    className="btn btn-sm btn-primary w-full mt-auto relative z-30 cursor-pointer shadow-lg active:scale-95 transition-transform"
                >
                    Add Course
                </button>
            </div>
        )
    }

    const percentage = Math.round((progress.completed / progress.total) * 100);

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

                {/* show online courses */}
                <div className="p-4 border-t bg-slate-50">
                    <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Asynchronous
                    </h3>
                    {onlineCourses.length === 0 ? (
                        <p className="text-xs text-slate-500">No online courses added.</p>
                    ) : (
                        onlineCourses.map(course => (
                            <div key={course.crn} className="flex justify-between items-center p-2 mb-2 bg-white border rounded-lg shadow-sm">
                                <div>
                                    <div className="text-xs font-bold">{course.subject}</div>
                                    <div className="text-[10px] text-slate-500">{course.title}</div>
                                </div>
                                <button
                                    onClick={() => handleRemoveCourse(course)}
                                    className="btn btn-xs btn-ghost text-error"
                                >
                                    Remove
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* show total credits! */}
                <div className="p-4 border-t bg-slate-50">
                    <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                        Total Credits
                    </h3>
                    {savedSchedule.length === 0 ? (
                        <p className="text-xs text-slate-500">No courses added.</p>
                    ) : (
                        <div className={"text-xs text-slate-500 font-bold"}>
                            {totalCredits}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50">
                    <h3 className="text-sm font-black uppercase ">{degree} degree completion</h3>

                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold">{percentage}% Done</span>
                        <span className="text-[10px] opacity-60">{progress.completed} / {progress.total} Credits</span>
                    </div>

                    <div className="w-full bg-slate-300 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div className="bg-primary h-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                </div>

            </aside>

            <main className={'flex-1 h-full p-4 overflow-y-auto'}>

                <div className={'h-full bg-primary/30 rounded-2xl p-4 shadow-2xl border border-slate-950'}>
                    <Calendar
                        localizer={localizer}
                        events={savedSchedule}
                        style={{height:'100%'}}
                        view={Views.WEEK}
                        toolbar={false}
                        onSelectEvent={handleRemoveCourse}
                        eventPropGetter={(event) => ({
                            className: "cursor-pointer !bg-primary hover:!bg-error transition-colors !text-white rounded-lg border-none shadow-md",
                            style: { fontSize: '0.75rem' }
                        })}
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