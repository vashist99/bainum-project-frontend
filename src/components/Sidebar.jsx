import { useState } from "react";
import { Link } from "react-router";
import {
  Home, Users, Building2, BarChart3, UserCircle, Settings, CircleHelp,
  LogOut, X, ChevronDown, ChevronRight, School, Radio, ClipboardList
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useViewAs } from "../contexts/ViewAsContext";
import { buildSidebarItems } from "../lib/sidebarNav.js";
import { roleDisplayName } from "../lib/viewAs.js";
import InfoTip from "./InfoTip.jsx";

const NAV_ICONS = {
  "nav.dashboard": Home,
  "nav.homeRecording": Radio,
  "nav.myChildData": BarChart3,
  "nav.coaches": ClipboardList,
  "nav.teachers": Users,
  "nav.schools": Building2,
  "nav.home": BarChart3,
  "nav.classrooms": School,
  "nav.myProfile": UserCircle,
};

const itemClassName = (isActive) =>
  `flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-200 group cursor-pointer ${
    isActive
      ? "bg-primary text-primary-content shadow-md"
      : "hover:bg-base-200 text-base-content"
  }`;

const SidebarItem = ({ icon: IconComponent, label, href, isActive, onClick, hasSubmenu = false, isOpen = false, helpKey, children }) => { // eslint-disable-line no-unused-vars
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(isOpen);

  const handleClick = (e) => {
    if (hasSubmenu) {
      e.preventDefault();
      setIsSubmenuOpen(!isSubmenuOpen);
    } else if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const inner = (
    <>
        <div className="flex items-center gap-3">
          <IconComponent className={`w-5 h-5 ${isActive ? "text-primary-content" : "text-base-content/70 group-hover:text-primary"}`} />
          <span className="font-medium">{label}</span>
          {helpKey && <InfoTip helpKey={helpKey} />}
        </div>
        {hasSubmenu && (
          <div className="transition-transform duration-200">
            {isSubmenuOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        )}
    </>
  );

  return (
    <div className="w-full">
      {href && !onClick ? (
        <Link to={href} className={itemClassName(isActive)} onClick={handleClick}>
          {inner}
        </Link>
      ) : (
        <button
          type="button"
          className={itemClassName(isActive)}
          onClick={handleClick}
        >
          {inner}
        </button>
      )}

      {hasSubmenu && isSubmenuOpen && children && (
        <div className="ml-8 mt-2 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const withIcons = (items) =>
  items.map((item) => ({ ...item, icon: NAV_ICONS[item.helpKey] || Home }));

const Sidebar = ({ isOpen, onToggle, currentPath = "/" }) => {
  const { user, logout } = useAuth();
  const { effectiveRole, isPreviewing, previewRole } = useViewAs();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const model = buildSidebarItems({
    effectiveRole,
    isPreviewing,
    user,
    currentPath,
  });
  const navigationItems = withIcons(model.navigationItems);
  const peopleItems = withIcons(model.peopleItems);
  const afterPeopleItems = withIcons(model.afterPeopleItems);
  const peopleChildActive = peopleItems.some((item) => item.isActive);
  const roleLine = isPreviewing
    ? `Viewing as ${roleDisplayName(previewRole)}`
    : (user?.role || "No Role");

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-base-100 border-r border-base-300 shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none
        w-72
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-primary-content font-bold text-sm">🎓</span>
              </div>
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  CATTAC
                </h1>
                <p className="text-xs text-base-content/60">Educational Platform</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden btn btn-ghost btn-sm btn-circle"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{user?.name || 'User'}</h3>
                <p className="text-xs text-base-content/60 capitalize truncate">
                  {roleLine}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarItem key={item.label} {...item} />
              ))}
              {peopleItems.length > 0 && (
                <SidebarItem
                  icon={Users}
                  label="People"
                  helpKey="nav.people"
                  hasSubmenu
                  isOpen={peopleChildActive}
                  isActive={false}
                >
                  {peopleItems.map((item) => (
                    <SidebarItem key={item.label} {...item} />
                  ))}
                </SidebarItem>
              )}
              {afterPeopleItems.map((item) => (
                <SidebarItem key={item.label} {...item} />
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-base-300">
            <div className="space-y-2">
              <SidebarItem
                icon={Settings}
                label="Settings"
                helpKey="nav.settings"
                href="/settings"
                isActive={currentPath === "/settings"}
              />
              <SidebarItem
                icon={CircleHelp}
                label="About"
                helpKey="nav.about"
                href="/about"
                isActive={currentPath.startsWith("/about")}
              />
              <SidebarItem
                icon={LogOut}
                label="Logout"
                onClick={handleLogout}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;