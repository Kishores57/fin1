import React from 'react';
import UnifiedTreeReport from './UnifiedTreeReport';

export default function ResultCard({ result }) {
  if (!result) return null;

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <UnifiedTreeReport
        tree={result}
        mode="interactive"
      />
    </div>
  );
}
