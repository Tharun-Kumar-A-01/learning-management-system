import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function SettingsPage() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [settings, setSettings] = useState({
        notifications: {
            emailEnrollment: true,
            emailCompletion: true,
            emailReminders: true,
            inAppNotifications: true
        },
        preferences: {
            language: 'en',
            timezone: 'UTC',
            dateFormat: 'MM/DD/YYYY'
        }
    });

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // Note: Would need a settings update endpoint
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/50 text-green-500'
                            : 'bg-red-500/10 border border-red-500/50 text-red-500'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Notification Settings */}
                <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-6">Notification Preferences</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white">Course Enrollment</p>
                                <p className="text-sm text-zinc-500">Get notified when you're enrolled in a course</p>
                            </div>
                            <ToggleSwitch
                                checked={settings.notifications.emailEnrollment}
                                onChange={(checked) => setSettings({
                                    ...settings,
                                    notifications: { ...settings.notifications, emailEnrollment: checked }
                                })}
                            />
                        </div>
                        <div className="border-t border-white/5"></div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white">Course Completion</p>
                                <p className="text-sm text-zinc-500">Get notified when you complete a course</p>
                            </div>
                            <ToggleSwitch
                                checked={settings.notifications.emailCompletion}
                                onChange={(checked) => setSettings({
                                    ...settings,
                                    notifications: { ...settings.notifications, emailCompletion: checked }
                                })}
                            />
                        </div>
                        <div className="border-t border-white/5"></div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white">Learning Reminders</p>
                                <p className="text-sm text-zinc-500">Get reminders to continue learning</p>
                            </div>
                            <ToggleSwitch
                                checked={settings.notifications.emailReminders}
                                onChange={(checked) => setSettings({
                                    ...settings,
                                    notifications: { ...settings.notifications, emailReminders: checked }
                                })}
                            />
                        </div>
                        <div className="border-t border-white/5"></div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white">In-App Notifications</p>
                                <p className="text-sm text-zinc-500">Show notifications within the application</p>
                            </div>
                            <ToggleSwitch
                                checked={settings.notifications.inAppNotifications}
                                onChange={(checked) => setSettings({
                                    ...settings,
                                    notifications: { ...settings.notifications, inAppNotifications: checked }
                                })}
                            />
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-6">Preferences</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Language</label>
                            <select
                                value={settings.preferences.language}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    preferences: { ...settings.preferences, language: e.target.value }
                                })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Timezone</label>
                            <select
                                value={settings.preferences.timezone}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    preferences: { ...settings.preferences, timezone: e.target.value }
                                })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">Eastern Time</option>
                                <option value="America/Los_Angeles">Pacific Time</option>
                                <option value="Europe/London">London</option>
                                <option value="Asia/Kolkata">India Standard Time</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Date Format</label>
                            <select
                                value={settings.preferences.dateFormat}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    preferences: { ...settings.preferences, dateFormat: e.target.value }
                                })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
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
