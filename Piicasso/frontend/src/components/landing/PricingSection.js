import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Building2, Users, Headphones } from 'lucide-react';

const PricingSection = () => {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for exploring our API and small side projects.",
      requests: "10K API requests/mo",
      features: [
        { text: "Standard English PII detection", included: true },
        { text: "Basic regex redaction", included: true },
        { text: "Community support", included: true },
        { text: "Multi-language support", included: false },
        { text: "Custom models", included: false },
        { text: "On-premise deployment", included: false },
        { text: "Priority support", included: false },
      ],
      buttonText: "Start Free",
      isPopular: false,
      ctaLink: "/register"
    },
    {
      name: "Pro",
      price: "$49",
      description: "For professional developers and growing startups.",
      requests: "500K API requests/mo",
      features: [
        { text: "Multi-language support (50+)", included: true },
        { text: "Custom regex & dictionaries", included: true },
        { text: "Context-aware NLP models", included: true },
        { text: "Priority email support", included: true },
        { text: "Custom models", included: false },
        { text: "On-premise deployment", included: false },
        { text: "Dedicated account manager", included: false },
      ],
      buttonText: "Upgrade to Pro",
      isPopular: true,
      ctaLink: "/register?plan=pro"
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations with strict security needs.",
      requests: "Unlimited API requests",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "Custom model training", included: true },
        { text: "On-premise deployment", included: true },
        { text: "24/7 phone & email support", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "SLA guarantees", included: true },
        { text: "Custom integrations", included: true },
      ],
      buttonText: "Contact Sales",
      isPopular: false,
      ctaLink: "/contact",
      isEnterprise: true
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/50 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 lg:px-16 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-semibold rounded-full mb-4">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Choose Your <span className="text-blue-600 dark:text-blue-400">Plan</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Start free, scale as you grow. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative rounded-2xl p-8 ${
                plan.isPopular 
                  ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-600/25 scale-105 lg:scale-105 z-10' 
                  : plan.isEnterprise
                    ? 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-700'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white text-blue-600 text-sm font-bold rounded-full shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    Most Popular
                  </span>
                </div>
              )}

              {/* Enterprise Icon */}
              {plan.isEnterprise && (
                <div className="absolute top-0 right-0 p-4">
                  <Building2 className="w-8 h-8 text-purple-400" />
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className={`text-2xl font-bold mb-2 ${plan.isPopular ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className={`text-4xl font-extrabold ${plan.isPopular ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className={`text-sm ${plan.isPopular ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                      /month
                    </span>
                  )}
                </div>
                <p className={`text-sm mb-2 ${plan.isPopular ? 'text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}>
                  {plan.description}
                </p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  plan.isPopular 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {plan.requests}
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.isPopular ? 'text-blue-200' : 'text-green-500'}`} />
                    ) : (
                      <X className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.isPopular ? 'text-blue-400/50' : 'text-slate-300 dark:text-slate-600'}`} />
                    )}
                    <span className={`text-sm ${
                      feature.included 
                        ? plan.isPopular ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                        : plan.isPopular ? 'text-blue-200/60' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <a
                href={plan.ctaLink}
                className={`block w-full py-3.5 px-6 rounded-xl font-semibold text-center transition-all duration-200 ${
                  plan.isPopular
                    ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
                    : plan.isEnterprise
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {plan.buttonText}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Enterprise Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              Enterprise Solutions Include:
            </h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-900 dark:text-white mb-1">On-Premise & VPC</h5>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Deploy within your secure environment</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-900 dark:text-white mb-1">Custom Team Training</h5>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Onboarding by our security experts</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Headphones className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-900 dark:text-white mb-1">Dedicated Support</h5>
                  <p className="text-sm text-slate-600 dark:text-slate-400">24/7 SLA with direct escalation</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Trusted by enterprise security teams worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {['SOC 2', 'HIPAA', 'GDPR', 'PCI-DSS', 'ISO 27001'].map((badge) => (
              <div key={badge} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{badge}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
