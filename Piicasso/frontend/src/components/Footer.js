import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Github, Twitter, Linkedin, Mail, Shield, ArrowRight } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', href: '/features' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'API Docs', href: '/api' },
      { name: 'Integrations', href: '/integrations' },
      { name: 'Changelog', href: '/changelog' },
    ],
    resources: [
      { name: 'Documentation', href: '/docs' },
      { name: 'Blog', href: '/blog' },
      { name: 'Security Guides', href: '/guides' },
      { name: 'Community', href: '/community' },
      { name: 'Support', href: '/help' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact', href: '/contact' },
      { name: 'Press Kit', href: '/press' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Security', href: '/security' },
    ],
  };

  return (
    <footer className="bg-slate-950 text-slate-400">
      {/* Main Footer */}
      <div className="container mx-auto px-6 lg:px-16 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link to="/" className="inline-block mb-6">
              <Logo className="text-2xl text-white" />
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              Enterprise-grade PII redaction and synthetic data generation for secure AI workflows.
            </p>
            
            {/* Newsletter */}
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-300 mb-3">Stay updated</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-l-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-blue-600 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-blue-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-900">
        <div className="container mx-auto px-6 lg:px-16 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 text-sm">
              <p>&copy; {currentYear} PIIcasso Inc. All rights reserved.</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-400">All systems operational</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-slate-500">SOC2 Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
