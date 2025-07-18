import React from 'react';
import type { RouteObject } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';

// Import all .tsx files recursively under /pages (not just /pages/home)
const pageModules = import.meta.glob('../pages/**/*.tsx', { eager: true });

// Helper to recursively build the route tree, omitting blanket segments
function buildRoutes(modules: Record<string, any>, base: string = '') {
  const tree: any = {};
  for (const [file, mod] of Object.entries(modules)) {
    const segments = file
      .replace(/^\.\.\/pages\//, '')
      .replace(/\.tsx$/, '')
      .split('/')
      .filter(seg => !/^ ?\(.*\)$/.test(seg)); // omit blanket segments
    if (!segments.length) continue;
    // If under home, treat as child; else, top-level
    let isHome = segments[0] === 'home';
    let start = isHome ? 1 : 0;
    let node = tree;
    for (let i = start; i < segments.length; i++) {
      // Support dynamic route segments: [param] => :param
      let seg = segments[i].replace(/Page$/, '');
      if (/^\[.+\]$/.test(seg)) {
        seg = `:${seg.slice(1, -1)}`;
      } else {
        seg = seg.toLowerCase();
      }
      if (i === segments.length - 1) {
        node[seg] = node[seg] || {};
        node[seg].file = mod;
      } else {
        node[seg] = node[seg] || {};
        node[seg].children = node[seg].children || {};
        node = node[seg].children;
      }
    }
    // Mark as home child if under home
    if (isHome) tree._isHome = true;
  }
  return tree;
}

function buildRouteObjects(tree: any): { homeChildren: RouteObject[], topLevel: RouteObject[] } {
  const homeChildren: RouteObject[] = [];
  const topLevel: RouteObject[] = [];
  for (const [route, val] of Object.entries(tree)) {
    if (route === '_isHome') continue;
    const node = val as any;
    if (!node.file) continue;
    const routeObj: RouteObject = {
      path: route,
      element: React.createElement(node.file.default),
    };
    if (node.children) {
      const children = buildRouteObjects(node.children);
      routeObj.children = children.homeChildren.length ? children.homeChildren : children.topLevel;
    }
    if (tree._isHome) {
      homeChildren.push(routeObj);
    } else {
      topLevel.push(routeObj);
    }
  }
  return { homeChildren, topLevel };
}

export function getDynamicRoutes(): RouteObject[] {
  const tree = buildRoutes(pageModules);
  const { homeChildren, topLevel } = buildRouteObjects(tree);
  // NotFound
  homeChildren.push({ path: '*', element: React.createElement(NotFoundPage) });
  return [
    {
      path: '/',
      element: React.createElement(HomePage),
      children: homeChildren,
    },
    ...topLevel,
  ];
}
