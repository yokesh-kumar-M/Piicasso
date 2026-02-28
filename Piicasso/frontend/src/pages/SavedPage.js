import React from 'react';
import Navbar from '../components/Navbar';
import { Bookmark, Star, Clock, Folder } from 'lucide-react';

const SavedPage = () => {
    // This replaces "My List" with a "Workspace" concept
    return (
        <div className="bg-[#0a0a0a] min-h-screen text-white font-body selection:bg-netflix-red selection:text-white">
            <Navbar />
            <div className="pt-24 px-6 md:px-12">
                <h1 className="text-3xl font-heading mb-8">SAVED <span className="text-netflix-red">ITEMS</span></h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Folder 1: Favorites */}
                    <div className="bg-[#141414] border border-zinc-800 rounded p-6 hover:border-gray-600 transition-colors cursor-pointer group">
                        <Folder className="w-10 h-10 text-yellow-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold mb-2">Starred items</h3>
                        <p className="text-sm text-gray-500">12 items saved</p>
                        <div className="mt-4 flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-[#141414]"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-[#141414]"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-[#141414]"></div>
                        </div>
                    </div>

                    {/* Folder 2: Recent */}
                    <div className="bg-[#141414] border border-zinc-800 rounded p-6 hover:border-gray-600 transition-colors cursor-pointer group">
                        <Clock className="w-10 h-10 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold mb-2">Recent Items</h3>
                        <p className="text-sm text-gray-500">Last accessed 2 mins ago</p>
                    </div>

                    {/* Folder 3: Reports */}
                    <div className="bg-[#141414] border border-zinc-800 rounded p-6 hover:border-gray-600 transition-colors cursor-pointer group">
                        <Star className="w-10 h-10 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold mb-2">Generated Reports</h3>
                        <p className="text-sm text-gray-500">5 PDF reports available</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SavedPage;
