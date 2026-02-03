import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/Dialog';
import {
    PhotoIcon,
    PlusIcon,
    TrashIcon,
    BookOpenIcon,
    PlayCircleIcon,
    DocumentTextIcon,
    QuestionMarkCircleIcon,
    XMarkIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function CreateCoursePage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [error, setError] = useState('');
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [course, setCourse] = useState({
        title: '',
        description: '',
        category: 'General',
        difficulty: 'beginner',
        thumbnail: '',
        certificateEnabled: true,
        modules: []
    });

    // Fetch course data in edit mode
    useEffect(() => {
        if (isEditMode) {
            fetchCourse();
        }
    }, [id]);

    const fetchCourse = async () => {
        try {
            const res = await apiFetch(`/courses/${id}`);
            if (res.success) {
                setCourse(res.data);
                if (res.data.thumbnail) {
                    setThumbnailPreview(res.data.thumbnail);
                }
            }
        } catch (error) {
            console.error('Failed to fetch course:', error);
            setError('Failed to load course data');
        } finally {
            setFetching(false);
        }
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result);
                setCourse({ ...course, thumbnail: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = isEditMode ? `/courses/${id}` : '/courses';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await apiFetch(url, {
                method,
                body: course
            });

            if (res.success) {
                navigate(`/courses/${res.data._id || id}`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await apiFetch(`/courses/${id}`, { method: 'DELETE' });
            setShowDeleteDialog(false);
            navigate('/courses');
        } catch (err) {
            setError(err.message);
            setShowDeleteDialog(false);
        } finally {
            setDeleting(false);
        }
    };

    const addModule = () => {
        setCourse({
            ...course,
            modules: [
                ...course.modules,
                { title: '', description: '', lessons: [], order: course.modules.length }
            ]
        });
    };

    const updateModule = (index, field, value) => {
        const newModules = [...course.modules];
        newModules[index][field] = value;
        setCourse({ ...course, modules: newModules });
    };

    const removeModule = (index) => {
        const newModules = course.modules.filter((_, i) => i !== index);
        setCourse({ ...course, modules: newModules });
    };

    const addLesson = (moduleIndex, type = 'text') => {
        const newModules = [...course.modules];
        const lesson = {
            title: '',
            type,
            content: '',
            duration: 0,
            order: newModules[moduleIndex].lessons.length,
            questions: type === 'quiz' ? [] : undefined,
            passingPercentage: 70,
            maxAttempts: 0,
            timeLimit: 0
        };
        newModules[moduleIndex].lessons.push(lesson);
        setCourse({ ...course, modules: newModules });
    };

    const updateLesson = (moduleIndex, lessonIndex, field, value) => {
        const newModules = [...course.modules];
        newModules[moduleIndex].lessons[lessonIndex][field] = value;
        setCourse({ ...course, modules: newModules });
    };

    const removeLesson = (moduleIndex, lessonIndex) => {
        const newModules = [...course.modules];
        newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
        setCourse({ ...course, modules: newModules });
    };

    const addQuestion = (moduleIndex, lessonIndex) => {
        const newModules = [...course.modules];
        const questions = newModules[moduleIndex].lessons[lessonIndex].questions || [];
        questions.push({
            question: '',
            type: 'mcq',
            options: ['', '', '', ''],
            correctAnswer: 0,
            points: 1
        });
        newModules[moduleIndex].lessons[lessonIndex].questions = questions;
        setCourse({ ...course, modules: newModules });
    };

    const updateQuestion = (moduleIndex, lessonIndex, questionIndex, field, value) => {
        const newModules = [...course.modules];
        newModules[moduleIndex].lessons[lessonIndex].questions[questionIndex][field] = value;
        setCourse({ ...course, modules: newModules });
    };

    const updateOption = (moduleIndex, lessonIndex, questionIndex, optionIndex, value) => {
        const newModules = [...course.modules];
        newModules[moduleIndex].lessons[lessonIndex].questions[questionIndex].options[optionIndex] = value;
        setCourse({ ...course, modules: newModules });
    };

    const removeQuestion = (moduleIndex, lessonIndex, questionIndex) => {
        const newModules = [...course.modules];
        newModules[moduleIndex].lessons[lessonIndex].questions.splice(questionIndex, 1);
        setCourse({ ...course, modules: newModules });
    };

    const getLessonIcon = (type) => {
        switch (type) {
            case 'video': return PlayCircleIcon;
            case 'document': return DocumentTextIcon;
            case 'quiz': return QuestionMarkCircleIcon;
            default: return BookOpenIcon;
        }
    };

    if (fetching) {
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
            <div className="max-w-4xl mx-auto">
                <h1 className="text-xl font-semibold text-[#e4e4ea] mb-6">
                    {isEditMode ? 'Edit Course' : 'Create New Course'}
                </h1>

                {error && (
                    <div className="mb-6 p-3 bg-[#ff4848]/10 border border-[#ff4848]/30 rounded-lg text-sm text-[#ff4848]">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                        <h2 className="text-sm font-medium text-[#e4e4ea] mb-4">Course Details</h2>

                        {/* Thumbnail Upload */}
                        <div className="mb-4">
                            <label className="block text-xs text-[#666] mb-2">Thumbnail</label>
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-20 bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg flex items-center justify-center overflow-hidden">
                                    {thumbnailPreview ? (
                                        <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                                    ) : (
                                        <PhotoIcon className="w-8 h-8 text-[#444]" />
                                    )}
                                </div>
                                <label className="px-4 py-2 bg-[#0e0e0e] border border-[#2a2a2a] text-[#e4e4ea] text-sm rounded cursor-pointer hover:border-[#5f82f3]/30 transition-colors">
                                    Upload Image
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-[#666] mb-2">Course Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={course.title}
                                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                                    placeholder="Enter course title"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-[#666] mb-2">Description *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={course.description}
                                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                                    placeholder="Enter course description"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-[#666] mb-2">Category</label>
                                    <select
                                        value={course.category}
                                        onChange={(e) => setCourse({ ...course, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                                    >
                                        <option value="General">General</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Business">Business</option>
                                        <option value="Compliance">Compliance</option>
                                        <option value="Leadership">Leadership</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#666] mb-2">Difficulty</label>
                                    <select
                                        value={course.difficulty}
                                        onChange={(e) => setCourse({ ...course, difficulty: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#0e0e0e] border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#2a2a2a]">
                            <input
                                type="checkbox"
                                id="certificateEnabled"
                                checked={course.certificateEnabled}
                                onChange={(e) => setCourse({ ...course, certificateEnabled: e.target.checked })}
                                className="accent-[#5f82f3] w-4 h-4 rounded"
                            />
                            <label htmlFor="certificateEnabled" className="text-xs text-[#e4e4ea] cursor-pointer">
                                Enable Certificate for this course (requires passing all quizzes)
                            </label>
                        </div>
                    </div>

                    {/* Modules */}
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-medium text-[#e4e4ea]">Course Content</h2>
                            <button
                                type="button"
                                onClick={addModule}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-black text-xs rounded hover:bg-[#4a6fd3] transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Module
                            </button>
                        </div>

                        {course.modules.length === 0 ? (
                            <div className="text-center py-8 text-[#666] text-sm">
                                No modules yet. Click "Add Module" to create content.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {course.modules.map((module, mIndex) => (
                                    <div key={mIndex} className="bg-[#0e0e0e] rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-xs text-[#5f82f3] font-medium">Module {mIndex + 1}</span>
                                            <input
                                                type="text"
                                                value={module.title}
                                                onChange={(e) => updateModule(mIndex, 'title', e.target.value)}
                                                className="flex-1 px-2 py-1 bg-transparent border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                                                placeholder="Module title"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeModule(mIndex)}
                                                className="text-[#ff4848] hover:text-[#ff6b6b] p-1"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Lessons */}
                                        <div className="ml-4 space-y-2">
                                            {module.lessons.map((lesson, lIndex) => {
                                                const LessonIcon = getLessonIcon(lesson.type);
                                                return (
                                                    <div key={lIndex} className="bg-[#1a1a1a] rounded p-3">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <LessonIcon className="w-4 h-4 text-[#5f82f3]" />
                                                            <input
                                                                type="text"
                                                                value={lesson.title}
                                                                onChange={(e) => updateLesson(mIndex, lIndex, 'title', e.target.value)}
                                                                className="flex-1 px-2 py-1 bg-transparent border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                                                                placeholder="Lesson title"
                                                            />
                                                            <span className="text-xs text-[#666] px-2 py-0.5 bg-[#2a2a2a] rounded">
                                                                {lesson.type}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeLesson(mIndex, lIndex)}
                                                                className="text-[#ff4848] hover:text-[#ff6b6b] p-1"
                                                            >
                                                                <XMarkIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {/* Quiz Settings & Questions */}
                                                        {lesson.type === 'quiz' && (
                                                            <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                                                                {/* Quiz Config */}
                                                                <div className="mb-4 p-4 bg-[#0e0e0e]/50 rounded-lg border border-[#2a2a2a] flex flex-wrap gap-4 items-end">
                                                                    <div className="flex-1 min-w-[120px]">
                                                                        <label className="block text-[10px] uppercase font-bold text-[#666] mb-1.5 ml-1">Passing %</label>
                                                                        <div className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] rounded px-2 focus-within:border-[#5f82f3] transition-colors">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max="100"
                                                                                value={lesson.passingPercentage || 70}
                                                                                onChange={(e) => updateLesson(mIndex, lIndex, 'passingPercentage', parseInt(e.target.value))}
                                                                                className="w-full py-1.5 bg-transparent text-sm text-[#e4e4ea] focus:outline-none"
                                                                            />
                                                                            <span className="text-[#444] text-xs">%</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 min-w-[120px]">
                                                                        <label className="block text-[10px] uppercase font-bold text-[#666] mb-1.5 ml-1">Max Attempts</label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={lesson.maxAttempts || 0}
                                                                            onChange={(e) => updateLesson(mIndex, lIndex, 'maxAttempts', parseInt(e.target.value))}
                                                                            className="w-full px-3 py-1.5 bg-[#141414] border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3] transition-colors"
                                                                            placeholder="0 = Unlimited"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 min-w-[120px]">
                                                                        <label className="block text-[10px] uppercase font-bold text-[#666] mb-1.5 ml-1">Timer (Mins)</label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={lesson.timeLimit || 0}
                                                                            onChange={(e) => updateLesson(mIndex, lIndex, 'timeLimit', parseInt(e.target.value))}
                                                                            className="w-full px-3 py-1.5 bg-[#141414] border border-[#2a2a2a] rounded text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3] transition-colors"
                                                                            placeholder="0 = No limit"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    {(lesson.questions || []).map((q, qIndex) => (
                                                                        <div key={qIndex} className="bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg p-4 relative group">
                                                                            <div className="flex items-center gap-3 mb-4">
                                                                                <div className="w-6 h-6 rounded bg-[#2a2a2a] flex items-center justify-center text-[10px] font-bold text-[#888]">
                                                                                    {qIndex + 1}
                                                                                </div>
                                                                                <select
                                                                                    value={q.type}
                                                                                    onChange={(e) => {
                                                                                        const type = e.target.value;
                                                                                        const updates = { type };
                                                                                        if (type === 'true_false') {
                                                                                            updates.options = ['True', 'False'];
                                                                                            updates.correctAnswer = 0;
                                                                                        } else if (q.type === 'true_false') {
                                                                                            updates.options = ['', '', '', ''];
                                                                                            updates.correctAnswer = 0;
                                                                                        }
                                                                                        Object.entries(updates).forEach(([k, v]) => updateQuestion(mIndex, lIndex, qIndex, k, v));
                                                                                    }}
                                                                                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[10px] text-[#e4e4ea] px-2 py-1 focus:outline-none focus:border-[#5f82f3]"
                                                                                >
                                                                                    <option value="mcq">Multiple Choice</option>
                                                                                    <option value="true_false">True / False</option>
                                                                                </select>
                                                                                <div className="flex items-center gap-1.5 ml-auto mr-4">
                                                                                    <span className="text-[10px] uppercase font-bold text-[#444]">Points:</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        min="1"
                                                                                        value={q.points || 1}
                                                                                        onChange={(e) => updateQuestion(mIndex, lIndex, qIndex, 'points', parseInt(e.target.value))}
                                                                                        className="w-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[10px] text-[#e4e4ea] py-0.5 focus:outline-none focus:border-[#5f82f3] text-center font-bold"
                                                                                    />
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeQuestion(mIndex, lIndex, qIndex)}
                                                                                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#ff4848]/10 text-[#ff4848] text-[10px] font-medium hover:bg-[#ff4848]/20 transition-colors"
                                                                                >
                                                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                                                    Delete Question
                                                                                </button>
                                                                            </div>

                                                                            <textarea
                                                                                value={q.question}
                                                                                onChange={(e) => updateQuestion(mIndex, lIndex, qIndex, 'question', e.target.value)}
                                                                                onInput={(e) => {
                                                                                    e.target.style.height = 'auto';
                                                                                    e.target.style.height = e.target.scrollHeight + 'px';
                                                                                }}
                                                                                className="w-full px-4 py-3 bg-[#111] border-2 border-[#2a2a2a] rounded-xl text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3] focus:ring-2 focus:ring-[#5f82f3]/20 mb-4 resize-none overflow-hidden transition-all placeholder-[#444]"
                                                                                placeholder="Enter your question here..."
                                                                                rows={1}
                                                                            />

                                                                            <div className="space-y-2">
                                                                                {q.type === 'mcq' ? (
                                                                                    q.options.map((opt, oIndex) => (
                                                                                        <div key={oIndex} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${q.correctAnswer === oIndex ? 'bg-[#5dff4f]/5 border-[#5dff4f]/30 ring-1 ring-[#5dff4f]/20' : 'bg-[#1a1a1a] border-[#2a2a2a]'}`}>
                                                                                            <input
                                                                                                type="radio"
                                                                                                name={`correct-${mIndex}-${lIndex}-${qIndex}`}
                                                                                                checked={q.correctAnswer === oIndex}
                                                                                                onChange={() => updateQuestion(mIndex, lIndex, qIndex, 'correctAnswer', oIndex)}
                                                                                                className="accent-[#5dff4f] w-3.5 h-3.5 cursor-pointer"
                                                                                            />
                                                                                            <input
                                                                                                type="text"
                                                                                                value={opt}
                                                                                                onChange={(e) => updateOption(mIndex, lIndex, qIndex, oIndex, e.target.value)}
                                                                                                className={`flex-1 bg-transparent text-sm transition-colors focus:outline-none focus:ring-0 ${q.correctAnswer === oIndex ? 'text-[#5dff4f] font-medium' : 'text-[#888]'}`}
                                                                                                placeholder={`Enter option ${oIndex + 1}...`}
                                                                                            />
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <div className="grid grid-cols-2 gap-3">
                                                                                        {['True', 'False'].map((val, oIndex) => (
                                                                                            <button
                                                                                                key={oIndex}
                                                                                                type="button"
                                                                                                onClick={() => updateQuestion(mIndex, lIndex, qIndex, 'correctAnswer', oIndex)}
                                                                                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border font-bold text-xs transition-all ${q.correctAnswer === oIndex ? 'bg-[#5dff4f] border-[#5dff4f] text-[#0e0e0e] shadow-lg shadow-[#5dff4f]/10' : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#666] hover:border-[#444]'}`}
                                                                                            >
                                                                                                {val}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="mt-4 flex justify-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => addQuestion(mIndex, lIndex)}
                                                                        className="flex items-center gap-2 px-6 py-2 bg-[#2a2a2a] hover:bg-[#333] text-[#e4e4ea] text-xs font-bold rounded-lg transition-all border border-[#333] hover:border-[#444]"
                                                                    >
                                                                        <PlusIcon className="w-4 h-4" />
                                                                        Add New Question
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {lesson.type === 'assessment' && (
                                                            <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                                                                <div className="mb-4 p-4 bg-[#0e0e0e]/50 rounded-lg border border-[#2a2a2a] flex flex-wrap gap-4 items-end">
                                                                    <div className="flex-1 min-w-[150px]">
                                                                        <label className="block text-[10px] uppercase font-bold text-[#666] mb-1.5 ml-1">Passing Percentage</label>
                                                                        <div className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] rounded px-2 focus-within:border-[#5f82f3] transition-colors">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max="100"
                                                                                value={lesson.passingPercentage || 70}
                                                                                onChange={(e) => updateLesson(mIndex, lIndex, 'passingPercentage', parseInt(e.target.value))}
                                                                                className="w-full py-1.5 bg-transparent text-sm text-[#e4e4ea] focus:outline-none"
                                                                            />
                                                                            <span className="text-[#444] text-xs">%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <label className="block text-[10px] uppercase font-bold text-[#666] mb-2 ml-1">Assessment Requirements</label>
                                                                <textarea
                                                                    value={lesson.content}
                                                                    onChange={(e) => updateLesson(mIndex, lIndex, 'content', e.target.value)}
                                                                    className="w-full px-4 py-3 bg-[#111] border border-[#2a2a2a] rounded-xl text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3] min-h-[120px] transition-all placeholder-[#444]"
                                                                    placeholder="Describe what the learner must do to complete this assessment (e.g., 'Upload a 2-page report on...')"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Content for non-quiz/non-assessment lessons */}
                                                        {lesson.type !== 'quiz' && lesson.type !== 'assessment' && (
                                                            <textarea
                                                                value={lesson.content}
                                                                onChange={(e) => updateLesson(mIndex, lIndex, 'content', e.target.value)}
                                                                className="w-full px-2 py-1 bg-transparent border border-[#2a2a2a] rounded text-xs text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                                                                placeholder={lesson.type === 'video' ? 'Video URL' : 'Content...'}
                                                                rows={2}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Add Lesson Buttons */}
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => addLesson(mIndex, 'text')}
                                                    className="text-xs text-[#666] hover:text-[#5f82f3]"
                                                >
                                                    + Text
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => addLesson(mIndex, 'video')}
                                                    className="text-xs text-[#666] hover:text-[#5f82f3]"
                                                >
                                                    + Video
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => addLesson(mIndex, 'quiz')}
                                                    className="text-xs text-[#666] hover:text-[#5f82f3]"
                                                >
                                                    + Quiz
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => addLesson(mIndex, 'assessment')}
                                                    className="text-xs text-[#666] hover:text-[#5f82f3]"
                                                >
                                                    + Assessment
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/courses')}
                            className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#e4e4ea] text-sm rounded-lg hover:border-[#5f82f3]/30 transition-colors"
                        >
                            Cancel
                        </button>
                        {isEditMode && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteDialog(true)}
                                className="px-4 py-2 bg-[#ff4848]/10 text-[#ff4848] text-sm rounded-lg hover:bg-[#ff4848]/20 transition-colors"
                            >
                                Delete Course
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-primary text-black text-sm rounded-lg hover:bg-[#4a6fd3] transition-colors disabled:opacity-50"
                        >
                            {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Course')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
                <DialogContent className="bg-zinc-900 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-[#ff4848]" />
                        <DialogTitle className="text-lg font-semibold text-white">Delete Course</DialogTitle>
                    </div>
                    <p className="text-zinc-400 mb-6">
                        Are you sure you want to delete <strong className="text-white">{course.title}</strong>?
                        This action cannot be undone and all enrollments will be lost.
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
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
