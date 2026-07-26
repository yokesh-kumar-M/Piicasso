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
    <div className="mx-auto max-w-4xl p-8 text-white">
      <h2 className="text-neon-green mb-4 text-2xl font-semibold">🔥 RockYou.txt Enhanced</h2>
      <button
        onClick={downloadTextFile}
        className="bg-neon-green mb-4 rounded px-4 py-2 shadow hover:bg-[#00cc00]"
      >
        Download .txt
      </button>
      <div className="max-h-[500px] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-4 shadow-inner">
        <pre className="whitespace-pre-wrap text-sm text-zinc-200">{wordlist.join('\n')}</pre>
      </div>
    </div>
  );
};

export default WordlistViewer;
