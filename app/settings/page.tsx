import { User, Shield, Bell, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { Navbar } from "@/components/layout/navbar";
import { getOrCreateAppUser } from "@/lib/app-user";

export default async function SettingsPage() {
    const user = await getOrCreateAppUser();

    return (
        <main className="min-h-screen bg-brand-dark text-white selection:bg-brand-cyan/30">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 pb-20">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold font-space mb-8">Settings</h1>

                    <div className="grid md:grid-cols-[250px_1fr] gap-12">
                        <aside className="space-y-2">
                            {[
                                { label: "Profile", icon: User, active: true },
                                { label: "Security", icon: Key },
                                { label: "Notifications", icon: Bell },
                                { label: "Privacy", icon: Shield },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${item.active
                                        ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20"
                                        : "text-gray-500 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                        </aside>

                        <div className="space-y-8">
                            <section className="glass-panel rounded-3xl p-8 border border-white/5">
                                <h2 className="text-xl font-bold font-space mb-6">Workspace Profile</h2>
                                <SettingsForm user={user} />
                            </section>

                            <section className="p-8 border border-red-500/10 rounded-3xl bg-red-500/[0.02]">
                                <h2 className="text-xl font-bold font-space text-red-400 mb-2">Danger Zone</h2>
                                <p className="text-sm text-gray-600 mb-6">This workspace is shared locally. Deleting the profile is not enabled.</p>
                                <Button variant="ghost" disabled className="text-red-400 border border-red-500/20 opacity-60">
                                    Delete Account Disabled
                                </Button>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
