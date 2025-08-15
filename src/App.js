import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChevronDown, Bell, User, LogOut, Calendar, BookOpen, CheckSquare, BarChart2, Settings, Users, Clipboard, PlusCircle } from 'lucide-react';

import { auth, db } from './firebase'; // Import from your new file
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore"; // To save user data


// Mock Data (In a real app, this would come from a database)
const mockStudentData = {
    name: "Alex Doe",
    collegeId: "E23CSE101",
    branch: "Computer Science",
    semester: 3,
    
    subjects: [
        { id: 1, name: "Data Structures", code: "CS201", attended: 25, total: 30 },
        { id: 2, name: "Algorithms", code: "CS202", attended: 22, total: 28 },
        { id: 3, name: "Database Systems", code: "CS203", attended: 28, total: 32 },
        { id: 4, name: "Operating Systems", code: "CS204", attended: 18, total: 30 },
        { id: 5, name: "Discrete Mathematics", code: "MA201", attended: 30, total: 35 },
    ],
    timetable: {
        Monday: [
            { time: "09:00 - 10:00", subject: "Data Structures", room: "A-101", faculty: "Dr. Smith" },
            { time: "10:00 - 11:00", subject: "Algorithms", room: "A-102", faculty: "Dr. Jones" },
            { time: "11:00 - 12:00", subject: "Operating Systems", room: "B-205", faculty: "Dr. Williams" },
        ],
        Tuesday: [
            { time: "10:00 - 11:00", subject: "Database Systems", room: "C-103", faculty: "Dr. Brown" },
            { time: "11:00 - 12:00", subject: "Discrete Mathematics", room: "C-104", faculty: "Dr. Green" },
        ],
        Wednesday: [
             { time: "09:00 - 10:00", subject: "Data Structures", room: "A-101", faculty: "Dr. Smith" },
             { time: "10:00 - 11:00", subject: "Algorithms", room: "A-102", faculty: "Dr. Jones" },
        ],
        Thursday: [
            { time: "10:00 - 11:00", subject: "Database Systems", room: "C-103", faculty: "Dr. Brown" },
            { time: "11:00 - 12:00", subject: "Operating Systems", room: "B-205", faculty: "Dr. Williams" },
        ],
        Friday: [
            { time: "11:00 - 12:00", subject: "Discrete Mathematics", room: "C-104", faculty: "Dr. Green" },
        ],
        Saturday: [],
        Sunday: [],
    }
};

const getAttendanceColor = (percentage) => {
    if (percentage < 70) return 'bg-red-500';
    if (percentage >= 70 && percentage < 75) return 'bg-yellow-500';
    return 'bg-green-500';
};

const getAttendanceTextColor = (percentage) => {
    if (percentage < 70) return 'text-red-500';
    if (percentage >= 70 && percentage < 75) return 'text-yellow-500';
    return 'text-green-500';
};

const ProgressBar = ({ attended, total }) => {
    const percentage = total > 0 ? (attended / total) * 100 : 0;
    const colorClass = getAttendanceColor(percentage);

    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const SubjectCard = ({ subject }) => {
    const percentage = subject.total > 0 ? (subject.attended / subject.total) * 100 : 0;
    const textColorClass = getAttendanceTextColor(percentage);
    
    const classesToMiss = subject.total > 0 ? Math.floor((subject.attended - 0.75 * subject.total) / 0.75) : 0;
    const classesToAttend = subject.total > 0 ? Math.ceil((0.75 * subject.total - subject.attended) / 0.25) : 0;

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{subject.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{subject.code}</p>
                </div>
                <div className={`font-bold text-xl ${textColorClass}`}>{percentage.toFixed(1)}%</div>
            </div>
            <div className="mt-4">
                <ProgressBar attended={subject.attended} total={subject.total} />
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mt-2">
                    <span>Attended: {subject.attended}/{subject.total}</span>
                </div>
            </div>
             <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {percentage >= 75 ? (
                    <p className="text-green-600 dark:text-green-400">✅ You can safely miss <span className="font-bold">{classesToMiss}</span> more class(es).</p>
                ) : (
                    <p className="text-red-600 dark:text-red-400">🚨 You must attend the next <span className="font-bold">{classesToAttend}</span> class(es) to reach 75%.</p>
                )}
            </div>
        </div>
    );
};

const TodaysClassCard = ({ classInfo, onMark }) => {
    const [status, setStatus] = useState('pending'); // pending, present, absent

    const handleMark = (newStatus) => {
        setStatus(newStatus);
        onMark(classInfo, newStatus);
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between">
            <div>
                <p className="font-bold text-gray-800 dark:text-white">{classInfo.subject}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{classInfo.time} | Room: {classInfo.room}</p>
            </div>
            <div className="flex space-x-2">
                 {status === 'pending' ? (
                    <>
                        <button onClick={() => handleMark('present')} className="px-3 py-1 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors">Present</button>
                        <button onClick={() => handleMark('absent')} className="px-3 py-1 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">Absent</button>
                    </>
                ) : (
                     <p className={`font-semibold ${status === 'present' ? 'text-green-500' : 'text-red-500'}`}>
                        Marked as {status.charAt(0).toUpperCase() + status.slice(1)}
                     </p>
                )}
            </div>
        </div>
    );
};


const Dashboard = ({ studentData, setPage }) => {

   // --- THIS IS THE FIX ---
    // We create the 'displayData' variable here.
    // It takes the mock data for subjects/timetable and overwrites the name/id
    // with the real data from the logged-in user.
    const displayData = {
        ...mockStudentData,
        name: studentData.fullName,
        collegeId: studentData.collegeId,
    };
    // --- END OF FIX ---
    const [today, setToday] = useState("");
    const [todaysClasses, setTodaysClasses] = useState([]);

    useEffect(() => {
        const date = new Date();
        const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
        setToday(dayOfWeek);
        setTodaysClasses(studentData.timetable[dayOfWeek] || []);
    }, [studentData.timetable]);
    
    const handleMarkAttendance = (classInfo, status) => {
        // In a real app, you'd update the database here.
        console.log(`Marked ${classInfo.subject} as ${status}`);
    };

    const totalAttended = studentData.subjects.reduce((sum, s) => sum + s.attended, 0);
    const totalClasses = studentData.subjects.reduce((sum, s) => sum + s.total, 0);
    const overallPercentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

    const chartData = studentData.subjects.map(s => ({
        name: s.code,
        attendance: s.total > 0 ? (s.attended / s.total) * 100 : 0,
    }));
    
    const pieChartData = [
        { name: 'Attended', value: totalAttended },
        { name: 'Missed', value: totalClasses - totalAttended },
    ];
    const PIE_COLORS = ['#10B981', '#EF4444'];


    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col">
                 <div className="h-16 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    Attend<span className="text-gray-800 dark:text-white">Wise</span>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-2">
                    <a href="#" className="flex items-center px-4 py-2 text-gray-700 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-md">
                        <BarChart2 className="w-5 h-5 mr-3" /> Dashboard
                    </a>
                    <a href="#" className="flex items-center px-4 py-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400 rounded-md">
                        <CheckSquare className="w-5 h-5 mr-3" /> Mark Attendance
                    </a>
                    <a href="#" className="flex items-center px-4 py-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400 rounded-md">
                        <Calendar className="w-5 h-5 mr-3" /> Timetable
                    </a>
                     <a href="#" className="flex items-center px-4 py-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400 rounded-md">
                        <BookOpen className="w-5 h-5 mr-3" /> Subjects
                    </a>
                </nav>
                 <div className="px-4 py-4">
                    <a href="#" onClick={() => setPage('login')} className="flex items-center px-4 py-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400 rounded-md">
                        <LogOut className="w-5 h-5 mr-3" /> Logout
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center justify-between px-6">
                    <div>
<h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Welcome back, {displayData.name?.split(' ')[0] || 'Student'}!</h1>                         <p className="text-sm text-gray-500 dark:text-gray-400">Let's track your attendance and stay on top of your classes.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Bell className="text-gray-500 dark:text-gray-400" />
                        <div className="flex items-center">
                            <User className="text-gray-500 dark:text-gray-400 mr-2" />
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{displayData.name || 'Student'}</span>
                            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 ml-1" />
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                         <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md">
                            <h4 className="text-gray-500 dark:text-gray-400 font-medium">Overall Attendance</h4>
                            <p className={`text-3xl font-bold ${getAttendanceTextColor(overallPercentage)}`}>{overallPercentage.toFixed(1)}%</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{totalAttended} of {totalClasses} classes attended</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md">
                            <h4 className="text-gray-500 dark:text-gray-400 font-medium">Requirement</h4>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">75%</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Minimum to pass</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md">
                            <h4 className="text-gray-500 dark:text-gray-400 font-medium">Classes Today</h4>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">{todaysClasses.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{today}</p>
                        </div>
                         <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md">
                            <h4 className="text-gray-500 dark:text-gray-400 font-medium">Lowest Attendance</h4>
                             {studentData.subjects.length > 0 && 
                                <p className="text-3xl font-bold text-red-500">
                                    {Math.min(...studentData.subjects.map(s => s.total > 0 ? (s.attended / s.total) * 100 : 100)).toFixed(1)}%
                                </p>
                             }
                            <p className="text-sm text-gray-500 dark:text-gray-400">in Operating Systems</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Subject Breakdown */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                             <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4">Subject-wise Breakdown</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {studentData.subjects.map(subject => (
                                    <SubjectCard key={subject.id} subject={subject} />
                                ))}
                            </div>
                        </div>

                        {/* Today's Classes */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4">Today's Schedule ({today})</h3>
                            {todaysClasses.length > 0 ? (
                                <div className="space-y-4">
                                    {todaysClasses.map((classInfo, index) => (
                                        <TodaysClassCard key={index} classInfo={classInfo} onMark={handleMarkAttendance} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Calendar className="mx-auto h-12 w-12 text-gray-400"/>
                                    <p className="mt-2 text-gray-500 dark:text-gray-400">No classes today. Enjoy your day off!</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
                        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4">Attendance Trends</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" domain={[0, 100]}/>
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem' }}/>
                                    <Legend />
                                    <Bar dataKey="attendance" fill="#4F46E5" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4">Overall Status</h3>
                             <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem' }}/>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};


const LoginPage = ({ setPage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setPage('dashboard');
        } catch (err) {
            setError(err.message);
            console.error("Error logging in:", err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">AttendWise</h1>
                <p className="text-gray-600 dark:text-gray-300">Your smart attendance manager</p>
            </div>
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Student Login</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                            Email or College ID
                        </label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="your.id@college.edu" required />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 dark:text-gray-300 dark:bg-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************" required />
                    </div>
                    <div className="flex items-center justify-center">
                        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline" type="submit">
                            Sign In
                        </button>
                    </div>
                </form>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
                    Don't have an account? <button onClick={() => setPage('signup')} className="font-bold text-indigo-500 hover:text-indigo-800">Sign Up</button>
                </p>
            </div>
        </div>
    );
};

const SignupPage = ({ setPage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [collegeId, setCollegeId] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        try {
            // 1. Create the user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Save the user's extra details in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                fullName: fullName,
                collegeId: collegeId,
                email: email,
                // You can add branch, semester, etc. here later
            });

            // 3. Go to the dashboard
            setPage('dashboard');

        } catch (err) {
            setError(err.message); // Show an error if something goes wrong
            console.error("Error signing up:", err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center py-12">
            {/* ... The rest of the JSX is the same, but we need to update the form and inputs ... */}
            <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Student Registration</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleSignUp}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="fullName">Full Name</label>
                            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700" id="fullName" type="text" placeholder="Alex Doe" required />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="collegeId">College ID</label>
                            <input value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700" id="collegeId" type="text" placeholder="E23CSE101" required />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">Email Address</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700" id="email" type="email" placeholder="alex.doe@college.edu" required />
                    </div>
                    {/* ... Add other fields like branch/semester here in the same way ... */}
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700" id="password" type="password" placeholder="******************" required />
                    </div>
                    <div className="mt-6 flex items-center justify-center">
                        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline" type="submit">
                            Register
                        </button>
                    </div>
                </form>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
                    Already have an account? <button onClick={() => setPage('login')} className="font-bold text-indigo-500 hover:text-indigo-800">Log In</button>
                </p>
            </div>
        </div>
    );
};

export default function App() {
    const [page, setPage] = useState('login'); // 'login', 'signup', 'dashboard'
     const [currentUser, setCurrentUser] = useState(null); // To store the logged-in user's data
    const [loading, setLoading] = useState(true); // To show a loading message while the bouncer is checking

   // This is our bouncer!
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User has the "hand stamp" (is logged in)
                // Now, let's get their specific data from Firestore
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    // We found their data! Let's store it.
                    setCurrentUser({ uid: user.uid, ...userDoc.data() });
                } else {
                    // This case is rare, but good to handle
                    console.log("User data not found in Firestore!");
                    setCurrentUser(null);
                }
                setPage('dashboard'); // Send them to the dashboard
            } else {
                // User does not have the "hand stamp" (is not logged in)
                setCurrentUser(null);
                setPage('login'); // Send them to the login page
            }
            setLoading(false); // We're done checking, so stop loading
        });

        // Cleanup function: "fire" the bouncer when the app closes
        return () => unsubscribe();
    }, []); // The empty array [] means this effect runs only once when the app starts

    // ... The rest of the code will go here ...


    // This simple router determines which page to show.
    // In a larger app, you'd use a library like React Router.
    const renderPage = () => {
        switch (page) {
            case 'signup':
                return <SignupPage setPage={setPage} />;
            case 'dashboard':
                return <Dashboard studentData={mockStudentData} setPage={setPage} />;
            case 'login':
            default:
                return <LoginPage setPage={setPage} />;
        }
    };
     // Show a simple loading message while we check for a user
    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }


    return (
        <div>
           
            {renderPage()}
        </div>
    );
}
