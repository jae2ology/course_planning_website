import { React, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Circle } from "lucide-react";

export default function Prereqs() {
    const navigate = useNavigate();
    const location = useLocation();
    const universityName = location.state?.universityName;
    const degree = location.state?.degree;

    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(new Set());

    const CREDIT_GOALS = {
        "Mathematics and Quantitative Skills Requirement": 3,
        "History Requirement" : 3,
        "Political Science and U.S History Requirement": 6,
        "Arts, Humanities and Ethics Requirement": 6,
        "Communication in Writing Requirement": 6,
        "Technology, Mathematics and Sciences Requirement": 11,
        "Social Sciences Requirement": 3,
        "Additional Requirements": 4,
        "Field of Study": 18,
        "Specific Requirements": 7,
        "Major Requirements": 37,
        "Major Elective": 9,
        "General Elective": 6,
        "Institutional Priority Requirement": 7,
    };

    useEffect(() => {
        const fetchReqs = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams({ major: degree, university: universityName });
                const res = await fetch(`http://localhost:3001/api/degree?${query}`);
                if (res.ok) {
                    let data = await res.json();
                    setRequirements(data);
                } else {
                    setRequirements([]);
                }

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
    }, [degree, universityName]);

    const toggleCourse = async (course) => {
        const courseKey = `${course.course_subject}-${course.course_title}`;
        const isCompleted = completed.has(courseKey);

        try {
            if (isCompleted) {
                await fetch(`http://localhost:3001/api/completed_courses?subject=${course.course_subject}&title=${course.course_title}`, { method: "DELETE" });
                setCompleted(prev => {
                    const next = new Set(prev);
                    next.delete(courseKey);
                    return next;
                });
            } else {
                await fetch(`http://localhost:3001/api/completed_courses`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        subject: course.course_subject,
                        title: course.course_title,
                        credits: course.credits,
                    })
                });
                setCompleted(prev => {
                    const next = new Set(prev);
                    next.add(courseKey);
                    return next;
                });
            }
        } catch (error) {
            console.error("Error syncing course status", error);
        }
    };

    const group = requirements.reduce((acc, cur) => {
        const type = cur.type_of_req || "General Requirements";
        if (!acc[type]) acc[type] = [];
        acc[type].push(cur);
        return acc;
    }, {});

    const goToSemester = () => {
        navigate("/semester", {
            state: {
                universityName: universityName,
                degree: degree,
                completed: Array.from(completed),
                requirements: requirements
            }
        });
    };

    return (
        <div className="fadeInUp-animation flex flex-col justify-center items-center min-h-screen pt-20">
            <h1 className="text-4xl font-bold mb-2">Select Completed Courses</h1>
            <p className="text-slate-500 mb-8">What have you already taken for your {degree} degree at Georgia Southern University?</p>

            <div className="w-full max-w-4xl space-y-8">
                {loading ? (
                    <div className="flex justify-center">
                        <span className="loading loading-dots loading-lg"></span>
                    </div>
                ) : (
                    Object.keys(group).map(type => {
                        const sectionCreditsDone = group[type].reduce((sum, course) => {
                            const isDone = completed.has(`${course.course_subject}-${course.course_title}`);
                            return isDone ? sum + (course.credits || 0) : sum;
                        }, 0);

                        const goal = CREDIT_GOALS[type] || null;

                        return (
                            <div key={type} className="card bg-base-100 shadow-xl p-6">
                                <div className="flex justify-between items-center border-b pb-2 mb-4">
                                    <h2 className="text-xl font-bold text-primary">{type}</h2>
                                    <div className={`badge py-3 px-4 font-semibold ${goal && sectionCreditsDone >= goal ? 'badge-success text-white' : 'badge-ghost'}`}>
                                        {sectionCreditsDone} {goal ? `/ ${goal}` : ''} Credits
                                    </div>
                                </div>

                                {goal && sectionCreditsDone >= goal && (
                                    <p className="text-xs text-success mb-4 font-medium italic">
                                        Requirement met! Extra credits will count toward your 124 total.
                                    </p>
                                )}

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
                        );
                    })
                )}
            </div>

            <button onClick={goToSemester} className="btn btn-primary mt-10 px-10 rounded-full gap-2">
                Done
            </button>
        </div>
    );
}