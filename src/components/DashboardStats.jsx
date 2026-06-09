import { useState, useEffect } from "react";
import { Users, Building2, UserCheck, TrendingUp, Calendar, BookOpen, Award, Clock } from "lucide-react";
import axios from "../lib/axios";
import { useAuth } from "../contexts/AuthContext";

const StatCard = ({ icon: Icon, title, value, subtitle, color = "primary", trend = null, loading = false }) => {
  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 border border-base-200">
      <div className="card-body p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className={`bg-${color}/10 p-3 rounded-lg w-fit mb-3`}>
              <Icon className={`w-6 h-6 text-${color}`} />
            </div>
            <h3 className="text-2xl font-bold text-base-content mb-1">
              {loading ? (
                <div className="skeleton w-16 h-8"></div>
              ) : (
                value
              )}
            </h3>
            <p className="text-sm text-base-content/70 font-medium">{title}</p>
            {subtitle && (
              <p className="text-xs text-base-content/50 mt-1">{subtitle}</p>
            )}
          </div>
          {trend && !loading && (
            <div className={`text-${trend >= 0 ? 'success' : 'error'} text-sm flex items-center gap-1`}>
              <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuickActionCard = ({ icon: Icon, title, description, onClick, color = "primary" }) => {
  return (
    <button
      onClick={onClick}
      className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 border border-base-200 hover:border-primary text-left active:scale-[0.98]"
    >
      <div className="card-body p-6">
        <div className={`bg-${color}/10 p-3 rounded-lg w-fit mb-3`}>
          <Icon className={`w-6 h-6 text-${color}`} />
        </div>
        <h3 className="text-lg font-semibold text-base-content mb-2">{title}</h3>
        <p className="text-sm text-base-content/70">{description}</p>
      </div>
    </button>
  );
};

const RecentActivityCard = ({ activities = [], loading = false }) => {
  return (
    <div className="card bg-base-100 shadow-xl border border-base-200">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Activity
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-8 h-8 rounded-full"></div>
                <div className="flex-1">
                  <div className="skeleton w-48 h-4 mb-1"></div>
                  <div className="skeleton w-24 h-3"></div>
                </div>
              </div>
            ))
          ) : activities.length > 0 ? (
            activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-base-50 hover:bg-base-100 transition-colors">
                <div className={`p-2 rounded-full bg-${activity.color || 'primary'}/10`}>
                  <activity.icon className={`w-4 h-4 text-${activity.color || 'primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-base-content">{activity.title}</p>
                  <p className="text-xs text-base-content/60">{activity.description}</p>
                  <p className="text-xs text-base-content/50 mt-1">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-base-content/60">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardStats = ({ onQuickAction }) => {
  const { isAdmin, isTeacher, user } = useAuth();
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalTeachers: 0,
    totalCenters: 0,
    activeRecordings: 0,
    monthlyAssessments: 0,
    averageProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [centersRes, teachersRes, childrenRes] = await Promise.all([
          axios.get("/api/centers").catch(() => ({ data: { centers: [] } })),
          axios.get("/api/teachers").catch(() => ({ data: { teachers: [] } })),
          axios.get("/api/children").catch(() => ({ data: { children: [] } }))
        ]);

        const centers = centersRes.data.centers || [];
        const teachers = teachersRes.data.teachers || [];
        const children = childrenRes.data.children || [];

        // Calculate stats
        const totalCenters = centers.length;
        const totalTeachers = teachers.length;
        const totalChildren = children.length;
        
        // Filter children based on user role
        const relevantChildren = isTeacher() 
          ? children.filter(child => child.leadTeacher === user?.name)
          : children;

        const activeRecordings = relevantChildren.filter(child => 
          child.assessments && child.assessments.length > 0
        ).length;

        // Calculate monthly assessments (assessments from current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let monthlyAssessments = 0;
        
        relevantChildren.forEach(child => {
          if (child.assessments) {
            monthlyAssessments += child.assessments.filter(assessment => {
              const assessmentDate = new Date(assessment.date);
              return assessmentDate.getMonth() === currentMonth && 
                     assessmentDate.getFullYear() === currentYear;
            }).length;
          }
        });

        // Calculate average progress (simplified)
        const childrenWithProgress = relevantChildren.filter(child => 
          child.assessments && child.assessments.length > 0
        );
        const averageProgress = childrenWithProgress.length > 0 
          ? Math.round((childrenWithProgress.length / relevantChildren.length) * 100)
          : 0;

        setStats({
          totalChildren: isTeacher() ? relevantChildren.length : totalChildren,
          totalTeachers: isTeacher() ? 1 : totalTeachers,
          totalCenters: isAdmin() ? totalCenters : (user?.center ? 1 : 0),
          activeRecordings,
          monthlyAssessments,
          averageProgress
        });

        // Generate recent activities
        const activities = [];
        
        if (monthlyAssessments > 0) {
          activities.push({
            icon: BookOpen,
            title: `${monthlyAssessments} new assessments`,
            description: "Recorded this month",
            time: "This month",
            color: "success"
          });
        }

        if (activeRecordings > 0) {
          activities.push({
            icon: Users,
            title: `${activeRecordings} children with recordings`,
            description: "Have assessment data",
            time: "Recent",
            color: "info"
          });
        }

        if (isAdmin() && totalTeachers > 0) {
          activities.push({
            icon: UserCheck,
            title: `${totalTeachers} teachers`,
            description: "Managing children across centers",
            time: "Current",
            color: "primary"
          });
        }

        setRecentActivities(activities);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin, isTeacher, user]);

  const quickActions = [
    ...(isAdmin() ? [
      {
        icon: Users,
        title: "Add New Teacher",
        description: "Invite a new teacher to the platform",
        onClick: () => onQuickAction?.("/teachers/add"),
        color: "primary"
      },
      {
        icon: Building2,
        title: "Add New Center",
        description: "Register a new educational center",
        onClick: () => onQuickAction?.("/centers/add"),
        color: "secondary"
      }
    ] : []),
    {
      icon: UserCheck,
      title: "Add New Child",
      description: "Register a new child for tracking",
      onClick: () => onQuickAction?.("/children/add"),
      color: "accent"
    },
    {
      icon: BookOpen,
      title: "View All Data",
      description: "Access child progress and analytics",
      onClick: () => onQuickAction?.("/data"),
      color: "info"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title={isTeacher() ? "My Students" : "Total Children"}
          value={stats.totalChildren}
          subtitle={isTeacher() ? "Students under your supervision" : "Across all centers"}
          color="primary"
          loading={loading}
        />
        
        {(isAdmin() || isTeacher()) && (
          <StatCard
            icon={UserCheck}
            title={isAdmin() ? "Total Teachers" : "My Classes"}
            value={isTeacher() ? "Active" : stats.totalTeachers}
            subtitle={isAdmin() ? "Across all centers" : "Currently teaching"}
            color="secondary"
            loading={loading}
          />
        )}
        
        {isAdmin() && (
          <StatCard
            icon={Building2}
            title="Education Centers"
            value={stats.totalCenters}
            subtitle="Registered locations"
            color="accent"
            loading={loading}
          />
        )}
        
        <StatCard
          icon={BookOpen}
          title="Active Recordings"
          value={stats.activeRecordings}
          subtitle="Children with assessment data"
          color="success"
          loading={loading}
        />
        
        <StatCard
          icon={Calendar}
          title="Monthly Assessments"
          value={stats.monthlyAssessments}
          subtitle="Completed this month"
          color="info"
          loading={loading}
        />
        
        <StatCard
          icon={Award}
          title="Progress Rate"
          value={`${stats.averageProgress}%`}
          subtitle="Children with recorded data"
          color="warning"
          loading={loading}
        />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-base-content mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivityCard activities={recentActivities} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;