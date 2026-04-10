import React, {useEffect, useState} from 'react';
import {Calendar, momentLocalizer, Views} from "react-big-calendar";
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './App.css'
import { Search, SlidersHorizontal, Clock, User } from 'lucide-react';
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

    const changeSubject = (event) => {
        setSubject(event);
    }

    useEffect(() => {
        fetchSchedule();
        fetchCreditTotal();
        
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
            setCourses([]);
            return;
        }

        const fetchCourses = async () => {
            setLoading(true);
            try {
                // get params
                const queryParams = new URLSearchParams({
                    subjectName: debounced,
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
                        const totalCourses = await fetch(queryUrl);
                        data = await totalCourses.json();
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

    }, [debounced, semester, university]); // rerun when subject changes

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
                            <span className="font-bold text-slate-100">{course.day}</span>
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

            <button onClick={() => handleAddCourse(course)} className="btn btn-sm btn-primary btn-block shadow-lg rounded-full">
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