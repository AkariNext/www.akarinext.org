import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
    index('routes/home.tsx'),
    route('/auth/login', 'routes/auth/login.tsx'),
    route('/auth/test', 'routes/auth/test.tsx'),
    route('/auth/callback', 'routes/auth/callback.tsx'),
] satisfies RouteConfig;
