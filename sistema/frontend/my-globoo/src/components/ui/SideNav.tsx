"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
    HiUsers, 
    HiDocumentText, 
    HiTemplate, 
    HiMenuAlt2, 
    HiX, 
    HiPlus,
    HiCog,
    HiUserGroup,
    HiKey,
    HiShieldCheck,
    HiCash,
    HiClock,
    HiChartBar,
    HiLogout
} from "react-icons/hi";
import LottieLogo from "./LottieLogo";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext"; 

export default function SideNav() {
    const [isOpen, setIsOpen] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [showBackOffice, setShowBackOffice] = useState(false);
    const pathname = usePathname();
    
    // Hook de autenticação
    const { user, hasRole, checkPermission, canAccess, logout } = useAuth();
    
    // Ensure consistent animations after initial mount
    useEffect(() => {
        setMounted(true);
    }, []);
    
    // Set CSS variable for sidebar width that other components can reference
    useEffect(() => {
        if (mounted) {
            document.documentElement.style.setProperty(
                '--sidebar-width', 
                isOpen ? '16rem' : '4.5rem'
            );
        }
    }, [isOpen, mounted]);
    
    // Check if a link is active
    const isActive = (href: string) => {
        return pathname === href || pathname?.startsWith(href);
    };
    
    // Check if BackOffice section is active
    const isBackOfficeActive = () => {
        return pathname?.startsWith('/backoffice');
    };
    
    // Animation variants (mantendo os existentes)
    const sidebarVariants = {
        open: {
            width: "16rem",
            transition: { 
                type: "spring", 
                stiffness: 200, 
                damping: 30,
                mass: 1
            }
        },
        closed: {
            width: "4.5rem",
            transition: { 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                mass: 0.8
            }
        }
    };
    
    const linksContainerVariants = {
        open: {
            transition: { 
                staggerChildren: 0.08,
                delayChildren: 0.1,
                staggerDirection: 1
            }
        },
        closed: {
            transition: { 
                staggerChildren: 0.03,
                staggerDirection: -1 
            }
        }
    };
    
    const linkVariants = {
        open: {
            y: 0,
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 250,
                damping: 20,
                mass: 0.85
            }
        },
        closed: {
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        }
    };
    
    const bgInitial = { backgroundPosition: "0% 0%" };
    const bgAnimate = { 
        backgroundPosition: "100% 100%",
        transition: { duration: 30, repeat: Infinity, repeatType: "mirror" as const, ease: "linear" }
    };
    
    // Links principais com permissões
    const navLinks = [
        { 
            href: "/pages/dashboard", 
            label: "Painel Geral", 
            icon: <HiChartBar size={21} />,
            permission: { resource: "dashboard", action: "read" }
        },
        { 
            href: "/pages/workers", 
            label: "Gerenciar Funcionários", 
            icon: <HiUsers size={21} />,
            permission: { resource: "workers", action: "read" }
        },
        { 
            href: "/pages/documents", 
            label: "Gerenciar Documentos", 
            icon: <HiDocumentText size={21} />,
            permission: { resource: "documents", action: "read" }
        },
        { 
            href: "/pages/templates", 
            label: "Gerenciar Templates", 
            icon: <HiTemplate size={21} />,
            permission: { resource: "templates", action: "read" }
        },
        { 
            href: "/pages/timeSheet", 
            label: "Controle de Ponto", 
            icon: <HiClock size={21} />,
            permission: { resource: "timesheet", action: "read" }
        },
        { 
            href: "/pages/payroll", 
            label: "Folha de Pagamento", 
            icon: <HiCash size={21} />,
            permission: { resource: "payroll", action: "read" }
        },
    ];
    
    // Links do BackOffice (apenas para Developers)
    const backOfficeLinks = [
        { 
            href: "/backoffice/users", 
            label: "Usuários", 
            icon: <HiUserGroup size={18} />,
            permission: { resource: "users", action: "manage" }
        },
        { 
            href: "/backoffice/roles", 
            label: "Roles", 
            icon: <HiShieldCheck size={18} />,
            permission: { resource: "roles", action: "manage" }
        },
        { 
            href: "/backoffice/permissions", 
            label: "Permissões", 
            icon: <HiKey size={18} />,
            permission: { resource: "permissions", action: "read" }
        },
    ];
    
    // Função para renderizar um link
    const renderNavLink = (link: any, index: number, isSubMenu = false) => {
        // Verifica permissões
        const hasPermission = checkPermission(link.permission.resource, link.permission.action);
        const canAccessRoute = canAccess(link.href);
        
        if (!hasPermission || !canAccessRoute) return null;
        
        const active = isActive(link.href);
        
        return (
            <motion.div 
                key={`${link.href}-${index}`}
                variants={linkVariants}
                className={`${isSubMenu ? 'ml-4' : ''} mb-3.5`}
            >
                <Link href={link.href}>
                    <motion.div
                        className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} gap-3.5 p-3 rounded-xl ${
                            active 
                                ? 'bg-cyan-50 dark:bg-cyan-900/20' 
                                : 'hover:bg-blue-50 dark:hover:bg-white/5'
                        } transition-all cursor-pointer group relative overflow-hidden`}
                        whileHover={{ 
                            x: isSubMenu ? 3 : 5,
                            backgroundColor: active 
                                ? "rgba(6, 182, 212, 0.15)"
                                : "rgba(59, 130, 246, 0.1)",
                            transition: { duration: 0.2, ease: "easeOut" } 
                        }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: mounted ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {/* Active indicator line */}
                        {active && (
                            <motion.div
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-cyan-500 dark:bg-cyan-400 rounded-r-md"
                                layoutId="activeNavIndicator"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            />
                        )}
                        
                        {/* Highlight ripple animation on hover */}
                        <motion.div 
                            className={`absolute inset-0 ${active ? 'bg-cyan-500/15' : 'bg-cyan-500/10'} rounded-xl`}
                            initial={{ scale: 0, opacity: 0 }}
                            whileHover={{ 
                                scale: [0, 2],
                                opacity: [0, 0.15, 0],
                                transition: {
                                    scale: { duration: 1.2, ease: "easeOut" },
                                    opacity: { duration: 1.2, ease: "easeOut" }
                                }
                            }}
                        />
                        
                        {/* Icon */}
                        <motion.div 
                            className={`flex items-center justify-center ${isSubMenu ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg ${
                                active
                                    ? 'bg-cyan-200/80 dark:bg-cyan-800/40 text-cyan-700 dark:text-cyan-200'
                                    : 'bg-blue-100/80 dark:bg-white/5 text-cyan-600 dark:text-cyan-300'
                            } group-hover:text-cyan-700 dark:group-hover:text-cyan-200 transition-colors`}
                            whileHover={{ 
                                scale: 1.1,
                                rotate: [0, -4, 4, 0],
                                transition: {
                                    rotate: {
                                        duration: 0.4,
                                        ease: "easeInOut",
                                        repeat: 0
                                    }
                                }
                            }}
                        >
                            {link.icon}
                        </motion.div>
                        
                        {/* Link text */}
                        <AnimatePresence>
                            {isOpen && (
                                <motion.span 
                                    className={`${
                                        active
                                            ? 'text-cyan-700 dark:text-cyan-300 font-semibold'
                                            : 'text-gray-700 dark:text-gray-200'
                                    } group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors whitespace-nowrap ${
                                        isSubMenu ? 'text-sm font-medium' : 'font-medium'
                                    }`}
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -5 }}
                                    transition={{ 
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30
                                    }}
                                >
                                    {link.label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </Link>
            </motion.div>
        );
    };
    
    return (
        <motion.div 
            className="side-nav fixed top-0 left-0 z-40 h-screen border-r border-gray-200 dark:border-gray-800/30"
            initial={false}
            animate={isOpen ? "open" : "closed"}
            variants={sidebarVariants}
        >
            <motion.div 
                className="h-full bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/30 flex flex-col relative overflow-hidden"
                initial={bgInitial}
                animate={bgAnimate}
                style={{
                    backgroundSize: "200% 200%",
                }}
            >
                {/* Toggle button */}
                <div className={`flex justify-${isOpen ? 'end' : 'center'} p-4`}>
                    <motion.button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 dark:text-blue-100 backdrop-blur-sm transition-colors z-50"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        initial={false}
                        animate={{ 
                            rotate: isOpen ? 0 : 180,
                            transition: { type: "spring", stiffness: 300, damping: 20 }
                        }}
                    >
                        {isOpen ? <HiX size={18} /> : <HiMenuAlt2 size={18} />}
                    </motion.button>
                </div>
                
                {/* Logo area e informações do usuário */}
                <motion.div 
                    className={`mx-auto ${isOpen ? 'p-5 pt-0' : 'p-3 justify-center'} ${isOpen ? 'mb-4' : 'mb-1'}`}
                >
                    <motion.div 
                        className={`${isOpen ? "w-22 h-22" : "w-12 h-12"} rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-300/20 dark:shadow-blue-500/20`}
                        whileHover={{ 
                            scale: 1.08,
                            rotate: [0, -3, 3, 0],
                            transition: {
                                rotate: {
                                    duration: 0.6,
                                    ease: "easeInOut",
                                    repeat: 0
                                },
                                scale: {
                                    duration: 0.2
                                }
                            }
                        }}
                        animate={{
                            y: [0, -2, 0],
                            transition: {
                                y: {
                                    repeat: Infinity,
                                    duration: 2.5,
                                    ease: "easeInOut"
                                }
                            }
                        }}
                    >
                        <LottieLogo isOpen={isOpen} />
                    </motion.div>
                    
                    {/* Informações do usuário */}
                    <AnimatePresence>
                        {isOpen && user && (
                            <motion.div 
                                className="mt-3 text-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {user.name}
                                </div>
                                <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                                    {user.role.name}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                
                {/* Navigation links */}
                <motion.nav 
                    className="flex-1 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                    variants={linksContainerVariants}
                >
                    {/* Links principais */}
                    {navLinks.map((link, index) => renderNavLink(link, index))}
                    
                    {/* BackOffice Section - Apenas para Developers */}
                    {hasRole('developer') && (
                        <motion.div variants={linkVariants} className="mt-6">
                            {/* Header do BackOffice */}
                            <motion.div
                                className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} gap-3 p-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer group relative overflow-hidden mb-2`}
                                onClick={() => setShowBackOffice(!showBackOffice)}
                                whileHover={{ 
                                    x: 3,
                                    backgroundColor: "rgba(147, 51, 234, 0.1)",
                                    transition: { duration: 0.2, ease: "easeOut" } 
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {/* BackOffice active indicator */}
                                {isBackOfficeActive() && (
                                    <motion.div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-purple-500 dark:bg-purple-400 rounded-r-md"
                                        layoutId="backOfficeIndicator"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                                
                                <motion.div 
                                    className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                                        isBackOfficeActive()
                                            ? 'bg-purple-200/80 dark:bg-purple-800/40 text-purple-700 dark:text-purple-200'
                                            : 'bg-purple-100/80 dark:bg-white/5 text-purple-600 dark:text-purple-300'
                                    } group-hover:text-purple-700 dark:group-hover:text-purple-200 transition-colors`}
                                    whileHover={{ scale: 1.1 }}
                                >
                                    <HiCog size={21} />
                                </motion.div>
                                
                                <AnimatePresence>
                                    {isOpen && (
                                        <>
                                            <motion.span 
                                                className={`${
                                                    isBackOfficeActive()
                                                        ? 'text-purple-700 dark:text-purple-300 font-semibold'
                                                        : 'text-gray-700 dark:text-gray-200'
                                                } group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors whitespace-nowrap font-medium flex-1`}
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -5 }}
                                                transition={{ 
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 30
                                                }}
                                            >
                                                BackOffice
                                            </motion.span>
                                            <motion.div
                                                animate={{ 
                                                    rotate: showBackOffice ? 90 : 0 
                                                }}
                                                transition={{ 
                                                    type: "spring", 
                                                    stiffness: 300, 
                                                    damping: 20 
                                                }}
                                                className="text-gray-500 dark:text-gray-400"
                                            >
                                                <HiPlus size={16} />
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                            
                            {/* Links do BackOffice */}
                            <AnimatePresence>
                                {showBackOffice && isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ 
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 30
                                        }}
                                        className="overflow-hidden"
                                    >
                                        {backOfficeLinks.map((link, index) => 
                                            renderNavLink(link, index, true)
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </motion.nav>
                
                {/* Theme toggle button */}
                <div className={`px-3 mx-auto ${isOpen ? 'mb-2' : 'flex justify-center mb-2'}`}>
                    <ThemeToggle />
                </div>
                
                {/* Logout button */}
                {user && (
                    <div className={`px-3 mx-auto ${isOpen ? 'mb-4' : 'flex justify-center mb-4'}`}>
                        <motion.button
                            onClick={logout}
                            className={`flex items-center ${isOpen ? 'justify-start w-full' : 'justify-center'} gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group text-red-600 dark:text-red-400`}
                            whileHover={{ 
                                x: 3,
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                transition: { duration: 0.2, ease: "easeOut" } 
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <motion.div 
                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100/80 dark:bg-white/5 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors"
                                whileHover={{ scale: 1.1 }}
                            >
                                <HiLogout size={18} />
                            </motion.div>
                            
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.span 
                                        className="text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors whitespace-nowrap font-medium"
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        transition={{ 
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 30
                                        }}
                                    >
                                        Sair
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                )}
                
                {/* Footer */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            className="p-4 border-t border-gray-200/50 dark:border-white/5"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 15 }}
                            transition={{ 
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                                delay: 0.1
                            }}
                        >
                            <motion.div 
                                className="text-xs text-gray-500 dark:text-gray-400 text-center"
                                whileHover={{ color: "#4B5563" }}
                            >
                                Globoo Admin © 2025
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}