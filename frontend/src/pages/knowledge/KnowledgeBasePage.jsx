import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
    BookOpenIcon,
    MagnifyingGlassIcon,
    TagIcon,
    BookmarkIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

export default function KnowledgeBasePage() {
    const { user } = useAuth();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [showSaved, setShowSaved] = useState(false);

    const canCreate = user?.role === 'trainer' || user?.role === 'admin' || user?.role === 'super_admin';

    useEffect(() => {
        fetchArticles();
        fetchCategories();
    }, [showSaved]);

    const fetchArticles = async () => {
        try {
            let url = '/articles';
            if (showSaved) url += '?savedOnly=true';
            const res = await apiFetch(url);
            if (res.success) {
                setArticles(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch articles:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await apiFetch('/articles/meta/categories');
            if (res.success) {
                setCategories(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const toggleSave = async (articleId) => {
        try {
            const res = await apiFetch(`/articles/${articleId}/save`, { method: 'PUT' });
            if (res.success) {
                setArticles(articles.map(a =>
                    a._id === articleId ? { ...a, isSaved: res.isSaved } : a
                ));
            }
        } catch (error) {
            console.error('Failed to toggle save:', error);
        }
    };

    const deleteArticle = async (articleId) => {
        if (!confirm('Are you sure you want to delete this article?')) return;
        try {
            await apiFetch(`/articles/${articleId}`, { method: 'DELETE' });
            setArticles(articles.filter(a => a._id !== articleId));
        } catch (error) {
            console.error('Failed to delete article:', error);
        }
    };

    const publishArticle = async (articleId) => {
        try {
            const res = await apiFetch(`/articles/${articleId}`, {
                method: 'PUT',
                body: { status: 'published' }
            });
            if (res.success) {
                setArticles(articles.map(a =>
                    a._id === articleId ? { ...a, status: 'published' } : a
                ));
            }
        } catch (error) {
            console.error('Failed to publish article:', error);
        }
    };

    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase()) ||
            article.content.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !category || article.category === category;
        return matchesSearch && matchesCategory;
    });

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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BookOpenIcon className="w-8 h-8 text-indigo-400" />
                        Knowledge Base
                    </h1>
                    <p className="text-zinc-400 mt-2">Articles, guides, and learning resources</p>
                </div>
                {canCreate && (
                    <Link
                        to="/knowledge/new"
                        className="inline-flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-black rounded-lg text-sm font-medium transition-colors"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        New Article
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowSaved(!showSaved)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${showSaved
                            ? 'bg-indigo-500 text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                    >
                        <BookmarkIcon className="w-4 h-4" />
                        Saved
                    </button>
                </div>
            </div>

            {/* Articles Grid */}
            {filteredArticles.length === 0 ? (
                <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-12 text-center">
                    <BookOpenIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400">
                        {showSaved ? 'No saved articles' : 'No articles found'}
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArticles.map((article) => (
                        <div
                            key={article._id}
                            className="bg-zinc-900/50 rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-xs">
                                            {article.category}
                                        </span>
                                        {article.status === 'draft' && (
                                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                                                Draft
                                            </span>
                                        )}
                                    </div>
                                    {!canCreate && (
                                        <button
                                            onClick={() => toggleSave(article._id)}
                                            className="text-zinc-400 hover:text-indigo-400 transition-colors"
                                        >
                                            {article.isSaved ? (
                                                <BookmarkSolidIcon className="w-5 h-5 text-indigo-400" />
                                            ) : (
                                                <BookmarkIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                    )}
                                </div>
                                <Link to={`/knowledge/${article._id}`}>
                                    <h3 className="text-lg font-semibold text-white hover:text-indigo-400 transition-colors mb-2">
                                        {article.title}
                                    </h3>
                                </Link>
                                <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
                                    {article.content}
                                </p>
                                <div className="mb-6">
                                    <Link
                                        to={`/knowledge/${article._id}`}
                                        className="inline-flex items-center justify-center w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-white/5"
                                    >
                                        Read Article
                                    </Link>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <span>By {article.author?.name || 'Unknown'}</span>
                                    </div>
                                    {canCreate && (
                                        <div className="flex items-center gap-2">
                                            {article.status === 'draft' && (
                                                <button
                                                    onClick={() => publishArticle(article._id)}
                                                    className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
                                                >
                                                    Publish
                                                </button>
                                            )}
                                            {(article.author?._id === user?.id || user?.role === 'admin' || user?.role === 'super_admin') && (
                                                <div className="flex items-center gap-1">
                                                    <Link
                                                        to={`/knowledge/${article._id}/edit`}
                                                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => deleteArticle(article._id)}
                                                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-400/5 rounded-md transition-colors"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {article.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {article.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                                                {tag}
                                            </span>
                                        ))}
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
