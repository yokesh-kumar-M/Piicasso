import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import Globe from 'react-globe.gl';
import axiosInstance from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const GlobalMap = () => {
    const globeEl = useRef();
    const containerRef = useRef();
    const [points, setPoints] = useState([]);
    const [countries, setCountries] = useState({ features: [] });
    const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
    const [isLive, setIsLive] = useState(false);
    const { isAuthenticated } = useContext(AuthContext);

    // Tracks the server timestamp of the last response — used for incremental fetches
    const lastServerTimeRef = useRef(null);
    // Tracks the per-user beacon map so we never show duplicates
    const beaconMapRef = useRef(new Map()); // key: description → value: point object

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        window.addEventListener('resize', updateSize);
        setTimeout(updateSize, 100);

        fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(setCountries)
            .catch(err => console.warn('Could not load country borders:', err));

        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.4;
            globeEl.current.pointOfView({ altitude: 2.0 });
            globeEl.current.controls().enableZoom = false;
        }
    }, []);

    const mergePoints = useCallback((newPoints) => {
        newPoints.forEach(p => {
            // One beacon per user: description is the unique key ("Operator X authenticated.")
            beaconMapRef.current.set(p.description, p);
        });
        setPoints([...beaconMapRef.current.values()]);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        let intervalId;
        let destroyed = false;

        const fetchInitial = async () => {
            try {
                const res = await axiosInstance.get('analytics/globe-data/');
                if (destroyed) return;

                if (res.data?.points) {
                    mergePoints(res.data.points);
                    lastServerTimeRef.current = res.data.server_time;
                    setIsLive(true);
                }
            } catch (e) {
                console.error('Globe init error', e);
            }
        };

        const fetchIncremental = async () => {
            if (!lastServerTimeRef.current) return;
            try {
                const res = await axiosInstance.get(
                    `analytics/globe-data/?since=${encodeURIComponent(lastServerTimeRef.current)}`
                );
                if (destroyed) return;

                if (res.data?.points?.length > 0) {
                    mergePoints(res.data.points);
                }
                // Always advance the cursor even if no new points
                if (res.data?.server_time) {
                    lastServerTimeRef.current = res.data.server_time;
                }
            } catch (e) {
                // Silent — incremental polls failing should not break the UI
            }
        };

        fetchInitial().then(() => {
            if (!destroyed) {
                intervalId = setInterval(fetchIncremental, 30000);
            }
        });

        return () => {
            destroyed = true;
            clearInterval(intervalId);
        };
    }, [mergePoints, isAuthenticated]);

    return (
        <div ref={containerRef} className="w-full h-full relative group flex items-center justify-center bg-transparent overflow-hidden">
            {/* Overlay stats */}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end pointer-events-none">
                <div className="bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 p-3 rounded shadow-2xl">
                    <div className="flex flex-col gap-1 text-right font-mono">
                        <span className="text-[9px] text-zinc-600 uppercase tracking-[0.2em]">Live Connections</span>
                        <span className="text-xl text-zinc-200 font-light tracking-tighter">{points.length}</span>
                        <div className="h-[1px] w-full bg-zinc-800 my-1" />
                        <span className="text-[8px] flex items-center gap-1 justify-end italic" style={{ color: isLive ? '#22c55e' : '#71717a' }}>
                            {isLive ? '● LIVE' : 'CONNECTING...'}
                        </span>
                    </div>
                </div>
            </div>

            <Globe
                ref={globeEl}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="rgba(0,0,0,0)"

                showGlobe={true}
                globeColor="#050505"
                showAtmosphere={true}
                atmosphereColor="#333333"
                atmosphereAltitude={0.1}

                hexPolygonsData={countries.features}
                hexPolygonResolution={3}
                hexPolygonMargin={0.3}
                hexPolygonColor={() => 'rgba(200, 200, 200, 0.7)'}
                hexPolygonAltitude={0.01}

                ringsData={points}
                ringLat="latitude"
                ringLng="longitude"
                ringColor={(d) => d.color || '#22c55e'}
                ringMaxRadius={6}
                ringPropagationSpeed={2.5}
                ringRepeatPeriod={1200}

                pointsData={points}
                pointLat="latitude"
                pointLng="longitude"
                pointColor="color"
                pointAltitude={0.02}
                pointRadius={0.6}

                labelsData={points}
                labelLat="latitude"
                labelLng="longitude"
                labelText="city"
                labelSize={0.6}
                labelDotRadius={0.3}
                labelColor={() => '#888888'}
                labelResolution={2}
                labelIncludeDot={true}
            />
        </div>
    );
};

export default GlobalMap;
