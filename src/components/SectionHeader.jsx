import React from 'react';

const SectionHeader = React.memo(({ title, subtitle, className = '', as: Heading = 'h2' }) => {
  return (
    <div className={className}>
      <Heading className="text-2xl md:text-3xl font-semibold">{title}</Heading>
      {subtitle && (
        <p className="mt-1 text-[var(--color-muted)]">{subtitle}</p>
      )}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';

export default SectionHeader;
