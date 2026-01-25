import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../utils/api';
import {
    UsersIcon,
    BookOpenIcon,
    ClipboardDocumentCheckIcon,
    ChartBarIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [courses, setCourses] = useState([]);
    const [dateRange, setDateRange] = useState('month');

    useEffect(() => {
        fetchReportData();
    }, [dateRange]);

    const fetchReportData = async () => {
        try {
            const [statsRes, coursesRes] = await Promise.all([
                apiFetch('/dashboard/stats'),
                apiFetch('/courses')
            ]);
            if (statsRes.success) setStats(statsRes.data);
            if (coursesRes.success) setCourses(coursesRes.data);
        } catch (error) {
            console.error('Failed to fetch report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        const csvData = `Report Type,Value
Total Users,${stats?.totalUsers || 0}
Total Courses,${stats?.totalCourses || courses.length || 0}
Total Enrollments,${stats?.totalEnrollments || 0}
Completion Rate,${stats?.completionRate || 0}%
Learners,${stats?.usersByRole?.learners || 0}
Trainers,${stats?.usersByRole?.trainers || 0}
Admins,${stats?.usersByRole?.admins || 0}`;

        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lms-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    // Calculate dynamic percentages for user distribution
    const totalUsers = stats?.totalUsers || 0;
    const learnerPercent = totalUsers > 0 ? Math.round((stats?.usersByRole?.learners || 0) / totalUsers * 100) : 0;
    const trainerPercent = totalUsers > 0 ? Math.round((stats?.usersByRole?.trainers || 0) / totalUsers * 100) : 0;
    const adminPercent = totalUsers > 0 ? Math.round((stats?.usersByRole?.admins || 0) / totalUsers * 100) : 0;

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
                    <h1 className="text-xl font-semibold text-[#e4e4ea]">Reports & Analytics</h1>
                    <p className="text-sm text-[#666]">View learning progress and performance metrics</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                    >
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="quarter">Last 90 Days</option>
                        <option value="year">Last Year</option>
                    </select>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-[#4a6fd3] transition-colors"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[#888]">Total Users</span>
                        <div className="p-2 bg-primary/10 rounded">
                            <UsersIcon className="w-4 h-4 text-[#5f82f3]" />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-[#e4e4ea]">{stats?.totalUsers || 0}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[#888]">Total Courses</span>
                        <div className="p-2 bg-primary/10 rounded">
                            <BookOpenIcon className="w-4 h-4 text-[#5f82f3]" />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-[#e4e4ea]">{stats?.totalCourses || courses.length || 0}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[#888]">Enrollments</span>
                        <div className="p-2 bg-primary/10 rounded">
                            <ClipboardDocumentCheckIcon className="w-4 h-4 text-[#5f82f3]" />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-[#e4e4ea]">{stats?.totalEnrollments || 0}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[#888]">Completion Rate</span>
                        <div className="p-2 bg-primary/10 rounded">
                            <ChartBarIcon className="w-4 h-4 text-[#5f82f3]" />
                        </div>
                    </div>
                    <div className="text-2xl font-semibold text-[#e4e4ea]">{stats?.completionRate || 0}%</div>
                </div>
            </div>

            {/* User Distribution */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 mb-8">
                <h3 className="text-sm font-medium text-[#e4e4ea] mb-4">User Distribution</h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#888]">Learners</span>
                            <span className="text-[#e4e4ea]">{stats?.usersByRole?.learners || 0}</span>
                        </div>
                        <div className="h-2 bg-[#0e0e0e] rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${learnerPercent}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#888]">Trainers</span>
                            <span className="text-[#e4e4ea]">{stats?.usersByRole?.trainers || 0}</span>
                        </div>
                        <div className="h-2 bg-[#0e0e0e] rounded-full overflow-hidden">
                            <div className="h-full bg-primary/70 rounded-full" style={{ width: `${trainerPercent}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#888]">Admins</span>
                            <span className="text-[#e4e4ea]">{stats?.usersByRole?.admins || 0}</span>
                        </div>
                        <div className="h-2 bg-[#0e0e0e] rounded-full overflow-hidden">
                            <div className="h-full bg-primary/50 rounded-full" style={{ width: `${adminPercent}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Courses Table */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[#e4e4ea] mb-4">Course Performance</h3>
                {courses.length === 0 ? (
                    <div className="text-center py-8 text-[#666] text-sm">
                        No courses available yet.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#2a2a2a]">
                                <th className="text-left py-3 text-xs font-medium text-[#666]">Course</th>
                                <th className="text-left py-3 text-xs font-medium text-[#666]">Enrollments</th>
                                <th className="text-left py-3 text-xs font-medium text-[#666]">Status</th>
                                <th className="text-left py-3 text-xs font-medium text-[#666]">Difficulty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.slice(0, 10).map((course) => (
                                <tr key={course._id} className="border-b border-[#1a1a1a]">
                                    <td className="py-3 text-sm text-[#e4e4ea]">{course.title}</td>
                                    <td className="py-3 text-sm text-[#888]">{course.enrolledCount || course.enrollments?.length || 0}</td>
                                    <td className="py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded ${course.status === 'published'
                                            ? 'bg-[#5dff4f]/10 text-[#5dff4f]'
                                            : 'bg-[#666]/10 text-[#666]'
                                            }`}>
                                            {course.status || 'draft'}
                                        </span>
                                    </td>
                                    <td className="py-3 text-sm text-[#888] capitalize">{course.difficulty}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardLayout>
    );
}
