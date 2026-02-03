import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
    ChartBarIcon,
    AcademicCapIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentCheckIcon,
    UsersIcon,
    TrophyIcon
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, [user]);

    const fetchAnalytics = async () => {
        try {
            let endpoint = '/analytics/learner';
            if (user?.role === 'trainer') endpoint = '/analytics/trainer';
            if (user?.role === 'admin' || user?.role === 'super_admin') endpoint = '/analytics/admin';

            const res = await apiFetch(endpoint);
            if (res.success) {
                setAnalytics(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <ChartBarIcon className="w-8 h-8 text-indigo-400" />
                    Analytics
                </h1>
                <p className="text-zinc-400 mt-2">
                    {user?.role === 'learner' && 'Your learning progress and performance'}
                    {user?.role === 'trainer' && 'Course performance and student progress'}
                    {(user?.role === 'admin' || user?.role === 'super_admin') && 'Platform-wide analytics and insights'}
                </p>
            </div>

            {/* Render based on role */}
            {user?.role === 'learner' && <LearnerAnalytics data={analytics} />}
            {user?.role === 'trainer' && <TrainerAnalytics data={analytics} />}
            {(user?.role === 'admin' || user?.role === 'super_admin') && <AdminAnalytics data={analytics} />}
        </DashboardLayout>
    );
}

function LearnerAnalytics({ data }) {
    if (!data) return null;
    const { overall, courses } = data;

    return (
        <div className="space-y-8">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={AcademicCapIcon}
                    label="Total Courses"
                    value={overall.totalCourses}
                    color="text-indigo-400"
                />
                <StatCard
                    icon={CheckCircleIcon}
                    label="Completed"
                    value={overall.completedCourses}
                    color="text-green-400"
                />
                <StatCard
                    icon={ClockIcon}
                    label="In Progress"
                    value={overall.inProgressCourses}
                    color="text-yellow-400"
                />
                <StatCard
                    icon={TrophyIcon}
                    label="Avg Progress"
                    value={`${overall.averageProgress}%`}
                    color="text-purple-400"
                />
            </div>

            {/* Quiz & Assessment Stats */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Quiz Performance</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Total Quizzes</span>
                            <span className="text-white font-medium">{overall.quizzes.total}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Passed</span>
                            <span className="text-green-400 font-medium">{overall.quizzes.passed}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Average Score</span>
                            <span className="text-indigo-400 font-medium">{overall.quizzes.averageScore}%</span>
                        </div>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Assessment Performance</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Total Assessments</span>
                            <span className="text-white font-medium">{overall.assessments.total}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Passed</span>
                            <span className="text-green-400 font-medium">{overall.assessments.passed}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Average Score</span>
                            <span className="text-indigo-400 font-medium">{overall.assessments.averageScore}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Per-Course Stats */}
            {courses.length > 0 && (
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white">Course Progress</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-zinc-400">
                                    <th className="text-left p-4">Course</th>
                                    <th className="text-center p-4">Progress</th>
                                    <th className="text-center p-4">Quiz Avg</th>
                                    <th className="text-center p-4">Assessment Avg</th>
                                    <th className="text-center p-4">Deadline</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((course) => (
                                    <tr key={course.courseId} className="border-b border-white/5 hover:bg-zinc-800/50">
                                        <td className="p-4">
                                            <div className="text-white font-medium">{course.courseTitle}</div>
                                            {course.isMandatory && (
                                                <span className="text-xs text-orange-400">Mandatory</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${course.progress >= 100 ? 'bg-green-500' :
                                                            course.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${course.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-zinc-300">{course.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-zinc-300">
                                            {course.quizzes.averageScore > 0 ? `${course.quizzes.averageScore}%` : '-'}
                                        </td>
                                        <td className="p-4 text-center text-zinc-300">
                                            {course.assessments.averageScore > 0 ? `${course.assessments.averageScore}%` : '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            {course.deadline ? (
                                                <span className={`text-sm ${new Date(course.deadline) < new Date() ? 'text-red-400' : 'text-zinc-300'
                                                    }`}>
                                                    {new Date(course.deadline).toLocaleDateString()}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function TrainerAnalytics({ data }) {
    if (!data) return null;
    const { overall, courses } = data;

    return (
        <div className="space-y-8">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={AcademicCapIcon}
                    label="Your Courses"
                    value={overall.totalCourses}
                    color="text-indigo-400"
                />
                <StatCard
                    icon={UsersIcon}
                    label="Total Enrollments"
                    value={overall.totalEnrollments}
                    color="text-blue-400"
                />
                <StatCard
                    icon={CheckCircleIcon}
                    label="Completions"
                    value={overall.totalCompletions}
                    color="text-green-400"
                />
                <StatCard
                    icon={DocumentCheckIcon}
                    label="Pending Review"
                    value={overall.pendingSubmissions}
                    color="text-orange-400"
                />
            </div>

            {/* Performance Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 text-center">
                    <div className="text-4xl font-bold text-indigo-400 mb-2">{overall.overallCompletionRate}%</div>
                    <div className="text-zinc-400 mb-4">Overall Completion Rate</div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${overall.overallCompletionRate}%` }}
                        />
                    </div>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">{overall.averageQuizScore}%</div>
                    <div className="text-zinc-400 mb-4">Average Quiz Score</div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${overall.averageQuizScore}%` }}
                        />
                    </div>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-2">{overall.averageAssessmentScore}%</div>
                    <div className="text-zinc-400 mb-4">Average Assessment Score</div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${overall.averageAssessmentScore}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Per-Course Stats */}
            {courses.length > 0 && (
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white">Course Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-zinc-400">
                                    <th className="text-left p-4">Course</th>
                                    <th className="text-center p-4">Enrolled</th>
                                    <th className="text-center p-4">Completions</th>
                                    <th className="text-center p-4">Quiz Avg</th>
                                    <th className="text-center p-4">Assessment Avg</th>
                                    <th className="text-center p-4">Pending</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((course) => (
                                    <tr key={course.courseId} className="border-b border-white/5 hover:bg-zinc-800/50">
                                        <td className="p-4">
                                            <div className="text-white font-medium">{course.courseTitle}</div>
                                            <span className={`text-xs ${course.status === 'published' ? 'text-green-400' : 'text-zinc-500'
                                                }`}>
                                                {course.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-zinc-300">{course.enrollments}</td>
                                        <td className="p-4 text-center">
                                            <span className="text-green-400">{course.completions}</span>
                                            <span className="text-zinc-500"> ({course.completionRate}%)</span>
                                        </td>
                                        <td className="p-4 text-center text-zinc-300">{course.averageQuizScore}%</td>
                                        <td className="p-4 text-center text-zinc-300">{course.averageAssessmentScore}%</td>
                                        <td className="p-4 text-center">
                                            {course.pendingSubmissions > 0 && (
                                                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                                                    {course.pendingSubmissions}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminAnalytics({ data }) {
    if (!data) return null;
    const { users, courses, courseDetails } = data;

    return (
        <div className="space-y-8">
            {/* User Stats */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">User Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard icon={UsersIcon} label="Total Users" value={users.total} color="text-indigo-400" />
                    <StatCard icon={UsersIcon} label="Learners" value={users.byRole.learners} color="text-zinc-400" />
                    <StatCard icon={UsersIcon} label="Trainers" value={users.byRole.trainers} color="text-green-400" />
                    <StatCard icon={UsersIcon} label="Admins" value={users.byRole.admins} color="text-blue-400" />
                    <StatCard icon={UsersIcon} label="Active" value={users.active} color="text-green-400" />
                </div>
            </div>

            {/* Course Stats */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Course Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={AcademicCapIcon} label="Total Courses" value={courses.total} color="text-indigo-400" />
                    <StatCard icon={CheckCircleIcon} label="Published" value={courses.byStatus.published} color="text-green-400" />
                    <StatCard icon={UsersIcon} label="Enrollments" value={courses.totalEnrollments} color="text-blue-400" />
                    <StatCard icon={TrophyIcon} label="Completions" value={courses.totalCompletions} color="text-purple-400" />
                </div>
            </div>

            {/* Performance Overview */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 text-center">
                    <div className="text-4xl font-bold text-indigo-400 mb-2">{courses.overallCompletionRate}%</div>
                    <div className="text-zinc-400 mb-4">Platform Completion Rate</div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${courses.overallCompletionRate}%` }}
                        />
                    </div>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">{courses.averageQuizScore}%</div>
                    <div className="text-zinc-400 mb-4">Average Quiz Score</div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${courses.averageQuizScore}%` }}
                        />
                    </div>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-2">{courses.averageAssessmentScore}%</div>
                    <div className="text-zinc-400 mb-4">Average Assessment Score</div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${courses.averageAssessmentScore}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Course Details Table */}
            {courseDetails.length > 0 && (
                <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white">All Courses</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-zinc-400">
                                    <th className="text-left p-4">Course</th>
                                    <th className="text-left p-4">Created By</th>
                                    <th className="text-center p-4">Status</th>
                                    <th className="text-center p-4">Enrolled</th>
                                    <th className="text-center p-4">Completion %</th>
                                    <th className="text-center p-4">Quiz Avg</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courseDetails.map((course) => (
                                    <tr key={course.courseId} className="border-b border-white/5 hover:bg-zinc-800/50">
                                        <td className="p-4 text-white font-medium">{course.courseTitle}</td>
                                        <td className="p-4 text-zinc-400">{course.createdBy}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs ${course.status === 'published'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-zinc-500/20 text-zinc-400'
                                                }`}>
                                                {course.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-zinc-300">{course.enrollments}</td>
                                        <td className="p-4 text-center text-zinc-300">{course.completionRate}%</td>
                                        <td className="p-4 text-center text-zinc-300">{course.averageQuizScore}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-sm text-zinc-400">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    );
}
