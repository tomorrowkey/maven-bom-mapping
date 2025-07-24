import React from 'react';

interface LoadingProps {
  visible: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
};