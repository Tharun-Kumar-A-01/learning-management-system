import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    DocumentIcon
} from '@heroicons/react/24/outline';

export default function AppealsPage() {
    const { user } = useAuth();
    const [appeals, setAppeals] = useState([]);
    const [filteredAppeals, setFilteredAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState(null);
    const [comment, setComment] = useState('');
    const [assessmentScore, setAssessmentScore] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const isStaff = ['trainer', 'admin', 'super_admin'].includes(user?.role);

    useEffect(() => {
        fetchAppeals();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [appeals, searchQuery, typeFilter, statusFilter]);

    const fetchAppeals = async () => {
        try {
            setLoading(true);
            const endpoint = isStaff ? '/courses/appeals/manage' : '/courses/appeals/my';
            const res = await apiFetch(endpoint);
            if (res.success) {
                setAppeals(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch appeals:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...appeals];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.courseTitle.toLowerCase().includes(query) ||
                (a.userName && a.userName.toLowerCase().includes(query)) ||
                (a.userEmail && a.userEmail.toLowerCase().includes(query))
            );
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter(a => a.type === typeFilter);
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(a => a.appeal.status === statusFilter);
        }

        setFilteredAppeals(filtered);
    };

    const handleAction = async (item, status) => {
        try {
            setActioning(item.appeal._id || item.courseId + item.lessonId + (item.userId || ''));

            const endpoint = item.type === 'assessment'
                ? `/courses/${item.courseId}/assessment/${item.lessonId}/appeal/${item.userId}`
                : `/courses/${item.courseId}/quiz/${item.lessonId}/appeal/${item.userId}`;

            const res = await apiFetch(endpoint, {
                method: 'PUT',
                body: { status, comment }
            });

            if (res.success) {
                setComment('');
                fetchAppeals();
            }
        } catch (error) {
            console.error('Failed to action appeal:', error);
        } finally {
            setActioning(null);
        }
    };

    const handleGradeAssessment = async (item) => {
        if (!assessmentScore) return;
        try {
            setActioning('grade-' + item.courseId + item.lessonId + item.userId);
            const res = await apiFetch(`/courses/${item.courseId}/assessment/${item.lessonId}/grade/${item.userId}`, {
                method: 'PUT',
                body: { score: parseInt(assessmentScore), feedback: comment }
            });
            if (res.success) {
                setAssessmentScore('');
                setComment('');
                fetchAppeals();
            }
        } catch (error) {
            console.error('Failed to grade assessment:', error);
        } finally {
            setActioning(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'text-[#5dff4f] bg-[#5dff4f]/10 border-[#5dff4f]/20';
            case 'rejected': return 'text-[#ff4848] bg-[#ff4848]/10 border-[#ff4848]/20';
            case 'pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            default: return 'text-[#888] bg-[#2a2a2a] border-[#333]';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return CheckCircleIcon;
            case 'rejected': return XCircleIcon;
            case 'pending': return ClockIcon;
            default: return ExclamationTriangleIcon;
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-[#e4e4ea]">{isStaff ? 'Manage Course Appeals' : 'My Course Appeals'}</h1>
                <p className="text-sm text-[#666]">
                    {isStaff ? 'Review and grade assessment submissions or quiz attempt requests' : 'Track the status of your assessment evaluations and quiz attempt requests'}
                </p>
            </div>

            {isStaff && (
                <div className="flex flex-wrap gap-4 mb-6 items-end">
                    <div className="flex-1 min-w-[300px] relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                        <input
                            type="text"
                            placeholder="Search by learner name or course..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3] transition-colors"
                        />
                    </div>

                    <div className="w-40 flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#666] ml-1 flex items-center gap-1">
                            <FunnelIcon className="w-3 h-3" />
                            Type
                        </label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-xs text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                        >
                            <option value="all">All Types</option>
                            <option value="quiz">Quiz</option>
                            <option value="assessment">Assessment</option>
                        </select>
                    </div>

                    <div className="w-40 flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#666] ml-1 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-xs text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            )}

            {filteredAppeals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 text-[#333] mb-4" />
                    <p className="text-[#666] font-medium">No appeals found matching your filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredAppeals.map((item, idx) => {
                        const StatusIcon = getStatusIcon(item.appeal.status);
                        const isActioning = actioning === (item.appeal._id || item.courseId + item.lessonId + (item.userId || ''));

                        return (
                            <div key={idx} className="bg-[#1a1a1a] border border-[#2a2a2a] max-w-4xl rounded-2xl p-5 hover:border-[#333] transition-colors relative overflow-hidden group">
                                {item.type === 'assessment' && (
                                    <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                        <DocumentIcon className="w-20 h-20 text-[#5f82f3]" />
                                    </div>
                                )}
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest ${item.type === 'quiz' ? 'bg-[#5f82f3] text-black' : 'bg-amber-500 text-black'}`}>
                                                    {item.type}
                                                </span>
                                                <h3 className="text-lg font-bold text-[#e4e4ea] tracking-tight">
                                                    {item.courseTitle}
                                                </h3>
                                            </div>
                                            <span className={`text-[11px] font-black px-3 py-1 rounded-full border flex items-center gap-1.5 uppercase tracking-wider shadow-sm ${getStatusColor(item.appeal.status)}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {item.appeal.status}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {isStaff && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-[#888] font-bold uppercase">
                                                        {item.userName?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="text-xs font-bold text-[#e4e4ea]">{item.userName}</span>
                                                    <span className="text-[10px] text-[#666]">({item.userEmail})</span>
                                                </div>
                                            )}

                                            <div className="bg-[#0e0e0e] rounded-xl border border-[#2a2a2a] p-4 relative overflow-hidden">
                                                <ChatBubbleLeftRightIcon className="absolute -right-2 -bottom-2 w-12 h-12 text-white/[0.02]" />
                                                <p className="text-sm text-[#e4e4ea] leading-relaxed relative z-10">
                                                    {item.appeal.reason}
                                                </p>
                                            </div>

                                            {item.type === 'assessment' && item.submissionFile && (
                                                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <DocumentIcon className="w-5 h-5 text-[#5f82f3]" />
                                                        <span className="text-xs text-[#e4e4ea] font-medium">Assessment Submission.pdf</span>
                                                    </div>
                                                    <a
                                                        href={item.submissionFile}
                                                        download={`Submission_${item.userName}.pdf`}
                                                        className="p-1.5 hover:bg-white/5 rounded-md text-[#888] hover:text-[#5f82f3] transition-colors"
                                                    >
                                                        <ArrowDownTrayIcon className="w-5 h-5" />
                                                    </a>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4 mt-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-[#444] tracking-widest">{item.type === 'quiz' ? 'Best Score' : 'Submission Score'}</span>
                                                    <span className="text-sm font-black text-amber-500">
                                                        {item.type === 'quiz'
                                                            ? (typeof (item.bestScore || item.score) === 'number' ? (item.bestScore || item.score).toFixed(2) : (item.bestScore || item.score || 0))
                                                            : Math.round(item.score || item.bestScore || 0)
                                                        }%
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-[#444] tracking-widest">Submitted</span>
                                                    <span className="text-sm font-medium text-[#888]">{new Date(item.appeal.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            {item.appeal.status !== 'pending' && item.appeal.comment && (
                                                <div className="mt-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 flex gap-3 items-start">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#5f82f3] mt-1.5 flex-shrink-0" />
                                                    <p className="text-xs text-[#888]">
                                                        <strong className="text-[#5f82f3] mr-1">Instructor Note:</strong> {item.appeal.comment}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isStaff && item.appeal.status === 'pending' && (
                                        <div className="w-full lg:w-72 space-y-3 mt-4 lg:mt-0">
                                            {item.type === 'assessment' && (
                                                <div className="p-3 bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg">
                                                    <label className="block text-[10px] uppercase font-black text-[#444] mb-2 tracking-widest">Grade Score (%)</label>
                                                    <input
                                                        type="number"
                                                        value={assessmentScore}
                                                        onChange={(e) => setAssessmentScore(e.target.value)}
                                                        placeholder="Enter grade..."
                                                        className="w-full bg-[#111] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                                                    />
                                                </div>
                                            )}

                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder={item.type === 'assessment' ? "Add feedback..." : "Add a comment (optional)..."}
                                                className="w-full p-2 bg-[#0e0e0e] border border-[#2a2a2a] rounded-lg text-xs text-[#e4e4ea] focus:outline-none focus:border-[#5f82f3]"
                                                rows={2}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAction(item, 'rejected')}
                                                    disabled={isActioning}
                                                    className="flex-1 py-1.5 bg-[#ff4848]/10 text-[#ff4848] text-[10px] font-bold rounded-lg hover:bg-[#ff4848]/20 transition-colors uppercase"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => item.type === 'assessment' ? handleGradeAssessment(item) : handleAction(item, 'approved')}
                                                    disabled={isActioning || (item.type === 'assessment' && !assessmentScore)}
                                                    className={`flex-1 py-1.5 text-[#0e0e0e] text-[10px] font-bold rounded-lg transition-colors uppercase ${item.type === 'assessment' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#5dff4f] hover:bg-[#4de63e]'}`}
                                                >
                                                    {item.type === 'assessment' ? 'Submit Grade' : 'Approve (+3)'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </DashboardLayout>
    );
}
