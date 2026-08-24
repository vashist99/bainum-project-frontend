import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { User } from "lucide-react";
import toast from "react-hot-toast";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("session_expired") === "1") {
      toast.error("Your session has expired. Please log in again.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 backdrop-blur-sm">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="avatar placeholder mb-4">
              <div className="bg-primary text-primary-content rounded-full w-16">
                <User className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {isLogin ? "Welcome" : "Create Account"}
            </h2>
            <p className="text-base-content/60 mt-2">
              {isLogin
                ? "Sign in to your account to continue"
                : "Sign up to get started"}
            </p>
          </div>

          <div className="join w-full mb-6" role="tablist" aria-label="Account">
            <button
              type="button"
              role="tab"
              id="account-tab-signin"
              aria-selected={isLogin}
              aria-controls="account-panel"
              className={`join-item btn flex-1 ${isLogin ? "btn-primary" : "btn-outline"}`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              id="account-tab-create"
              aria-selected={!isLogin}
              aria-controls="account-panel"
              className={`join-item btn flex-1 ${!isLogin ? "btn-primary" : "btn-outline"}`}
              onClick={() => setIsLogin(false)}
            >
              Create account
            </button>
          </div>

          <div id="account-panel" role="tabpanel" aria-labelledby={isLogin ? "account-tab-signin" : "account-tab-create"}>
            {isLogin ? <LoginForm /> : <SignupForm />}
          </div>

          <p className="text-center text-sm text-base-content/60 mt-4">
            Are you a coach?{" "}
            <button
              type="button"
              onClick={() => navigate("/coach/register")}
              className="link link-secondary font-semibold"
            >
              Register as a coach
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;