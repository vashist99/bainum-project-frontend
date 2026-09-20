import { getPrimaryChildId } from "../utils/parentChildren.js";
import { PREVIEW_CHILD_PATH } from "./viewAs.js";

/**
 * Sidebar item lists for a chrome role. Used by Sidebar and unit tests.
 * `effectiveRole` is the previewed role while View as is active.
 */
export function buildSidebarItems({
    effectiveRole,
    isPreviewing = false,
    user = null,
    currentPath = "/",
}) {
    const isAdmin = effectiveRole === "admin";
    const isTeacher = effectiveRole === "teacher";
    const isParent = effectiveRole === "parent";
    const isCoach = effectiveRole === "coach";

    const primaryChildId = isParent
        ? isPreviewing
            ? "preview"
            : getPrimaryChildId(user)
        : null;

    const teacherProfileHref = isPreviewing
        ? "/profile"
        : user?.username
          ? `/teachers/${user.username}`
          : "/profile";

    const navigationItems = isCoach
        ? [
              {
                  label: "Dashboard",
                  href: "/home",
                  helpKey: "nav.dashboard",
                  isActive:
                      currentPath === "/home" ||
                      currentPath === "/" ||
                      currentPath.startsWith("/classrooms"),
              },
          ]
        : [
              {
                  label: "Dashboard",
                  href: "/home",
                  helpKey: "nav.dashboard",
                  isActive:
                      currentPath === "/home" ||
                      currentPath === "/" ||
                      (isParent && currentPath.startsWith("/classrooms")),
              },
              ...(isParent
                  ? [
                        {
                            label: "Home Environment Data",
                            href: "/home/recording",
                            helpKey: "nav.homeRecording",
                            isActive: currentPath.startsWith("/home/recording"),
                        },
                    ]
                  : []),
              ...(isParent && primaryChildId
                  ? [
                        {
                            label: "My Child's Data",
                            href: isPreviewing ? PREVIEW_CHILD_PATH : `/data/child/${primaryChildId}`,
                            helpKey: "nav.myChildData",
                            isActive: currentPath.startsWith("/data/child"),
                        },
                    ]
                  : []),
          ];

    const peopleItems = [
        ...(isAdmin
            ? [
                  {
                      label: "Coaches",
                      href: "/coaches",
                      helpKey: "nav.coaches",
                      isActive: currentPath.startsWith("/coaches"),
                  },
              ]
            : []),
        ...(isAdmin || isCoach
            ? [
                  {
                      label: "Teachers",
                      href: "/teachers",
                      helpKey: "nav.teachers",
                      isActive: currentPath.startsWith("/teachers"),
                  },
              ]
            : []),
    ];

    const afterPeopleItems = isCoach
        ? []
        : [
              ...(isAdmin
                  ? [
                        {
                            label: "Schools",
                            href: "/schools",
                            helpKey: "nav.schools",
                            isActive:
                                currentPath.startsWith("/schools") ||
                                currentPath.startsWith("/centers"),
                        },
                    ]
                  : []),
              ...(!isParent && !isCoach
                  ? [
                        {
                            label: "Home Environment Data",
                            href: "/data",
                            helpKey: "nav.home",
                            isActive: currentPath.startsWith("/data"),
                        },
                    ]
                  : []),
              ...(isAdmin || isTeacher
                  ? [
                        {
                            label: "Classrooms",
                            href: isAdmin ? "/classrooms" : "/home",
                            helpKey: "nav.classrooms",
                            isActive: currentPath.startsWith("/classrooms"),
                        },
                    ]
                  : []),
              ...(isTeacher
                  ? [
                        {
                            label: "My Profile",
                            href: teacherProfileHref,
                            helpKey: "nav.myProfile",
                            isActive:
                                currentPath.includes("/teachers/") ||
                                currentPath === "/profile",
                        },
                    ]
                  : []),
          ];

    return {
        navigationItems,
        peopleItems,
        afterPeopleItems,
        footerLabels: ["Settings", "About", "Logout"],
    };
}

export function sidebarNavLabels(effectiveRole, options = {}) {
    const model = buildSidebarItems({
        effectiveRole,
        isPreviewing: Boolean(options.isPreviewing),
        user: options.user || null,
        currentPath: options.currentPath || "/",
    });
    return {
        primary: model.navigationItems.map((item) => item.label),
        people: model.peopleItems.map((item) => item.label),
        afterPeople: model.afterPeopleItems.map((item) => item.label),
        footer: model.footerLabels,
    };
}
