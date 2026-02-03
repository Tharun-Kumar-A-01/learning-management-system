import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
    UserCircleIcon,
    BellIcon,
    KeyIcon,
    TrashIcon,
    CameraIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        profilePhoto: null,
        emailAlertsEnabled: true
    });
    const [password, setPassword] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        // Fetch current profile details
        const fetchProfile = async () => {
            try {
                const res = await apiFetch('/profile');
                if (res.success) {
                    setProfile({
                        name: res.data.name,
                        email: res.data.email,
                        profilePhoto: res.data.profilePhoto,
                        emailAlertsEnabled: res.data.emailAlertsEnabled ?? true
                    });
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            }
        };
        fetchProfile();
    }, []);

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
            setMessage({ type: 'error', text: 'Image must be less than 500KB' });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setProfile({ ...profile, profilePhoto: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await apiFetch('/profile', {
                method: 'PUT',
                body: {
                    name: profile.name,
                    profilePhoto: profile.profilePhoto,
                    emailAlertsEnabled: profile.emailAlertsEnabled
                }
            });
            if (res.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (password.newPassword !== password.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (password.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await apiFetch('/profile/password', {
                method: 'PUT',
                body: {
                    currentPassword: password.currentPassword,
                    newPassword: password.newPassword
                }
            });
            if (res.success) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: UserCircleIcon },
        { id: 'notifications', label: 'Notifications', icon: BellIcon },
        { id: 'security', label: 'Security', icon: KeyIcon }
    ];

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/50 text-green-500'
                        : 'bg-red-500/10 border border-red-500/50 text-red-500'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-indigo-500 text-black'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Profile Information</h3>

                        {/* Profile Photo */}
                        <div className="flex items-center gap-6 mb-6">
                            <div className="relative">
                                {profile.profilePhoto ? (
                                    <img
                                        src={profile.profilePhoto}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {profile.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <label className="absolute bottom-0 right-0 p-1 bg-indigo-500 rounded-full cursor-pointer hover:bg-indigo-600 transition-colors">
                                    <CameraIcon className="w-4 h-4 text-white" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <div>
                                <p className="text-white font-medium">{profile.name}</p>
                                <p className="text-sm text-zinc-500">{profile.email}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="w-full px-4 py-2 bg-zinc-800/50 border border-white/10 rounded-lg text-zinc-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-zinc-500 mt-1">Email cannot be changed</p>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Notification Preferences</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white">Email Notifications</p>
                                    <p className="text-sm text-zinc-500">Receive email alerts for important updates</p>
                                </div>
                                <ToggleSwitch
                                    checked={profile.emailAlertsEnabled}
                                    onChange={(checked) => setProfile({ ...profile, emailAlertsEnabled: checked })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Change Password</h3>
                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={password.currentPassword}
                                    onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={password.newPassword}
                                    onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={password.confirmPassword}
                                    onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleChangePassword}
                                disabled={saving || !password.currentPassword || !password.newPassword}
                                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                )}
                {/* Simple Logout Button */}
                <div className="mt-12 pt-8 border-t border-white/10 flex justify-center">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-all border border-white/5 active:scale-95"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Log Out
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}

function ToggleSwitch({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-zinc-700'
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    );
}

