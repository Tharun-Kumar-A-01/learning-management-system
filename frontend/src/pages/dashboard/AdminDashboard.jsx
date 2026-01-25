import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { apiFetch } from '../../utils/api';
import {
    UsersIcon,
    BookOpenIcon,
    ChartBarIcon,
    ClipboardDocumentCheckIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await apiFetch('/dashboard/stats');
            if (res.success) setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
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
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-[#e4e4ea]">Admin Dashboard</h1>
                <p className="text-sm text-[#666]">Organization overview and insights</p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={UsersIcon}
                />
                <StatCard
                    title="Total Courses"
                    value={stats?.totalCourses || stats?.activeCourses || 0}
                    icon={BookOpenIcon}
                />
                <StatCard
                    title="Enrollments"
                    value={stats?.totalEnrollments || 0}
                    icon={ClipboardDocumentCheckIcon}
                />
                <StatCard
                    title="Completion Rate"
                    value={`${stats?.completionRate || 0}%`}
                    icon={ChartBarIcon}
                />
            </div>

            {/* User Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <h3 className="text-sm font-medium text-[#e4e4ea] mb-4">Users by Role</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#888]">Learners</span>
                            <span className="text-sm text-[#e4e4ea]">{stats?.usersByRole?.learners || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#888]">Trainers</span>
                            <span className="text-sm text-[#e4e4ea]">{stats?.usersByRole?.trainers || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#888]">Admins</span>
                            <span className="text-sm text-[#e4e4ea]">{stats?.usersByRole?.admins || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <h3 className="text-sm font-medium text-[#e4e4ea] mb-4">Activity</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-[#5f82f3]" />
                            <div>
                                <p className="text-sm text-[#e4e4ea]">Active Sessions</p>
                                <p className="text-xs text-[#666]">{stats?.activeSessions || 0} users online</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ClipboardDocumentCheckIcon className="w-5 h-5 text-[#5f82f3]" />
                            <div>
                                <p className="text-sm text-[#e4e4ea]">New Enrollments</p>
                                <p className="text-xs text-[#666]">{stats?.recentEnrollments?.length || 0} this week</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-sm font-medium text-[#e4e4ea] mb-4">Quick Actions</h2>
                <div className="flex gap-3 flex-wrap">
                    <Link
                        to="/users"
                        className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-[#4a6fd3] transition-colors"
                    >
                        Manage Users
                    </Link>
                    <Link
                        to="/courses"
                        className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#e4e4ea] text-sm rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                    >
                        Manage Courses
                    </Link>
                    <Link
                        to="/reports"
                        className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#e4e4ea] text-sm rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                    >
                        View Reports
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
