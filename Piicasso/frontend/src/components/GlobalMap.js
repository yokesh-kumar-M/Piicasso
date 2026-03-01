import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import axiosInstance from '../api/axios';

const GlobalMap = () => {
    const globeEl = useRef();
    const containerRef = useRef();
    const [points, setPoints] = useState([]);
    const [countries, setCountries] = useState({ features: [] });
    const [dimensions, setDimensions] = useState({ width: 300, height: 300 });

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        window.addEventListener('resize', updateSize);
        setTimeout(updateSize, 100);

        // Load Country Data for 3D Hex mesh
        fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(setCountries);

        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.4;
            globeEl.current.pointOfView({ altitude: 2.0 });
            globeEl.current.controls().enableZoom = false;
        }

        const fetchPoints = async () => {
            try {
                const res = await axiosInstance.get('analytics/globe-data/');
                if (Array.isArray(res.data)) {
                    setPoints(res.data);
                }
            } catch (e) {
                console.error("Map fetch error", e);
            }
        };

        fetchPoints();
        const interval = setInterval(fetchPoints, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative group flex items-center justify-center bg-transparent overflow-hidden">
            {/* Overlay stats - Minimalist Terminal Style */}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end pointer-events-none">
                <div className="bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 p-3 rounded shadow-2xl">
                    <div className="flex flex-col gap-1 text-right font-mono">
                        <span className="text-[9px] text-zinc-600 uppercase tracking-[0.2em]">Live Connections</span>
                        <span className="text-xl text-zinc-200 font-light tracking-tighter">{points.length}</span>
                        <div className="h-[1px] w-full bg-zinc-800 my-1" />
                        <span className="text-[8px] text-zinc-500 flex items-center gap-1 justify-end italic">
                            CONNECTING...
                        </span>
                    </div>
                </div>
            </div>

            <Globe
                ref={globeEl}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="rgba(0,0,0,0)"

                // Monochromatic Base
                showGlobe={true}
                globeColor="#050505"
                showAtmosphere={true}
                atmosphereColor="#333333"
                atmosphereAltitude={0.1}

                // depth: 3D HEXAGONAL CONTINENTS (Extruded)
                hexPolygonsData={countries.features}
                hexPolygonResolution={3}
                hexPolygonMargin={0.3}
                hexPolygonUseColor={() => false}
                hexPolygonColor={() => 'rgba(200, 200, 200, 0.7)'}
                hexPolygonAltitude={0.01}

                // Indicators: SONAR RINGS (Pulsing Beacons)
                ringsData={points}
                ringLat="latitude"
                ringLng="longitude"
                ringColor={(d) => d.color || "#ffffff"}
                ringMaxRadius={6}
                ringPropagationSpeed={2.5}
                ringRepeatPeriod={1200}

                // Beacon Points
                pointsData={points}
                pointLat="latitude"
                pointLng="longitude"
                pointColor="color"
                pointAltitude={0.02}
                pointRadius={0.6}

                // Labels
                labelsData={points}
                labelLat="latitude"
                labelLng="longitude"
                labelText="city"
                labelSize={0.6}
                labelDotRadius={0.3}
                labelColor={() => "#888888"}
                labelResolution={2}
                labelIncludeDot={true}
            />
        </div>
    );
};

export default GlobalMap;
