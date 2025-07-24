import React from 'react';

interface FooterProps {
  lastUpdated: string | null;
}

export const Footer: React.FC<FooterProps> = ({ lastUpdated }) => {
  return (
    <footer>
      <p>Last updated: <span id="last-updated">{lastUpdated || '-'}</span></p>
    </footer>
  );
};