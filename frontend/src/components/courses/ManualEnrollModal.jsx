import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/TextInput';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ManualEnrollModal({ isOpen, onClose, courseId, courseTitle }) {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [deadline, setDeadline] = useState('');
    const [isMandatory, setIsMandatory] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        } else {
            // Reset state when closing
            setSearch('');
            setSelectedUsers([]);
            setDeadline('');
            setIsMandatory(false);
            setMessage({ type: '', text: '' });
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/users?role=learner&search=${search}&courseId=${courseId}`);
            if (res.success) {
                setUsers(res.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    const toggleUserSelection = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleEnroll = async () => {
        if (selectedUsers.length === 0) {
            setMessage({ type: 'error', text: 'Select at least one user' });
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiFetch(`/courses/${courseId}/manual-enroll`, {
                method: 'POST',
                body: {
                    userIds: selectedUsers,
                    deadline: deadline || undefined,
                    isMandatory
                }
            });

            if (res.success) {
                setMessage({ type: 'success', text: `Successfully enrolled ${selectedUsers.length} users!` });
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to enroll users' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Manual Enrollment</h2>
                        <p className="text-zinc-400 text-sm mt-1">{courseTitle}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-auto space-y-6">
                    {message.text && (
                        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/50' : 'bg-red-500/10 text-red-500 border border-red-500/50'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Enrollment Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Deadline (Optional)</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex items-end h-full py-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isMandatory}
                                    onChange={(e) => setIsMandatory(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/10 bg-zinc-800 text-indigo-500 focus:ring-0"
                                />
                                <span className="text-sm text-zinc-400">Mark as Mandatory</span>
                            </label>
                        </div>
                    </div>

                    {/* User Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Search Students</label>
                        <form onSubmit={handleSearch} className="relative mb-4">
                            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                            />
                        </form>

                        <div className="border border-white/10 rounded-lg overflow-hidden bg-zinc-950/50">
                            <div className="max-h-60 overflow-auto">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto"></div>
                                    </div>
                                ) : users.length === 0 ? (
                                    <p className="p-8 text-center text-zinc-500">No students found</p>
                                ) : (
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead className="bg-[#1a1a1a] border-b border-white/10 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 w-12 text-center">
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => {
                                                            const eligibleUsers = users.filter(u => !u.isEnrolled);
                                                            if (e.target.checked) {
                                                                setSelectedUsers(eligibleUsers.map(u => u._id));
                                                            } else {
                                                                setSelectedUsers([]);
                                                            }
                                                        }}
                                                        checked={selectedUsers.length > 0 && selectedUsers.length === users.filter(u => !u.isEnrolled).length}
                                                        className="w-4 h-4 rounded border-white/20 bg-zinc-800 text-indigo-500 focus:ring-0 cursor-pointer"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 font-semibold text-zinc-400">Name</th>
                                                <th className="px-4 py-3 font-semibold text-zinc-400">Email</th>
                                                <th className="px-4 py-3 font-semibold text-zinc-400 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {users.map((user) => (
                                                <tr
                                                    key={user._id}
                                                    onClick={() => !user.isEnrolled && toggleUserSelection(user._id)}
                                                    className={`transition-colors ${user.isEnrolled ? 'opacity-50 cursor-not-allowed bg-zinc-900/30' : 'cursor-pointer hover:bg-white/5'} ${selectedUsers.includes(user._id) ? 'bg-indigo-500/10' : ''}`}
                                                >
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.includes(user._id) || user.isEnrolled}
                                                            disabled={user.isEnrolled}
                                                            onChange={() => { }} // Handled by tr onClick
                                                            className={`w-4 h-4 rounded border-white/20 bg-zinc-800 text-indigo-500 focus:ring-0 ${user.isEnrolled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-white font-medium">{user.name}</td>
                                                    <td className="px-4 py-3 text-zinc-400">{user.email}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        {user.isEnrolled ? (
                                                            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full">Enrolled</span>
                                                        ) : (
                                                            <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-500 rounded-full">Available</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                            {selectedUsers.length} user(s) selected
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleEnroll}
                        disabled={submitting || selectedUsers.length === 0}
                    >
                        {submitting ? 'Enrolling...' : `Enroll Selected Users`}
                    </Button>
                </div>
            </div>
        </div>
    );
}
