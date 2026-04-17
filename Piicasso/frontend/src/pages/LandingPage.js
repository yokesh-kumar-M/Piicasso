import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/landing/HeroSection';
import SocialProofBar from '../components/landing/SocialProofBar';
import DualModeShowcase from '../components/landing/DualModeShowcase';
import FeatureGrid from '../components/landing/FeatureGrid';
import HowItWorks from '../components/landing/HowItWorks';
import InteractiveDemo from '../components/landing/InteractiveDemo';
import TechStack from '../components/landing/TechStack';
import PricingSection from '../components/landing/PricingSection';
import RoadmapTimeline from '../components/landing/RoadmapTimeline';
import CTABanner from '../components/landing/CTABanner';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0B0E14] text-slate-300 font-sans selection:bg-blue-500/30">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <SocialProofBar />
        <DualModeShowcase />
        <FeatureGrid />
        <HowItWorks />
        <InteractiveDemo />
        <TechStack />
        <PricingSection />
        <RoadmapTimeline />
        <CTABanner />
      </main>
    </div>
  );
};

export default LandingPage;
