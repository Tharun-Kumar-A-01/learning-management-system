import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/Dialog';
import {
    ArrowLeftIcon,
    BookOpenIcon,
    ClockIcon,
    PlayCircleIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    QuestionMarkCircleIcon,
    ExclamationTriangleIcon,
    EyeSlashIcon,
    ArrowUpOnSquareIcon,
    ArrowDownTrayIcon,
    PencilSquareIcon,
    TrashIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import {
    CheckCircleIcon as CheckCircleSolid,
    ExclamationTriangleIcon as ExclamationTriangleSolid,
    TrashIcon as TrashSolid,
    XMarkIcon as XMarkSolid,
    PaperClipIcon,
    CloudArrowUpIcon,
    DocumentIcon
} from '@heroicons/react/24/solid';

// Helper function for progress colors
const getProgressColor = (progress) => {
    if (progress === 100) return '#5dff4f';
    if (progress === 0) return '#ff4848';
    if (progress < 70) return '#ffb84d';
    return '#5f82f3';
};

// Check if URL is embeddable video
const getVideoEmbedUrl = (url) => {
    if (!url) return null;

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Direct video URL
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
        return url;
    }

    return null;
};

export default function CourseDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModule, setActiveModule] = useState(0);
    const [activeLesson, setActiveLesson] = useState(0);
    const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);
    const [unenrolling, setUnenrolling] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Quiz state
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizResults, setQuizResults] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [appealReason, setAppealReason] = useState('');
    const [showAppealModal, setShowAppealModal] = useState(false);
    const [submittingAppeal, setSubmittingAppeal] = useState(false);
    const lastLessonId = useRef(null);

    const isOwner = course?.createdBy?._id === user?.id || course?.createdBy === user?.id;
    const isTrainer = user?.role === 'trainer';
    const canEdit = (isTrainer && isOwner) || ['admin', 'super_admin'].includes(user?.role);
    const canPublish = ((isTrainer && isOwner) || ['admin', 'super_admin'].includes(user?.role)) && course?.status === 'draft';
    const isLearner = user?.role === 'learner';

    useEffect(() => {
        fetchCourse();
    }, [id]);

    // Reset quiz state ONLY when lesson actually changes
    useEffect(() => {
        const currentLesson = course?.modules?.[activeModule]?.lessons?.[activeLesson];
        if (currentLesson && currentLesson._id !== lastLessonId.current) {
            setQuizAnswers({});
            setQuizStarted(false);
            setQuizSubmitted(false);
            setQuizResults(null);
            setTimeRemaining(null);
            setPreviewMode(false);
            setAppealReason('');
            setShowAppealModal(false);
            lastLessonId.current = currentLesson._id;
        }
    }, [activeModule, activeLesson, course]);

    // Load existing quiz results if any (runs when course data updates or lesson changes)
    useEffect(() => {
        if (course) {
            const currentLesson = course.modules?.[activeModule]?.lessons?.[activeLesson];
            if (currentLesson) {
                // Try direct results first (learners get this), then search enrollments (trainers see all)
                let result = course.quizResults?.find(r => r.lessonId === currentLesson._id);

                if (!result && course.enrollments) {
                    const enrollment = course.enrollments.find(e => e.userId === user?.id || e.userId?._id === user?.id);
                    if (enrollment && enrollment.quizResults) {
                        result = enrollment.quizResults.find(r => r.lessonId === currentLesson._id);
                    }
                }

                if (result) {
                    setQuizResults({
                        ...result,
                        attemptsLeft: currentLesson.maxAttempts > 0 ? Math.max(0, (currentLesson.maxAttempts + (result.appeal?.status === 'approved' ? 3 : 0)) - result.attempts.length) : null,
                        percentage: result.bestScore,
                        passed: result.isPassed,
                        appealStatus: result.appeal?.status || 'none'
                    });
                    if (result.isPassed || (currentLesson.maxAttempts > 0 && result.attempts.length >= (currentLesson.maxAttempts + (result.appeal?.status === 'approved' ? 3 : 0)))) {
                        setQuizSubmitted(true);
                    }
                } else if (course.assessmentResults) {
                    // Try assessment results
                    const assessmentResult = course.assessmentResults.find(r => r.lessonId === currentLesson._id);
                    if (assessmentResult) {
                        setQuizResults({
                            ...assessmentResult,
                            passed: assessmentResult.isPassed,
                            percentage: assessmentResult.score,
                            appealStatus: assessmentResult.appeal?.status || 'none',
                            status: assessmentResult.status,
                            type: 'assessment'
                        });
                        if (assessmentResult.status === 'passed' || assessmentResult.status === 'failed' || assessmentResult.status === 'graded') {
                            // Do not set quizSubmitted=true for assessments, as AssessmentView handles results
                        }
                    }
                }
            }
        }
    }, [activeModule, activeLesson, course]);

    // Timer effect
    useEffect(() => {
        if (quizStarted && timeRemaining !== null && timeRemaining > 0 && !quizSubmitted) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeRemaining === 0 && !quizSubmitted) {
            handleQuizSubmit();
        }
    }, [quizStarted, timeRemaining, quizSubmitted]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const fetchCourse = async () => {
        try {
            const res = await apiFetch(`/courses/${id}`);
            if (res.success) {
                setCourse(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch course:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        try {
            await apiFetch(`/courses/${id}/enroll`, { method: 'POST' });
            fetchCourse();
        } catch (error) {
            console.error('Failed to enroll:', error);
        }
    };

    const handleUnenroll = async () => {
        setUnenrolling(true);
        try {
            await apiFetch(`/courses/${id}/enroll`, { method: 'DELETE' });
            setShowUnenrollDialog(false);
            fetchCourse();
        } catch (error) {
            console.error('Failed to unenroll:', error);
        } finally {
            setUnenrolling(false);
        }
    };

    const handlePublish = async () => {
        try {
            await apiFetch(`/courses/${id}/publish`, { method: 'PUT' });
            fetchCourse();
        } catch (error) {
            console.error('Failed to publish:', error);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await apiFetch(`/courses/${id}`, { method: 'DELETE' });
            setShowDeleteDialog(false);
            navigate('/courses');
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setDeleting(false);
        }
    };

    const handleLessonComplete = async (lessonId) => {
        if (!course.isEnrolled) return;

        try {
            const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
            const completedLessons = [...(course.completedLessons || []), lessonId];
            const newProgress = Math.round((completedLessons.length / totalLessons) * 100);

            await apiFetch(`/courses/${id}/progress`, {
                method: 'PUT',
                body: { lessonId, progress: newProgress }
            });
            fetchCourse();
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    };

    const handleQuizAnswer = (questionIndex, answerIndex) => {
        if (quizSubmitted) return;
        setQuizAnswers(prev => ({
            ...prev,
            [questionIndex]: answerIndex
        }));
    };

    const startQuiz = () => {
        const currentLesson = course.modules?.[activeModule]?.lessons?.[activeLesson];
        setQuizAnswers({});
        setQuizSubmitted(false);
        if (currentLesson?.timeLimit > 0) {
            setTimeRemaining(currentLesson.timeLimit * 60);
        }
        setQuizStarted(true);
    };

    const handleAppealSubmit = async () => {
        const currentLesson = course.modules?.[activeModule]?.lessons?.[activeLesson];
        if (!appealReason || !currentLesson) return;

        setSubmittingAppeal(true);
        try {
            const type = currentLesson.type === 'quiz' ? 'quiz' : 'assessment';
            const res = await apiFetch(`/courses/${id}/${type}/${currentLesson._id}/appeal`, {
                method: 'POST',
                body: { reason: appealReason }
            });

            if (res.success) {
                setShowAppealModal(false);
                setAppealReason('');
                fetchCourse();
            }
        } catch (error) {
            console.error('Failed to submit appeal:', error);
        } finally {
            setSubmittingAppeal(false);
        }
    };

    const handleAssessmentSubmit = async (fileBase64) => {
        const currentLesson = course.modules?.[activeModule]?.lessons?.[activeLesson];
        if (!currentLesson) return;

        try {
            const res = await apiFetch(`/courses/${id}/assessment/${currentLesson._id}/submit`, {
                method: 'POST',
                body: { submissionFile: fileBase64 }
            });
            if (res.success) {
                fetchCourse();
            }
        } catch (error) {
            console.error('Failed to submit assessment:', error);
        }
    };

    const handleQuizSubmit = async () => {
        const currentLesson = course.modules?.[activeModule]?.lessons?.[activeLesson];
        if (!currentLesson) return;

        setLoading(true);
        try {
            const res = await apiFetch(`/courses/${id}/quiz/${currentLesson._id}/submit`, {
                method: 'POST',
                body: { answers: quizAnswers }
            });

            if (res.success) {
                setQuizResults(res.data);
                setQuizSubmitted(true);
                fetchCourse(); // Refresh course data for progress/certificates
            }
        } catch (error) {
            console.error('Quiz submission failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const getLessonIcon = (type) => {
        switch (type) {
            case 'video': return PlayCircleIcon;
            case 'document': return DocumentTextIcon;
            case 'quiz': return QuestionMarkCircleIcon;
            default: return BookOpenIcon;
        }
    };

    const generateCertificate = () => {
        if (!course || !user) return;
        setGenerating(true);

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

        // Certificate ID
        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial';
        ctx.fillText(`Certificate ID: ${course._id}-${user?.id}`, canvas.width / 2, 600);

        // Download
        const link = document.createElement('a');
        link.download = `certificate-${course.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        setGenerating(false);
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

    if (!course) {
        return (
            <DashboardLayout>
                <div className="text-center py-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                    <BookOpenIcon className="w-12 h-12 text-[#444] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[#e4e4ea] mb-2">Course not found</h3>
                    <Link to="/courses" className="text-sm text-[#5f82f3] hover:underline">
                        Back to courses
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    const currentModule = course.modules?.[activeModule];
    const currentLesson = currentModule?.lessons?.[activeLesson];
    const progress = course.progress || 0;
    const isQuizLesson = currentLesson?.type === 'quiz' || currentLesson?.type === 'assessment';
    const isLessonCompleted = course.completedLessons?.includes(currentLesson?._id);

    // For quiz lessons, check if can complete (all correct or already completed)
    const canCompleteQuiz = isQuizLesson && quizResults?.allCorrect;

    return (
        <DashboardLayout>
            {/* Deadline Warning Banner */}
            {isLearner && course.deadline && (
                (() => {
                    const daysLeft = Math.ceil((new Date(course.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                    const isUpcoming = daysLeft >= 0 && daysLeft <= 7;
                    const isPast = daysLeft < 0;

                    if (isUpcoming || isPast) {
                        return (
                            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${isPast
                                ? 'bg-red-500/10 border-red-500/50 text-red-500'
                                : 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                                }`}>
                                <ExclamationTriangleSolid className="w-6 h-6 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-sm">
                                        {isPast ? 'Deadline Passed!' : 'Approaching Deadline!'}
                                    </p>
                                    <p className="text-xs opacity-90">
                                        {isPast
                                            ? `This course was due on ${new Date(course.deadline).toLocaleDateString()}. Please complete it as soon as possible.`
                                            : `You have ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left to complete this course (Due: ${new Date(course.deadline).toLocaleDateString()}).`
                                        }
                                    </p>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()
            )}

            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => {
                        if (quizStarted && !quizSubmitted) {
                            if (window.confirm('Quitting now will count as a failed attempt. Are you sure you want to leave?')) {
                                handleQuizSubmit();
                                navigate('/courses');
                            }
                        } else {
                            navigate('/courses');
                        }
                    }}
                    className="inline-flex items-center gap-1 text-sm text-[#666] hover:text-[#e4e4ea] mb-4"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Courses
                </button>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-semibold text-[#e4e4ea]">{course.title}</h1>
                            {course.isMandatory && (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-indigo-500/20 text-[#5f82f3] border border-indigo-500/30">
                                    Mandatory
                                </span>
                            )}
                            {canPublish && (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-[#ffb84d]/10 text-[#ffb84d]">
                                    Draft
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-[#666] mt-1">{course.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-[#666]">
                            <span className="flex items-center gap-1">
                                <BookOpenIcon className="w-4 h-4" />
                                {course.modules?.length || 0} modules
                            </span>
                            {course.deadline && (
                                <span className="flex items-center gap-1 text-amber-500">
                                    <ClockIcon className="w-4 h-4" />
                                    Deadline: {new Date(course.deadline).toLocaleDateString()}
                                </span>
                            )}
                            {/* <span className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                {course.duration || 0} min
                            </span> */}
                            <span className={`px-2 py-0.5 rounded ${course.difficulty === 'beginner' ? 'bg-[#5dff4f]/10 text-[#5dff4f]' :
                                course.difficulty === 'intermediate' ? 'bg-[#ffb84d]/10 text-[#ffb84d]' :
                                    'bg-[#ff4848]/10 text-[#ff4848]'
                                }`}>
                                {course.difficulty}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canPublish && (
                            <button
                                onClick={handlePublish}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#5dff4f] text-[#0e0e0e] text-sm font-semibold rounded-lg hover:bg-[#4de63e] transition-colors"
                            >
                                <ArrowUpOnSquareIcon className="w-4 h-4" />
                                Publish
                            </button>
                        )}
                        {canEdit && (
                            <Link
                                to={`/courses/${id}/edit`}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-black text-sm font-medium rounded-lg hover:bg-[#4a6fd3] transition-colors"
                            >
                                <PencilSquareIcon className="w-4 h-4" />
                                Edit
                            </Link>
                        )}
                        {canEdit && (
                            <button
                                onClick={() => setShowDeleteDialog(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#ff4848]/10 text-[#ff4848] text-sm rounded-lg hover:bg-[#ff4848]/20 transition-colors"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                            </button>
                        )}
                        {isLearner && !course.isEnrolled && (
                            <button
                                onClick={handleEnroll}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#5dff4f] text-[#0e0e0e] text-sm font-semibold rounded-lg hover:bg-[#4de63e] transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Enroll Now
                            </button>
                        )}
                        {isLearner && course.isEnrolled && progress < 100 && !course.isMandatory && (
                            <button
                                onClick={() => setShowUnenrollDialog(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#ff4848]/10 text-[#ff4848] text-sm rounded-lg hover:bg-[#ff4848]/20 transition-colors"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Unenroll
                            </button>
                        )}
                        {isLearner && course.isEnrolled && progress < 100 && course.isMandatory && (
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-white/5 text-[#666] text-sm rounded-lg cursor-not-allowed border border-white/5" title="Mandatory courses cannot be unenrolled">
                                <XMarkSolid className="w-4 h-4" />
                                Mandatory Course
                            </div>
                        )}
                        {isLearner && course.isEnrolled && progress === 100 && course.certificateEnabled !== false && (
                            <button
                                onClick={generateCertificate}
                                disabled={generating}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#5dff4f] text-[#0e0e0e] text-sm font-semibold rounded-lg hover:bg-[#4de63e] transition-colors disabled:opacity-50"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                {generating ? 'Generating...' : 'Download Certificate'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress bar for enrolled users */}
                {course.isEnrolled && (
                    <div className="mt-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#888]">Your Progress</span>
                            <span
                                className="text-sm font-semibold"
                                style={{ color: getProgressColor(progress) }}
                            >
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <div className="h-2 bg-[#0e0e0e] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${progress}%`,
                                    backgroundColor: getProgressColor(progress)
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Course Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - Modules */}
                <div className="lg:col-span-1">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                        <h3 className="text-sm font-medium text-[#e4e4ea] mb-4">Course Content</h3>
                        <div className="space-y-2">
                            {course.modules?.map((module, mIndex) => (
                                <div key={mIndex}>
                                    <button
                                        onClick={() => {
                                            setActiveModule(mIndex);
                                            setActiveLesson(0);
                                        }}
                                        className={`w-full text-left p-3 rounded-lg transition-colors ${activeModule === mIndex
                                            ? 'bg-primary/10 text-[#5f82f3]'
                                            : 'text-[#888] hover:bg-[#0e0e0e]'
                                            }`}
                                    >
                                        <div className="text-sm font-medium">{module.title}</div>
                                        <div className="text-xs text-[#666] mt-1">
                                            {module.lessons?.length || 0} lessons
                                        </div>
                                    </button>
                                    {activeModule === mIndex && (
                                        <div className="ml-3 mt-2 space-y-1">
                                            {module.lessons?.map((lesson, lIndex) => {
                                                const isCompleted = course.completedLessons?.includes(lesson._id);
                                                const LessonIcon = getLessonIcon(lesson.type);
                                                return (
                                                    <button
                                                        key={lIndex}
                                                        onClick={() => setActiveLesson(lIndex)}
                                                        className={`w-full text-left p-2 rounded text-xs flex items-center gap-2 ${activeLesson === lIndex
                                                            ? 'bg-[#0e0e0e] text-[#e4e4ea]'
                                                            : 'text-[#666] hover:text-[#888]'
                                                            }`}
                                                    >
                                                        {isCompleted ? (
                                                            <CheckCircleSolid className="w-4 h-4 text-[#5dff4f]" />
                                                        ) : (
                                                            <LessonIcon className="w-4 h-4" />
                                                        )}
                                                        <span className="truncate">{lesson.title}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content - Lesson Viewer */}
                <div className="lg:col-span-3">
                    {currentLesson ? (
                        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                            <h2 className="text-lg font-medium text-[#e4e4ea] mb-4">{currentLesson.title}</h2>

                            {/* Lesson Content */}
                            <div className="bg-[#0e0e0e] rounded-lg min-h-[300px] mb-6 overflow-hidden">
                                {currentLesson.type === 'video' ? (
                                    (() => {
                                        const embedUrl = getVideoEmbedUrl(currentLesson.content);
                                        if (embedUrl && embedUrl.match(/\.(mp4|webm|ogg)$/i)) {
                                            return (
                                                <video
                                                    controls
                                                    className="w-full aspect-video"
                                                    src={embedUrl}
                                                >
                                                    Your browser does not support video playback.
                                                </video>
                                            );
                                        } else if (embedUrl) {
                                            return (
                                                <iframe
                                                    src={embedUrl}
                                                    className="w-full aspect-video"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            );
                                        } else {
                                            return (
                                                <div className="text-center py-12 p-6">
                                                    <PlayCircleIcon className="w-12 h-12 text-[#444] mx-auto mb-4" />
                                                    <p className="text-sm text-[#666]">{currentLesson.content || 'No video URL provided'}</p>
                                                    {currentLesson.content && (
                                                        <a
                                                            href={currentLesson.content}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-block mt-3 text-sm text-[#5f82f3] hover:underline"
                                                        >
                                                            Open video in new tab →
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        }
                                    })()
                                ) : currentLesson.type === 'document' ? (
                                    <div className="text-center py-12 p-6">
                                        <DocumentTextIcon className="w-12 h-12 text-[#444] mx-auto mb-4" />
                                        <p className="text-sm text-[#666] whitespace-pre-wrap">{currentLesson.content || 'Document'}</p>
                                        {currentLesson.content?.startsWith('http') && (
                                            <a
                                                href={currentLesson.content}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block mt-3 text-sm text-[#5f82f3] hover:underline"
                                            >
                                                Open document →
                                            </a>
                                        )}
                                    </div>
                                ) : currentLesson.type === 'assessment' ? (
                                    <AssessmentView
                                        lesson={currentLesson}
                                        result={quizResults}
                                        isLessonCompleted={isLessonCompleted}
                                        onSubmit={handleAssessmentSubmit}
                                        onAppeal={() => setShowAppealModal(true)}
                                    />
                                ) : currentLesson.type === 'quiz' ? (
                                    <div className="p-6">
                                        {!quizStarted && !quizSubmitted && !previewMode ? (
                                            // Start Screen
                                            <div className="text-center py-6 px-4">
                                                <div className="mb-6 flex justify-center">
                                                    <div className="w-16 h-16 bg-[#5f82f3]/10 rounded-full flex items-center justify-center">
                                                        <QuestionMarkCircleIcon className="w-10 h-10 text-[#5f82f3]" />
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold text-[#e4e4ea] mb-2">{currentLesson.title}</h3>

                                                <div className="max-w-md mx-auto mb-8 text-left bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                                                    <div className="flex items-center gap-2 mb-3 text-amber-500 font-bold text-xs uppercase tracking-wider">
                                                        <ExclamationTriangleIcon className="w-4 h-4" />
                                                        Quiz Rules
                                                    </div>
                                                    <ul className="space-y-3">
                                                        <li className="flex items-start gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white/50 mt-1.5 flex-shrink-0" />
                                                            <div className="text-xs text-[#888]">
                                                                <span className="text-[#e4e4ea] font-medium">Passing Criteria: </span> <span className="text-white font-bold">{currentLesson.passingPercentage || 70}%</span>
                                                            </div>
                                                        </li>
                                                        {currentLesson.timeLimit > 0 ? (
                                                            <li className="flex items-start gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white/50 mt-1.5 flex-shrink-0" />
                                                                <div className="text-xs text-[#888]">
                                                                    <span className="text-[#e4e4ea] font-medium">Time Limit: <span className="text-white font-bold">{currentLesson.timeLimit} minutes</span></span>
                                                                </div>
                                                            </li>
                                                        ) : (
                                                            <></>
                                                        )}
                                                        {currentLesson.questions?.length > 0 ? (
                                                            <li className="flex items-start gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white/50 mt-1.5 flex-shrink-0" />
                                                                <div className="text-xs text-[#888]">
                                                                    <span className="text-[#e4e4ea] font-medium">Questions: <span className="text-white font-bold">{currentLesson.questions?.length || 0}</span></span>
                                                                </div>
                                                            </li>
                                                        ) : (
                                                            <></>
                                                        )}
                                                        {currentLesson.maxAttempts > 0 ? (
                                                            <li className="flex items-start gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white/50 mt-1.5 flex-shrink-0" />
                                                                <div className="text-xs text-[#888]">
                                                                    <span className="text-[#e4e4ea] font-medium">Attempts:</span>
                                                                    <span>Max: <span className="text-white font-bold">{currentLesson.maxAttempts}</span> {quizResults?.attemptsLeft !== undefined ? (
                                                                        <span>Remaining: <span className="text-amber-500 font-bold">{quizResults.attemptsLeft}</span></span>
                                                                    ) : (
                                                                        <span><br />Ensure you are ready before starting.</span>
                                                                    )}</span>
                                                                </div>
                                                            </li>
                                                        ) : (
                                                            <></>
                                                        )}
                                                    </ul>
                                                </div>

                                                <div className="flex justify-center gap-4">
                                                    {!course.isEnrolled ? (
                                                        <div className="flex flex-col items-center gap-3">
                                                            <p className="text-xs text-[#666]">You must enroll in this course to take the assessment.</p>
                                                            <button
                                                                className="px-8 py-3 bg-[#1a1a1a] border border-[#2a2a2a] text-[#424242] text-sm font-bold rounded-lg"
                                                            >
                                                                Start Quiz
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {(canEdit || user?.role === 'admin' || user?.role === 'super_admin') && (
                                                                <button
                                                                    onClick={() => setPreviewMode(true)}
                                                                    className="px-6 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] rounded-lg font-medium hover:text-[#e4e4ea] hover:border-[#444] transition-colors"
                                                                >
                                                                    Preview Mode
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={startQuiz}
                                                                disabled={(isLessonCompleted && !currentLesson?.maxAttempts) || (currentLesson.maxAttempts > 0 && quizResults?.attemptsLeft === 0)}
                                                                className="px-8 py-3 bg-[#5f82f3] text-black rounded-lg text-sm font-bold hover:bg-[#4a6fd3] transition-all transform hover:scale-105 shadow-xl shadow-[#5f82f3]/20 disabled:opacity-50 disabled:scale-100"
                                                            >
                                                                {isLessonCompleted ? 'Retake Quiz' : 'Start Quiz'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : previewMode ? (
                                            // Preview Mode
                                            <div>
                                                <div className="flex items-center justify-between mb-6 border-b border-[#2a2a2a] pb-4">
                                                    <span className="text-sm text-[#888] font-medium uppercase tracking-wider">Preview Mode</span>
                                                    <button
                                                        onClick={() => setPreviewMode(false)}
                                                        className="text-sm text-[#e4e4ea] hover:text-white"
                                                    >
                                                        Exit Preview
                                                    </button>
                                                </div>
                                                <div className="space-y-8">
                                                    {currentLesson.questions.map((question, qIndex) => (
                                                        <div key={qIndex} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                                                            <p className="text-base text-[#e4e4ea] mb-4 font-medium">
                                                                <span className="text-[#5f82f3] mr-2">Q{qIndex + 1}.</span>
                                                                {question.question}
                                                            </p>
                                                            <div className="space-y-2">
                                                                {question.options?.map((option, oIndex) => {
                                                                    const isCorrect = question.correctAnswer === oIndex;
                                                                    return (
                                                                        <div
                                                                            key={oIndex}
                                                                            className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${isCorrect
                                                                                ? 'border-[#5dff4f] bg-[#5dff4f]/10 text-[#5dff4f]'
                                                                                : 'border-[#2a2a2a] text-[#888]'
                                                                                }`}
                                                                        >
                                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isCorrect ? 'border-[#5dff4f]' : 'border-[#666]'}`}>
                                                                                {isCorrect && <div className="w-2 h-2 rounded-full bg-[#5dff4f]" />}
                                                                            </div>
                                                                            <span>{option}</span>
                                                                            {isCorrect && <span className="ml-auto text-xs font-semibold uppercase">Correct Answer</span>}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : quizSubmitted ? (
                                            // Result Screen
                                            <div className="text-center py-8">
                                                {quizResults?.passed ? (
                                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#5dff4f]/10 mb-4">
                                                        <CheckCircleSolid className="w-10 h-10 text-[#5dff4f]" />
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ff4848]/10 mb-4">
                                                        <ExclamationTriangleIcon className="w-10 h-10 text-[#ff4848]" />
                                                    </div>
                                                )}

                                                <h3 className="text-xl font-bold text-[#e4e4ea] mb-2">
                                                    {quizResults?.passed ? 'Quiz Passed!' : 'Quiz Failed'}
                                                </h3>
                                                <div className="flex flex-col items-center gap-1 mb-6">
                                                    <div className="text-3xl font-black text-[#e4e4ea]">
                                                        {quizResults?.percentage?.toFixed(2)}%
                                                    </div>
                                                    <p className="text-sm text-[#666]">
                                                        You got <span className="text-[#5dff4f] font-bold">{quizResults?.score}</span> correct out of <span className="text-[#e4e4ea] font-medium">{quizResults?.totalPoints}</span> questions
                                                    </p>
                                                </div>

                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="flex justify-center gap-3">
                                                        {!quizResults?.passed && (quizResults?.attemptsLeft > 0 || quizResults?.attemptsLeft === null) && (
                                                            <button
                                                                onClick={startQuiz}
                                                                className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#e4e4ea] rounded-lg hover:border-[#5f82f3] transition-colors"
                                                            >
                                                                Retry Quiz
                                                            </button>
                                                        )}
                                                        {quizResults?.passed && (
                                                            <div className="px-4 py-2 bg-[#5dff4f]/10 text-[#5dff4f] rounded-lg text-sm font-medium">
                                                                No retries needed for passed quiz
                                                            </div>
                                                        )}
                                                        {isLessonCompleted && (
                                                            <button
                                                                onClick={() => {
                                                                    if (activeLesson < (currentModule?.lessons?.length || 0) - 1) {
                                                                        setActiveLesson(activeLesson + 1);
                                                                    } else if (activeModule < (course.modules?.length || 0) - 1) {
                                                                        setActiveModule(activeModule + 1);
                                                                        setActiveLesson(0);
                                                                    }
                                                                }}
                                                                className="px-4 py-2 bg-[#5f82f3] text-white rounded-lg hover:bg-[#4a6fd3] transition-colors"
                                                            >
                                                                Next Lesson
                                                            </button>
                                                        )}
                                                    </div>

                                                    {!quizResults?.passed && quizResults?.attemptsLeft === 0 && (
                                                        <div className="mt-4 p-4 bg-[#ff4848]/10 border border-[#ff4848]/20 rounded-xl max-w-md">
                                                            <p className="text-xs text-[#ff4848] mb-3 leading-relaxed">
                                                                You have exhausted all attempts for this assessment.
                                                                {quizResults?.appealStatus === 'none' ? ' You can appeal to your instructor for extra attempts.' :
                                                                    quizResults?.appealStatus === 'pending' ? ' Your appeal is currently under review.' :
                                                                        quizResults?.appealStatus === 'rejected' ? ' Your appeal was rejected. You may continue the course but this assessment remains failed.' :
                                                                            (quizResults?.attemptsLeft === 0 ? ' Your appeal attempts are also exhausted. You can continue the course anyway.' : ' Your appeal was approved! You can now retry.')}
                                                            </p>
                                                            {quizResults?.appealStatus === 'none' && (
                                                                <button
                                                                    onClick={() => setShowAppealModal(true)}
                                                                    className="w-full py-2 bg-[#ff4848] text-white text-xs font-bold rounded-lg hover:bg-[#e43e3e] transition-colors"
                                                                >
                                                                    Submit Appeal for More Attempts
                                                                </button>
                                                            )}
                                                            {(quizResults?.appealStatus === 'rejected' || (quizResults?.appealStatus === 'approved' && quizResults?.attemptsLeft === 0)) && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (activeLesson < (currentModule?.lessons?.length || 0) - 1) {
                                                                            setActiveLesson(activeLesson + 1);
                                                                        } else if (activeModule < (course.modules?.length || 0) - 1) {
                                                                            setActiveModule(activeModule + 1);
                                                                            setActiveLesson(0);
                                                                        }
                                                                    }}
                                                                    className="w-full py-2 bg-[#2a2a2a] text-[#888] text-xs font-bold rounded-lg hover:bg-[#333] transition-colors"
                                                                >
                                                                    Continue Course anyway
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            // Active Quiz
                                            <div>
                                                <div className="flex items-center justify-between mb-6 border-b border-[#2a2a2a] pb-4">
                                                    <span className="text-sm text-[#888]">
                                                        {Object.keys(quizAnswers).length}/{currentLesson.questions?.length} Answered
                                                    </span>
                                                    {timeRemaining !== null && (
                                                        <span className={`text-sm font-mono ${timeRemaining < 60 ? 'text-[#ff4848]' : 'text-[#5dff4f]'}`}>
                                                            Time Left: {formatTime(timeRemaining)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-8">
                                                    {currentLesson.questions.map((question, qIndex) => (
                                                        <div key={qIndex}>
                                                            <p className="text-base text-[#e4e4ea] mb-4 font-medium">
                                                                <span className="text-[#5f82f3] mr-2">{qIndex + 1}.</span>
                                                                {question.question}
                                                            </p>
                                                            <div className="space-y-2 pl-6">
                                                                {question.options?.map((option, oIndex) => {
                                                                    const isSelected = quizAnswers[qIndex] === oIndex;
                                                                    return (
                                                                        <button
                                                                            key={oIndex}
                                                                            onClick={() => handleQuizAnswer(qIndex, oIndex)}
                                                                            className={`w-full text-left p-3 rounded-lg border transition-colors ${isSelected
                                                                                ? 'border-[#5f82f3] bg-[#5f82f3]/10 text-white'
                                                                                : 'border-[#2a2a2a] text-[#888] hover:border-[#444]'
                                                                                }`}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#5f82f3]' : 'border-[#666]'
                                                                                    }`}>
                                                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#5f82f3]" />}
                                                                                </div>
                                                                                <span>{option}</span>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-10 pt-6 border-t border-[#2a2a2a]">
                                                    <button
                                                        onClick={handleQuizSubmit}
                                                        disabled={Object.keys(quizAnswers).length !== currentLesson.questions?.length || loading}
                                                        className="w-full py-4 bg-[#5f82f3] text-white rounded-lg font-bold hover:bg-[#4a6fd3] transition-all disabled:opacity-50 shadow-lg shadow-[#5f82f3]/20"
                                                    >
                                                        {loading ? 'Submitting...' : 'Submit Assessment'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="prose prose-invert max-w-none p-6">
                                        <p className="text-sm text-[#888] whitespace-pre-wrap">
                                            {currentLesson.content || 'Lesson content will appear here.'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Lesson Actions */}
                            {course.isEnrolled && (
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => {
                                            if (activeLesson > 0) {
                                                setActiveLesson(activeLesson - 1);
                                            } else if (activeModule > 0) {
                                                setActiveModule(activeModule - 1);
                                                const prevModule = course.modules[activeModule - 1];
                                                setActiveLesson((prevModule?.lessons?.length || 1) - 1);
                                            }
                                        }}
                                        disabled={activeModule === 0 && activeLesson === 0}
                                        className="flex items-center gap-1 px-4 py-2 bg-[#0e0e0e] text-[#888] text-sm rounded-lg hover:text-[#e4e4ea] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeftIcon className="w-4 h-4" />
                                        Previous
                                    </button>

                                    {/* Only show Mark Complete for non-quiz lessons or completed quizzes */}
                                    {!isQuizLesson && (
                                        <button
                                            onClick={() => handleLessonComplete(currentLesson._id)}
                                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${isLessonCompleted
                                                ? 'bg-[#5dff4f]/10 text-[#5dff4f]'
                                                : 'bg-primary text-white hover:bg-[#4a6fd3]'
                                                }`}
                                        >
                                            {isLessonCompleted ? (
                                                <span className="flex items-center gap-2">
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                    Completed
                                                </span>
                                            ) : 'Mark Complete'}
                                        </button>
                                    )}

                                    {isQuizLesson && isLessonCompleted && (
                                        <span className="flex items-center gap-2 px-6 py-2 bg-[#5dff4f]/10 text-[#5dff4f] rounded-lg text-sm font-medium">
                                            <CheckCircleIcon className="w-4 h-4" />
                                            Completed
                                        </span>
                                    )}

                                    <button
                                        onClick={() => {
                                            if (activeLesson < (currentModule?.lessons?.length || 0) - 1) {
                                                setActiveLesson(activeLesson + 1);
                                            } else if (activeModule < (course.modules?.length || 0) - 1) {
                                                setActiveModule(activeModule + 1);
                                                setActiveLesson(0);
                                            }
                                        }}
                                        disabled={
                                            activeModule === (course.modules?.length || 0) - 1 &&
                                            activeLesson === (currentModule?.lessons?.length || 0) - 1
                                        }
                                        className="flex items-center gap-1 px-4 py-2 bg-[#0e0e0e] text-[#888] text-sm rounded-lg hover:text-[#e4e4ea] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
                            <BookOpenIcon className="w-12 h-12 text-[#444] mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-[#e4e4ea] mb-2">No content available</h3>
                            <p className="text-sm text-[#666]">This course doesn't have any modules yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Unenroll Confirmation Dialog */}
            <Dialog open={showUnenrollDialog} onClose={() => setShowUnenrollDialog(false)}>
                <DialogContent className="bg-zinc-900 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-[#ffb84d]" />
                        <DialogTitle className="text-lg font-semibold text-white">Unenroll from Course</DialogTitle>
                    </div>
                    <p className="text-zinc-400 mb-6">
                        Are you sure you want to unenroll from <strong className="text-white">{course?.title}</strong>?
                        Your progress will be lost and cannot be recovered.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowUnenrollDialog(false)}
                            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUnenroll}
                            disabled={unenrolling}
                            className="flex-1 px-4 py-2 bg-[#ff4848] hover:bg-[#e63e3e] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {unenrolling ? 'Unenrolling...' : 'Unenroll'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
                <DialogContent className="bg-zinc-900 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <TrashIcon className="w-6 h-6 text-[#ff4848]" />
                        <DialogTitle className="text-lg font-semibold text-white">Delete Course</DialogTitle>
                    </div>
                    <p className="text-zinc-400 mb-6">
                        Are you sure you want to delete <strong className="text-white">{course?.title}</strong>?
                        This action cannot be undone and all enrolled learners will lose access.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDeleteDialog(false)}
                            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 px-4 py-2 bg-[#ff4848] hover:bg-[#e63e3e] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {deleting ? 'Deleting...' : 'Delete Course'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Appeal Modal */}
            <Dialog open={showAppealModal} onClose={() => setShowAppealModal(false)}>
                <DialogContent className="max-w-md bg-[#0e0e0e] border border-[#2a2a2a] text-[#e4e4ea] shadow-2xl">
                    <DialogTitle className="text-[#e4e4ea]">Appeal for Extra Attempts</DialogTitle>
                    <div className="p-4">
                        <p className="text-xs text-[#888] mb-4">
                            Briefly explain why you need more attempts for this assessment. Your instructor will review your request.
                        </p>
                        <textarea
                            value={appealReason}
                            onChange={(e) => setAppealReason(e.target.value)}
                            className="w-full p-3 bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3] mb-4"
                            placeholder="Reason for appeal..."
                            rows={4}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAppealModal(false)}
                                className="flex-1 py-2 bg-[#2a2a2a] text-[#888] text-sm font-medium rounded-lg hover:bg-[#333]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAppealSubmit}
                                disabled={submittingAppeal || !appealReason.trim()}
                                className="flex-1 py-2 bg-[#5f82f3] text-black text-sm font-medium rounded-lg hover:bg-[#4a6fd3]"
                            >
                                {submittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

function AssessmentView({ lesson, result, isLessonCompleted, onSubmit, onAppeal }) {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setError('');
        if (!selectedFile) return;
        if (selectedFile.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }
        if (selectedFile.size > 2 * 1024 * 1024) {
            setError('File size must be under 2MB.');
            return;
        }
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;
        setSubmitting(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                await onSubmit(reader.result);
                setFile(null);
                setSubmitting(false);
                setShowConfirm(false);
            };
        } catch (err) {
            setError('Upload failed. Please try again.');
            setSubmitting(false);
            setShowConfirm(false);
        }
    };

    const isSubmitted = result && result.status !== 'approved_for_resubmission';
    const isPassed = result?.status === 'passed' || (result?.status === 'graded' && result?.percentage >= (lesson?.passingPercentage || 70));
    const isFailed = result?.status === 'failed' || (result?.status === 'graded' && result?.percentage < (lesson?.passingPercentage || 70));

    return (
        <div className="p-8 max-w-xl mx-auto">
            {isSubmitted || isLessonCompleted ? (
                <div className="text-center py-12 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-xl">
                    {isPassed || (isLessonCompleted && !isFailed) ? (
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#5dff4f]/10 mb-6">
                            <CheckCircleSolid className="w-12 h-12 text-[#5dff4f]" />
                        </div>
                    ) : isFailed ? (
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#ff4848]/10 mb-6">
                            <XMarkSolid className="w-12 h-12 text-[#ff4848]" />
                        </div>
                    ) : (
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 mb-6">
                            <ClockIcon className="w-12 h-12 text-amber-500" />
                        </div>
                    )}

                    <h3 className="text-2xl font-black text-[#e4e4ea] mb-2">
                        {isPassed || (isLessonCompleted && !isFailed) ? 'Assessment Passed!' : isFailed ? 'Assessment Failed' : 'Submission Received'}
                    </h3>
                    <p className="text-[11px] text-[#666] font-black uppercase tracking-[0.2em] mb-8">
                        {isPassed || isFailed || isLessonCompleted ? 'Your work has been evaluated' : 'Your work is under expert review'}
                    </p>

                    {(result?.status === 'graded' || result?.status === 'passed' || result?.status === 'failed' || isLessonCompleted) && (result?.percentage !== undefined || result?.score !== undefined) ? (
                        <div className="mt-6 pt-8 border-t border-[#2a2a2a] px-8">
                            <div className="text-5xl font-black text-[#e4e4ea] mb-2">{Math.round(result?.percentage || result?.score || 0)}%</div>
                            <p className="text-[10px] text-[#5f82f3] font-black uppercase tracking-widest mb-4">Final Performance Score</p>
                            {result.feedback && (
                                <div className="p-5 bg-black/40 rounded-2xl border border-[#2a2a2a] mb-6 text-left shadow-inner">
                                    <p className="text-[10px] text-[#444] font-black uppercase tracking-widest mb-3 border-b border-[#222] pb-2">Expert Feedback</p>
                                    <p className="text-sm text-[#888] italic leading-relaxed font-medium">"{result.feedback}"</p>
                                </div>
                            )}

                            {isFailed && !isLessonCompleted && (
                                <button
                                    onClick={onAppeal}
                                    className="w-full py-4 bg-[#ff4848] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#e43e3e] transition-all shadow-lg shadow-[#ff4848]/20"
                                >
                                    Apply for Re-evaluation
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl mx-8 flex flex-col items-center">
                            <span className="animate-pulse w-2 h-2 rounded-full bg-amber-500 mb-3" />
                            <p className="text-[11px] text-amber-500 font-black uppercase tracking-widest">Review Pending</p>
                            <p className="text-[9px] text-[#444] mt-2 font-bold uppercase">Estimated time: 24-48 hours</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {!showConfirm ? (
                        <>
                            <div className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 transition-all group ${file ? 'border-[#5f82f3] bg-[#5f82f3]/5' : 'border-[#2a2a2a] hover:border-[#444] bg-black/20'}`}>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    title=""
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                />
                                <CloudArrowUpIcon className={`w-12 h-12 transition-all duration-300 ${file ? 'text-[#5f82f3] scale-110' : 'text-[#333] group-hover:text-[#444]'}`} />
                                <div className="text-center">
                                    <p className="text-sm text-[#e4e4ea] font-bold tracking-tight">{file ? file.name : 'Choose or Drop PDF'}</p>
                                    <p className="text-[10px] text-[#666] mt-1.5 font-bold uppercase tracking-[0.1em]">Max PDF size 2MB</p>
                                </div>
                            </div>
                            {error && <p className="text-[10px] text-[#ff4848] text-center font-bold uppercase tracking-widest bg-[#ff4848]/5 py-2 rounded-lg">{error}</p>}
                            <button
                                onClick={() => setShowConfirm(true)}
                                disabled={!file || submitting}
                                className="w-full py-4 bg-[#5f82f3] text-[#0e0e0e] text-[13px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white hover:shadow-2xl transition-all disabled:opacity-30"
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </>
                    ) : (
                        <div className="p-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl text-center">
                            <ExclamationTriangleIcon className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Confirm Submission</h3>
                            <div className="mb-6 p-4 bg-black/40 rounded-xl border border-[#2a2a2a] flex items-center gap-3">
                                <DocumentIcon className="w-6 h-6 text-[#5f82f3]" />
                                <div className="text-left overflow-hidden">
                                    <p className="text-[10px] text-[#444] font-black uppercase tracking-widest">Ready to upload</p>
                                    <p className="text-sm text-[#e4e4ea] font-medium truncate">{file?.name}</p>
                                </div>
                            </div>
                            <p className="text-sm text-[#888] mb-6">
                                You can only submit this document once. Are you sure your document is ready for grading?
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-3 bg-[#2a2a2a] text-[#888] rounded-xl font-bold hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-[#5f82f3] text-black rounded-xl font-bold hover:bg-[#4a6fd3] transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}




