import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import Globe from 'react-globe.gl';
import axiosInstance from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import useResponsive from '../hooks/useResponsive';

const GlobalMap = () => {
    const globeEl = useRef();
    const containerRef = useRef();
    const [points, setPoints] = useState([]);
    const [liveCount, setLiveCount] = useState(0);
    const [countries, setCountries] = useState({ features: [] });
    const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
    const [isLive, setIsLive] = useState(false);
    const { isAuthenticated } = useContext(AuthContext);
    const { isMobile } = useResponsive();

    // User's own geolocation
    const [userLocation, setUserLocation] = useState(null); // {latitude, longitude, city, country_code}

    // Tracks the server timestamp of the last response — used for incremental fetches
    const lastServerTimeRef = useRef(null);
    // One beacon per active user — keyed by user_id, replaced on every poll
    const beaconMapRef = useRef(new Map()); // key: user_id → value: point object

    // Get user's geolocation on mount
    useEffect(() => {
        if (!navigator.geolocation) {
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                // Reverse-geocode via a lightweight lookup (city/country from coords)
                fetch(`https://secure.geonames.org/countrySubdivisionJSON?lat=${latitude}&lng=${longitude}&username=demo&radius=10`)
                    .then(r => r.json())
                    .then(data => {
                        setUserLocation({
                            latitude,
                            longitude,
                            city: data.geonames?.[0]?.name || 'Unknown',
                            country_code: data.geonames?.[0]?.countryCode || 'UNK',
                        });
                    })
                    .catch(() => {
                        setUserLocation({ latitude, longitude, city: 'Unknown', country_code: 'UNK' });
                    });
            },
            (err) => {
                console.warn('Geolocation denied or unavailable:', err.message);
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
        );
    }, []);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        const observer = new ResizeObserver(updateSize);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        updateSize();

        fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(setCountries)
            .catch(err => console.warn('Could not load country borders:', err));

        return () => observer.disconnect();
    }, []);

    // Send HELP beacon with user's geolocation
    const sendBeacon = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const payload = { message: 'HELP' };
            if (userLocation) {
                payload.latitude = userLocation.latitude;
                payload.longitude = userLocation.longitude;
                payload.city = userLocation.city;
                payload.country_code = userLocation.country_code;
            }
            await axiosInstance.post('analytics/beacon/', payload);
        } catch (e) {
            console.warn('Beacon send failed:', e.message);
        }
    }, [isAuthenticated, userLocation]);

    useEffect(() => {
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.4;
            globeEl.current.pointOfView({ altitude: 2.0 });
            globeEl.current.controls().enableZoom = false;
        }
    }, []);

    const mergePoints = useCallback((newPoints, newLiveCount) => {
        // Build map from incoming points (replaces all — removes offline users)
        const newMap = new Map(newPoints.map(p => [String(p.user_id), p]));

        // Add the current user's own location with a special "self" marker
        if (userLocation && isAuthenticated) {
            const selfPoint = {
                user_id: 'self',
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                city: userLocation.city || 'You',
                country_code: userLocation.country_code || 'UNK',
                color: '#22c55e',
                intensity: 1.0,
                activity_type: 'LOGIN',
            };
            newMap.set('self', selfPoint);
        }

        beaconMapRef.current = newMap;
        setPoints([...beaconMapRef.current.values()]);
        if (newLiveCount !== undefined) setLiveCount(newLiveCount);
    }, [userLocation, isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;

        let intervalId;
        let beaconIntervalId;
        let destroyed = false;

        const fetchInitial = async () => {
            try {
                // Send beacon first so backend records our location
                await sendBeacon();

                const res = await axiosInstance.get('analytics/globe-data/');
                if (destroyed) return;

                if (res.data?.points) {
                    mergePoints(res.data.points, res.data.live_count);
                    lastServerTimeRef.current = res.data.server_time;
                    setIsLive(true);
                }
            } catch (e) {
                console.error('Globe init error', e);
                setIsLive(false);
            }
        };

        const fetchIncremental = async () => {
            if (!lastServerTimeRef.current) return;
            try {
                const res = await axiosInstance.get(
                    `analytics/globe-data/?since=${encodeURIComponent(lastServerTimeRef.current)}`
                );
                if (destroyed) return;

                if (res.data?.points !== undefined) {
                    mergePoints(res.data.points, res.data.live_count);
                }
                if (res.data?.server_time) {
                    lastServerTimeRef.current = res.data.server_time;
                }
            } catch (e) {
                // Silent — incremental polls failing should not break the UI
            }
        };

        fetchInitial().then(() => {
            if (!destroyed) {
                // Poll for new globe data every 30s
                intervalId = setInterval(fetchIncremental, 30000);
                // Re-send beacon every 30s to stay "active"
                beaconIntervalId = setInterval(sendBeacon, 30000);
            }
        });

        return () => {
            destroyed = true;
            clearInterval(intervalId);
            clearInterval(beaconIntervalId);
        };
    }, [mergePoints, isAuthenticated, sendBeacon]);

    return (
        <div
          ref={containerRef}
          className="w-full relative group flex items-center justify-center bg-transparent overflow-hidden"
          style={isMobile ? { height: 'min(50vw, 280px)' } : { height: '100%' }}
        >
            {/* Overlay stats */}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end pointer-events-none">
                <div className="bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 p-3 rounded shadow-2xl">
                    <div className="flex flex-col gap-1 text-right font-mono">
                        <span className="text-[9px] text-zinc-600 uppercase tracking-[0.2em]">Live Connections</span>
                        <span className="text-xl text-zinc-200 font-light tracking-tighter">{liveCount}</span>
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
                pointAltitude={isMobile ? 0.01 : 0.02}
                enablePointerInteraction={true}
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
