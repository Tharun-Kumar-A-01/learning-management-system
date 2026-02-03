import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

/**
 * Robust Markdown Renderer using react-markdown.
 * Supports GFM (tables, etc.) and syntax highlighting.
 */
export default function MarkdownRenderer({ content }) {
    return (
        <div className="markdown-content prose prose-invert max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    // Style basic elements to match the platform's theme
                    h1: ({ children }) => <h1 className="text-3xl font-bold text-white mt-8 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-bold text-white mt-6 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-bold text-white mt-5 mb-2">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-lg font-bold text-white mt-4 mb-2">{children}</h4>,
                    p: ({ children }) => <p className="mb-4 leading-relaxed text-zinc-300">{children}</p>,
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
                        >
                            {children}
                        </a>
                    ),
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-6 border border-white/10 rounded-xl">
                            <table className="w-full border-collapse text-sm">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className="bg-zinc-800/50 text-zinc-300 border-b border-white/10">{children}</thead>,
                    th: ({ children }) => <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-xs">{children}</th>,
                    td: ({ children }) => <td className="px-4 py-3 border-t border-white/5 text-zinc-400">{children}</td>,
                    img: ({ src, alt }) => (
                        <img
                            src={src}
                            alt={alt}
                            className="rounded-xl border border-white/10 my-8 max-w-full h-auto shadow-2xl mx-auto"
                        />
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-indigo-500 bg-indigo-500/5 px-6 py-4 my-6 italic text-zinc-400 rounded-r-lg">
                            {children}
                        </blockquote>
                    ),
                    ul: ({ children }) => <ul className="list-disc list-outside mb-4 ml-6 space-y-2 text-zinc-300">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-outside mb-4 ml-6 space-y-2 text-zinc-300">{children}</ol>,
                    li: ({ children }) => <li className="pl-2">{children}</li>,
                    code: ({ inline, className, children }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline ? (
                            <div className="relative group my-6">
                                <div className="absolute top-0 right-0 p-2 text-zinc-500 text-[10px] font-mono group-hover:text-zinc-400 uppercase">
                                    {match ? match[1] : 'code'}
                                </div>
                                <pre className={`${className} bg-zinc-900 border border-white/10 p-5 rounded-xl overflow-x-auto text-sm leading-relaxed shadow-inner`}>
                                    <code className="block whitespace-pre font-mono">
                                        {children}
                                    </code>
                                </pre>
                            </div>
                        ) : (
                            <code className="bg-zinc-800 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono border border-white/5 mx-0.5">
                                {children}
                            </code>
                        );
                    },
                    hr: () => <hr className="border-t border-white/10 my-10" />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
