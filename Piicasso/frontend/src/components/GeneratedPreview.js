// src/components/GeneratedPreview.js
import React from 'react';

const GeneratedPreview = ({ list }) => (
  <div className="mt-10 bg-black bg-opacity-40 p-6 rounded-xl border border-green-500 max-w-2xl mx-auto">
    <h2 className="text-green-400 text-lg font-semibold mb-4">
      Generated Wordlist Preview:
    </h2>
    <ul className="list-disc list-inside text-white space-y-1">
      {list.map((word, idx) => (
        <li key={idx}>{word}</li>
      ))}
    </ul>
  </div>
);

export default GeneratedPreview;
