import { Link } from 'react-router-dom';

export default function CourseCard({ course, showProgress = false }) {
    const progress = course.progress || 0;

    return (
        <div className="bg-zinc-900/50 rounded-xl border border-white/10 overflow-hidden hover:border-indigo-500/30 transition-all hover:scale-[1.02]">
            {/* Course Image/Thumbnail */}
            <div className="h-32 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
                <span className="text-4xl">📚</span>
            </div>

            {/* Course Info */}
            <div className="p-4">
                <h4 className="text-lg font-semibold text-white truncate">{course.title || 'Untitled Course'}</h4>
                <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{course.description || 'No description available'}</p>

                {showProgress && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-zinc-400">Progress</span>
                            <span className="text-indigo-400 font-medium">{progress}%</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>📖 {course.modules || 0} modules</span>
                    </div>
                    <Link
                        to={`/courses/${course._id || course.id}`}
                        className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                        {showProgress ? 'Continue →' : 'View →'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
