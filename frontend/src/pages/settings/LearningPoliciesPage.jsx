import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../utils/api';
import {
    ShieldCheckIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function LearningPoliciesPage() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const res = await apiFetch('/learning-policies');
            if (res.success) {
                setPolicies(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch policies:', err);
            setError('Failed to load policies');
        } finally {
            setLoading(false);
        }
    };

    const updatePolicy = (id, field, value) => {
        setPolicies(policies.map(p =>
            p._id === id ? { ...p, [field]: value } : p
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        setError('');

        try {
            const res = await apiFetch('/learning-policies', {
                method: 'PUT',
                body: { policies }
            });

            if (res.success) {
                setPolicies(res.data);
                setMessage('Policies saved successfully');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            console.error('Failed to save policies:', err);
            setError('Failed to save policies');
            setTimeout(() => setError(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5f82f3] border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-[#e4e4ea]">Learning Policies</h1>
                    <p className="text-sm text-[#666]">Configure organization-wide learning rules</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-[#5f82f3] text-black text-sm rounded-lg hover:bg-[#4a6fd3] transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Success Message */}
            {message && (
                <div className="mb-6 p-3 bg-[#5dff4f]/10 border border-[#5dff4f]/30 rounded-lg flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-[#5dff4f]" />
                    <span className="text-sm text-[#5dff4f]">{message}</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-3 bg-[#ff4848]/10 border border-[#ff4848]/30 rounded-lg flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-[#ff4848]" />
                    <span className="text-sm text-[#ff4848]">{error}</span>
                </div>
            )}

            {/* Policies List */}
            <div className="space-y-4">
                {policies.map(policy => (
                    <div
                        key={policy._id}
                        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShieldCheckIcon className={`w-5 h-5 ${policy.value === 'true' || (policy.type === 'number' && parseInt(policy.value) > 0) ? 'text-[#5f82f3]' : 'text-[#666]'}`} />
                                <div>
                                    <h3 className="text-sm font-medium text-[#e4e4ea]">{policy.name}</h3>
                                    <p className="text-xs text-[#666] mt-0.5">{policy.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {policy.type === 'boolean' ? (
                                    <>
                                        <span className={`text-xs font-medium ${policy.value === 'true' ? 'text-[#5dff4f]' : 'text-[#666]'}`}>
                                            {policy.value === 'true' ? 'Enabled' : 'Disabled'}
                                        </span>
                                        <button
                                            onClick={() => updatePolicy(policy._id, 'value', policy.value === 'true' ? 'false' : 'true')}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${policy.value === 'true' ? 'bg-[#5f82f3]' : 'bg-[#2a2a2a]'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${policy.value === 'true' ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={policy.value}
                                            onChange={(e) => updatePolicy(policy._id, 'value', e.target.value)}
                                            min="0"
                                            max="100"
                                            className="w-20 px-3 py-1.5 bg-[#0e0e0e] border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] text-center focus:outline-none focus:border-[#5f82f3]"
                                        />
                                        <span className="text-xs text-[#666]">%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}

