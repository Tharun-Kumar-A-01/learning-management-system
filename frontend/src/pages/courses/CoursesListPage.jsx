import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ManualEnrollModal from '../../components/courses/ManualEnrollModal';
import { useAuth } from '../../context/AuthContext';
import {
    BookOpenIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    UsersIcon,
    Squares2X2Icon,
    UserIcon,
    TagIcon,
    ArrowDownTrayIcon,
    EyeSlashIcon,
    ArrowUpOnSquareIcon,
    PencilSquareIcon,
    EyeIcon,
    TrashIcon,
    PlayIcon,
    UserPlusIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

// Helper function for progress colors
const getProgressColor = (progress) => {
    if (progress === 100) return '#5dff4f';
    if (progress === 0) return '#ff4848';
    if (progress < 70) return '#ffb84d';
    return '#5f82f3';
};

export default function CoursesListPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [enrollModal, setEnrollModal] = useState({ isOpen: false, courseId: null, courseTitle: '' });
    const { user } = useAuth();

    const isTrainerOrAdmin = ['trainer', 'admin', 'super_admin'].includes(user?.role);
    const isLearner = user?.role === 'learner';

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await apiFetch('/courses');
            if (res.success) {
                setCourses(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
            course.description?.toLowerCase().includes(search.toLowerCase());

        if (filter === 'all') return matchesSearch;
        if (filter === 'enrolled') return matchesSearch && course.isEnrolled;
        if (filter === 'available') return matchesSearch && !course.isEnrolled;
        if (filter === 'completed') return matchesSearch && course.progress === 100;
        return matchesSearch;
    });

    const handleEnroll = async (courseId) => {
        try {
            await apiFetch(`/courses/${courseId}/enroll`, { method: 'POST' });
            fetchCourses();
        } catch (error) {
            console.error('Failed to enroll:', error);
        }
    };

    const handlePublish = async (courseId) => {
        try {
            await apiFetch(`/courses/${courseId}/publish`, { method: 'PUT' });
            fetchCourses();
        } catch (error) {
            console.error('Failed to publish:', error);
        }
    };

    const handleDelete = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }
        try {
            await apiFetch(`/courses/${courseId}`, { method: 'DELETE' });
            fetchCourses();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    // Certificate generation - Formal white background design
    const downloadCertificate = (course) => {
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

        const link = document.createElement('a');
        link.download = `certificate-${course.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
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
                    <h1 className="text-xl font-semibold text-[#e4e4ea]">Courses</h1>
                    <p className="text-sm text-[#666]">
                        {isTrainerOrAdmin ? 'Manage and create courses' : 'Browse and enroll in courses'}
                    </p>
                </div>
                {isTrainerOrAdmin && (
                    <Link
                        to="/courses/create"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm rounded-lg hover:bg-[#4a6fd3] transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Create Course
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-[#e4e4ea] placeholder-[#666] focus:outline-none focus:border-[#5f82f3]"
                    />
                </div>
                {isLearner && (
                    <div className="flex gap-2">
                        {['all', 'enrolled', 'available', 'completed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === f
                                    ? 'bg-primary text-black'
                                    : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-[#e4e4ea]'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Courses Grid */}
            {filteredCourses.length === 0 ? (
                <div className="text-center py-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                    <BookOpenIcon className="w-12 h-12 text-[#444] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[#e4e4ea] mb-2">No courses found</h3>
                    <p className="text-sm text-[#666]">
                        {search ? 'Try a different search term' : 'No courses available yet'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCourses.map((course) => (
                        <div
                            key={course._id}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-[#5f82f3]/30 transition-colors flex flex-col"
                        >
                            {/* Thumbnail */}
                            <div className="h-32 bg-[#0e0e0e] flex items-center justify-center flex-shrink-0">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <BookOpenIcon className="w-10 h-10 text-[#333]" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-1">
                                {/* Title & Tags */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="text-sm font-medium text-[#e4e4ea] line-clamp-1 flex-1">{course.title}</h3>
                                    <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
                                        {isTrainerOrAdmin && course.status === 'draft' && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-[#ffb84d]/10 text-[#ffb84d]">
                                                Draft
                                            </span>
                                        )}
                                        {course.isMandatory && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-[#ffb84d]/20 text-[#ffb84d] border border-[#ffb84d]/30">
                                                Mandatory
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 text-xs rounded ${course.difficulty === 'beginner' ? 'bg-[#5dff4f]/10 text-[#5dff4f]' :
                                            course.difficulty === 'intermediate' ? 'bg-[#ffb84d]/10 text-[#ffb84d]' :
                                                'bg-[#ff4848]/10 text-[#ff4848]'
                                            }`}>
                                            {course.difficulty}
                                        </span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-[#666] line-clamp-2 mb-3 min-h-[32px]">{course.description}</p>

                                {/* Category & Author */}
                                <div className="flex items-center gap-3 text-xs text-[#666] mb-3">
                                    <span className="flex items-center gap-1">
                                        <TagIcon className="w-3 h-3" />
                                        {course.category || 'General'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <UserIcon className="w-3 h-3" />
                                        {course.createdBy?.name || 'Unknown'}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-3 text-xs text-[#666] mb-3">
                                    <span className="flex items-center gap-1">
                                        <Squares2X2Icon className="w-3 h-3" />
                                        {course.totalModules || 0} modules
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <UsersIcon className="w-3 h-3" />
                                        {course.enrolledCount || 0} enrolled
                                    </span>
                                </div>

                                {/* Deadline days remaining - positioned prominently */}
                                {course.isEnrolled && course.deadline && (() => {
                                    const daysLeft = Math.ceil((new Date(course.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                                    const isPast = daysLeft < 0;
                                    const isUrgent = daysLeft <= 5 && daysLeft >= 0;
                                    return (
                                        <div className={`text-xs mb-3 flex items-center gap-1.5 px-2 py-1 rounded-md ${isPast ? 'bg-red-500/10 text-red-500' : isUrgent ? 'bg-red-500/10 text-red-500' : 'bg-[#2a2a2a] text-[#888]'}`}>
                                            <ClockIcon className="w-3.5 h-3.5" />
                                            {isPast
                                                ? `Deadline passed (${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago)`
                                                : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                                            }
                                        </div>
                                    );
                                })()}

                                {/* Progress bar for enrolled courses */}
                                {course.isEnrolled && (
                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-[#888]">Progress</span>
                                            <span style={{ color: getProgressColor(course.progress || 0) }}>
                                                {Math.round(course.progress || 0)}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full rounded-full transition-all duration-500 ease-out"
                                                style={{
                                                    width: `${course.progress || 0}%`,
                                                    backgroundColor: getProgressColor(course.progress || 0)
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Spacer */}
                                <div className="flex-1"></div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 mt-auto">
                                    {course.isEnrolled && course.progress === 100 ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => downloadCertificate(course)}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#5dff4f] text-[#0e0e0e] text-xs font-semibold rounded-lg hover:bg-[#4de63e] transition-colors"
                                            >
                                                <ArrowDownTrayIcon className="w-4 h-4" />
                                                Certificate
                                            </button>
                                            <Link
                                                to={`/courses/${course._id}`}
                                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#2a2a2a] text-[#e4e4ea] text-xs rounded-lg hover:bg-[#333] transition-colors"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    ) : course.isEnrolled ? (
                                        <Link
                                            to={`/courses/${course._id}`}
                                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary text-black text-xs font-medium rounded-lg hover:bg-[#4a6fd3] transition-colors"
                                        >
                                            <PlayIcon className="w-4 h-4" />
                                            Continue Learning
                                        </Link>
                                    ) : isLearner ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEnroll(course._id)}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#5dff4f] text-[#0e0e0e] text-xs font-semibold rounded-lg hover:bg-[#4de63e] transition-colors"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                Enroll Now
                                            </button>
                                            <Link
                                                to={`/courses/${course._id}`}
                                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#2a2a2a] text-[#e4e4ea] text-xs rounded-lg hover:bg-[#333] transition-colors"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    ) : isTrainerOrAdmin ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                {course.status === 'draft' ? (
                                                    <button
                                                        onClick={() => handlePublish(course._id)}
                                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#5dff4f] text-[#0e0e0e] text-xs font-semibold rounded-lg hover:bg-[#4de63e] transition-colors"
                                                    >
                                                        <ArrowUpOnSquareIcon className="w-4 h-4" />
                                                        Publish Course
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setEnrollModal({ isOpen: true, courseId: course._id, courseTitle: course.title })}
                                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#5f82f3] text-black text-xs font-semibold rounded-lg hover:bg-[#4a6fd3] transition-colors"
                                                    >
                                                        <UserPlusIcon className="w-4 h-4" />
                                                        Manual Enroll
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Link
                                                    to={`/courses/${course._id}/edit`}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary text-black text-xs font-medium rounded-lg hover:bg-[#4a6fd3] transition-colors"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                    Edit
                                                </Link>
                                                <Link
                                                    to={`/courses/${course._id}`}
                                                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#2a2a2a] text-[#e4e4ea] text-xs rounded-lg hover:bg-[#333] transition-colors"
                                                >
                                                    View
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <Link
                                            to={`/courses/${course._id}`}
                                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-[#4a6fd3] transition-colors"
                                        >
                                            View Course
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Manual Enroll Modal */}
            <ManualEnrollModal
                isOpen={enrollModal.isOpen}
                onClose={() => setEnrollModal({ ...enrollModal, isOpen: false })}
                courseId={enrollModal.courseId}
                courseTitle={enrollModal.courseTitle}
            />
        </DashboardLayout>
    );
}

