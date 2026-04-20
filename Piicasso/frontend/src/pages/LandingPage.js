import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/landing/HeroSection';
import FeatureGrid from '../components/landing/FeatureGrid';
import CTABanner from '../components/landing/CTABanner';
import Footer from '../components/Footer';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500/30">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <HeroSection />
        <FeatureGrid />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
