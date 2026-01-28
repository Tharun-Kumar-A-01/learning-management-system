import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { apiFetch } from '../../utils/api';
import {
    BookOpenIcon,
    UsersIcon,
    ClipboardDocumentCheckIcon,
    ChartBarIcon,
    PlusIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function TrainerDashboard() {
    const [stats, setStats] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, coursesRes] = await Promise.all([
                apiFetch('/dashboard/stats'),
                apiFetch('/courses')
            ]);
            if (statsRes.success) setStats(statsRes.data);
            if (coursesRes.success) setCourses(coursesRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-[#e4e4ea]">Trainer Dashboard</h1>
                    <p className="text-sm text-[#666]">Manage your courses and students</p>
                </div>
                <Link
                    to="/courses/create"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm rounded-lg hover:bg-[#4a6fd3] transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    New Course
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="My Courses"
                    value={stats?.coursesCreated || 0}
                    icon={BookOpenIcon}
                />
                <StatCard
                    title="Total Students"
                    value={stats?.totalLearners || 0}
                    icon={UsersIcon}
                />
                <StatCard
                    title="Pending Reviews"
                    value={stats?.pendingAssessments || 0}
                    icon={ClipboardDocumentCheckIcon}
                />
                <StatCard
                    title="Avg. Completion"
                    value={`${Math.round(stats?.avgCompletionRate || 0)}%`}
                    icon={ChartBarIcon}
                />
            </div>

            {/* My Courses */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-[#e4e4ea]">My Courses</h2>
                    <Link to="/courses" className="text-xs text-[#5f82f3] hover:underline">
                        View all
                    </Link>
                </div>
                {courses.length === 0 ? (
                    <div className="p-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-center">
                        <BookOpenIcon className="w-10 h-10 text-[#444] mx-auto mb-3" />
                        <p className="text-sm text-[#888]">No courses yet</p>
                        <Link
                            to="/courses/create"
                            className="inline-block mt-3 text-sm text-[#5f82f3] hover:underline"
                        >
                            Create your first course
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {courses.slice(0, 5).map(course => (
                            <Link
                                key={course._id}
                                to={`/courses/${course._id}`}
                                className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                                        <BookOpenIcon className="w-5 h-5 text-[#5f82f3]" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#e4e4ea]">{course.title}</p>
                                        <p className="text-xs text-[#666]">
                                            {course.enrolledCount || 0} students • {course.status || 'draft'}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRightIcon className="w-4 h-4 text-[#666]" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-sm font-medium text-[#e4e4ea] mb-4">Quick Actions</h2>
                <div className="flex gap-3">
                    <Link
                        to="/courses/create"
                        className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#e4e4ea] text-sm rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                    >
                        Create Course
                    </Link>
                    <Link
                        to="/assessments"
                        className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#e4e4ea] text-sm rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                    >
                        Manage Assessments
                    </Link>
                    <Link
                        to="/students"
                        className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#e4e4ea] text-sm rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                    >
                        View Students
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
