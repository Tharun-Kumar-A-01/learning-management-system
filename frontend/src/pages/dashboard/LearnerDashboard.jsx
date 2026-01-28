import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../utils/api';
import {
    BookOpenIcon,
    CheckCircleIcon,
    ClockIcon,
    TrophyIcon,
    ArrowRightIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

// Helper function for progress colors
const getProgressColor = (progress) => {
    if (progress === 100) return '#5dff4f';
    if (progress === 0) return '#ff4848';
    if (progress < 70) return '#ffb84d';
    return '#5f82f3';
};

const getProgressBgColor = (progress) => {
    if (progress === 100) return 'bg-[#5dff4f]/10';
    if (progress === 0) return 'bg-[#ff4848]/10';
    if (progress < 70) return 'bg-[#ffb84d]/10';
    return 'bg-primary/10';
};

export default function LearnerDashboard() {
    const [courses, setCourses] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [enrolledRes, allRes] = await Promise.all([
                apiFetch('/courses/enrolled'),
                apiFetch('/courses')
            ]);
            if (enrolledRes.success) setCourses(enrolledRes.data);
            if (allRes.success) setAllCourses(allRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats
    const completedCourses = courses.filter(c => c.completed || c.progress === 100);
    const inProgressCourses = courses.filter(c => c.progress < 100);

    // Calculate total progress
    const totalProgress = courses.length > 0
        ? Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length)
        : 0;

    // Get recommended courses (courses not enrolled in)
    const enrolledIds = courses.map(c => c._id);
    const recommendedCourses = allCourses.filter(c => !enrolledIds.includes(c._id)).slice(0, 3);

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
                <h1 className="text-xl font-semibold text-[#e4e4ea]">My Learning</h1>
                <p className="text-sm text-[#666]">Track your progress and continue learning</p>
            </div>

            {/* Overall Progress */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-[#888]">Overall Learning Progress</span>
                    <span
                        className="text-lg font-semibold"
                        style={{ color: getProgressColor(totalProgress) }}
                    >
                        {Math.round(totalProgress)}%
                    </span>
                </div>
                <div className="h-3 bg-[#0e0e0e] rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${totalProgress}%`,
                            backgroundColor: getProgressColor(totalProgress)
                        }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[#888]">Enrolled</span>
                        <div className="p-2 bg-primary/10 rounded">
                            <BookOpenIcon className="w-4 h-4 text-[#5f82f3]" />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-[#e4e4ea]">{courses.length}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[#888]">Completed</span>
                        <div className="p-2 bg-[#5dff4f]/10 rounded">
                            <CheckCircleIcon className="w-4 h-4 text-[#5dff4f]" />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-[#5dff4f]">{completedCourses.length}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[#888]">In Progress</span>
                        <div className="p-2 bg-[#ffb84d]/10 rounded">
                            <ClockIcon className="w-4 h-4 text-[#ffb84d]" />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-[#ffb84d]">{inProgressCourses.length}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[#888]">Certificates</span>
                        <div className="p-2 bg-[#5dff4f]/10 rounded">
                            <TrophyIcon className="w-4 h-4 text-[#5dff4f]" />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-[#e4e4ea]">{completedCourses.length}</div>
                </div>
            </div>

            {/* Continue Learning */}
            {inProgressCourses.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-medium text-[#e4e4ea]">Continue Learning</h2>
                        <Link to="/courses" className="text-xs text-[#5f82f3] hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="grid gap-3">
                        {inProgressCourses.slice(0, 4).map(course => (
                            <Link
                                key={course._id}
                                to={`/courses/${course._id}`}
                                className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded flex items-center justify-center ${getProgressBgColor(course.progress || 0)}`}>
                                        <BookOpenIcon className="w-5 h-5" style={{ color: getProgressColor(course.progress || 0) }} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#e4e4ea]">{course.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-24 h-1.5 bg-[#0e0e0e] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${course.progress || 0}%`,
                                                        backgroundColor: getProgressColor(course.progress || 0)
                                                    }}
                                                />
                                            </div>
                                            <span
                                                className="text-xs"
                                                style={{ color: getProgressColor(course.progress || 0) }}
                                            >
                                                {Math.round(course.progress || 0)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ArrowRightIcon className="w-4 h-4 text-[#666]" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommended Courses */}
            {recommendedCourses.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4 text-[#ffb84d]" />
                            <h2 className="text-sm font-medium text-[#e4e4ea]">Recommended For You</h2>
                        </div>
                        <Link to="/courses" className="text-xs text-[#5f82f3] hover:underline">
                            Browse all
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recommendedCourses.map(course => (
                            <Link
                                key={course._id}
                                to={`/courses/${course._id}`}
                                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-[#5f82f3]/30 transition-colors"
                            >
                                <div className="h-24 bg-[#0e0e0e] flex items-center justify-center">
                                    <BookOpenIcon className="w-8 h-8 text-[#333]" />
                                </div>
                                <div className="p-4">
                                    <h3 className="text-sm font-medium text-[#e4e4ea] mb-1 line-clamp-1">{course.title}</h3>
                                    <p className="text-xs text-[#666] line-clamp-2 mb-3">{course.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs px-2 py-0.5 rounded ${course.difficulty === 'beginner' ? 'bg-[#5dff4f]/10 text-[#5dff4f]' :
                                            course.difficulty === 'intermediate' ? 'bg-[#ffb84d]/10 text-[#ffb84d]' :
                                                'bg-[#ff4848]/10 text-[#ff4848]'
                                            }`}>
                                            {course.difficulty}
                                        </span>
                                        <span className="text-xs text-[#666]">{course.totalModules || 0} modules</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h2 className="text-sm font-medium text-[#e4e4ea] mb-4">Quick Actions</h2>
                <div className="flex gap-3">
                    <Link
                        to="/courses"
                        className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-[#4a6fd3] transition-colors"
                    >
                        Browse Courses
                    </Link>
                    <Link
                        to="/certificates"
                        className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#e4e4ea] text-sm rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                    >
                        View Certificates
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
