import React, { useState, useEffect, useRef, useContext } from 'react';
import { Terminal, Skull } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import axiosInstance from '../api/axios';

const KaliTerminal = () => {
    const { user } = useContext(AuthContext);
    const isGod = user?.is_superuser;

    const [history, setHistory] = useState([
        "Kali GNU/Linux Rolling [Version 2024.1]",
        isGod ? "SUPERUSER DETECTED. GOD MODE ENGAGED." : "Restricted Shell: Only 'hydra' tool is authorized.",
        "" // Spacer
    ]);
    const [input, setInput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    // Refs
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Check for injected wordlist
    useEffect(() => {
        const injectedFile = sessionStorage.getItem('terminal_inject_filename');
        const counts = sessionStorage.getItem('terminal_inject_count');

        if (injectedFile) {
            // clear immediately to prevent re-runs
            sessionStorage.removeItem('terminal_inject_filename');
            sessionStorage.removeItem('terminal_inject_count');

            setTimeout(() => {
                addToHistory(`[SYSTEM] DATA INJECTION RECEIVED`, 'warning');
                addToHistory(`[+] Wordlist imported: ${injectedFile}`, 'success');
                addToHistory(`[+] Size: ${counts || '???'} lines`, 'dim');
                addToHistory(`[HINT] Execute attack: hydra -l admin -P ${injectedFile} target-ip ssh`, 'info');
                setInput(`hydra -l admin -P ${injectedFile} 10.10.1.5 ssh`);
            }, 800);
        }
    }, []);

    // Auto-scroll to bottom of terminal internally without affecting page scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [history]);

    // Focus input on click
    const handleFocus = () => {
        inputRef.current?.focus();
    };

    const addToHistory = (line, type = 'standard') => {
        setHistory(prev => [...prev, { text: line, type }]);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            processCommand(input);
            setInput('');
        }
    };

    const processCommand = async (cmd) => {
        if (!cmd.trim()) return;

        const prompt = isGod ? 'GOD@KALI:~#' : 'root@kali:~/aegis#';

        // Add command to history
        setHistory(prev => [...prev, { text: `${prompt} ${cmd}`, type: 'prompt' }]);

        // Client-side clear for immediate response
        if (cmd.trim().toLowerCase() === 'clear') {
            setHistory([]);
            return;
        }

        setIsRunning(true);

        try {
            const res = await axiosInstance.post('terminal/exec/', { command: cmd });
            const lines = res.data.output || [];

            lines.forEach(line => {
                let type = 'info';
                if (line.includes('[SUCCESS]') || line.includes('open')) type = 'success';
                else if (line.includes('[STATUS]')) type = 'warning';
                else if (line.includes('bash:') || line.includes('error')) type = 'error';
                else if (line.includes('Hydra') || line.includes('Nmap')) type = 'dim';

                addToHistory(line, type);
            });

        } catch (err) {
            console.error(err);
            addToHistory(`Connection lost: ${err.message}`, 'error');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div
            className={`h-full bg-black font-terminal text-sm p-4 overflow-hidden flex flex-col border rounded shadow-[0_0_20px_rgba(0,0,0,0.8)] ${isGod ? 'border-red-600 shadow-red-900/40' : 'border-zinc-800'}`}
            onClick={handleFocus}
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-2 mb-2 select-none border-zinc-900">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                </div>
                <div className={`flex items-center gap-2 font-bold ${isGod ? 'text-red-500' : 'text-gray-400'}`}>
                    {isGod ? <Skull className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                    <span>{isGod ? 'GOD_MODE :: UNRESTRICTED' : 'root@kali: ~/aegis'}</span>
                </div>
                <div className="text-[10px] text-gray-600">v2024.1</div>
            </div>

            {/* Output */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 font-mono">
                {history.map((item, i) => {
                    // Handle legacy string format or new object format
                    const text = typeof item === 'string' ? item : item.text;
                    const type = typeof item === 'string' ? 'info' : item.type;

                    let colorClass = 'text-green-500';
                    if (type === 'prompt') colorClass = isGod ? 'text-red-500 font-bold' : 'text-blue-500 font-bold';
                    if (type === 'error') colorClass = 'text-red-500';
                    if (type === 'warning') colorClass = 'text-yellow-500';
                    if (type === 'dim') colorClass = 'text-gray-600';
                    if (type === 'info') colorClass = 'text-gray-300';
                    if (type === 'success') colorClass = 'text-green-400';

                    return (
                        <div key={i} className={colorClass}>
                            {text}
                        </div>
                    );
                })}

                {/* Input Line */}
                {!isRunning && (
                    <div className="flex items-center">
                        <span className={`mr-2 font-bold ${isGod ? 'text-red-600' : 'text-blue-500'}`}>
                            {isGod ? 'GOD@KALI:~#' : 'root@kali:~/aegis#'}
                        </span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={`bg-transparent border-none outline-none flex-1 caret-white ${isGod ? 'text-red-100' : 'text-white'}`}
                            autoComplete="off"
                        />
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default KaliTerminal;
