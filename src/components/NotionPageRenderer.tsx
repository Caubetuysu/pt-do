"use client";

import React from 'react';
import { NotionRenderer } from 'react-notion-x';
import { ExtendedRecordMap } from 'notion-types';

// Core CSS for react-notion-x
import 'react-notion-x/src/styles.css';
// Prism styling for code blocks
import 'prismjs/themes/prism-tomorrow.css';
// KaTeX styling for math equations
import 'katex/dist/katex.min.css';

interface NotionPageRendererProps {
  recordMap: ExtendedRecordMap;
  darkMode?: boolean;
}

export function NotionPageRenderer({ recordMap, darkMode = true }: NotionPageRendererProps) {
  if (!recordMap) {
    return <div>No data available</div>;
  }

  return (
    <div className="notion-app-container w-full h-full overflow-y-auto">
      <NotionRenderer 
        recordMap={recordMap} 
        fullPage={true} 
        darkMode={darkMode}
        className="bg-transparent"
      />
    </div>
  );
}
