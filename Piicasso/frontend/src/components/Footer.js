import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { ModeContext } from '../context/ModeContext';

const Footer = () => {
    const { mode } = useContext(ModeContext);
    const currentYear = new Date().getFullYear();

    return (
        <footer className={`border-t py-16 mt-auto transition-colors duration-300 ${mode === 'user' ? 'bg-[#050a05] text-gray-400 border-green-900/50' : 'bg-slate-950 text-slate-400 border-slate-900'}`}>
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    
                    {/* Column 1: Brand & About */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <Link to="/" className="inline-block mb-6">
                            <Logo className="text-3xl text-white" />
                        </Link>
                        <p className={`leading-relaxed mb-6 ${mode === 'user' ? 'text-gray-400' : 'text-slate-400'}`}>
                            Enterprise-grade PII redaction and synthetic data generation for secure AI workflows and data analysis.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${mode === 'user' ? 'bg-green-950/30 hover:bg-green-600 hover:text-white text-green-500' : 'bg-slate-900 hover:bg-blue-600 hover:text-white'}`}>
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${mode === 'user' ? 'bg-green-950/30 hover:bg-green-600 hover:text-white text-green-500' : 'bg-slate-900 hover:bg-blue-600 hover:text-white'}`}>
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${mode === 'user' ? 'bg-green-950/30 hover:bg-green-600 hover:text-white text-green-500' : 'bg-slate-900 hover:bg-blue-600 hover:text-white'}`}>
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Product */}
                    <div>
                        <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Product</h4>
                        <ul className="space-y-4">
                            <li><Link to="/features" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>Features</Link></li>
                            <li><Link to="/pricing" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>Pricing</Link></li>
                            <li><Link to="/api" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>API Documentation</Link></li>
                            <li><Link to="/integrations" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>Integrations</Link></li>
                            <li><Link to="/changelog" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>Changelog</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Resources */}
                    <div>
                        <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Resources</h4>
                        <ul className="space-y-4">
                            <li><Link to="/blog" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>Blog</Link></li>
                            <li><Link to="/guides" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>Security Guides</Link></li>
                            <li><Link to="/community" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>Community Forum</Link></li>
                            <li><Link to="/help" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>Help Center</Link></li>
                            <li><Link to="/status" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>System Status</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Legal & Contact */}
                    <div>
                        <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Company</h4>
                        <ul className="space-y-4">
                            <li><Link to="/about" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>About Us</Link></li>
                            <li><Link to="/careers" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>Careers</Link></li>
                            <li><Link to="/privacy" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>Privacy Policy</Link></li>
                            <li><Link to="/terms" className={`transition-colors ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>Terms of Service</Link></li>
                            <li><Link to="/contact" className={`transition-colors flex items-center gap-2 ${mode === 'user' ? 'hover:text-green-400' : 'hover:text-blue-400'}`}>
                                <Mail className="w-4 h-4" /> Contact Us
                            </Link></li>
                        </ul>
                    </div>
                </div>

                <div className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center text-sm ${mode === 'user' ? 'border-green-900/50' : 'border-slate-900'}`}>
                    <p>&copy; {currentYear} PIIcasso Inc. All rights reserved.</p>
                    <div className="flex items-center space-x-2 mt-4 md:mt-0">
                        <span className={`w-2 h-2 rounded-full ${mode === 'user' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                        <span>All systems operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;