import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
    route("signup", "routes/signup.tsx"),

    // Admin Routes with Persistent Layout
    layout("routes/admin/layout.tsx", [
        route("admin/dashboard", "routes/admin/dashboard.tsx"),
        route("admin/users", "routes/admin/users.tsx"),
        route("admin/users/:id", "routes/admin/users-details.tsx"),
        route("admin/courses", "routes/admin/courses.tsx"),
        route("admin/courses/create", "routes/admin/courses/create.tsx"),
        route("admin/courses/:id", "routes/admin/courses-details.tsx"),
        route("admin/courses/:id/content", "routes/admin/course-content.tsx"),
    ]),

    route("student/dashboard", "routes/student/dashboard.tsx"),
] satisfies RouteConfig;
