import { useState } from "react";
import AppLayout from "../components/AppLayout";
import BugReportForm from "../components/BugReportForm";
import ActivityLogPanel from "../components/ActivityLogPanel";
import DeleteAccountPanel from "../components/DeleteAccountPanel";
import InfoTip from "../components/InfoTip.jsx";
import { Settings } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { userCan } from "../lib/permissions";

const SettingsPage = () => {
    const breadcrumbs = [{ label: "Settings", href: "/settings" }];
    const { user } = useAuth();
    const showActivityLog = userCan(user, "viewActivityLog");
    const showDeleteAccount = userCan(user, "deleteOwnAccount");
    const [activeTab, setActiveTab] = useState("general");

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className={`p-4 sm:p-6 mx-auto ${showActivityLog ? "max-w-5xl" : "max-w-3xl"}`}>
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/10 p-3 rounded-xl">
                            <Settings className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Settings</h1>
                            <p className="text-base-content/70 mt-1">
                                Account tools and support options.
                            </p>
                        </div>
                    </div>
                </div>

                {showActivityLog && (
                    <div role="tablist" className="tabs tabs-boxed w-fit mb-6">
                        <button
                            type="button"
                            role="tab"
                            className={`tab ${activeTab === "general" ? "tab-active" : ""}`}
                            onClick={() => setActiveTab("general")}
                        >
                            General
                        </button>
                        <button
                            type="button"
                            role="tab"
                            className={`tab gap-1 ${activeTab === "activity" ? "tab-active" : ""}`}
                            onClick={() => setActiveTab("activity")}
                        >
                            Activities log
                            <InfoTip helpKey="control.activityLog" />
                        </button>
                    </div>
                )}

                {showActivityLog && activeTab === "activity" ? (
                    <ActivityLogPanel />
                ) : (
                    <>
                        <BugReportForm />
                        {showDeleteAccount && <DeleteAccountPanel />}
                    </>
                )}
            </div>
        </AppLayout>
    );
};

export default SettingsPage;
