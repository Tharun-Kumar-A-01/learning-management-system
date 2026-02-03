import { useState } from 'react';
import { apiFetch } from '../../utils/api';
import { ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function ImportUsersModal({ onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState(null);

    const parseCSV = (text) => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.indexOf('name');
        const emailIndex = headers.indexOf('email');
        const passwordIndex = headers.indexOf('password');
        const roleIndex = headers.indexOf('role');

        if (nameIndex === -1 || emailIndex === -1 || passwordIndex === -1) {
            throw new Error('CSV must have name, email, and password columns');
        }

        const users = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length < 3) continue;

            users.push({
                name: values[nameIndex],
                email: values[emailIndex],
                password: values[passwordIndex],
                role: roleIndex !== -1 ? values[roleIndex] || 'learner' : 'learner'
            });
        }
        return users;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.csv')) {
            setError('Please select a CSV file');
            return;
        }

        setFile(selectedFile);
        setError('');
        setResults(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const users = parseCSV(event.target.result);
                setPreview(users);
            } catch (err) {
                setError(err.message);
            }
        };
        reader.readAsText(selectedFile);
    };

    const handleImport = async () => {
        if (preview.length === 0) {
            setError('No valid users to import');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await apiFetch('/users/import', {
                method: 'POST',
                body: { users: preview }
            });

            if (res.success) {
                setResults(res.data);
                if (res.data.created.length > 0) {
                    onSuccess();
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <ArrowUpTrayIcon className="w-6 h-6 text-indigo-400" />
                        <h2 className="text-xl font-bold text-white">Import Users from CSV</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Results View */}
                    {results ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                                    <CheckCircleIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-green-400">{results.created.length}</div>
                                    <div className="text-sm text-green-300">Users Created</div>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                                    <ExclamationCircleIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-red-400">{results.failed.length}</div>
                                    <div className="text-sm text-red-300">Failed</div>
                                </div>
                            </div>

                            {results.failed.length > 0 && (
                                <div className="bg-zinc-800 rounded-lg p-4">
                                    <h3 className="text-sm font-medium text-zinc-300 mb-2">Failed Imports:</h3>
                                    <ul className="space-y-1 text-sm">
                                        {results.failed.map((f, i) => (
                                            <li key={i} className="text-red-400">
                                                {f.email}: {f.reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Upload Area */}
                            {!file && (
                                <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center">
                                    <DocumentTextIcon className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                                    <p className="text-zinc-400 mb-4">
                                        Upload a CSV file with columns: <span className="text-white">name, email, password</span>
                                        <br />
                                        <span className="text-sm text-zinc-500">Optional column: role (learner, trainer, admin)</span>
                                    </p>
                                    <label className="inline-flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg cursor-pointer transition-colors">
                                        <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                                        Select CSV File
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            )}

                            {/* Preview */}
                            {preview.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-medium text-zinc-300">
                                            Preview ({preview.length} users)
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setFile(null);
                                                setPreview([]);
                                            }}
                                            className="text-sm text-zinc-400 hover:text-white"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <div className="bg-zinc-800 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left py-2 px-4 text-zinc-400">Name</th>
                                                    <th className="text-left py-2 px-4 text-zinc-400">Email</th>
                                                    <th className="text-left py-2 px-4 text-zinc-400">Role</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview.slice(0, 10).map((user, i) => (
                                                    <tr key={i} className="border-b border-white/5">
                                                        <td className="py-2 px-4 text-white">{user.name}</td>
                                                        <td className="py-2 px-4 text-zinc-400">{user.email}</td>
                                                        <td className="py-2 px-4 text-zinc-400 capitalize">{user.role}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {preview.length > 10 && (
                                            <div className="text-center py-2 text-sm text-zinc-500">
                                                ... and {preview.length - 10} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                    >
                        {results ? 'Close' : 'Cancel'}
                    </button>
                    {!results && preview.length > 0 && (
                        <button
                            onClick={handleImport}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Importing...' : `Import ${preview.length} Users`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
