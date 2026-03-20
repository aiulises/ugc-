
import React from 'react';

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6-10.938A2 2 0 0 0 4.5 0h15a2 2 0 0 0 1.938 2.938L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.063 3.812a2 2 0 0 1-3.938 0Z" />
    <path d="M22 13a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
    <path d="M11 2.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
    <path d="M13 22a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
  </svg>
);

export default SparklesIcon;
