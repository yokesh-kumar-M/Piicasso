import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const PricingSection = () => {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for exploring our API and small side projects.",
      features: [
        "10,000 API requests / month",
        "Standard English PII detection",
        "Basic regex redaction",
        "Community forum support"
      ],
      buttonText: "Start Free",
      isPopular: false
    },
    {
      name: "Pro",
      price: "$49",
      description: "For professional developers and growing startups.",
      features: [
        "500,000 API requests / month",
        "Multi-language support (50+)",
        "Custom regex & dictionaries",
        "Priority email support",
        "Context-aware NLP models"
      ],
      buttonText: "Upgrade to Pro",
      isPopular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations with strict security needs.",
      features: [
        "Unlimited API requests",
        "Dedicated account manager",
        "On-premise deployment options",
        "Custom model training",
        "SLA & 24/7 phone support"
      ],
      buttonText: "Contact Sales",
      isPopular: false
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Choose the perfect plan for your application's data protection needs. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative p-8 rounded-3xl flex flex-col h-full
                ${plan.isPopular 
                  ? 'bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900 border-2 border-blue-500 shadow-xl scale-105 z-10' 
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                }
              `}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                  {plan.price !== "Custom" && plan.price !== "Free" && <span className="text-slate-500 dark:text-slate-400">/mo</span>}
                </div>
                <p className="text-slate-600 dark:text-slate-400 min-h-[48px]">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 rounded-xl font-bold transition-all
                  ${plan.isPopular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                  }
                `}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
