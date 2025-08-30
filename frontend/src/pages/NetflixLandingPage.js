import React, { useState, useEffect } from 'react';
import { Play, Info, ChevronRight, Star, Shield, Zap, Eye, EyeOff, Download, Trash2, Plus } from 'lucide-react';

const NetflixPIIcasso = () => {
  const [currentView, setCurrentView] = useState('home'); // home, generate, results, profile
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [generatedWordlist, setGeneratedWordlist] = useState([]);
  const [recentHistory, setRecentHistory] = useState([
    { id: 1, name: "John's Social Engineering", type: "Premium", strength: 95, count: 2847, date: "2 days ago" },
    { id: 2, name: "Corporate Breach Sim", type: "Professional", strength: 87, count: 1523, date: "1 week ago" },
    { id: 3, name: "Family Password Pack", type: "Personal", strength: 73, count: 892, date: "2 weeks ago" }
  ]);

  // Auto-advancing hero content
  const [heroIndex, setHeroIndex] = useState(0);
  const heroContent = [
    {
      title: "Master the Art of",
      subtitle: "Password Intelligence",
      description: "Generate thousands of targeted passwords using advanced PII analysis. Professional-grade wordlists for security testing.",
      bg: "from-red-900 via-red-800 to-black"
    },
    {
      title: "Elite Cybersecurity",
      subtitle: "Starts Here",
      description: "Join thousands of security professionals who trust PIIcasso for their penetration testing needs.",
      bg: "from-purple-900 via-blue-900 to-black"
    },
    {
      title: "Unlock Hidden",
      subtitle: "Password Patterns",
      description: "AI-powered wordlist generation that learns from human psychology and social patterns.",
      bg: "from-green-900 via-teal-800 to-black"
    }
  ];

  const profiles = [
    { name: "Security Pro", avatar: "🛡️", desc: "Advanced penetration testing" },
    { name: "Red Team", avatar: "🎯", desc: "Corporate security assessment" },
    { name: "Bug Hunter", avatar: "🐛", desc: "Vulnerability research" },
    { name: "Student", avatar: "🎓", desc: "Learning cybersecurity" }
  ];

  const piiSteps = [
    {
      title: "Personal Identity",
      description: "Core identifying information",
      fields: [
        { key: 'full_name', label: 'Full Name', placeholder: 'John Smith', icon: '👤' },
        { key: 'birth_year', label: 'Birth Year', placeholder: '1985', icon: '📅' },
        { key: 'phone_suffix', label: 'Phone Last 4', placeholder: '1234', icon: '📱' }
      ]
    },
    {
      title: "Personal Connections",
      description: "Relationships and social bonds",
      fields: [
        { key: 'spouse_name', label: 'Partner Name', placeholder: 'Sarah', icon: '💕' },
        { key: 'pet_names', label: 'Pet Names', placeholder: 'Buddy, Luna', icon: '🐕' },
        { key: 'childhood_nickname', label: 'Childhood Nickname', placeholder: 'Johnny', icon: '🧸' }
      ]
    },
    {
      title: "Digital Footprint",
      description: "Online presence and interests",
      fields: [
        { key: 'social_handle', label: 'Social Handle', placeholder: '@johnsmith', icon: '📱' },
        { key: 'favorite_movies', label: 'Favorite Movies', placeholder: 'Matrix, Inception', icon: '🎬' },
        { key: 'employer', label: 'Employer', placeholder: 'TechCorp', icon: '🏢' }
      ]
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroContent.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsGenerating(false);
            setCurrentView('results');
            // Simulate generated wordlist
            setGeneratedWordlist([
              'JohnSmith1985', 'Buddy123!', 'Sarah&John', 'TechCorp2023',
              'j.smith85', 'BuddyLuna', 'johnnyboy', 'Matrix1999',
              'SmithFamily', 'Johnny85!', 'SarahMyLove', 'BuddyDog',
              // ... more simulated passwords
            ]);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(0);
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (!selectedProfile) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Netflix-style Profile Selection */}
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-red-600 mb-4">PIIcasso</h1>
            <p className="text-2xl text-gray-300">Who's using PIIcasso today?</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl">
            {profiles.map((profile, idx) => (
              <div
                key={idx}
                className="group cursor-pointer text-center transform transition-all duration-300 hover:scale-110"
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center text-4xl mb-4 group-hover:from-red-600 group-hover:to-red-700 transition-all duration-300">
                  {profile.avatar}
                </div>
                <h3 className="text-xl font-semibold text-gray-300 group-hover:text-white">
                  {profile.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{profile.desc}</p>
              </div>
            ))}
          </div>

          <button className="mt-12 px-8 py-3 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors">
            Manage Profiles
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Netflix-style Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-50 px-8 py-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-3xl font-bold text-red-600">PIIcasso</h1>
              <div className="hidden md:flex space-x-6">
                <button className="hover:text-gray-300 transition-colors">Home</button>
                <button className="hover:text-gray-300 transition-colors">Generate</button>
                <button className="hover:text-gray-300 transition-colors">History</button>
                <button className="hover:text-gray-300 transition-colors">Analytics</button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-white/10 rounded">
                <Search className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-sm">
                {selectedProfile.avatar}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section with Auto-changing Content */}
        <div className={`relative min-h-screen bg-gradient-to-r ${heroContent[heroIndex].bg} flex items-center`}>
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative z-10 px-8 max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <h1 className="text-7xl font-bold mb-6 leading-tight">
                {heroContent[heroIndex].title}<br />
                <span className="text-red-500">{heroContent[heroIndex].subtitle}</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {heroContent[heroIndex].description}
              </p>
              <div className="flex space-x-4">
                <button 
                  className="flex items-center space-x-3 bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                  onClick={() => setCurrentView('generate')}
                >
                  <Play className="w-6 h-6" />
                  <span>Start Generation</span>
                </button>
                <button className="flex items-center space-x-3 bg-gray-600/50 hover:bg-gray-600/70 px-8 py-4 rounded-lg font-bold text-lg transition-all">
                  <Info className="w-6 h-6" />
                  <span>Learn More</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Floating Statistics */}
          <div className="absolute bottom-8 right-8 bg-black/60 backdrop-blur-lg rounded-xl p-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-red-500">2.3M+</div>
                <div className="text-sm text-gray-400">Passwords Generated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">99.7%</div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">15K+</div>
                <div className="text-sm text-gray-400">Security Pros</div>
              </div>
            </div>
          </div>
        </div>

        {/* Netflix-style Content Rows */}
        <div className="px-8 pb-16 space-y-12">
          {/* Recent Generations */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Zap className="w-6 h-6 text-yellow-500 mr-2" />
              Continue Generating
            </h2>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {recentHistory.map((item) => (
                <div
                  key={item.id}
                  className="group relative min-w-[300px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:z-10"
                >
                  <div className="aspect-video bg-gradient-to-br from-red-900/20 to-purple-900/20 flex items-center justify-center">
                    <Shield className="w-16 h-16 text-red-500/50" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                      <span className="bg-red-600 px-2 py-1 rounded text-xs font-bold">
                        {item.type}
                      </span>
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{item.strength}% match</span>
                    </div>
                    <p className="text-sm text-gray-300">{item.count} passwords • {item.date}</p>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors">
                      <Play className="w-8 h-8" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-6 rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition-colors cursor-pointer">
                <Shield className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Smart Generation</h3>
                <p className="text-gray-400">AI-powered wordlist creation using advanced algorithms</p>
              </div>
              <div className="bg-gradient-to-br from-red-900/30 to-pink-900/30 p-6 rounded-xl border border-red-500/20 hover:border-red-500/50 transition-colors cursor-pointer">
                <Zap className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Instant Deploy</h3>
                <p className="text-gray-400">Ready-to-use wordlists for immediate penetration testing</p>
              </div>
              <div className="bg-gradient-to-br from-green-900/30 to-teal-900/30 p-6 rounded-xl border border-green-500/20 hover:border-green-500/50 transition-colors cursor-pointer">
                <Star className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Premium Analytics</h3>
                <p className="text-gray-400">Detailed insights into password patterns and effectiveness</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (currentView === 'generate') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        {/* Navigation with progress */}
        <nav className="px-8 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentView('home')}
              className="text-red-500 hover:text-red-400 flex items-center space-x-2"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Back to Home</span>
            </button>
            <div className="flex space-x-2">
              {piiSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 w-12 rounded-full ${idx <= currentStep ? 'bg-red-500' : 'bg-gray-700'}`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-400">
              Step {currentStep + 1} of {piiSteps.length}
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Current Step */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">{piiSteps[currentStep].title}</h1>
            <p className="text-xl text-gray-400">{piiSteps[currentStep].description}</p>
          </div>

          {/* Form Fields */}
          <div className="grid gap-8 max-w-2xl mx-auto">
            {piiSteps[currentStep].fields.map((field) => (
              <div key={field.key} className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl">
                  {field.icon}
                </div>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-xl px-16 py-6 text-xl focus:border-red-500 focus:bg-gray-800/70 transition-all duration-300 placeholder-gray-500"
                />
                <label className="absolute left-16 -top-3 text-sm text-red-400 bg-gray-900 px-2 rounded">
                  {field.label}
                </label>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12 max-w-2xl mx-auto">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {currentStep === piiSteps.length - 1 ? (
              <button
                onClick={handleGenerate}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-12 py-4 rounded-lg font-bold text-lg transform hover:scale-105 transition-all"
              >
                🚀 Generate Wordlist
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(Math.min(piiSteps.length - 1, currentStep + 1))}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
              >
                Next
              </button>
            )}
          </div>

          {/* Progress indicator */}
          <div className="text-center mt-8 text-gray-500">
            Fill in as many fields as possible for better results
          </div>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <Shield className="w-16 h-16 animate-pulse" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Generating Your Wordlist</h2>
            <p className="text-gray-400 text-lg">Using advanced AI to create targeted passwords...</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-4 mb-6">
            <div 
              className="h-4 bg-gradient-to-r from-red-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-2xl font-bold text-red-500 mb-8">
            {Math.round(progress)}% Complete
          </div>

          {/* Status Messages */}
          <div className="space-y-2 text-gray-400">
            {progress > 20 && <p>✓ Analyzing PII patterns...</p>}
            {progress > 40 && <p>✓ Generating base combinations...</p>}
            {progress > 60 && <p>✓ Applying leetspeak variations...</p>}
            {progress > 80 && <p>✓ Optimizing wordlist quality...</p>}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'results') {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900/20 to-purple-900/20 border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Wordlist Generated Successfully! 🎉</h1>
                <p className="text-gray-400">Ready for deployment • Generated just now</p>
              </div>
              <button
                onClick={() => setCurrentView('home')}
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Generate Another
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4">Generation Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Passwords:</span>
                    <span className="font-bold text-green-400">{generatedWordlist.length * 50}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unique Patterns:</span>
                    <span className="font-bold text-blue-400">847</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Strength Score:</span>
                    <span className="font-bold text-red-400">94/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Generation Time:</span>
                    <span className="font-bold">3.2s</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>Download Wordlist</span>
                  </button>
                  <button className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition-colors">
                    Copy to Clipboard
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-bold mb-4">Quick Deploy</h3>
                <div className="space-y-3">
                  <button className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 py-2 rounded-lg text-sm transition-colors">
                    Export for Hashcat
                  </button>
                  <button className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 py-2 rounded-lg text-sm transition-colors">
                    Export for John the Ripper
                  </button>
                  <button className="w-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 py-2 rounded-lg text-sm transition-colors">
                    Export for Hydra
                  </button>
                </div>
              </div>
            </div>

            {/* Wordlist Preview */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Password Preview</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span>Showing first 50 of {generatedWordlist.length * 50}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {[...Array(50)].map((_, idx) => (
                      <div
                        key={idx}
                        className="bg-black/30 px-3 py-2 rounded font-mono text-sm hover:bg-black/50 transition-colors cursor-pointer group"
                      >
                        <span className="text-green-400">
                          {idx < generatedWordlist.length 
                            ? generatedWordlist[idx] 
                            : `password_${idx + 1}_variation`}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 ml-2 text-gray-500">
                          📋
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default NetflixPIIcasso;