import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../utils/api';
import {
    ShieldCheckIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function LearningPoliciesPage() {
    const [policies, setPolicies] = useState([
        {
            id: 1,
            name: 'Course Completion Deadline',
            description: 'Days allowed to complete a course after enrollment',
            value: '30',
            type: 'number',
            enabled: true
        },
        {
            id: 2,
            name: 'Passing Score',
            description: 'Minimum score required to pass assessments',
            value: '70',
            type: 'number',
            enabled: true
        },
        {
            id: 3,
            name: 'Certificate Auto-Generation',
            description: 'Automatically generate certificates on course completion',
            value: 'true',
            type: 'boolean',
            enabled: true
        },
        {
            id: 4,
            name: 'Allow Course Retakes',
            description: 'Allow learners to retake completed courses',
            value: 'true',
            type: 'boolean',
            enabled: true
        },
        {
            id: 5,
            name: 'Max Quiz Attempts',
            description: 'Maximum attempts allowed for quizzes',
            value: '3',
            type: 'number',
            enabled: true
        }
    ]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const updatePolicy = (id, field, value) => {
        setPolicies(policies.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 500));

        setMessage('Policies saved successfully');
        setSaving(false);

        setTimeout(() => setMessage(''), 3000);
    };

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
                    className="flex items-center gap-2 px-4 py-2 bg-[#5f82f3] text-white text-sm rounded-lg hover:bg-[#4a6fd3] transition-colors disabled:opacity-50"
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

            {/* Policies List */}
            <div className="space-y-4">
                {policies.map(policy => (
                    <div
                        key={policy.id}
                        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <ShieldCheckIcon className="w-5 h-5 text-[#5f82f3]" />
                                    <h3 className="text-sm font-medium text-[#e4e4ea]">{policy.name}</h3>
                                </div>
                                <p className="text-xs text-[#666] mb-4">{policy.description}</p>

                                {policy.type === 'boolean' ? (
                                    <button
                                        onClick={() => updatePolicy(policy.id, 'value', policy.value === 'true' ? 'false' : 'true')}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${policy.value === 'true' ? 'bg-[#5f82f3]' : 'bg-[#2a2a2a]'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${policy.value === 'true' ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                ) : (
                                    <input
                                        type="number"
                                        value={policy.value}
                                        onChange={(e) => updatePolicy(policy.id, 'value', e.target.value)}
                                        className="w-24 px-3 py-1.5 bg-[#0e0e0e] border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                                    />
                                )}
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={policy.enabled}
                                    onChange={(e) => updatePolicy(policy.id, 'enabled', e.target.checked)}
                                    className="sr-only"
                                />
                                <span className={`text-xs ${policy.enabled ? 'text-[#5dff4f]' : 'text-[#666]'}`}>
                                    {policy.enabled ? 'Active' : 'Disabled'}
                                </span>
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}
