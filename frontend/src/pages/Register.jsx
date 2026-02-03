import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { apiFetch } from '../utils/api';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [registrationDisabled, setRegistrationDisabled] = useState(false);
    const [checkingPolicy, setCheckingPolicy] = useState(true);

    const { register } = useAuth();
    const navigate = useNavigate();

    // Check if registration is disabled
    useEffect(() => {
        const checkRegistrationPolicy = async () => {
            try {
                const res = await apiFetch('/learning-policies');
                if (res.success) {
                    const policy = res.data.find(p => p.name === 'User Registration Disabled');
                    if (policy && policy.enabled && policy.value === 'true') {
                        setRegistrationDisabled(true);
                    }
                }
            } catch (err) {
                console.error('Failed to check registration policy:', err);
            } finally {
                setCheckingPolicy(false);
            }
        };
        checkRegistrationPolicy();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(name, email, password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (checkingPolicy) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (registrationDisabled) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black p-4">
                <div className="max-w-md w-full space-y-8 bg-zinc-900 p-8 rounded-xl border border-white/10 text-center">
                    <ExclamationTriangleIcon className="w-16 h-16 text-yellow-400 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Registration Disabled</h2>
                    <p className="text-zinc-400">
                        New user registrations are currently disabled on this platform.
                        Please contact an administrator for assistance.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block mt-4 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="max-w-md w-full space-y-8 bg-zinc-900 p-8 rounded-xl border border-white/10">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Create an account
                    </h2>
                    <p className="mt-2 text-center text-sm text-zinc-400">
                        Register as a learner to start your learning journey
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4 rounded-md shadow-sm">
                        {/* Input fields for signup */}
                        <Input
                            label="Full Name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                        />
                        <Input
                            label="Email address"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                        <Input
                            label="Password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                        />
                    </div>

                    <div>
                        <Button type="submit" disabled={loading} className="w-full justify-center">
                            {loading ? 'Creating account...' : 'Register'}
                        </Button>
                    </div>

                    <div className="text-center text-sm text-zinc-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-indigo-500 hover:text-indigo-400">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

