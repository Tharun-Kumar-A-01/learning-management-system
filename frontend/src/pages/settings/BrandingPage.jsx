import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../utils/api';
import {
    PaintBrushIcon,
    PhotoIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function BrandingPage() {
    const [branding, setBranding] = useState({
        primaryColor: '#5f82f3',
        secondaryColor: '#2a2580',
        logoUrl: '',
        companyName: 'LMS Platform',
        tagline: 'Learn. Grow. Succeed.'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await apiFetch('/site-settings');
            if (res.success && res.data) {
                setBranding({
                    primaryColor: res.data.primaryColor || '#5f82f3',
                    secondaryColor: res.data.secondaryColor || '#2a2580',
                    logoUrl: res.data.logoUrl || '',
                    companyName: res.data.companyName || 'LMS Platform',
                    tagline: res.data.tagline || 'Learn. Grow. Succeed.'
                });
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                setError('Logo file must be under 2MB');
                setTimeout(() => setError(''), 3000);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setBranding({ ...branding, logoUrl: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setBranding({ ...branding, logoUrl: '' });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        setError('');

        try {
            const res = await apiFetch('/site-settings', {
                method: 'PUT',
                body: branding
            });

            if (res.success) {
                setMessage('Branding settings saved successfully');
                setTimeout(() => setMessage(''), 3000);
            } else {
                throw new Error(res.message || 'Failed to save');
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
            setError(err.message || 'Failed to save branding settings');
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
                    <h1 className="text-xl font-semibold text-[#e4e4ea]">Branding Settings</h1>
                    <p className="text-sm text-[#666]">Customize the platform appearance</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm rounded-lg hover:bg-[#4a6fd3] transition-colors disabled:opacity-50"
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
                        <div className="w-20 h-20 bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg flex items-center justify-center overflow-hidden">
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <PhotoIcon className="w-8 h-8 text-[#444]" />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="px-4 py-2 bg-[#0e0e0e] border border-[#2a2a2a] text-[#e4e4ea] text-sm rounded hover:border-[#5f82f3]/30 transition-colors cursor-pointer">
                                Upload Logo
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                            </label>
                            {branding.logoUrl && (
                                <button
                                    onClick={handleRemoveLogo}
                                    className="px-4 py-2 bg-[#ff4848]/10 border border-[#ff4848]/30 text-[#ff4848] text-sm rounded hover:bg-[#ff4848]/20 transition-colors"
                                >
                                    Remove
                                </button>
                            )}
                            <p className="text-xs text-[#666]">PNG, JPG, SVG up to 2MB</p>
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

                    {/* Color Preview */}
                    <div className="mt-6 pt-4 border-t border-[#2a2a2a]">
                        <h4 className="text-xs text-[#666] mb-3">Preview</h4>
                        <div className="flex items-center gap-4">
                            <button
                                className="px-4 py-2 rounded-lg text-black text-sm font-medium"
                                style={{ backgroundColor: branding.primaryColor }}
                            >
                                Primary Button
                            </button>
                            <button
                                className="px-4 py-2 rounded-lg text-black text-sm font-medium"
                                style={{ backgroundColor: branding.secondaryColor }}
                            >
                                Secondary Button
                            </button>
                            <div
                                className="w-8 h-8 rounded-full"
                                style={{ backgroundColor: branding.primaryColor }}
                            />
                            <div
                                className="w-8 h-8 rounded-full"
                                style={{ backgroundColor: branding.secondaryColor }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
