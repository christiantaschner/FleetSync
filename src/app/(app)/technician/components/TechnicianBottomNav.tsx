
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TechnicianBottomNavProps {
    technicianId: string;
}

export const TechnicianBottomNav: React.FC<TechnicianBottomNavProps> = ({ technicianId }) => {
    const pathname = usePathname();
    
    const navItems = [
        { href: `/technician/jobs/${technicianId}`, label: 'Jobs', icon: Briefcase },
        { href: '/technician/profile', label: 'Profile', icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex md:hidden z-50">
            {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                    <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
                        <item.icon className={cn("h-6 w-6 mb-1", isActive && "text-primary")} />
                        <span className={cn(isActive && "font-bold text-primary")}>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
};
