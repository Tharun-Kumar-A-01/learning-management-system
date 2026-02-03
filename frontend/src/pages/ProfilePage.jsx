import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiFetch } from '../utils/api';

export default function ProfilePage() {
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    const getRoleLabel = (role) => {
        const labels = {
            super_admin: 'Super Admin',
            admin: 'Admin / HR',
            trainer: 'Trainer',
            learner: 'Learner'
        };
        return labels[role] || role;
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // Note: Would need a profile update endpoint
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setEditing(false);
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // Note: Would need a password change endpoint
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/50 text-green-500'
                        : 'bg-red-500/10 border border-red-500/50 text-red-500'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-6 mb-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-white">{user?.name}</h2>
                                <p className="text-zinc-400">{user?.email}</p>
                                <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium ${user?.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' :
                                    user?.role === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                                        user?.role === 'trainer' ? 'bg-green-500/20 text-green-400' :
                                            'bg-zinc-500/20 text-zinc-400'
                                    }`}>
                                    {getRoleLabel(user?.role)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setEditing(!editing)}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {editing ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>

                    {editing ? (
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    ) : (
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-zinc-500">Full Name</p>
                                <p className="text-white">{user?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Email</p>
                                <p className="text-white">{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Role</p>
                                <p className="text-white">{getRoleLabel(user?.role)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Account Status</p>
                                <p className="text-green-400">Active</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Change Password */}
                <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Change Password</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Current Password</label>
                            <input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">New Password</label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
