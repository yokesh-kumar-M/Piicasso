import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Shield, ArrowRight } from 'lucide-react';
import Logo from './Logo';

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
      <div className="container mx-auto px-6 py-16 lg:px-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link to="/" className="mb-6 inline-block">
              <Logo className="text-2xl text-white" />
            </Link>
            <p className="mb-6 text-sm leading-relaxed">
              Enterprise-grade PII redaction and synthetic data generation for secure AI workflows.
            </p>

            {/* Newsletter */}
            <div className="mb-6">
              <p className="mb-3 text-sm font-medium text-slate-300">Stay updated</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none sm:rounded-l-lg sm:rounded-r-none"
                />
                <button
                  className="rounded-lg px-4 py-3 text-white transition-colors sm:rounded-l-none sm:rounded-r-lg"
                  style={{ background: 'var(--accent-500)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-700)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--accent-500)';
                  }}
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-slate-400 transition-all hover:text-white"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-500)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '';
                }}
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/yokesh-kumar-M/Piicasso"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-slate-400 transition-all hover:text-white"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-700)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '';
                }}
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm transition-colors hover:text-white">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm transition-colors hover:text-white">
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
        <div className="container mx-auto px-6 py-6 lg:px-16">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-4 text-sm">
              <p>&copy; {currentYear} PIIcasso Inc. All rights reserved.</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2 rounded-full bg-green-900/30 px-3 py-1">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                  <span className="text-green-400">All systems operational</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" style={{ color: 'var(--accent-500)' }} />
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
