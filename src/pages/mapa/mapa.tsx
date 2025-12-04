import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import * as jwtDecode from "jwt-decode";
// Importar ícones padrão do leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { IonButton, IonContent, IonFooter, IonIcon, IonLabel, IonPage, IonToolbar, IonHeader, IonButtons } from "@ionic/react";
import { bandageOutline, cartOutline, listOutline, mapOutline, personOutline, searchCircleOutline, settingsOutline } from "ionicons/icons";
import logo from "../lista/logo.png";

L.Marker.prototype.options.icon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface Animal {
    _id?: string;
    nome: string;
    idade: number;
    raca?: string;
    localizacaoX?: number;
    localizacaoY?: number;
    locationHistory?: Array<{ x: number; y: number; at: string }>;
}

const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

const MapaAnimaisPage: React.FC = () => {
    const [animais, setAnimais] = useState<Animal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);

    const getJwtFromAuthCookie = (): string | null => {
        const raw = document.cookie.split(';').map(s => s.trim()).find(c => c.startsWith('auth='));
        if (!raw) return null;
        const val = decodeURIComponent(raw.substring(5)); // remove "auth="
        const jwtMatch = val.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
        if (jwtMatch && jwtMatch[0]) return jwtMatch[0];
        if (val.split('.').length === 3) return val;
        return null;
    };
    const getUserIdFromCookieOrServer = async (): Promise<string | null> => {
        // 1) tenta cookie no cliente
        const token = getJwtFromAuthCookie();
        if (token) {
            try {
                const decoded = (jwtDecode as any)(token);
                return decoded?.user_id || decoded?.id || decoded?.sub || null;
            } catch (e) {
                console.warn('jwt-decode falhou:', e);
            }
        }

        // 2) fallback: pedir ao servidor (usa cookie httpOnly)
        try {
            const res = await axios.get(`${API_BASE}/me`, { withCredentials: true });
            // espere res.data ter algo como { user_id: '...' } ou { user: { _id: '...' } }
            return res.data?.user_id || res.data?.id || res.data?._id || res.data?.user?._id || null;
        } catch (err) {
            console.warn('fallback /me falhou:', err);
            return null;
        }
    };
    // Buscar animais do backend
    const fetchAnimais = async () => {
        setLoading(true);
        setError(null);
        try {
            const userId = await getUserIdFromCookieOrServer();
            if (!userId) throw new Error('User ID não encontrado (auth cookie httpOnly ou ausente)');
            const res = await axios.get(`${API_BASE}/animais/${userId}`, { withCredentials: true });
            const data = res.data?.data ?? [];
            setAnimais(data);
        } catch (err: any) {
            console.error("Erro ao buscar animais:", err);
            setError(err?.response?.data?.message || "Erro ao carregar animais");
            setAnimais([]);
        } finally {
            setLoading(false);
        }
    };

    // Criar o mapa e adicionar marcadores
    const createMap = () => {
        if (!mapRef.current) return;

        // Remove instância antiga
        if (mapInstanceRef.current) {
            try {
                mapInstanceRef.current.remove();
            } catch { }
            mapInstanceRef.current = null;
        }

        const map = L.map(mapRef.current, {
            center: [0, 0],
            zoom: 2,
            attributionControl: true,
            zoomControl: true,
        });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        const points: L.LatLngExpression[] = [];

        animais.forEach((animal) => {
            if (animal.localizacaoX !== undefined && animal.localizacaoY !== undefined) {
                const marker = L.marker([animal.localizacaoX, animal.localizacaoY]).addTo(map);
                marker.bindPopup(`<strong>${animal.nome}</strong><br/>${animal.raca ?? "—"}<br/>${animal.idade} anos`);
                points.push([animal.localizacaoX, animal.localizacaoY]);
            }
        });

        if (points.length) {
            map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
        }

        setTimeout(() => map.invalidateSize(), 200);
    };

    // Buscar animais ao montar o componente
    useEffect(() => {
        fetchAnimais();
    }, []);

    // Atualizar mapa sempre que os animais mudarem
    useEffect(() => {
        if (animais.length > 0) createMap();
    }, [animais]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar
                    style={{
                        ["--background" as any]: "#FFF9E5",
                        ["--color" as any]: "#004030",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 12px",
                    } as React.CSSProperties}
                >
                    <img
                        src={logo}
                        srcSet={`${logo} 1x, ${logo} 2x`}
                        alt="perfil"
                        width={40}
                        height={40}
                        style={{
                            borderRadius: "50%",
                            border: "2px solid #DCD0A8",
                            objectFit: "cover",
                            imageRendering: 'auto',
                            WebkitFontSmoothing: 'antialiased'
                        }}
                    />

                    <IonButtons slot="end">
                        <IonButton fill="clear" href="/settings">
                            <IonIcon icon={settingsOutline} style={{ color: "#004030", fontSize: "24px" }} />
                        </IonButton>
                    </IonButtons>
                    <IonButtons slot="end" id="search">
                        <IonButton onClick={() => setIsAccordionOpen(!isAccordionOpen)}>
                            <IonIcon icon={searchCircleOutline} size="large" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <div style={{ width: "100%", height: "100%", position: "relative" }}>
                    {loading && (
                        <p style={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}>Carregando...</p>
                    )}
                    {error && (
                        <p style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, color: "crimson" }}>{error}</p>
                    )}
                    <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
                </div>
            </IonContent>

            <IonFooter>
                <IonToolbar
                    style={{
                        "--background": "#DCD0A8",
                        "--border-color": "#DCD0A8",
                        "--min-height": "64px",
                        "--padding": "6px 6px"
                    }}
                >
                    <div style={{
                        display: "flex",
                        flexWrap: "nowrap",        // forçar 1 linha
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        gap: "6px",
                        overflow: "hidden"        // evita overflow vertical/linhas extras
                    }}>
                        <IonButton fill="clear" href="/mapa" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                <IonIcon icon={mapOutline} style={{ color: "#004030", fontSize: "18px" }} />
                                <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Mapa</IonLabel>
                            </div>
                        </IonButton>

                        <IonButton fill="clear" href="/market" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                <IonIcon icon={cartOutline} style={{ color: "#004030", fontSize: "18px" }} />
                                <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Market</IonLabel>
                            </div>
                        </IonButton>

                        <IonButton fill="clear" href="/lista" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                <IonIcon icon={listOutline} style={{ color: "#004030", fontSize: "18px" }} />
                                <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Lista</IonLabel>
                            </div>
                        </IonButton>

                        <IonButton fill="clear" routerLink="/veterinarios" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                <IonIcon icon={bandageOutline} style={{ color: "#004030", fontSize: "18px" }} />
                                <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Veterinária</IonLabel>
                            </div>
                        </IonButton>


                        <IonButton fill="clear" href="/settings/conta" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                <IonIcon icon={personOutline} style={{ color: "#004030", fontSize: "18px" }} />
                                <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Perfil</IonLabel>
                            </div>
                        </IonButton>
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );

};

export default MapaAnimaisPage;
