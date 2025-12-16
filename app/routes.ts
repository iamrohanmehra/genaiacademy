import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";
// Trigger rebuild - fixed settings route loading

export default [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
    route("signup", "routes/signup.tsx"),

    // Admin Routes with Persistent Layout
    layout("routes/admin/layout.tsx", [
        route("admin/dashboard", "routes/admin/dashboard.tsx"),
        route("admin/settings", "routes/admin/settings.tsx"),
        route("admin/users", "routes/admin/users.tsx"),
        route("admin/search", "routes/admin/search.tsx"),
        route("admin/users/create", "routes/admin/users/create.tsx"),
        route("admin/users/:id", "routes/admin/users-details.tsx"),
        route("admin/enrollments", "routes/admin/enrollments.tsx"),
        route("admin/enrollments/create", "routes/admin/enrollments/create.tsx"),

        route("admin/enrollments/:id/edit", "routes/admin/enrollments/edit.tsx"),
        route("admin/enrollments/:id/progress", "routes/admin/enrollments/progress.tsx"),
        route("admin/courses", "routes/admin/courses.tsx"),
        route("admin/courses/create", "routes/admin/courses/create.tsx"),

        route("admin/courses/:id/edit", "routes/admin/courses/edit.tsx"),
        route("admin/courses/:id/content", "routes/admin/course-content.tsx"),
        route("admin/courses/:id/schedule", "routes/admin/courses/schedule.tsx"),
    ]),

    route("debug-token", "routes/debug-token.tsx"),

    route("student/dashboard", "routes/student/dashboard.tsx"),
] satisfies RouteConfig;
