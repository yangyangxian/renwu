import React from 'react';
import type { RouteObject } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';

// Import all .tsx files recursively under /pages/home
const pageModules = import.meta.glob('../pages/home/**/*.tsx', { eager: true });

// Helper to build a file+folder based route tree (file = parent, folder = children)
function buildFileFolderRoutes(modules: Record<string, any>) {
  // Map: { routeName: { file: mod, children: { ... } } }
  const tree: any = {};
  for (const [file, mod] of Object.entries(modules)) {
    const rel = file.replace(/^\.\.\/pages\/home\//, '').replace(/\.tsx$/, '');
    const segments = rel.split('/');
    if (segments.length === 1) {
      // Top-level file (e.g. TasksPage)
      const name = segments[0].replace(/Page$/, '').toLowerCase();
      tree[name] = tree[name] || {};
      tree[name].file = mod;
    } else if (segments.length === 2) {
      // Child file (e.g. tasks/SubTaskPage)
      const parent = segments[0].replace(/Page$/, '').toLowerCase();
      const child = segments[1].replace(/Page$/, '').toLowerCase();
      tree[parent] = tree[parent] || {};
      tree[parent].children = tree[parent].children || {};
      tree[parent].children[child] = mod;
    }
  }
  return tree;
}

export function getDynamicRoutes(): RouteObject[] {
  const tree = buildFileFolderRoutes(pageModules);
  const children: RouteObject[] = [];
  // Do NOT add a default landing page as index route
  for (const [route, v] of Object.entries(tree)) {
    const val = v as any;
    if (!val.file) continue;
    const routeObj: RouteObject = {
      path: route,
      element: React.createElement(val.file.default),
    };
    if (val.children) {
      routeObj.children = Object.entries(val.children).map(([child, mod]) => ({
        path: child,
        element: React.createElement((mod as any).default),
      }));
    }
    children.push(routeObj);
  }
  // NotFound
  children.push({ path: '*', element: React.createElement(NotFoundPage) });
  return [
    {
      path: '/',
      element: React.createElement(HomePage),
      children,
    },
  ];
}
