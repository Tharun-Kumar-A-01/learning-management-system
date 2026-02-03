import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../utils/api';
import {
    DocumentTextIcon,
    ArrowLeftIcon,
    EyeIcon,
    PencilSquareIcon
} from '@heroicons/react/24/outline';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';

export default function ArticleEditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [article, setArticle] = useState({
        title: '',
        content: '',
        category: 'General',
        tags: '',
        status: 'draft'
    });

    const [previewMode, setPreviewMode] = useState(false);

    const categories = ['General', 'Training', 'Compliance', 'Technical', 'HR', 'Other'];

    useEffect(() => {
        if (isEditing) {
            fetchArticle();
        }
    }, [id]);

    const fetchArticle = async () => {
        try {
            const res = await apiFetch(`/articles/${id}`);
            if (res.success) {
                setArticle({
                    title: res.data.title,
                    content: res.data.content,
                    category: res.data.category,
                    tags: res.data.tags?.join(', ') || '',
                    status: res.data.status
                });
            }
        } catch (err) {
            setError('Failed to load article');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e, status) => {
        if (e) e.preventDefault();
        setError('');

        if (!article.title.trim() || !article.content.trim()) {
            setError('Title and content are required');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: article.title.trim(),
                content: article.content.trim(),
                category: article.category,
                tags: article.tags.split(',').map(t => t.trim()).filter(Boolean),
                status: status || article.status
            };

            if (isEditing) {
                await apiFetch(`/articles/${id}`, {
                    method: 'PUT',
                    body: payload
                });
            } else {
                await apiFetch('/articles', {
                    method: 'POST',
                    body: payload
                });
            }
            navigate('/knowledge');
        } catch (err) {
            setError(err.message || 'Failed to save article');
        } finally {
            setSaving(false);
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

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/knowledge')}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <DocumentTextIcon className="w-7 h-7 text-indigo-400" />
                        {isEditing ? 'Edit Article' : 'New Article'}
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        {isEditing ? 'Update this knowledge base article' : 'Create a new knowledge base article'}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-3xl">
                <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={article.title}
                            onChange={(e) => setArticle({ ...article, title: e.target.value })}
                            placeholder="Enter article title"
                            className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Category
                        </label>
                        <select
                            value={article.category}
                            onChange={(e) => setArticle({ ...article, category: e.target.value })}
                            className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Tags
                        </label>
                        <input
                            type="text"
                            value={article.tags}
                            onChange={(e) => setArticle({ ...article, tags: e.target.value })}
                            placeholder="Enter tags separated by commas"
                            className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Separate tags with commas (e.g., training, onboarding, safety)</p>
                    </div>

                    {/* Content */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-zinc-400">
                                Content <span className="text-red-400">*</span>
                            </label>
                            <div className="flex bg-zinc-800 rounded-lg p-1">
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode(false)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${!previewMode ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    <PencilSquareIcon className="w-3.5 h-3.5" />
                                    Write
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode(true)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${previewMode ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    <EyeIcon className="w-3.5 h-3.5" />
                                    Preview
                                </button>
                            </div>
                        </div>

                        {!previewMode ? (
                            <textarea
                                value={article.content}
                                onChange={(e) => setArticle({ ...article, content: e.target.value })}
                                placeholder="Write your article content here using Markdown..."
                                rows={15}
                                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-y font-mono text-sm leading-relaxed"
                            />
                        ) : (
                            <div className="min-h-[384px] p-6 bg-zinc-800/50 border border-white/10 rounded-lg overflow-y-auto">
                                <MarkdownRenderer content={article.content} />
                                {(!article.content || article.content.trim() === '') && (
                                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-12">
                                        <DocumentTextIcon className="w-12 h-12 mb-2 opacity-20" />
                                        <p>Nothing to preview yet</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <p className="text-[10px] text-zinc-500 mt-2">Supports Markdown: # Header, **Bold**, *Italic*, [Link](url), ![Image](url), | Tables |, and ```Code Blocks```.</p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => navigate('/knowledge')}
                            className="px-5 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'draft')}
                            disabled={saving}
                            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save as Draft'}
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, 'published')}
                            disabled={saving}
                            className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Publishing...' : (isEditing && article.status === 'published' ? 'Update' : 'Publish')}
                        </button>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
