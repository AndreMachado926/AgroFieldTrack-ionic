import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { jwtDecode } from "jwt-decode";
import logo from "../lista/logo.png";

import {
    IonPage,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
} from "@ionic/react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import FooterNav from "../../components/FooterNav";
import HeaderNav from "../../components/HeaderNav";
import {
    mapOutline,
    cartOutline,
    listOutline,
    bandageOutline,
    settingsOutline,
    logOutOutline,
} from "ionicons/icons";

axios.defaults.withCredentials = true;
const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

// Ícone customizado para pins
const pinIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4A9782" width="30" height="40" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2)); position: absolute; top: 0; left: 0;">
        <path d="M12 0C7.03 0 3 4.03 3 9c0 5.25 9 15 9 15s9-9.75 9-15c0-4.97-4.03-9-9-9zm0 12c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
    className: 'custom-pin-icon',
});

interface Animal {
    _id?: string;
    nome: string;
    raca?: string;
    localizacaoX?: number;
    localizacaoY?: number;
    dono_id?: string | { nome_completo?: string; username?: string };
}

interface Pasto {
    _id?: string;
    nome: string;
    pontosx?: number[];
    pontosy?: number[];
    animais_ids?: string[];
}

interface DecodedToken {
    user_id: string;
    username: string;
    type?: string;
    iat: number;
    exp: number;
}

const MapaAnimaisPage: React.FC = () => {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const decodedUserIdRef = useRef<string | null>(null);
    const userLocationMarkerRef = useRef<L.CircleMarker | L.Marker | null>(null);
    const otherUsersMarkersRef = useRef<Record<string, L.CircleMarker | L.Marker>>({});

    const [animais, setAnimais] = useState<Animal[]>([]);
    const [pastos, setPastos] = useState<Pasto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    const parseCoord = (value: any) => {
        if (value === undefined || value === null) return NaN;

        if (typeof value === 'string') {
            const normalized = value.trim().replace(',', '.');
            return normalized === '' ? NaN : Number(normalized);
        }

        if (typeof value === 'object') {
            if (value.$numberDecimal !== undefined) {
                return Number(String(value.$numberDecimal).replace(',', '.'));
            }
            if (typeof value.valueOf === 'function') {
                return Number(value.valueOf());
            }
            return NaN;
        }

        return Number(value);
    };

    const getToken = () => {
        const match = document.cookie.match(/(^| )auth=([^;]+)/);
        return match ? match[2] : localStorage.getItem("authToken");
    };

    const createMap = (animals: Animal[], pastosData: Pasto[]) => {
        if (!mapRef.current) return;
        if (mapInstanceRef.current) mapInstanceRef.current.remove();

        const map = L.map(mapRef.current, {
            center: [0, 0],
            zoom: 2,
            maxBounds: [[-90, -180], [90, 180]],
            maxBoundsViscosity: 1.0,
        });
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap & CartoDB',
            noWrap: true,
        }).addTo(map);
        const bounds: L.LatLngExpression[] = [];

        animals.forEach(animal => {
            const lat = parseCoord(animal.localizacaoX);
            const lng = parseCoord(animal.localizacaoY);

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                console.debug('Mapa ignorando animal com coordenadas inválidas:', animal._id, animal.nome, animal.localizacaoX, animal.localizacaoY, lat, lng);
                return;
            }

            const ownerName = typeof animal.dono_id === 'object'
                ? (animal.dono_id.nome_completo || animal.dono_id.username || '')
                : '';
            const popupText = `<strong>${animal.nome}</strong><br/>${animal.raca ?? ""}${ownerName ? `<br/>Dono: ${ownerName}` : ''}`;
            const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
            marker.bindPopup(popupText);
            bounds.push([lat, lng]);
        });

        // Adicionar pastos como polígonos
        pastosData.forEach(pasto => {
            if (pasto.pontosx && pasto.pontosy && pasto.pontosx.length === pasto.pontosy.length && pasto.pontosx.length >= 3) {
                const coords: L.LatLngExpression[] = [];
                for (let i = 0; i < pasto.pontosx.length; i++) {
                    coords.push([pasto.pontosx[i], pasto.pontosy[i]]);
                    bounds.push([pasto.pontosx[i], pasto.pontosy[i]]);
                }
                const polygon = L.polygon(coords, {
                    color: '#4A9782',
                    weight: 2,
                    fillColor: '#4A9782',
                    fillOpacity: 0.2,
                }).addTo(map);
                const animalCount = pasto.animais_ids?.length || 0;
                polygon.bindPopup(`<strong>${pasto.nome}</strong><br/>${animalCount} animal(is)`);
            }
        });

        if (bounds.length > 0) map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });

        // Adicionar marcador do usuário se localização já foi obtida
        if (userLocation) {
            updateUserMarker(userLocation.lat, userLocation.lng);
        }

        setTimeout(() => map.invalidateSize(), 300);
    };

    const updateUserMarker = (lat: number, lng: number, label = 'TU') => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setLatLng([lat, lng]);
        } else {
            const marker = L.circleMarker([lat, lng], {
                radius: 8,
                color: '#007AFF',
                fillColor: '#007AFF',
                fillOpacity: 0.9,
                weight: 2,
            }).addTo(map);
            marker.bindPopup(label);
            userLocationMarkerRef.current = marker;

            // Se não há animais no mapa, centraliza na localização do usuário
            if (!animais.length) {
                map.setView([lat, lng], 13);
            }
        }
    };

    const updateOtherUserMarker = (userId: string, lat: number, lng: number) => {
        const map = mapInstanceRef.current;
        if (!map || !userId) return;

        const existing = otherUsersMarkersRef.current[userId];
        if (existing) {
            existing.setLatLng([lat, lng]);
            return;
        }

        const marker = L.circleMarker([lat, lng], {
            radius: 6,
            color: '#FF5722',
            fillColor: '#FF5722',
            fillOpacity: 0.8,
            weight: 2,
        }).addTo(map);
        marker.bindPopup(`Outro usuário`);
        otherUsersMarkersRef.current[userId] = marker;
    };

    useEffect(() => {
        const socket = io(API_BASE, {
            transports: ["websocket"],
            withCredentials: true,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket conectado:", socket.id);
        });

        socket.on("userMoved", (location) => {
            if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') return;
            if (location.userId && location.userId === decodedUserIdRef.current) return;
            updateOtherUserMarker(location.userId || 'other', location.lat, location.lng);
        });

        socket.on("connect_error", (err) => {
            console.error("Erro de conexão websocket:", err);
        });

        let watchId: number | null = null;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setUserLocation({ lat, lng });
                    updateUserMarker(lat, lng);
                    const token = getToken();
                    if (token) {
                        const decoded: DecodedToken = jwtDecode(token);
                        socket.emit("locationUpdate", { userId: decoded.user_id, lat, lng });
                    } else {
                        socket.emit("locationUpdate", { lat, lng });
                    }
                },
                (geoErr) => {
                    console.warn("Erro de geolocalização:", geoErr);
                    setError("Não foi possível obter localização do dispositivo");
                },
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
            );
        } else {
            setError("Geolocalização não suportada pelo navegador.");
        }

        const init = async () => {
            setLoading(true);
            try {
                const token = getToken();
                if (!token) throw new Error("Não autenticado");
                const decoded: DecodedToken = jwtDecode(token);
                decodedUserIdRef.current = decoded.user_id;
                const userId = decoded.user_id;

                let currentUserType = decoded.type;
                if (!currentUserType) {
                    try {
                        const typeRes = await axios.get(`${API_BASE}/veterinarios/${userId}/type`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        currentUserType = typeRes.data.type;
                    } catch (typeErr) {
                        console.warn('Não foi possível obter tipo de usuário, usando padrão.', typeErr);
                    }
                }

                const endpoint = currentUserType === 'veterinario'
                    ? `${API_BASE}/veterinarios/${userId}/shared-animals`
                    : `${API_BASE}/animais/${userId}`;

                const resAnimais = await axios.get(endpoint, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const animalsData: Animal[] = Array.isArray(resAnimais.data)
                    ? resAnimais.data
                    : resAnimais.data?.data || [];

                // Buscar pastos
                let resPastos;
                try {
                    resPastos = await axios.get(`${API_BASE}/pastos/user/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                } catch (pastosErr) {
                    console.warn('Erro ao buscar pastos:', pastosErr);
                    resPastos = { data: [] };
                }
                const pastosData: Pasto[] = Array.isArray(resPastos.data)
                    ? resPastos.data
                    : resPastos.data?.data || [];

                setAnimais(animalsData);
                setPastos(pastosData);
                createMap(animalsData, pastosData);
            } catch (err) {
                console.error(err);
                setError("Sessão expirada ou inválida");
            } finally {
                setLoading(false);
            }
        };

        init();

        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post(`${API_BASE}/logout`);
        } catch (err) {
            console.warn("Erro ao deslogar", err);
        } finally {
            localStorage.removeItem("authToken");
            window.location.href = "/";
        }
    };

    return (
        <IonPage>
            <style>{`
                .custom-pin-icon {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                .custom-pin-icon img {
                    background: transparent !important;
                }
                .leaflet-control {
                    margin: 10px !important;
                    z-index: 999 !important;
                }
            `}</style>
            <HeaderNav onLogout={handleLogout} />

            <IonContent fullscreen style={{ '--background': '#FFF9E5' } as any}>
                {loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4, gap: 1, zIndex: 10, position: 'relative' }}>
                        <CircularProgress size={28} sx={{ color: '#004030' }} />
                        <Typography sx={{ color: '#004030' }}>A carregar mapa...</Typography>
                    </Box>
                )}

                {error && (
                    <Box sx={{ backgroundColor: '#FDECEA', borderRadius: 3, p: 2, m: 2, zIndex: 10, position: 'relative' }}>
                        <Typography sx={{ color: '#B42318', textAlign: 'center' }}>{error}</Typography>
                    </Box>
                )}

                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, px: 2, pt: 2, pb: 14, display: 'flex' }}>
                    <Box sx={{ flex: 1, borderRadius: 3, overflow: 'hidden', boxShadow: '0 18px 34px rgba(0,0,0,0.08)', bgcolor: '#fff', position: 'relative' }}>
                        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                    </Box>
                </Box>
            </IonContent>

            <FooterNav />
        </IonPage>
    );
};

export default MapaAnimaisPage;
