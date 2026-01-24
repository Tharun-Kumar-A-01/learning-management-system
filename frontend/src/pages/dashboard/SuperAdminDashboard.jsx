import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import { apiFetch } from '../../utils/api';
import {
    UsersIcon,
    BookOpenIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    PaintBrushIcon,
    Cog6ToothIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function SuperAdminDashboard() {
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
                <h1 className="text-xl font-semibold text-[#e4e4ea]">Super Admin Dashboard</h1>
                <p className="text-sm text-[#666]">Platform-wide control and settings</p>
            </div>

            {/* System Health */}
            <div className="mb-6 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-[#5dff4f]" />
                <div>
                    <p className="text-sm text-[#e4e4ea]">System Status: {stats?.systemHealth?.status || 'Healthy'}</p>
                    <p className="text-xs text-[#666]">Uptime: {stats?.systemHealth?.uptime || '99.9%'}</p>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Organizations"
                    value={stats?.totalOrganizations || 1}
                    icon={BuildingOfficeIcon}
                />
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={UsersIcon}
                    subtitle={`${stats?.usersByRole?.superAdmins || 0} super admins`}
                />
                <StatCard
                    title="Total Courses"
                    value={stats?.totalCourses || 0}
                    icon={BookOpenIcon}
                />
                <StatCard
                    title="Completion Rate"
                    value={`${stats?.completionRate || 0}%`}
                    icon={ChartBarIcon}
                />
            </div>

            {/* User Breakdown */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 mb-8">
                <h3 className="text-sm font-medium text-[#e4e4ea] mb-4">Users by Role</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-semibold text-[#e4e4ea]">{stats?.usersByRole?.learners || 0}</p>
                        <p className="text-xs text-[#666]">Learners</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-semibold text-[#e4e4ea]">{stats?.usersByRole?.trainers || 0}</p>
                        <p className="text-xs text-[#666]">Trainers</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-semibold text-[#e4e4ea]">{stats?.usersByRole?.admins || 0}</p>
                        <p className="text-xs text-[#666]">Admins</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-semibold text-[#e4e4ea]">{stats?.usersByRole?.superAdmins || 0}</p>
                        <p className="text-xs text-[#666]">Super Admins</p>
                    </div>
                </div>
            </div>

            {/* Super Admin Actions */}
            <div>
                <h2 className="text-sm font-medium text-[#e4e4ea] mb-4">System Controls</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Link
                        to="/users"
                        className="p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                    >
                        <UsersIcon className="w-5 h-5 text-[#5f82f3] mb-2" />
                        <p className="text-sm text-[#e4e4ea]">Manage Users</p>
                        <p className="text-xs text-[#666]">Add admins & users</p>
                    </Link>
                    <Link
                        to="/learning-policies"
                        className="p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                    >
                        <ShieldCheckIcon className="w-5 h-5 text-[#5f82f3] mb-2" />
                        <p className="text-sm text-[#e4e4ea]">Learning Policies</p>
                        <p className="text-xs text-[#666]">Configure rules</p>
                    </Link>
                    <Link
                        to="/branding"
                        className="p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                    >
                        <PaintBrushIcon className="w-5 h-5 text-[#5f82f3] mb-2" />
                        <p className="text-sm text-[#e4e4ea]">Branding</p>
                        <p className="text-xs text-[#666]">Customize look</p>
                    </Link>
                    <Link
                        to="/settings"
                        className="p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                    >
                        <Cog6ToothIcon className="w-5 h-5 text-[#5f82f3] mb-2" />
                        <p className="text-sm text-[#e4e4ea]">Settings</p>
                        <p className="text-xs text-[#666]">System config</p>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
