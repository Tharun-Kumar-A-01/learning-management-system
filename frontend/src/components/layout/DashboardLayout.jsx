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
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

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
                { path: '/certificates', label: 'Certificates', icon: TrophyIcon }
            ],
            trainer: [
                { path: '/courses', label: 'Courses', icon: BookOpenIcon },
                { path: '/students', label: 'Students', icon: UsersIcon },
                // { path: '/assessments', label: 'Assessments', icon: ClipboardDocumentCheckIcon }
            ],
            admin: [
                { path: '/users', label: 'Users', icon: UsersIcon },
                { path: '/courses', label: 'Courses', icon: BookOpenIcon },
                { path: '/reports', label: 'Reports', icon: ChartBarIcon },
                { path: '/settings', label: 'Settings', icon: Cog6ToothIcon }
            ],
            super_admin: [
                { path: '/users', label: 'Users', icon: UsersIcon },
                { path: '/courses', label: 'Courses', icon: BookOpenIcon },
                { path: '/reports', label: 'Reports', icon: ChartBarIcon },
                // { path: '/organizations', label: 'Organizations', icon: BuildingOfficeIcon },
                { path: '/learning-policies', label: 'Learning Policies', icon: ShieldCheckIcon },
                { path: '/branding', label: 'Branding', icon: PaintBrushIcon },
                { path: '/settings', label: 'Settings', icon: Cog6ToothIcon }
            ]
        };

        return [...common, ...(roleItems[user?.role] || [])];
    };

    const navItems = getNavItems();

    return (
        <div className="min-h-screen bg-[#0e0e0e] flex">
            {/* Sidebar */}
            <aside className="w-56 bg-[#0e0e0e] border-r border-[#1a1a1a] flex flex-col">
                {/* Logo */}
                <div className="p-4 border-b border-[#1a1a1a]">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <AcademicCapIcon className="w-7 h-7 text-[#5f82f3]" />
                        <span className="text-lg font-semibold text-[#e4e4ea]">LMS</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3">
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
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[#5f82f3] text-sm font-medium">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#e4e4ea] truncate">{user?.name}</p>
                            <p className="text-xs text-[#666]">{getRoleLabel()}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#888] hover:text-[#ff4848] hover:bg-[#1a1a1a] rounded-md transition-colors"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
                {children}
            </main>
        </div>
    );
}
