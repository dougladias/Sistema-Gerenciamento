"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { HiUsers, HiDocumentText, HiTemplate, HiMenuAlt2, HiX, HiPlus } from "react-icons/hi";
import LottieLogo from "./LottieLogo";

export default function SideNav() {
    const [isOpen, setIsOpen] = useState(true);
    const [mounted, setMounted] = useState(false);
    
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
    
    // Enhanced sidebar animation variants with better easing
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
    
    // Links container animation variants with better staggering
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
    
    // Link item animation variants with improved floatiness
    // Modified to keep icons visible in closed state
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
            opacity: 1, // Keep link container visible
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        }
    };
    
    // Background animation for subtle float effect
    const bgInitial = { backgroundPosition: "0% 0%" };
    const bgAnimate = { 
        backgroundPosition: "100% 100%",
        transition: { duration: 30, repeat: Infinity, repeatType: "mirror" as const, ease: "linear" }
    };
    
    // Link items with icons
    const navLinks = [
        { href: "/pages/dashboard", label: "Painel Geral", icon: <HiPlus size={21} /> },
        { href: "/pages/workers", label: "Gerenciar Funcionários", icon: <HiUsers size={21} /> },
        { href: "/pages/documents", label: "Gerenciar Documentos", icon: <HiDocumentText size={21} /> },
        { href: "/pages/templates", label: "Gerenciar Templates", icon: <HiTemplate size={21} /> },
        { href: "/pages/timeSheet", label: "Controle de Ponto", icon: <HiDocumentText size={21} /> },       
        { href: "/pages/payroll", label: "Folha de Pagamento", icon: <HiDocumentText size={21} /> },       
    ];
    
    return (
        <motion.div 
            className="side-nav fixed top-0 left-0 z-40 h-screen border-r border-gray-800/30"
            initial={false}
            animate={isOpen ? "open" : "closed"}
            variants={sidebarVariants}
        >
            <motion.div 
                className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-xl shadow-gray-900/30 flex flex-col relative overflow-hidden"
                initial={bgInitial}
                animate={bgAnimate}
                style={{
                    backgroundSize: "200% 200%",
                }}
            >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAgTSA2MCAxMCBMIDYwIDAgNTAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-5"></div>
                
                {/* Toggle button repositioned */}
                <div className={`flex justify-${isOpen ? 'end' : 'center'} p-4`}>
                    <motion.button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 backdrop-blur-sm transition-colors z-50"
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
                
                {/* Logo area with enhanced animations */}
                <motion.div 
                    className={`flex items-center ${isOpen ? 'p-5 pt-0' : 'p-3 justify-center'} ${isOpen ? 'mb-8' : 'mb-4'}`}
                >
                    <motion.div 
                        className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/20"
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
                        {isOpen && (
                            <motion.h1 
                                className="ml-3 text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -15 }}
                                transition={{ 
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25,
                                }}
                            >
                                Globoo
                            </motion.h1>
                        )}
                    </AnimatePresence>
                </motion.div>
                
                {/* Navigation links with enhanced staggered animation */}
                <motion.nav 
                    className="flex-1 px-3"
                    variants={linksContainerVariants}
                >
                    {navLinks.map((link, index) => (
                        <motion.div 
                            key={index}
                            variants={linkVariants}
                            className="mb-3.5"
                        >
                            <Link href={link.href}>
                                <motion.div
                                    className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} gap-3.5 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden`}
                                    whileHover={{ 
                                        x: 5,
                                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                                        transition: { duration: 0.2, ease: "easeOut" } 
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: mounted ? 1 : 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {/* Highlight ripple animation on hover */}
                                    <motion.div 
                                        className="absolute inset-0 bg-blue-500/10 rounded-xl" 
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
                                    
                                    {/* Icon with enhanced micro-animations - always visible */}
                                    <motion.div 
                                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-blue-300 group-hover:text-blue-200 transition-colors"
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
                                    
                                    {/* Link text with improved animation */}
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.span 
                                                className="text-gray-200 group-hover:text-white transition-colors whitespace-nowrap font-medium"
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
                    ))}
                </motion.nav>
                
                {/* Footer area with smooth appearance */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            className="p-4 mt-auto border-t border-white/5"
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
                                className="text-xs text-gray-400 text-center"
                                whileHover={{ color: "#ffffff" }}
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