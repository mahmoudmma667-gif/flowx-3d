'use client';

import * as React from "react";
import { User, Save, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsFormProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        bio?: string | null;
    };
}

export function SettingsForm({ user }: SettingsFormProps) {
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: user.name || "",
        bio: user.bio || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-6 mb-8">
                {user.image ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={user.image} alt="" className="w-20 h-20 rounded-2xl border border-white/10" />
                    </>
                ) : (
                    <div className="w-20 h-20 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan border border-brand-cyan/20">
                        <User className="w-8 h-8" />
                    </div>
                )}
                <Button type="button" variant="outline" size="sm">Change Avatar</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase tracking-widest font-bold">Full Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-cyan/50 transition-colors"
                        placeholder="Your name"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase tracking-widest font-bold">Email Address</label>
                    <input
                        type="email"
                        value={user.email || ""}
                        disabled
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm opacity-50 cursor-not-allowed"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold">Bio</label>
                <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm min-h-[120px] focus:outline-none focus:border-brand-cyan/50 transition-colors"
                />
            </div>

            <div className="pt-4 flex items-center justify-end gap-4">
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 text-brand-cyan text-sm"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Changes saved successfully
                        </motion.div>
                    )}
                </AnimatePresence>

                <Button type="submit" disabled={loading} className="gap-2 min-w-[140px]">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
