import { Head, usePage } from '@inertiajs/react';
import { useAppearance } from '@/hooks/use-appearance';

// Sections
import Navbar from '@/components/Welcome/Navbar';
import HeroSection from '@/components/Welcome/HeroSection';
import AboutSection from '@/components/Welcome/AboutSection';
import VisionMissionSection from '@/components/Welcome/VisionMissionSection';
import GamifiedMapSection from '@/components/Welcome/GamifiedMapSection';
import FaqSection from '@/components/Welcome/FaqSection';
import CtaSection from '@/components/Welcome/CtaSection';
import ContactSection from '@/components/Welcome/ContactSection';
import Footer from '@/components/Welcome/Footer';

export interface PublicDonationBanner {
    title?: string | null;
    url: string;
    image_url: string | null;
}

export default function Welcome({
    auth,
    donationBanner = null,
}: {
    auth: { user: any };
    donationBanner?: PublicDonationBanner | null;
}) {
    const { url } = usePage();
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const darkMode = resolvedAppearance === 'dark';

    const toggleTheme = () => {
        updateAppearance(darkMode ? 'light' : 'dark');
    };
    return (
        <>
            <Head title="SkillVentura - Level Up Your Life" />
            <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f8fafc] font-sans text-[#1e293b] antialiased transition-colors duration-300 2xl:mx-auto 2xl:max-w-[1780px] dark:bg-[#020202] dark:text-slate-100">
                {/* Ambient Light Mode Background Texture - Seamless across all sections */}
                <div className="pointer-events-none absolute inset-0 -z-20">
                    {/* Subtle dot pattern grid for depth and high-tech contrast in light mode */}
                    <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.25] dark:opacity-0" />
                </div>

                <Navbar
                    auth={auth}
                    darkMode={darkMode}
                    toggleTheme={toggleTheme}
                />
                <HeroSection
                    donationBanner={donationBanner}
                    auth={auth}
                />
                <AboutSection />
                <VisionMissionSection />
                <GamifiedMapSection />
                <FaqSection />
                <CtaSection />
                <ContactSection />
                <Footer />
            </div>
        </>
    );
}
