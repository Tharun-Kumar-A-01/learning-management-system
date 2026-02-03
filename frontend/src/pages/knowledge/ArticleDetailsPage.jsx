import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import {
    ChevronLeftIcon,
    PencilIcon,
    TrashIcon,
    CalendarIcon,
    UserIcon,
    TagIcon,
    BookmarkIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

export default function ArticleDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const canEdit = user?.role === 'super_admin' || user?.role === 'admin' || (user?.role === 'trainer' && article?.author?._id === user?.id);

    useEffect(() => {
        fetchArticle();
    }, [id]);

    const fetchArticle = async () => {
        try {
            const res = await apiFetch(`/articles/${id}`);
            if (res.success) {
                setArticle(res.data);
            } else {
                setError(res.message || 'Failed to load article');
            }
        } catch (err) {
            setError('Failed to fetch article details');
        } finally {
            setLoading(false);
        }
    };

    const toggleSave = async () => {
        try {
            const res = await apiFetch(`/articles/${id}/save`, { method: 'PUT' });
            if (res.success) {
                setArticle({ ...article, isSaved: res.isSaved });
            }
        } catch (error) {
            console.error('Failed to toggle save:', error);
        }
    };

    const deleteArticle = async () => {
        if (!confirm('Are you sure you want to delete this article?')) return;
        try {
            const res = await apiFetch(`/articles/${id}`, { method: 'DELETE' });
            if (res.success) {
                navigate('/knowledge');
            }
        } catch (error) {
            console.error('Failed to delete article:', error);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !article) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto py-12 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
                    <p className="text-zinc-400 mb-8">{error || 'Article not found'}</p>
                    <Link to="/knowledge" className="text-indigo-400 hover:text-indigo-300">
                        Back to Knowledge Base
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                {/* Navigation */}
                <button
                    onClick={() => navigate('/knowledge')}
                    className="flex items-center text-zinc-400 hover:text-white mb-8 transition-colors"
                >
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    Back to Knowledge Base
                </button>

                {/* Article Header */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-8 mb-8">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium uppercase tracking-wider">
                            {article.category}
                        </span>
                        {article.status === 'draft' && (
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium uppercase tracking-wider">
                                Draft
                            </span>
                        )}
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
                        {article.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-6 text-sm text-zinc-400">
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                <span>{article.author?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4" />
                                <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {article.status === 'draft' && canEdit && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await apiFetch(`/articles/${id}`, {
                                                method: 'PUT',
                                                body: { status: 'published' }
                                            });
                                            if (res.success) {
                                                setArticle({ ...article, status: 'published' });
                                            }
                                        } catch (error) {
                                            console.error('Failed to publish article:', error);
                                        }
                                    }}
                                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Publish Article
                                </button>
                            )}
                            <button
                                onClick={toggleSave}
                                className={`p-2 rounded-lg border transition-all ${article.isSaved
                                    ? 'bg-indigo-500 text-black border-indigo-500'
                                    : 'bg-zinc-800 text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
                                    }`}
                                title={article.isSaved ? 'Unsave Article' : 'Save Article'}
                            >
                                {article.isSaved ? <BookmarkSolidIcon className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
                            </button>

                            {canEdit && (
                                <>
                                    <Link
                                        to={`/knowledge/${article._id}/edit`}
                                        className="p-2 bg-zinc-800 text-zinc-400 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-all underline decoration-transparent hover:no-underline"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </Link>
                                    <button
                                        onClick={deleteArticle}
                                        className="p-2 bg-zinc-800 text-zinc-400 border border-white/10 rounded-lg hover:text-red-400 hover:border-red-400/50 transition-all"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Article Content */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-8 mb-8">
                    <MarkdownRenderer content={article.content} />
                </div>

                {/* Tags */}
                {article.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-12">
                        {article.tags.map(tag => (
                            <span
                                key={tag}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-white/10 text-zinc-400 rounded-lg text-sm"
                            >
                                <TagIcon className="w-3.5 h-3.5" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
