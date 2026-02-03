import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, UsersIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import ImportUsersModal from '../../components/users/ImportUsersModal';

export default function UsersListPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await apiFetch('/users');
            if (res.success) {
                setUsers(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleStatusChange = async (userId, isActive) => {
        try {
            await apiFetch(`/users/${userId}/status`, {
                method: 'PUT',
                body: { isActive }
            });
            fetchUsers();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const getRoleColor = (role) => {
        const colors = {
            super_admin: 'bg-purple-500/20 text-purple-400',
            admin: 'bg-blue-500/20 text-blue-400',
            trainer: 'bg-green-500/20 text-green-400',
            learner: 'bg-zinc-500/20 text-zinc-400'
        };
        return colors[role] || colors.learner;
    };

    const getRoleLabel = (role) => {
        const labels = {
            super_admin: 'Super Admin',
            admin: 'Admin / HR',
            trainer: 'Trainer',
            learner: 'Learner'
        };
        return labels[role] || role;
    };

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
                    <h1 className="text-3xl font-bold text-white">User Management</h1>
                    <p className="text-zinc-400 mt-2">Manage users and their roles</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Import CSV
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-black rounded-lg text-sm font-medium transition-colors"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'learner', 'trainer', 'admin', 'super_admin'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${roleFilter === role
                                ? 'bg-indigo-500 text-black'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            {role === 'all' ? 'All' : getRoleLabel(role)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-900/50 rounded-lg border border-white/10 p-4 text-center">
                    <div className="text-2xl font-bold text-white">{users.length}</div>
                    <div className="text-sm text-zinc-500">Total Users</div>
                </div>
                <div className="bg-zinc-900/50 rounded-lg border border-white/10 p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                        {users.filter(u => u.role === 'learner').length}
                    </div>
                    <div className="text-sm text-zinc-500">Learners</div>
                </div>
                <div className="bg-zinc-900/50 rounded-lg border border-white/10 p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                        {users.filter(u => u.role === 'trainer').length}
                    </div>
                    <div className="text-sm text-zinc-500">Trainers</div>
                </div>
                <div className="bg-zinc-900/50 rounded-lg border border-white/10 p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                        {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
                    </div>
                    <div className="text-sm text-zinc-500">Admins</div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-zinc-900/50 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">User</th>
                            <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Role</th>
                            <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Status</th>
                            <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Joined</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-zinc-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user._id} className="border-b border-white/5 hover:bg-zinc-800/50">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{user.name}</div>
                                            <div className="text-sm text-zinc-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap ${getRoleColor(user.role)}`}>
                                        {getRoleLabel(user.role)}
                                    </span>
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${user.isActive !== false
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {user.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-sm text-zinc-400">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            to={`/users/${user._id}`}
                                            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleStatusChange(user._id, user.isActive === false)}
                                            className={`px-3 py-1 rounded text-sm transition-colors ${user.isActive !== false
                                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                }`}
                                        >
                                            {user.isActive !== false ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <UsersIcon className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                        <p className="text-zinc-400">No users found</p>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <AddUserModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchUsers();
                    }}
                />
            )}

            {/* Import Users Modal */}
            {showImportModal && (
                <ImportUsersModal
                    onClose={() => setShowImportModal(false)}
                    onSuccess={() => {
                        setShowImportModal(false);
                        fetchUsers();
                    }}
                />
            )}
        </DashboardLayout>
    );
}

function AddUserModal({ onClose, onSuccess }) {
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'learner'
    });

    // Role options based on current user's role
    const getRoleOptions = () => {
        if (currentUser?.role === 'super_admin') {
            return [
                { value: 'learner', label: 'Learner' },
                { value: 'trainer', label: 'Trainer' },
                { value: 'admin', label: 'Admin / HR' }
            ];
        }
        // Regular admin can only create trainers and learners
        return [
            { value: 'learner', label: 'Learner' },
            { value: 'trainer', label: 'Trainer' }
        ];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await apiFetch('/users', {
                method: 'POST',
                body: form
            });
            if (res.success) {
                onSuccess();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 rounded-xl border border-white/10 p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-white mb-6">Add New User</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Role</label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        >
                            {getRoleOptions().map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
