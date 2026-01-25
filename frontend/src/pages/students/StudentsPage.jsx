import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../utils/api';
import {
    UsersIcon,
    BookOpenIcon,
    AcademicCapIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

// Helper function for progress colors
const getProgressColor = (progress) => {
    if (progress === 100) return '#5dff4f';
    if (progress === 0) return '#ff4848';
    if (progress < 70) return '#ffb84d';
    return '#5f82f3';
};

export default function StudentsPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await apiFetch('/courses');
            if (res.success) {
                setCourses(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    // Extract all students from courses with their enrollment info
    const getAllStudents = () => {
        const studentsMap = new Map();

        courses.forEach(course => {
            if (course.enrollments) {
                course.enrollments.forEach(enrollment => {
                    const key = `${enrollment.userId?._id || enrollment.userId}-${course._id}`;
                    studentsMap.set(key, {
                        id: enrollment.userId?._id || enrollment.userId,
                        name: enrollment.userId?.name || 'Unknown User',
                        email: enrollment.userId?.email || '',
                        courseId: course._id,
                        courseTitle: course.title,
                        progress: enrollment.progress || 0,
                        completed: enrollment.completed || false,
                        enrolledAt: enrollment.enrolledAt
                    });
                });
            }
        });

        return Array.from(studentsMap.values());
    };

    const students = getAllStudents();

    // Filter students
    const filteredStudents = students.filter(student => {
        const matchesCourse = selectedCourse === 'all' || student.courseId === selectedCourse;
        const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
            student.email.toLowerCase().includes(search.toLowerCase());
        return matchesCourse && matchesSearch;
    });

    // Stats
    const totalStudents = new Set(students.map(s => s.id)).size;
    const completedEnrollments = students.filter(s => s.completed).length;

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5f82f3] border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-[#e4e4ea]">Students</h1>
                <p className="text-sm text-[#666]">View enrolled students and their progress</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-[#5f82f3]" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-[#e4e4ea]">{totalStudents}</p>
                            <p className="text-xs text-[#666]">Total Students</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <BookOpenIcon className="w-5 h-5 text-[#5f82f3]" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-[#e4e4ea]">{students.length}</p>
                            <p className="text-xs text-[#666]">Enrollments</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#5dff4f]/10 rounded-lg flex items-center justify-center">
                            <AcademicCapIcon className="w-5 h-5 text-[#5dff4f]" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-[#e4e4ea]">{completedEnrollments}</p>
                            <p className="text-xs text-[#666]">Completed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-[#e4e4ea] placeholder-[#666] focus:outline-none focus:border-[#5f82f3]"
                />
                <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                >
                    <option value="all">All Courses</option>
                    {courses.map(course => (
                        <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                </select>
            </div>

            {/* Students List */}
            {filteredStudents.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
                    <UsersIcon className="w-12 h-12 text-[#444] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[#e4e4ea] mb-2">No students found</h3>
                    <p className="text-sm text-[#666]">
                        {courses.length === 0
                            ? "Create a course to start getting enrollments"
                            : "No students match your search criteria"}
                    </p>
                </div>
            ) : (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#2a2a2a]">
                                <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase">Student</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase">Course</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase">Progress</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase">Status</th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-[#666] uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student, index) => (
                                <tr key={`${student.id}-${student.courseId}-${index}`} className="border-b border-[#2a2a2a]/50 hover:bg-[#0e0e0e]">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[#5f82f3] text-sm font-medium">
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm text-[#e4e4ea]">{student.name}</p>
                                                <p className="text-xs text-[#666]">{student.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <p className="text-sm text-[#e4e4ea]">{student.courseTitle}</p>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-[#0e0e0e] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${student.progress}%`,
                                                        backgroundColor: getProgressColor(student.progress)
                                                    }}
                                                />
                                            </div>
                                            <span
                                                className="text-xs font-medium"
                                                style={{ color: getProgressColor(student.progress) }}
                                            >
                                                {student.progress}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded text-xs ${student.completed
                                            ? 'bg-[#5dff4f]/10 text-[#5dff4f]'
                                            : student.progress > 0
                                                ? 'bg-[#ffb84d]/10 text-[#ffb84d]'
                                                : 'bg-[#666]/10 text-[#666]'
                                            }`}>
                                            {student.completed ? 'Completed' : student.progress > 0 ? 'In Progress' : 'Not Started'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <Link
                                            to={`/courses/${student.courseId}`}
                                            className="inline-flex items-center gap-1 text-xs text-[#5f82f3] hover:underline"
                                        >
                                            View Course
                                            <ArrowRightIcon className="w-3 h-3" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </DashboardLayout>
    );
}
