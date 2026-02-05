import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/TextInput';
import { Button } from '../../components/ui/Button';
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { API_URL } from '../../utils/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to send reset email');
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
                        <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                        <p className="text-zinc-400 text-sm">
                            We've sent a password reset link to <strong className="text-white">{email}</strong>
                        </p>
                        <p className="text-zinc-500 text-xs mt-2">
                            The link will expire in 10 minutes.
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-[#4a6fd3] transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Login
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
                        <EnvelopeIcon className="w-8 h-8 text-[#5f82f3]" />
                    </div>
                    <h2 className="text-center text-2xl font-bold text-white">
                        Forgot your password?
                    </h2>
                    <p className="text-center text-zinc-400 text-sm mt-2">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Email address"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                    />

                    <Button type="submit" disabled={loading} className="w-full justify-center">
                        {loading ? 'Sending...' : 'Send Reset Link'}
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
