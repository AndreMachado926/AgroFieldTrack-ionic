import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { jwtDecode } from "jwt-decode";

import {
    IonPage,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonLabel,
    IonText,
    IonButtons,
} from "@ionic/react";
import FooterTabs from "../../components/FooterTabs";
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
}

interface DecodedToken {
    user_id: string;
    username: string;
    iat: number;
    exp: number;
}

const MapaVetPage: React.FC = () => {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const decodedUserIdRef = useRef<string | null>(null);
    const userLocationMarkerRef = useRef<L.CircleMarker | L.Marker | null>(null);
    const otherUsersMarkersRef = useRef<Record<string, L.CircleMarker | L.Marker>>({});

    const [animais, setAnimais] = useState<Animal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getToken = () => {
        const match = document.cookie.match(/(^| )auth=([^;]+)/);
        return match ? match[2] : localStorage.getItem("authToken");
    };

    const createMap = (animals: Animal[]) => {
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
            if (typeof animal.localizacaoX === 'number' && typeof animal.localizacaoY === 'number') {
                const marker = L.marker([animal.localizacaoX, animal.localizacaoY], { icon: pinIcon }).addTo(map);
                marker.bindPopup(`<strong>${animal.nome}</strong><br/>${animal.raca ?? ""}`);
                bounds.push([animal.localizacaoX, animal.localizacaoY]);
            }
        });

        if (bounds.length > 0) {
            map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
        }

        setTimeout(() => map.invalidateSize(), 300);
    };

    const updateUserMarker = (lat: number, lng: number, label = 'Você') => {
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
                    updateUserMarker(lat, lng);
                    const token = getToken();
                    if (token) {
                        const decoded: DecodedToken = jwtDecode(token);
                        decodedUserIdRef.current = decoded.user_id;
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
            setError(null);

            try {
                const token = getToken();
                if (!token) throw new Error("Não autenticado");
                const decoded: DecodedToken = jwtDecode(token);
                decodedUserIdRef.current = decoded.user_id;
                const userId = decoded.user_id;
                const res = await axios.get(`${API_BASE}/veterinarios/${userId}/shared-animals`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const animalsData: Animal[] = res.data.data || [];
                setAnimais(animalsData);
                createMap(animalsData);
            } catch (err: any) {
                console.error(err);
                setError(err?.response?.data?.message || "Erro ao carregar animais partilhados");
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
            `}</style>
            <HeaderNav onLogout={handleLogout} />

            <IonContent fullscreen>
                {loading && (
                    <IonText>
                        <p style={{ textAlign: "center" }}>A carregar mapa...</p>
                    </IonText>
                )}
                {error && (
                    <IonText color="danger">
                        <p style={{ textAlign: "center" }}>{error}</p>
                    </IonText>
                )}
                {!loading && !error && animais.length === 0 && (
                    <IonText>
                        <p style={{ textAlign: "center" }}>Nenhum animal partilhado encontrado.</p>
                    </IonText>
                )}

                <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
            </IonContent>

            <FooterTabs activeTab="mapa" isVeterinario />
        </IonPage>
    );
};

export default MapaVetPage;
