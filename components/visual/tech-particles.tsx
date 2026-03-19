'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    color: string;
    flash: number;
}

export function TechParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const particleCount = 120;
        const colors = ['#00f0ff', '#bd00ff', '#ffffff'];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticle = (): Particle => ({
            x: Math.random() * canvas.width,
            y: canvas.height + Math.random() * 100,
            size: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 4 + 2, // Fast upwards
            opacity: Math.random() * 0.5 + 0.2,
            color: colors[Math.floor(Math.random() * colors.length)],
            flash: Math.random() * 0.05
        });

        const init = () => {
            resizeCanvas();
            particles = Array.from({ length: particleCount }, createParticle);
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, i) => {
                p.y -= p.speed;
                p.x += Math.sin(p.y * 0.01) * 0.5; // Slight drift

                // Flickering effect
                p.opacity += (Math.random() - 0.5) * 0.1;
                p.opacity = Math.max(0.1, Math.min(0.8, p.opacity));

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;
                ctx.fill();

                // Glow effect is expensive with shadowBlur, use simpler circles if needed
                // For now, removing for performance

                // Reset particle if it goes off screen
                if (p.y < -20) {
                    particles[i] = createParticle();
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resizeCanvas);
        init();
        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[1] opacity-40"
            style={{ mixBlendMode: 'screen' }}
        />
    );
}
