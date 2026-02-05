import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';
import { API_URL } from '../utils/api';

export default function VerifyCertificatePage() {
    const [certificateId, setCertificateId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!certificateId.trim()) return;

        setLoading(true);
        setResult(null);
        setError('');

        try {
            const res = await fetch(`${API_URL}/certificates/verify/${certificateId}`);
            const data = await res.json();

            if (data.success) {
                setResult(data.data);
            } else {
                setError(data.message || 'Certificate not found');
            }
        } catch (err) {
            setError('Failed to verify certificate. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0e0e0e]">
            {/* Header */}
            <header className="border-b border-[#1a1a1a]">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <AcademicCapIcon className="w-7 h-7 text-[#5f82f3]" />
                        <span className="text-lg font-semibold text-[#e4e4ea]">LMS</span>
                    </Link>
                    <Link
                        to="/login"
                        className="text-sm text-[#888] hover:text-[#e4e4ea] transition-colors"
                    >
                        Sign In
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 py-16">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-[#e4e4ea] mb-2">
                        Certificate Verification
                    </h1>
                    <p className="text-sm text-[#666]">
                        Enter the certificate ID to verify its authenticity
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleVerify} className="mb-8">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#666]" />
                            <input
                                type="text"
                                value={certificateId}
                                onChange={(e) => setCertificateId(e.target.value)}
                                placeholder="Enter Certificate ID..."
                                className="w-full pl-12 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#e4e4ea] placeholder-[#666] focus:outline-none focus:border-[#5f82f3]"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary text-black rounded-lg hover:bg-[#4a6fd3] transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                    </div>
                </form>

                {/* Result */}
                {result && (
                    <div className="bg-[#1a1a1a] border border-[#5dff4f]/30 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircleIcon className="w-8 h-8 text-[#5dff4f]" />
                            <div>
                                <h2 className="text-lg font-medium text-[#5dff4f]">Valid Certificate</h2>
                                <p className="text-xs text-[#666]">This certificate is authentic</p>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-[#2a2a2a]">
                                <span className="text-[#888]">Recipient</span>
                                <span className="text-[#e4e4ea]">{result.userName}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-[#2a2a2a]">
                                <span className="text-[#888]">Course</span>
                                <span className="text-[#e4e4ea]">{result.courseTitle}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-[#2a2a2a]">
                                <span className="text-[#888]">Instructor</span>
                                <span className="text-[#e4e4ea]">{result.instructorName}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-[#888]">Completed On</span>
                                <span className="text-[#e4e4ea]">{result.completedAt}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-[#1a1a1a] border border-[#ff4848]/30 rounded-lg p-6">
                        <div className="flex items-center gap-3">
                            <XCircleIcon className="w-8 h-8 text-[#ff4848]" />
                            <div>
                                <h2 className="text-lg font-medium text-[#ff4848]">Invalid Certificate</h2>
                                <p className="text-sm text-[#888]">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info */}
                <div className="mt-8 text-center text-xs text-[#666]">
                    <p>Certificate IDs can be found at the bottom of each certificate.</p>
                </div>
            </main>
        </div>
    );
}
