import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/Dialog';
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function UserDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [error, setError] = useState('');

    const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

    useEffect(() => {
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        try {
            const res = await apiFetch(`/users/${id}`);
            if (res.success) {
                setUser(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await apiFetch(`/users/${id}`, {
                method: 'PUT',
                body: {
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
            if (res.success) {
                navigate('/users');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        setError('');

        try {
            const res = await apiFetch(`/users/${id}`, {
                method: 'DELETE'
            });
            if (res.success) {
                navigate('/users');
            }
        } catch (err) {
            setError(err.message);
            setShowDeleteDialog(false);
        } finally {
            setDeleting(false);
        }
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

    if (!user) {
        return (
            <DashboardLayout>
                <div className="text-center py-16">
                    <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">User not found</h3>
                    <Link to="/users" className="text-indigo-400 hover:text-indigo-300">
                        Back to users
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                <Link to="/users" className="text-zinc-400 hover:text-white text-sm mb-4 inline-flex items-center">
                    ← Back to Users
                </Link>

                <div className="mt-4 mb-8">
                    <h1 className="text-3xl font-bold text-white">Edit User</h1>
                    <p className="text-zinc-400 mt-2">Update user information and role</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-6">
                        {/* User Avatar */}
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                                <p className="text-zinc-400">{user.email}</p>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={user.name}
                                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={user.email}
                                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Role</label>
                                <select
                                    value={user.role}
                                    onChange={(e) => setUser({ ...user, role: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="learner">Learner</option>
                                    <option value="trainer">Trainer</option>
                                    <option value="admin">Admin / HR</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Status</label>
                                <div className={`inline-flex px-3 py-1 rounded-full text-sm ${user.isActive !== false
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {user.isActive !== false ? 'Active' : 'Inactive'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Joined</label>
                                <p className="text-white">
                                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/users')}
                            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        {canDelete && user._id !== currentUser?.id && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteDialog(true)}
                                className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-colors"
                            >
                                Delete User
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
                <DialogContent className="bg-zinc-900 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                        <DialogTitle className="text-lg font-semibold text-white">Delete User</DialogTitle>
                    </div>
                    <p className="text-zinc-400 mb-6">
                        Are you sure you want to delete <strong className="text-white">{user.name}</strong>?
                        This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDeleteDialog(false)}
                            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

