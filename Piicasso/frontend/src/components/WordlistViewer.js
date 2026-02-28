import React from 'react';

const WordlistViewer = ({ wordlist }) => {
  const downloadTextFile = () => {
    const blob = new Blob([wordlist.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wordlist.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-red-500">🔥 RockYou.txt Enhanced</h2>
      <button
        onClick={downloadTextFile}
        className="mb-4 bg-red-600 hover:bg-red-700 py-2 px-4 rounded shadow">
        Download .txt
      </button>
      <div className="max-h-[500px] overflow-y-auto bg-zinc-900 p-4 rounded-lg shadow-inner border border-zinc-700">
        <pre className="whitespace-pre-wrap text-sm text-zinc-200">
          {wordlist.join('\n')}
        </pre>
      </div>
    </div>
  );
};

export default WordlistViewer;
