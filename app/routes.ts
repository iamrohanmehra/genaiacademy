import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
    route("signup", "routes/signup.tsx"),
    route("admin/dashboard", "routes/admin/dashboard.tsx"),
    route("admin/dashboard/create-batch", "routes/admin/dashboard/create-batch.tsx"),
] satisfies RouteConfig;
