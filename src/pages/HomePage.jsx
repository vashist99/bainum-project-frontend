import { useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DashboardStats from "../components/DashboardStats";
import { Sparkles, Mic, Radio, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getPrimaryChildId } from "../utils/parentChildren.js";
import ClassroomUploadModal from "../components/ClassroomUploadModal";
import ActivityRecordingModal from "../components/ActivityRecordingModal";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAdmin, isParent, isTeacher, user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const breadcrumbs = [
    { label: "Dashboard", href: "/home" }
  ];

  const handleUploadSuccess = (teacherId) => {
    if (isTeacher()) {
      navigate("/profile");
    } else if (isAdmin() && teacherId) {
      navigate(`/data/teacher/${teacherId}`);
    }
  };

  const handleActivitySuccess = () => {
    if (isParent()) {
      const primary = getPrimaryChildId(user);
      if (primary) navigate(`/data/child/${primary}`);
    } else if (isTeacher()) {
      navigate("/profile");
    }
  };

  const showActivityButton = isTeacher() || isParent();
  
  const handleQuickAction = (path) => {
    navigate(path);
  };
  
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={handleSidebarToggle}
        currentPath="/home"
        onShowUploadModal={() => setShowUploadModal(true)}
        onShowActivityModal={() => setShowActivityModal(true)}
      />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <Navbar 
          onToggleSidebar={handleSidebarToggle}
          showSidebar={sidebarOpen}
          breadcrumbs={breadcrumbs}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Welcome Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-base-content">
                    Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                  </h1>
                  <p className="text-base-content/70 mt-1">
                    Here's what's happening in your educational platform today.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Dashboard Stats */}
            <DashboardStats onQuickAction={handleQuickAction} />
            
            {/* Quick Recording Actions for Parents/Teachers */}
            {(showActivityButton || isAdmin() || isTeacher()) && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-base-content mb-4">Recording Tools</h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
                  {showActivityButton && (
                    <button
                      onClick={() => setShowActivityModal(true)}
                      className="card bg-base-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 text-left border border-base-200 hover:border-error/50"
                    >
                      <div className="card-body p-6">
                        <div className="bg-error/10 p-3 rounded-lg w-fit mb-3">
                          <Radio className="h-6 w-6 text-error" />
                        </div>
                        <h3 className="card-title text-lg">Record Activity</h3>
                        <p className="text-sm text-base-content/70 mt-2">
                          {isTeacher()
                            ? "Record now — shared with every child you supervise."
                            : "Record now — shared with every child linked to you."}
                        </p>
                      </div>
                    </button>
                  )}

                  {(isAdmin() || isTeacher()) && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="card bg-base-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 text-left border border-base-200 hover:border-accent/50"
                    >
                      <div className="card-body p-6">
                        <div className="bg-accent/10 p-3 rounded-lg w-fit mb-3">
                          <Mic className="h-6 w-6 text-accent" />
                        </div>
                        <h3 className="card-title text-lg">Upload Classroom Recording</h3>
                        <p className="text-sm text-base-content/70 mt-2">
                          {isAdmin()
                            ? "Upload classroom recording for a teacher"
                            : "Upload a classroom recording for yourself"}
                        </p>
                      </div>
                    </button>
                  )}



                  {isParent() && getPrimaryChildId(user) && (
                    <a
                      href={`/data/child/${getPrimaryChildId(user)}`}
                      className="card bg-base-100 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 border border-base-200 hover:border-secondary/50"
                    >
                      <div className="card-body p-6">
                        <div className="bg-secondary/10 p-3 rounded-lg w-fit mb-3">
                          <ArrowRight className="h-6 w-6 text-secondary" />
                        </div>
                        <h3 className="card-title text-lg">View My Child's Data</h3>
                        <p className="text-sm text-base-content/70 mt-2">
                          See assessments, transcripts, and WPM progress.
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      
      {/* Modals */}
      {showUploadModal && (
        <ClassroomUploadModal
          isAdmin={isAdmin()}
          onSuccess={handleUploadSuccess}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {showActivityModal && (
        <ActivityRecordingModal
          role={isTeacher() ? "teacher" : "parent"}
          onSuccess={handleActivitySuccess}
          onClose={() => setShowActivityModal(false)}
        />
      )}
    </div>
  );
};

export default HomePage;
