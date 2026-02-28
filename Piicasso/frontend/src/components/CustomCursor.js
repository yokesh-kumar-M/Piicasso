import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CustomCursor = () => {
    const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const updateMousePosition = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseOver = (e) => {
            const isClickable = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) ||
                e.target.closest('button') ||
                e.target.closest('a');
            setIsHovering(!!isClickable);
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        const handleMouseEnter = () => {
            setIsVisible(true);
        };

        window.addEventListener('mousemove', updateMousePosition);
        window.addEventListener('mouseover', handleMouseOver);
        document.body.addEventListener('mouseleave', handleMouseLeave);
        document.body.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            window.removeEventListener('mousemove', updateMousePosition);
            window.removeEventListener('mouseover', handleMouseOver);
            document.body.removeEventListener('mouseleave', handleMouseLeave);
            document.body.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, []);

    if (!isVisible) return null;

    // Small dot that follows instantly
    const dotVariants = {
        default: {
            x: mousePosition.x - 4, // 2px radius (w-2 h-2 is 8px, so -4)
            y: mousePosition.y - 4,
            transition: { type: 'tween', ease: 'backOut', duration: 0 } // instant follow
        },
        hover: {
            x: mousePosition.x - 6, // 12px / 2
            y: mousePosition.y - 6,
            height: 12,
            width: 12,
            transition: { type: 'tween', ease: 'backOut', duration: 0 }
        }
    };

    // Outer ring that has a spring delay
    const ringVariants = {
        default: {
            x: mousePosition.x - 16, // w-8 h-8 is 32px, so -16
            y: mousePosition.y - 16,
            scale: 1,
            backgroundColor: 'rgba(229, 9, 20, 0)',
            transition: { type: 'spring', stiffness: 350, damping: 28, mass: 0.5 }
        },
        hover: {
            x: mousePosition.x - 16,
            y: mousePosition.y - 16,
            scale: 1.5,
            backgroundColor: 'rgba(229, 9, 20, 0.15)',
            transition: { type: 'spring', stiffness: 350, damping: 28, mass: 0.5 }
        }
    };

    return (
        <>
            {/* Outer Ring */}
            <motion.div
                variants={ringVariants}
                animate={isHovering ? "hover" : "default"}
                className="fixed top-0 left-0 w-8 h-8 border border-netflix-red rounded-full pointer-events-none z-[9999] opacity-80"
            />
            {/* Inner Dot */}
            <motion.div
                variants={dotVariants}
                animate={isHovering ? "hover" : "default"}
                className="fixed top-0 left-0 w-2 h-2 bg-netflix-red rounded-full pointer-events-none z-[10000] shadow-[0_0_10px_rgba(229,9,20,0.8)]"
            />
        </>
    );
};

export default CustomCursor;
