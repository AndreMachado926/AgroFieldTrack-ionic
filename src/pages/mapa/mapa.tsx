import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { jwtDecode } from "jwt-decode";

import {
    IonPage,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonFooter,
    IonButton,
    IonIcon,
    IonLabel,
    IonText,
    IonButtons,
} from "@ionic/react";
import {
    mapOutline,
    cartOutline,
    listOutline,
    bandageOutline,
    settingsOutline,
    logOutOutline,
} from "ionicons/icons";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

axios.defaults.withCredentials = true;
const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

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

const MapaAnimaisPage: React.FC = () => {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

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

        const map = L.map(mapRef.current, { center: [0, 0], zoom: 2 });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

        const bounds: L.LatLngExpression[] = [];

        animals.forEach(animal => {
            if (animal.localizacaoX && animal.localizacaoY) {
                const marker = L.marker([animal.localizacaoX, animal.localizacaoY]).addTo(map);
                marker.bindPopup(`<strong>${animal.nome}</strong><br/>${animal.raca ?? ""}`);
                bounds.push([animal.localizacaoX, animal.localizacaoY]);
            }
        });

        if (bounds.length > 0) map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
        setTimeout(() => map.invalidateSize(), 300);
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const token = getToken();
                if (!token) throw new Error("Não autenticado");
                const decoded: DecodedToken = jwtDecode(token);
                const userId = decoded.user_id;
                const res = await axios.get(`${API_BASE}/animais/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const animalsData: Animal[] = res.data.data || [];
                setAnimais(animalsData);
                createMap(animalsData);
            } catch (err) {
                console.error(err);
                setError("Sessão expirada ou inválida");
            } finally {
                setLoading(false);
            }
        };

        init();
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
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Mapa de Animais</IonTitle>

                    <IonButtons slot="end" style={{ display: "flex", gap: "4px" }}>
                        {/* Botão de Settings */}
                        <IonButton fill="clear" href="/settings">
                            <IonIcon icon={settingsOutline} style={{ color: "#004030", fontSize: "24px" }} />
                        </IonButton>

                        {/* Botão de Logout */}
                        <IonButton fill="clear" onClick={handleLogout}>
                            <IonIcon icon={logOutOutline} style={{ color: "#004030", fontSize: "24px" }} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

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

                <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
            </IonContent>

            <IonFooter>
                <IonToolbar style={{ "--background": "#DCD0A8", "--border-color": "#DCD0A8", "--min-height": "64px", "--padding": "6px 6px" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 6 }}>
                        <IonButton fill="clear" routerLink="/mapa" style={{ flex: '1 1 0', minWidth: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <IonIcon icon={mapOutline} style={{ color: "#004030", fontSize: 18 }} />
                                <IonLabel style={{ color: "#004030", fontSize: 11 }}>Mapa</IonLabel>
                            </div>
                        </IonButton>
                        <IonButton fill="clear" routerLink="/market" style={{ flex: '1 1 0', minWidth: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <IonIcon icon={cartOutline} style={{ color: "#004030", fontSize: 18 }} />
                                <IonLabel style={{ color: "#004030", fontSize: 11 }}>Market</IonLabel>
                            </div>
                        </IonButton>
                        <IonButton fill="clear" routerLink="/lista" style={{ flex: '1 1 0', minWidth: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <IonIcon icon={listOutline} style={{ color: "#004030", fontSize: 18 }} />
                                <IonLabel style={{ color: "#004030", fontSize: 11 }}>Lista</IonLabel>
                            </div>
                        </IonButton>
                        <IonButton fill="clear" routerLink="/veterinarios" style={{ flex: '1 1 0', minWidth: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <IonIcon icon={bandageOutline} style={{ color: "#004030", fontSize: 18 }} />
                                <IonLabel style={{ color: "#004030", fontSize: 11 }}>Veterinária</IonLabel>
                            </div>
                        </IonButton>
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default MapaAnimaisPage;
