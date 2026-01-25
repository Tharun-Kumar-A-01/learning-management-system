import { useState, useEffect } from 'react';
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
    PencilSquareIcon,
    TrashIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

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
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizResults, setQuizResults] = useState(null);

    const isOwner = course?.createdBy?._id === user?.id || course?.createdBy === user?.id;
    const isTrainer = user?.role === 'trainer';
    const canEdit = (isTrainer && isOwner) || ['admin', 'super_admin'].includes(user?.role);
    const canPublish = ((isTrainer && isOwner) || ['admin', 'super_admin'].includes(user?.role)) && course?.status === 'draft';
    const isLearner = user?.role === 'learner';

    useEffect(() => {
        fetchCourse();
    }, [id]);

    // Reset quiz state when lesson changes
    useEffect(() => {
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizResults(null);
    }, [activeModule, activeLesson]);

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

    const handleQuizSubmit = () => {
        const currentLesson = course.modules?.[activeModule]?.lessons?.[activeLesson];
        if (!currentLesson?.questions) return;

        const results = currentLesson.questions.map((q, idx) => ({
            correct: quizAnswers[idx] === q.correctAnswer,
            selectedAnswer: quizAnswers[idx],
            correctAnswer: q.correctAnswer
        }));

        const allCorrect = results.every(r => r.correct);
        setQuizResults({ results, allCorrect, score: results.filter(r => r.correct).length });
        setQuizSubmitted(true);

        // If all answers are correct, allow marking as complete
        if (allCorrect) {
            // Automatically mark as complete after a short delay
            setTimeout(() => {
                handleLessonComplete(currentLesson._id);
            }, 1500);
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
    const isQuizLesson = currentLesson?.type === 'quiz';
    const isLessonCompleted = course.completedLessons?.includes(currentLesson?._id);

    // For quiz lessons, check if can complete (all correct or already completed)
    const canCompleteQuiz = isQuizLesson && quizResults?.allCorrect;

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-6">
                <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-[#666] hover:text-[#e4e4ea] mb-4">
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Courses
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-semibold text-[#e4e4ea]">{course.title}</h1>
                            {canPublish && (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-[#ffb84d]/10 text-[#ffb84d]">
                                    <EyeSlashIcon className="w-3 h-3" />
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
                            <span className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                {course.duration || 0} min
                            </span>
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
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#5f82f3] text-black text-sm font-medium rounded-lg hover:bg-[#4a6fd3] transition-colors"
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
                        {isLearner && course.isEnrolled && progress < 100 && (
                            <button
                                onClick={() => setShowUnenrollDialog(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#ff4848]/10 text-[#ff4848] text-sm rounded-lg hover:bg-[#ff4848]/20 transition-colors"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Unenroll
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
                                {progress}%
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
                                            ? 'bg-[#5f82f3]/10 text-[#5f82f3]'
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
                                ) : currentLesson.type === 'quiz' ? (
                                    <div className="p-6">
                                        <div className="flex items-center gap-2 mb-6">
                                            <QuestionMarkCircleIcon className="w-5 h-5 text-[#5f82f3]" />
                                            <span className="text-sm text-[#888]">
                                                {currentLesson.questions?.length || 0} questions
                                            </span>
                                            {quizSubmitted && (
                                                <span className={`ml-auto px-2 py-1 rounded text-xs ${quizResults?.allCorrect
                                                    ? 'bg-[#5dff4f]/10 text-[#5dff4f]'
                                                    : 'bg-[#ff4848]/10 text-[#ff4848]'
                                                    }`}>
                                                    {quizResults?.score}/{currentLesson.questions?.length} correct
                                                </span>
                                            )}
                                        </div>

                                        {currentLesson.questions?.length > 0 ? (
                                            <div className="space-y-6">
                                                {currentLesson.questions.map((question, qIndex) => (
                                                    <div key={qIndex} className="bg-[#1a1a1a] rounded-lg p-4">
                                                        <p className="text-sm text-[#e4e4ea] mb-3">
                                                            <span className="text-[#5f82f3] mr-2">Q{qIndex + 1}.</span>
                                                            {question.question}
                                                        </p>
                                                        <div className="space-y-2">
                                                            {question.options?.map((option, oIndex) => {
                                                                const isSelected = quizAnswers[qIndex] === oIndex;
                                                                const isCorrect = question.correctAnswer === oIndex;
                                                                const showResult = quizSubmitted;

                                                                let optionClass = 'border-[#2a2a2a] hover:border-[#5f82f3]/30';
                                                                if (isSelected && !showResult) {
                                                                    optionClass = 'border-[#5f82f3] bg-[#5f82f3]/10';
                                                                } else if (showResult && isCorrect) {
                                                                    optionClass = 'border-[#5dff4f] bg-[#5dff4f]/10';
                                                                } else if (showResult && isSelected && !isCorrect) {
                                                                    optionClass = 'border-[#ff4848] bg-[#ff4848]/10';
                                                                }

                                                                return (
                                                                    <button
                                                                        key={oIndex}
                                                                        onClick={() => handleQuizAnswer(qIndex, oIndex)}
                                                                        disabled={quizSubmitted || isLessonCompleted}
                                                                        className={`w-full text-left p-3 rounded-lg border transition-colors ${optionClass} ${quizSubmitted ? 'cursor-default' : ''}`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#5f82f3]' : 'border-[#666]'}`}>
                                                                                {isSelected && <div className="w-2 h-2 rounded-full bg-[#5f82f3]" />}
                                                                            </div>
                                                                            <span className="text-sm text-[#e4e4ea]">{option}</span>
                                                                            {showResult && isCorrect && (
                                                                                <CheckCircleSolid className="w-4 h-4 text-[#5dff4f] ml-auto" />
                                                                            )}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Quiz Submit Button */}
                                                {!isLessonCompleted && !quizSubmitted && (
                                                    <button
                                                        onClick={handleQuizSubmit}
                                                        disabled={Object.keys(quizAnswers).length !== currentLesson.questions?.length}
                                                        className="w-full py-3 bg-[#5f82f3] text-black rounded-lg text-sm font-medium hover:bg-[#4a6fd3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Submit Quiz
                                                    </button>
                                                )}

                                                {/* Quiz Result Message */}
                                                {quizSubmitted && !quizResults?.allCorrect && (
                                                    <div className="p-4 bg-[#ff4848]/10 border border-[#ff4848]/30 rounded-lg">
                                                        <p className="text-sm text-[#ff4848]">
                                                            Some answers are incorrect. Review the correct answers above and try again.
                                                        </p>
                                                        <button
                                                            onClick={() => {
                                                                setQuizAnswers({});
                                                                setQuizSubmitted(false);
                                                                setQuizResults(null);
                                                            }}
                                                            className="mt-2 text-sm text-[#5f82f3] hover:underline"
                                                        >
                                                            Retry Quiz
                                                        </button>
                                                    </div>
                                                )}

                                                {quizSubmitted && quizResults?.allCorrect && (
                                                    <div className="p-4 bg-[#5dff4f]/10 border border-[#5dff4f]/30 rounded-lg">
                                                        <p className="text-sm text-[#5dff4f]">
                                                            Congratulations! All answers are correct. Lesson marked as complete.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-sm text-[#666]">No questions available for this quiz.</p>
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
                                                : 'bg-[#5f82f3] text-white hover:bg-[#4a6fd3]'
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
        </DashboardLayout>
    );
}
