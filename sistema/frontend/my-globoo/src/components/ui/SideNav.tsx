"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; // Import for path tracking
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { HiUsers, HiDocumentText, HiTemplate, HiMenuAlt2, HiX, HiPlus } from "react-icons/hi";
import { FaMoneyBill1Wave, FaFileInvoice } from "react-icons/fa6";
import { FaUserClock, FaUserCog } from "react-icons/fa";
import { GrUserWorker, GrDocumentVerified } from "react-icons/gr";
import LottieLogo from "./LottieLogo";
import ThemeToggle from "./ThemeToggle";

export default function SideNav() {
    const [isOpen, setIsOpen] = useState(true);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname(); // Track current path
    
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
        // Match exact path or path prefix for nested routes
        return pathname === href || pathname?.startsWith(href);
    };
    
    // All your existing animation variants remain the same
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
    
    const navLinks = [
        { href: "/pages/dashboard", label: "Painel Geral", icon: <HiPlus size={21} /> },
        { href: "/pages/workers", label: "Gerenciar Funcionários", icon: <HiUsers size={21} /> },
        { href: "/pages/documents", label: "Gerenciar Documentos", icon: <HiDocumentText size={21} /> },
        { href: "/pages/templates", label: "Gerenciar Templates", icon: <HiTemplate size={21} /> },
        { href: "/pages/timeSheet", label: "Controle de Ponto", icon: <FaUserClock size={21} /> },       
        { href: "/pages/payroll", label: "Folha de Pagamento", icon: <FaMoneyBill1Wave size={21} /> },       
        { href: "/pages/invoice", label: "Notas Fiscais", icon: <FaFileInvoice size={21} /> },      
        { href: "/pages/visitors", label: "Controle de Visitantes", icon: <FaUserCog size={21} /> },  
        { href: "/pages/provider", label: "Prestador de Serviço", icon: <GrUserWorker size={21} /> },
        { href: "/pages/tasks", label: "Lista de Tarefas", icon: <GrDocumentVerified size={21} /> },
        
    ];
    
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
                
                {/* Logo area */}
                <motion.div 
                    className={`mx-auto ${isOpen ? 'p-5 pt-0' : 'p-3 justify-center'} ${isOpen ? 'mb-8' : 'mb-1'}`}
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
                    
                    <AnimatePresence>
                        
                    </AnimatePresence>
                </motion.div>
                
                {/* Navigation links */}
                <motion.nav 
                    className="flex-1 px-3"
                    variants={linksContainerVariants}
                >
                    {navLinks.map((link, index) => {
                        // Check if this link is active
                        const active = isActive(link.href);
                        
                        return (
                            <motion.div 
                                key={index}
                                variants={linkVariants}
                                className="mb-3.5"
                            >
                                <Link href={link.href}>
                                    <motion.div
                                        className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} gap-3.5 p-3 rounded-xl ${
                                            // Apply active styles or hover styles
                                            active 
                                                ? 'bg-cyan-50 dark:bg-cyan-900/20' 
                                                : 'hover:bg-blue-50 dark:hover:bg-white/5'
                                        } transition-all cursor-pointer group relative overflow-hidden`}
                                        whileHover={{ 
                                            x: 5,
                                            backgroundColor: active 
                                                ? "rgba(6, 182, 212, 0.15)"  // Lighter cyan for active
                                                : "rgba(59, 130, 246, 0.1)",  // Light blue for hover
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
                                            className={`flex items-center justify-center w-8 h-8 rounded-lg ${
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
                                                    } group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors whitespace-nowrap font-medium text-[14px]`}
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
                    })}
                </motion.nav>
                
                {/* Theme toggle button */}
                <div className={`px-3 mx-auto ${isOpen ? 'mb-2' : 'flex justify-center mb-2'}`}>
                    <ThemeToggle />
                </div>
                
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