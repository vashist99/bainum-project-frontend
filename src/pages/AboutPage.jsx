import { CircleHelp } from "lucide-react";
import { Link } from "react-router";
import AppLayout from "../components/AppLayout";
import AccessModelDiagram from "../components/AccessModelDiagram";
import InfoTip from "../components/InfoTip.jsx";
import { useAuth } from "../contexts/AuthContext";

function AboutBody() {
    return (
        <div className="p-4 sm:p-6 mx-auto max-w-[1600px]">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary/10 p-3 rounded-xl">
                        <CircleHelp className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                                About
                            </h1>
                            <InfoTip helpKey="page.about" />
                        </div>
                    </div>
                </div>
            </div>
            <AccessModelDiagram />
        </div>
    );
}

const AboutPage = () => {
    const { user, loading } = useAuth();
    const breadcrumbs = [{ label: "About", href: "/about" }];

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="loading loading-spinner loading-lg" aria-label="Loading" />
            </div>
        );
    }

    if (user) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <AboutBody />
            </AppLayout>
        );
    }

    return (
        <div className="min-h-screen bg-base-200">
            <header className="border-b border-base-300 bg-base-100">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
                    <p className="font-semibold text-base-content">CATTAC</p>
                    <Link to="/" className="btn btn-sm btn-primary">
                        Sign in
                    </Link>
                </div>
            </header>
            <main>
                <AboutBody />
            </main>
        </div>
    );
};

export default AboutPage;
