import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    PaintBrushIcon,
    PhotoIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function BrandingPage() {
    const [branding, setBranding] = useState({
        primaryColor: '#5f82f3',
        secondaryColor: '#2a2580',
        logoUrl: '',
        companyName: 'LMS Platform',
        tagline: 'Learn. Grow. Succeed.'
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 500));

        setMessage('Branding settings saved successfully');
        setSaving(false);

        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-[#e4e4ea]">Branding Settings</h1>
                    <p className="text-sm text-[#666]">Customize the platform appearance</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <h3 className="text-sm font-medium text-[#e4e4ea] mb-4">General</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-[#666] mb-2">Company Name</label>
                            <input
                                type="text"
                                value={branding.companyName}
                                onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                                className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#666] mb-2">Tagline</label>
                            <input
                                type="text"
                                value={branding.tagline}
                                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                                className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                            />
                        </div>
                    </div>
                </div>

                {/* Logo */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                    <h3 className="text-sm font-medium text-[#e4e4ea] mb-4">Logo</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg flex items-center justify-center">
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Logo" className="max-w-full max-h-full" />
                            ) : (
                                <PhotoIcon className="w-8 h-8 text-[#444]" />
                            )}
                        </div>
                        <div>
                            <button className="px-4 py-2 bg-[#0e0e0e] border border-[#2a2a2a] text-[#e4e4ea] text-sm rounded hover:border-[#5f82f3]/30 transition-colors">
                                Upload Logo
                            </button>
                            <p className="text-xs text-[#666] mt-2">PNG, JPG up to 2MB</p>
                        </div>
                    </div>
                </div>

                {/* Colors */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 lg:col-span-2">
                    <h3 className="text-sm font-medium text-[#e4e4ea] mb-4">Colors</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-[#666] mb-2">Primary Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={branding.primaryColor}
                                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                    className="w-10 h-10 rounded border-0 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={branding.primaryColor}
                                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                    className="flex-1 px-3 py-2 bg-[#0e0e0e] border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-[#666] mb-2">Secondary Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={branding.secondaryColor}
                                    onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                                    className="w-10 h-10 rounded border-0 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={branding.secondaryColor}
                                    onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                                    className="flex-1 px-3 py-2 bg-[#0e0e0e] border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
