import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
    InboxIcon,
    BellIcon,
    CheckIcon,
    TrashIcon,
    AcademicCapIcon,
    ClockIcon,
    DocumentCheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const typeIcons = {
    enrollment: AcademicCapIcon,
    deadline: ClockIcon,
    appeal_update: ExclamationTriangleIcon,
    grading: DocumentCheckIcon,
    submission: DocumentCheckIcon,
    general: BellIcon
};

const typeColors = {
    enrollment: 'text-green-400',
    deadline: 'text-yellow-400',
    appeal_update: 'text-orange-400',
    grading: 'text-blue-400',
    submission: 'text-purple-400',
    general: 'text-zinc-400'
};

export default function InboxPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await apiFetch('/notifications');
            if (res.success) {
                setNotifications(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiFetch('/notifications/read-all', { method: 'PUT' });
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
        return n.type === filter;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <InboxIcon className="w-8 h-8 text-indigo-400" />
                        Inbox
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-indigo-500 text-black text-sm font-bold rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="text-zinc-400 mt-2">Your notifications and updates</p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="inline-flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <CheckIcon className="w-4 h-4 mr-2" />
                        Mark All Read
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['all', 'unread', 'enrollment', 'deadline', 'grading', 'appeal_update'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === type
                                ? 'bg-indigo-500 text-black'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-12 text-center">
                        <InboxIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400">No notifications</p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => {
                        const Icon = typeIcons[notification.type] || BellIcon;
                        return (
                            <div
                                key={notification._id}
                                className={`bg-zinc-900/50 rounded-xl border border-white/10 p-4 flex items-start gap-4 transition-all ${!notification.read ? 'border-l-4 border-l-indigo-500' : ''
                                    }`}
                            >
                                <div className={`p-2 rounded-lg bg-zinc-800 ${typeColors[notification.type]}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className={`font-medium ${notification.read ? 'text-zinc-300' : 'text-white'}`}>
                                                {notification.title}
                                            </h3>
                                            <p className="text-sm text-zinc-500 mt-1">{notification.message}</p>
                                        </div>
                                        <span className="text-xs text-zinc-500 whitespace-nowrap">
                                            {new Date(notification.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!notification.read && (
                                        <button
                                            onClick={() => markAsRead(notification._id)}
                                            className="p-2 text-zinc-400 hover:text-green-400 transition-colors"
                                            title="Mark as read"
                                        >
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(notification._id)}
                                        className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                                        title="Delete"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </DashboardLayout>
    );
}
