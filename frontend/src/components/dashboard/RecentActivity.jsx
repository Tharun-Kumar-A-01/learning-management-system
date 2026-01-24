export default function RecentActivity({ activities = [] }) {
    const getActivityIcon = (type) => {
        const icons = {
            enrollment: '📚',
            completion: '✅',
            certificate: '🏆',
            assessment: '📝',
            login: '🔑',
            course_created: '➕',
        };
        return icons[type] || '📌';
    };

    const getActivityColor = (type) => {
        const colors = {
            enrollment: 'bg-blue-500/20 border-blue-500/30',
            completion: 'bg-green-500/20 border-green-500/30',
            certificate: 'bg-yellow-500/20 border-yellow-500/30',
            assessment: 'bg-purple-500/20 border-purple-500/30',
            login: 'bg-zinc-500/20 border-zinc-500/30',
            course_created: 'bg-indigo-500/20 border-indigo-500/30',
        };
        return colors[type] || 'bg-zinc-500/20 border-zinc-500/30';
    };

    if (activities.length === 0) {
        return (
            <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="text-center py-8">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-zinc-400 text-sm">No recent activity</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
                {activities.map((activity, index) => (
                    <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)} transition-colors hover:bg-white/5`}
                    >
                        <span className="text-xl">{getActivityIcon(activity.type)}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">{activity.message}</p>
                            <p className="text-xs text-zinc-500 mt-1">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
