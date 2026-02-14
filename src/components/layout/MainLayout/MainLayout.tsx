import React from 'react';
import { cn } from '@/utils/helpers';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className,
  maxWidth = '7xl',
}) => {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <div
        className={cn(
          'mx-auto px-4 sm:px-6 lg:px-8 py-8',
          maxWidths[maxWidth],
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <MainLayout className="flex items-center justify-center min-h-screen">
      <div className="w-full animate-fade-in">{children}</div>
    </MainLayout>
  );
};
