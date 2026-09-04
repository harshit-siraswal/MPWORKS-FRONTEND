'use client';

import { useEffect } from 'react';

const entries = {
  main: () => import('../src/main.js'),
  works: () => import('../src/works.js'),
  project: () => import('../src/project.js'),
  mps: () => import('../src/mps.js'),
  mp: () => import('../src/mp.js'),
  district: () => import('../src/district.js'),
  developer: () => import('../src/developer.js'),
};

export default function LegacyPage({ markup, bodyClassName = '', pageTitle, entry }) {
  useEffect(() => {
    document.title = pageTitle;
    document.body.className = bodyClassName;
    let active = true;
    entries[entry]?.().catch((error) => {
      if (active) console.error(`MP Works page runtime failed: ${entry}`, error);
    });
    return () => {
      active = false;
      document.body.className = '';
    };
  }, [bodyClassName, entry, pageTitle]);

  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}
