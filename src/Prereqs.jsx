import {React, useState, useEffect} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {CheckCircle} from "lucide-react";

export default function Prereqs() {
    const navigate = useNavigate();
    const location = useLocation();
    const universityName = location.state?.universityName;
    const semesterName = location.state?.semesterName;
    const degree = location.state?.degree;

    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(new Set());

    useEffect(() => {
        const fetchReqs = async () => {
            setLoading(true);
            try {
                // get requirements for the major
                const query = new URLSearchParams({ major: degree, university: universityName });
                const res = await fetch(`http://localhost:3001/api/degree?${query}`);
                if (res.ok){
                    let data = await res.json();
                    setRequirements(data);
                } else {
                    setRequirements([]);
                }

                // fetch already completed courses to check boxes
                const completedRes = await fetch('http://localhost:3001/api/completed_courses');
                const completedData = await completedRes.json();
                setCompleted(new Set(completedData.map(c => `${c.course_subject}-${c.course_title}`)));

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchReqs();
    }, [degree, universityName])

    const toggleCourse = async (course) => {
        const courseKey = `${course.course_subject}-${course.course_title}`;
        const isCompleted = completed.has(courseKey); // true or fasle

        try {
            if (isCompleted) {
                // if true (and user presses it), remove from db
                await fetch(`http://localhost:3001/api/completed_courses?subject=${course.course_subject}&title=${course.course_title}`, {method: "DELETE"});
                completed.delete(courseKey);
            }

            else {
                // add to db
                await fetch(`http://localhost:3001/api/completed_courses`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        subject: course.course_subject,
                        title: course.course_title,
                        credits: course.credits,
                    })

                });
                completed.add(courseKey);
            }

            setCompleted(new Set(completed));
        } catch (error) {
            console.error("Error syncing course status", error);
        }
    };

    const group = requirements.reduce((acc, cur) => {
        const type = cur.type_of_req || "General Requirements";
        if (!acc[type]){
            acc[type] = [];
        }

        acc[type].push(cur);
        return acc;
    }, {});

    const goToMain = () => {
        navigate("/mainPage", {state: {
            universityName: universityName,
                semesterName: semesterName,
                degree: degree,
                completed: completed,
                requirements: requirements
            }})
    }

    return (
        <div className={"fadeInUp-animation flex flex-col justify-center items-center min-h-screen "}>
            <h1 className="text-4xl font-bold mb-2">Select Completed Courses</h1>
            <p className="text-slate-500 mb-8">What have you already taken for your {degree}?</p>

            <div className={"w-full max-w-4xl space-y-8"}>
                {loading ? (
                    <div className={"flex justify-center"}>
                        <span className="loading loading-dots loading-lg"></span>
                    </div>

                ) : (
                    Object.keys(group).map(type => (
                        <div key={type} className="card bg-base-100 shadow-xl p-6">
                            <h2 className="text-xl font-bold border-b pb-2 mb-4 text-primary">{type}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {group[type].map(course => {
                                    const isDone = completed.has(`${course.course_subject}-${course.course_title}`);
                                    return (
                                        <div
                                            key={`${course.course_subject}-${course.course_title}`}
                                            onClick={() => toggleCourse(course)}
                                            className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isDone ? 'border-success bg-success/10' : 'border-slate-200 hover:border-primary'}`}
                                        >
                                            <div>
                                                <div className="font-bold text-sm">{course.course_subject}</div>
                                                <div className="text-xs opacity-70">{course.course_title}</div>
                                            </div>
                                            {isDone ? <CheckCircle className="text-success" /> : <Circle className="text-slate-300" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button onClick={goToMain} className={"btn btn-primary mt-10 px-10 rounded-full gap-2"}>
                Done
            </button>
        </div>
    );
}