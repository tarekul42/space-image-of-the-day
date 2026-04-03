import { Router } from 'express';
import { ApodRoutes } from '../modules/apod/apod.route.js';

const router = Router();

const moduleRoutes = [
  {
    path: '/apod',
    route: ApodRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
