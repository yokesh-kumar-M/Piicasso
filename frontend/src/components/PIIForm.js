// src/components/PIIForm.js
import React from 'react';

const fields = [
  'Full Name', 'Birth Year', 'Pet Names (comma-separated)', 'Spouse Name',
  'Sports Team', 'Childhood Nickname', 'First Car Model', 'Hometown',
  'Favourite Movies (comma-separated)', 'School Name', 'Employer Name',
  'Phone Suffix', 'Favourite Food'
];

const PIIForm = () => {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white font-mono flex items-center justify-center p-4">
      <form className="w-full max-w-2xl bg-black bg-opacity-30 backdrop-blur-md p-8 rounded-xl border border-red-700 shadow-2xl">
        <h1 className="text-3xl font-bold text-red-600 mb-6 text-center tracking-wider">
          PIIcasso Generator
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {fields.map((field, i) => (
            <div key={i} className="flex flex-col">
              <label className="text-sm text-red-400 mb-1">{field}</label>
              <input
                type="text"
                placeholder=""
                className="bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 transition"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded text-lg transition"
        >
          Generate Password List
        </button>
      </form>
    </div>
  );
};

export default PIIForm;
