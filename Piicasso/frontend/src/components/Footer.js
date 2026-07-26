import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code2, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'API Docs', href: '/api' },
      { name: 'Terminal', href: '/terminal' },
      { name: 'User Dashboard', href: '/user/dashboard' },
      { name: 'Security Workspace', href: '/security/dashboard' },
    ],
    resources: [
      {
        name: 'Source & Documentation',
        href: 'https://github.com/yokesh-kumar-M/Piicasso',
        external: true,
      },
      {
        name: 'Report an Issue',
        href: 'https://github.com/yokesh-kumar-M/Piicasso/issues',
        external: true,
      },
      { name: 'Password Safety Guide', href: '/user/learn' },
    ],
  };

  const renderLink = (link) =>
    link.external ? (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm transition-colors hover:text-white"
      >
        {link.name}
      </a>
    ) : (
      <Link to={link.href} className="text-sm transition-colors hover:text-white">
        {link.name}
      </Link>
    );

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

            <a
              href="https://github.com/yokesh-kumar-M/Piicasso"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <Code2 className="h-5 w-5" aria-hidden="true" />
              View source
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>{renderLink(link)}</li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>{renderLink(link)}</li>
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
                <ShieldCheck className="h-4 w-4" style={{ color: 'var(--accent-500)' }} />
                <span className="text-slate-500">Apache-2.0 licensed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
