import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Input } from '../../components/ui/TextInput';
import { Button } from '../../components/ui/Button';
import { LockClosedIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { API_URL } from '../../utils/api';

export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black p-4">
                <div className="max-w-md w-full space-y-8 bg-zinc-900 p-8 rounded-xl border border-white/10">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-[#5dff4f]/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircleIcon className="w-8 h-8 text-[#5dff4f]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful</h2>
                        <p className="text-zinc-400 text-sm">
                            Your password has been successfully reset. You can now log in with your new password.
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-[#4a6fd3] transition-colors"
                    >
                        Continue to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black p-4">
                <div className="max-w-md w-full space-y-8 bg-zinc-900 p-8 rounded-xl border border-white/10">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-[#ff4848]/10 rounded-full flex items-center justify-center mb-4">
                            <ExclamationTriangleIcon className="w-8 h-8 text-[#ff4848]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h2>
                        <p className="text-zinc-400 text-sm">
                            This password reset link is invalid. Please request a new one.
                        </p>
                    </div>
                    <Link
                        to="/forgot-password"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-[#4a6fd3] transition-colors"
                    >
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="max-w-md w-full space-y-8 bg-zinc-900 p-8 rounded-xl border border-white/10">
                <div>
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <LockClosedIcon className="w-8 h-8 text-[#5f82f3]" />
                    </div>
                    <h2 className="text-center text-2xl font-bold text-white">
                        Set New Password
                    </h2>
                    <p className="text-center text-zinc-400 text-sm mt-2">
                        Enter your new password below.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <Input
                        label="New Password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                    />

                    <Button type="submit" disabled={loading} className="w-full justify-center">
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>

                    <div className="text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-1 text-sm text-[#5f82f3] hover:text-[#4a6fd3]"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
