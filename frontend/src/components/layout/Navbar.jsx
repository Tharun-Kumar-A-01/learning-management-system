import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../hooks/useBranding';
import { Button } from '../ui/Button'; // Assuming Button component exists in UI kit
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from '../ui/Menu'; // Assuming Menu exists

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { settings } = useBranding();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-zinc-900 border-b border-white/10 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-3">
                            {settings.logoUrl ? (
                                <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                            ) : (
                                <span className="text-xl font-bold" style={{ color: settings.primaryColor }}>
                                    {settings.companyName}
                                </span>
                            )}
                            {settings.logoUrl && (
                                <span className="text-xl font-bold hidden md:block" style={{ color: settings.primaryColor }}>
                                    {settings.companyName}
                                </span>
                            )}
                        </Link>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link to="/courses" className="hover:bg-zinc-800 px-3 py-2 rounded-md text-sm font-medium">
                                    Courses
                                </Link>
                                <Link to="/verify" className="hover:bg-zinc-800 px-3 py-2 rounded-md text-sm font-medium">
                                    Verify Certificate
                                </Link>
                                {user && (
                                    <Link to="/dashboard" className="hover:bg-zinc-800 px-3 py-2 rounded-md text-sm font-medium">
                                        Dashboard
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6 gap-4">
                            {user ? (
                                <Menu>
                                    <MenuTrigger className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{user.name}</span>
                                        <div
                                            className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-colors"
                                            style={{ backgroundColor: settings.primaryColor }}
                                        >
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    </MenuTrigger>
                                    <MenuContent className="w-48">
                                        <MenuItem href="/profile">Profile</MenuItem>
                                        <MenuItem href="/settings">Settings</MenuItem>
                                        <MenuSeparator />
                                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                                    </MenuContent>
                                </Menu>
                            ) : (
                                <>
                                    <Link to="/login">
                                        <Button plain>Login</Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button style={{ backgroundColor: settings.primaryColor }} className="text-white hover:opacity-90">Register</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
