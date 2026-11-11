import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { StudentPortalPage } from '../pages/StudentPortalPage';
import { ErrorPage } from '../pages/ErrorPage';
import { NotFoundPage } from '../pages/NotFoundPage';

const AdminPage = lazy(() =>
  import('../pages/AdminPage').then((module) => ({ default: module.AdminPage }))
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage standalone />,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          {
            index: true,
            element: <StudentPortalPage />,
          },
          {
            path: 'admin',
            element: <AdminPage />,
          },
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
]);
