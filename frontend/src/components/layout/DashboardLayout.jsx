import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HomeIcon,
    BookOpenIcon,
    UsersIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    AcademicCapIcon,
    BuildingOfficeIcon,
    ShieldCheckIcon,
    PaintBrushIcon,
    ClipboardDocumentCheckIcon,
    TrophyIcon,
    ArrowRightOnRectangleIcon,
    ChatBubbleLeftRightIcon,
    DocumentIcon,
    InboxIcon,
    BookmarkSquareIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();



    const getRoleLabel = () => {
        const labels = {
            super_admin: 'Super Admin',
            admin: 'Admin / HR',
            trainer: 'Trainer',
            learner: 'Learner'
        };
        return labels[user?.role] || 'User';
    };

    const getNavItems = () => {
        const common = [
            { path: '/dashboard', label: 'Dashboard', icon: HomeIcon }
        ];

        const roleItems = {
            learner: [
                { path: '/courses', label: 'My Courses', icon: BookOpenIcon },
                { path: '/analytics', label: 'My Analytics', icon: ChartBarIcon },
                { path: '/certificates', label: 'Certificates', icon: TrophyIcon },
                { path: '/knowledge', label: 'Knowledge Base', icon: BookmarkSquareIcon }
            ],
            trainer: [
                { path: '/courses', label: 'Courses', icon: BookOpenIcon },
                { path: '/students', label: 'Students', icon: UsersIcon },
                { path: '/analytics', label: 'Analytics', icon: ChartBarIcon },
                { path: '/knowledge', label: 'Knowledge Base', icon: BookmarkSquareIcon }
            ],
            admin: [
                { path: '/users', label: 'Users', icon: UsersIcon },
                { path: '/courses', label: 'Courses', icon: BookOpenIcon },
                { path: '/analytics', label: 'Analytics', icon: ChartBarIcon },
                { path: '/knowledge', label: 'Knowledge Base', icon: BookmarkSquareIcon }
            ],
            super_admin: [
                { path: '/users', label: 'Users', icon: UsersIcon },
                { path: '/courses', label: 'Courses', icon: BookOpenIcon },
                { path: '/analytics', label: 'Analytics', icon: ChartBarIcon },
                { path: '/knowledge', label: 'Knowledge Base', icon: BookmarkSquareIcon },
                { path: '/learning-policies', label: 'Learning Policies', icon: ShieldCheckIcon },
                { path: '/branding', label: 'Branding', icon: PaintBrushIcon }
            ]
        };

        return [
            ...common,
            { path: '/inbox', label: 'Inbox', icon: InboxIcon },
            ...(roleItems[user?.role] || []),
            { path: '/assessments', label: 'Assessments', icon: DocumentIcon },
            { path: '/appeals', label: 'Course Appeals', icon: ChatBubbleLeftRightIcon },
            { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
        ];
    };

    const navItems = getNavItems();

    return (
        <div className="min-h-screen bg-[#0e0e0e] flex flex-col md:flex-row">
            {/* Mobile Header (Fixed Top) */}
            <header className="md:hidden flex items-center justify-between p-4 bg-[#0e0e0e] border-b border-[#1a1a1a] sticky top-0 z-50">
                <Link to="/dashboard" className="flex items-center gap-2">
                    <AcademicCapIcon className="w-7 h-7 text-[#5f82f3]" />
                    <span className="text-lg font-semibold text-[#e4e4ea]">LMS</span>
                </Link>
                <div className="flex items-center gap-3">
                    <Link to="/settings">
                        {user?.profilePhoto ? (
                            <img src={user.profilePhoto} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[#5f82f3] text-sm font-medium">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </Link>
                </div>
            </header>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-56 bg-[#0e0e0e] border-r border-[#1a1a1a] flex-col sticky top-0 h-screen">
                {/* Logo */}
                <div className="p-4 border-b border-[#1a1a1a]">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <AcademicCapIcon className="w-7 h-7 text-[#5f82f3]" />
                        <span className="text-lg font-semibold text-[#e4e4ea]">LMS</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 overflow-y-auto">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive
                                            ? 'bg-primary/10 text-[#5f82f3]'
                                            : 'text-[#888] hover:text-[#e4e4ea] hover:bg-[#1a1a1a]'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-[#1a1a1a]">
                    <div className="flex items-center gap-3 mb-3">
                        {user?.profilePhoto ? (
                            <img
                                src={user.profilePhoto}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[#5f82f3] text-sm font-medium">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#e4e4ea] truncate">{user?.name}</p>
                            <p className="text-xs text-[#666]">{getRoleLabel()}</p>
                        </div>
                    </div>

                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0e0e0e]/80 backdrop-blur-lg border-t border-[#1a1a1a] px-2 py-1 z-50">
                <ul className="flex justify-around items-center">
                    {/* Only show 5 primary items on mobile bottom nav */}
                    {navItems.slice(0, 5).map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={item.path} className="flex-1">
                                <Link
                                    to={item.path}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive
                                        ? 'text-[#5f82f3]'
                                        : 'text-[#666]'
                                        }`}
                                >
                                    <item.icon className="w-6 h-6" />
                                    <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
