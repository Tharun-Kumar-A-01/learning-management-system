export default function StatCard({ title, value, icon: Icon, subtitle }) {
    return (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-[#888] mb-1">{title}</p>
                    <p className="text-2xl font-semibold text-[#e4e4ea]">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-[#666] mt-1">{subtitle}</p>
                    )}
                </div>
                {Icon && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="w-6 h-6 text-[#5f82f3]" />
                    </div>
                )}
            </div>
        </div>
    );
}
