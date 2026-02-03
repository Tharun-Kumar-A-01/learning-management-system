import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
    TrophyIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

// Helper function for progress colors
const getProgressColor = (progress) => {
    if (progress === 100) return '#5dff4f';
    if (progress === 0) return '#ff4848';
    if (progress < 70) return '#ffb84d';
    return '#5f82f3';
};

export default function CertificatesPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(null);
    const [certificatesEnabled, setCertificatesEnabled] = useState(true);

    useEffect(() => {
        fetchCompletedCourses();
    }, []);

    const fetchCompletedCourses = async () => {
        try {
            setLoading(true);
            const [coursesRes, policiesRes] = await Promise.all([
                apiFetch('/courses/enrolled?completedOnly=true'),
                apiFetch('/learning-policies')
            ]);

            if (coursesRes.success) {
                setCourses(coursesRes.data);
            }

            // Check certificate policy
            if (policiesRes.success) {
                const certPolicy = policiesRes.data.find(p => p.name === 'Certificate Auto-Generation');
                // Store policy in state or check directly. 
                // Since this is a simple page, let's filter the courses or disable generation if policy is off.
                // However, the best UX is to show the certificates but maybe disable download or hide them?
                // The user said: "turning off auto certificate generation, will not allow learner download certificates".

                if (certPolicy && (certPolicy.value === 'false' || !certPolicy.enabled)) {
                    // If policy is disabled, we can either clear courses or add a flag
                    // For now, let's just clear courses so they see "No certificates yet" 
                    // OR we can keep them but disable the button. Let's disable the button.
                    setCertificatesEnabled(false);
                } else {
                    setCertificatesEnabled(true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Formal white background certificate design
    const generateCertificate = async (course) => {
        setGenerating(course._id);

        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 700;
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Decorative border
        ctx.strokeStyle = '#1a365d';
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
        ctx.strokeStyle = '#c5a572';
        ctx.lineWidth = 2;
        ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);

        // Header
        ctx.fillStyle = '#1a365d';
        ctx.font = 'bold 42px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 120);

        // Decorative line
        ctx.strokeStyle = '#c5a572';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(250, 145);
        ctx.lineTo(750, 145);
        ctx.stroke();

        // This certifies that
        ctx.fillStyle = '#333333';
        ctx.font = 'italic 18px Georgia';
        ctx.fillText('This is to certify that', canvas.width / 2, 200);

        // User name
        ctx.fillStyle = '#1a365d';
        ctx.font = 'bold 36px Georgia';
        ctx.fillText(user?.name || 'Student', canvas.width / 2, 255);

        // Has completed
        ctx.fillStyle = '#333333';
        ctx.font = 'italic 18px Georgia';
        ctx.fillText('has successfully completed the course', canvas.width / 2, 310);

        // Course title
        ctx.fillStyle = '#1a365d';
        ctx.font = 'bold 28px Georgia';
        const courseTitle = course.title.length > 50 ? course.title.substring(0, 47) + '...' : course.title;
        ctx.fillText(courseTitle, canvas.width / 2, 365);

        // Instructor line
        ctx.fillStyle = '#333333';
        ctx.font = 'italic 16px Georgia';
        ctx.fillText('under the instruction of', canvas.width / 2, 420);

        ctx.fillStyle = '#1a365d';
        ctx.font = '20px Georgia';
        ctx.fillText(course.createdBy?.name || 'Course Instructor', canvas.width / 2, 455);

        // Completion date
        const completionDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        ctx.fillStyle = '#666666';
        ctx.font = '16px Georgia';
        ctx.fillText(`Awarded on ${completionDate}`, canvas.width / 2, 520);

        // Decorative line before footer
        ctx.strokeStyle = '#c5a572';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(200, 560);
        ctx.lineTo(800, 560);
        ctx.stroke();

        // Certificate ID and verification
        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial';
        ctx.fillText(`Certificate ID: ${course._id}-${user?.id}`, canvas.width / 2, 600);

        // Download
        const link = document.createElement('a');
        link.download = `certificate-${course.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        setGenerating(null);
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
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-[#e4e4ea]">My Certificates</h1>
                <p className="text-sm text-[#666]">Download certificates for completed courses</p>
            </div>

            {/* Certificates */}
            {courses.length === 0 ? (
                <div className="text-center py-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                    <TrophyIcon className="w-12 h-12 text-[#444] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[#e4e4ea] mb-2">No certificates yet</h3>
                    <p className="text-sm text-[#666]">Complete courses to earn certificates</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course) => (
                        <div
                            key={course._id}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden"
                        >
                            {/* Certificate Preview */}
                            <div className="h-32 bg-[#5dff4f]/15 border-b border-[#2a2a2a] flex items-center justify-center relative">
                                <div className="text-center">
                                    <TrophyIcon className="w-10 h-10 text-[#5dff4f] mx-auto mb-2" />
                                    <span className="text-xs text-white font-medium">Certificate Earned</span>
                                </div>
                                <div className="absolute top-2 right-2">
                                    <CheckCircleIcon className="w-5 h-5 text-[#5dff4f]" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="text-sm font-medium text-[#e4e4ea] mb-2 line-clamp-2">
                                    {course.title}
                                </h3>

                                {/* Instructor */}
                                <p className="text-xs text-[#666] mb-3">
                                    By {course.createdBy?.name || 'Instructor'}
                                </p>

                                {/* Progress */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[#888]">Progress</span>
                                        <span style={{ color: getProgressColor(100) }}>100%</span>
                                    </div>
                                    <div className="h-1.5 bg-[#0e0e0e] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full w-full"
                                            style={{ backgroundColor: getProgressColor(100) }}
                                        />
                                    </div>
                                </div>

                                {/* Download Button */}
                                {certificatesEnabled ? (
                                    <button
                                        onClick={() => generateCertificate(course)}
                                        disabled={generating === course._id}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#5dff4f] text-[#0e0e0e] text-sm font-medium rounded hover:bg-[#4de63e] transition-colors disabled:opacity-50"
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                        {generating === course._id ? 'Generating...' : 'Download Certificate'}
                                    </button>
                                ) : (
                                    <div className="w-full px-4 py-2 bg-[#2a2a2a] text-[#666] text-sm font-medium rounded text-center cursor-not-allowed">
                                        Certificate Downloads Disabled
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Verify Link */}
            <div className="mt-8 text-center absolute bottom-0">
                <p className="text-xs text-[#666]">
                    Need to verify a certificate?{' '}
                    <Link to="/verify" className="text-[#5f82f3] hover:underline">
                        Visit our verification page
                    </Link>
                </p>
            </div>
        </DashboardLayout>
    );
}
