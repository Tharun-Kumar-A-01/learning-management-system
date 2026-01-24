import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/SelectInput';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('learner');
    const [error, setError] = useState('');

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(name, email, password, role);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="max-w-md w-full space-y-8 bg-zinc-900 p-8 rounded-xl border border-white/10">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Create an account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4 rounded-md shadow-sm">
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
                        <Select label="I am a" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="learner">Learner</option>
                            <option value="trainer">Trainer</option>
                            <option value="admin">Admin</option>
                        </Select>
                    </div>

                    <div>
                        <Button type="submit" className="w-full justify-center">
                            Register
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
