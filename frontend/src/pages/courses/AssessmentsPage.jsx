import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
    DocumentIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

export default function AssessmentsPage() {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [gradingId, setGradingId] = useState(null);
    const [gradeData, setGradeData] = useState({ score: '', feedback: '' });

    const isLearner = user?.role === 'learner';

    useEffect(() => {
        fetchSubmissions();
    }, [user]);

    useEffect(() => {
        let result = submissions;
        if (search) {
            result = result.filter(s =>
                (s.userName?.toLowerCase().includes(search.toLowerCase())) ||
                (s.courseTitle?.toLowerCase().includes(search.toLowerCase()))
            );
        }
        if (statusFilter !== 'all') {
            result = result.filter(s => s.status === statusFilter);
        }
        setFiltered(result);
    }, [submissions, search, statusFilter]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const endpoint = isLearner ? '/courses/assessments/my' : '/courses/assessments/manage';
            const res = await apiFetch(endpoint);
            if (res.success) setSubmissions(res.data);
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGrade = async (sub) => {
        if (!gradeData.score) return;
        try {
            setGradingId(sub.courseId + sub.lessonId + sub.userId);
            const res = await apiFetch(`/courses/${sub.courseId}/assessment/${sub.lessonId}/grade/${sub.userId}`, {
                method: 'PUT',
                body: { score: parseInt(gradeData.score), feedback: gradeData.feedback }
            });
            if (res.success) {
                setGradeData({ score: '', feedback: '' });
                fetchSubmissions();
            }
        } catch (error) {
            console.error('Grading failed:', error);
        } finally {
            setGradingId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#e4e4ea] tracking-tight">
                        {isLearner ? 'My Assessments' : 'Assessment Grading'}
                    </h1>
                    <p className="text-xs text-[#666] font-medium uppercase tracking-widest mt-1">
                        {isLearner ? 'Track your submitted documents and scores' : 'Review and score learner submissions'}
                    </p>
                </div>
            </div>

            <div className="flex gap-4 mb-8">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                    <input
                        type="text"
                        placeholder={isLearner ? "Search courses..." : "Search learner or course..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-[#e4e4ea] focus:border-[#5f82f3] outline-none transition-colors"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-[#e4e4ea] outline-none focus:border-[#5f82f3]"
                >
                    <option value="all">All Status</option>
                    <option value="submitted">Pending</option>
                    <option value="graded">Graded</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {loading ? (
                <div className="py-20 text-center text-[#444]">Loading submissions...</div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl">
                    <DocumentIcon className="w-12 h-12 text-[#2a2a2a] mx-auto mb-4" />
                    <p className="text-[#666] font-medium">No submissions found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((sub, i) => (
                        <div key={i} className="max-w-4xl bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#333] transition-colors">
                            <div className="flex flex-wrap items-start justify-between gap-6">
                                <div className="flex-1 min-w-[300px]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${sub.status === 'submitted' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                            sub.status === 'passed' ? 'bg-[#5dff4f]/10 text-[#5dff4f] border border-[#5dff4f]/20' :
                                                'bg-[#ff4848]/10 text-[#ff4848] border border-[#ff4848]/20'
                                            }`}>
                                            {sub.status === 'submitted' ? 'Pending' : sub.status}
                                        </span>
                                        <span className="text-[10px] text-[#444] font-bold uppercase tracking-widest">
                                            Submitted {sub.date ? new Date(sub.date).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-[#e4e4ea] mb-1">{sub.courseTitle}</h3>
                                    {!isLearner && (
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-[#888] font-bold uppercase">
                                                {sub.userName?.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold text-[#888]">{sub.userName}</span>
                                            <span className="text-[10px] text-[#444]">({sub.userEmail})</span>
                                        </div>
                                    )}

                                    <div className="p-4 bg-black/40 border border-[#2a2a2a] rounded-xl flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-3">
                                            <DocumentIcon className="w-5 h-5 text-[#5f82f3]" />
                                            <span className="text-xs text-[#e4e4ea] font-medium lowercase italic opacity-60">submission_document.pdf</span>
                                        </div>
                                        <a
                                            href={sub.submissionFile}
                                            download={`Assessment_${sub.userName || user?.name}.pdf`}
                                            className="p-2 hover:bg-white/5 rounded-lg text-[#5f82f3] transition-colors"
                                        >
                                            <ArrowDownTrayIcon className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>

                                {!isLearner && (sub.status === 'submitted' || sub.status === 'failed') ? (
                                    <div className="w-80 space-y-3 bg-black/20 p-4 rounded-xl border border-[#2a2a2a]">
                                        <div>
                                            <label className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-1.5 block">Assign Score (%)</label>
                                            <input
                                                type="number"
                                                placeholder="0-100"
                                                step="0.01"
                                                value={gradingId === sub.courseId + sub.lessonId + sub.userId ? gradeData.score : ''}
                                                onChange={(e) => {
                                                    setGradingId(sub.courseId + sub.lessonId + sub.userId);
                                                    setGradeData(prev => ({ ...prev, score: e.target.value }));
                                                }}
                                                className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#5f82f3]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-[#444] uppercase tracking-widest mb-1.5 block">Feedback</label>
                                            <autoresize-textarea>
                                                <textarea
                                                    placeholder="Add comments..."
                                                    rows={2}
                                                    value={gradingId === sub.courseId + sub.lessonId + sub.userId ? gradeData.feedback : ''}
                                                    onChange={(e) => {
                                                        setGradingId(sub.courseId + sub.lessonId + sub.userId);
                                                        setGradeData(prev => ({ ...prev, feedback: e.target.value }));
                                                    }}
                                                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5f82f3] resize-none"
                                                />
                                            </autoresize-textarea>
                                        </div>
                                        <button
                                            onClick={() => handleGrade(sub)}
                                            disabled={gradingId === sub.courseId + sub.lessonId + sub.userId && !gradeData.score}
                                            className="w-full py-2 bg-[#5f82f3] text-[#0e0e0e] text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-[#4a6fd3] transition-all"
                                        >
                                            Submit Grade
                                        </button>
                                    </div>
                                ) : (sub.status !== 'submitted') ? (
                                    <div className="w-80 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-[#444] uppercase tracking-widest">Final Grade</span>
                                            <span className={`text-2xl font-black ${sub.status === 'passed' ? 'text-[#5dff4f]' : 'text-[#ff4848]'}`}>
                                                {typeof sub.score === 'number' ? Math.round(sub.score) : '0'}%
                                            </span>
                                        </div>
                                        {sub.feedback ? (
                                            <div className="p-3 bg-black/40 rounded-lg border border-[#2a2a2a]">
                                                <p className="text-[10px] text-[#444] font-black uppercase tracking-widest mb-2">Instructor Feedback</p>
                                                <p className="text-xs text-[#888] italic leading-relaxed">
                                                    "{sub.feedback}"
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                                                <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Review Pending</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-80 p-6 bg-amber-500/5 border border-amber-500/10 rounded-xl flex flex-col items-center justify-center text-center">
                                        <ClockIcon className="w-8 h-8 text-amber-500 mb-2 opacity-40" />
                                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">Review Pending</p>
                                        <p className="text-[9px] text-[#444] mt-1 uppercase font-bold">instructor is checking your work</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
