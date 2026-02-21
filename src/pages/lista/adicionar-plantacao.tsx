import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonTitle,
    IonFooter,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonCard
} from "@ionic/react";
import {
    arrowBackOutline,
    mapOutline,
    cartOutline,
    listOutline,
    personOutline,
    bandageOutline
} from "ionicons/icons";
import { useHistory, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

interface DecodedToken {
    user_id: string;
}

interface Plantacao {
    _id?: string;
    planta: string;
    nome?: string;
    localizacaoX?: number;
    localizacaoY?: number;
    pontosx?: number[];
    pontosy?: number[];
}

const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

// Configuração padrão do ícone do Leaflet
L.Marker.prototype.options.icon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const AdicionarPlantacao: React.FC = () => {
    const history = useHistory();
    const location = useLocation();

    const distance = (a: L.LatLng, b: L.LatLng) => a.distanceTo(b);

    const cross = (o: L.LatLng, a: L.LatLng, b: L.LatLng) => (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);

    const convexHull = (points: L.LatLng[]) => {
        if (points.length <= 1) return points;
        points = points.slice().sort((a, b) => a.lng - b.lng || a.lat - b.lat);
        const hull = [];
        for (let i = 0; i < points.length; i++) {
            while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], points[i]) <= 0) hull.pop();
            hull.push(points[i]);
        }
        const t = hull.length + 1;
        for (let i = points.length - 2; i >= 0; i--) {
            while (hull.length >= t && cross(hull[hull.length - 2], hull[hull.length - 1], points[i]) <= 0) hull.pop();
            hull.push(points[i]);
        }
        hull.pop();
        return hull;
    };

    const isPointInPolygon = (point: L.LatLng, polygon: L.LatLng[]) => {
        let x = point.lng; // longitude
        let y = point.lat; // latitude

        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            let xi = polygon[i].lng, yi = polygon[i].lat;
            let xj = polygon[j].lng, yj = polygon[j].lat;

            const intersect =
                yi > y !== yj > y &&
                x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

            if (intersect) inside = !inside;
        }

        return inside;
    };

    const [plantacao, setPlantacao] = useState<Partial<Plantacao>>({
        planta: "",
        nome: "",
        pontosx: [],
        pontosy: []
    });

    const [tab, setTab] = useState<"edit" | "details">("edit");
    const [selectedPlantacao, setSelectedPlantacao] = useState<Plantacao | null>(null);

    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    const editMapRef = useRef<HTMLDivElement | null>(null);
    const editMapInstanceRef = useRef<L.Map | null>(null);

    const [nextPinNumber, setNextPinNumber] = useState<number>(1);
    const [pins, setPins] = useState<Array<{ id: string; marker: L.Marker; number: number; latlng: L.LatLng }>>([]);

    const markersRef = useRef<L.Marker[]>([]);
    const polygonRef = useRef<L.Polygon | null>(null);
    const polylinesRef = useRef<L.Polyline[]>([]);
    const isUpdating = useRef(false);

    // Carregar plantação selecionada
    useEffect(() => {
        const state = location.state as { plantacao?: Plantacao };
        if (state?.plantacao) {
            setSelectedPlantacao(state.plantacao);
            setPlantacao({
                planta: state.plantacao.planta,
                nome: state.plantacao.nome || "",
                pontosx: state.plantacao.pontosx || [],
                pontosy: state.plantacao.pontosy || []
            });
            setTab("details");
        }
    }, [location.state]);

    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) try { mapInstanceRef.current.remove(); } catch { }
            if (editMapInstanceRef.current) try { editMapInstanceRef.current.remove(); } catch { }
        };
    }, []);

    useEffect(() => {
        if (tab === "details" && selectedPlantacao) {
            setTimeout(() => createPlantacaoMap(), 100);
        }
    }, [tab, selectedPlantacao]);

    useEffect(() => {
        if (tab === "edit" && editMapRef.current) {
            initializeEditMap();
        }
    }, [tab]);

    useEffect(() => {
        if (pins.length >= 3) {
            updatePolygon(pins);
        }
    }, [pins]);

    const initializeEditMap = () => {
        if (!editMapRef.current) return;

        editMapRef.current.innerHTML = "";
        editMapRef.current.style.height = "300px";
        editMapRef.current.style.width = "100%";

        const map = L.map(editMapRef.current, {
            center: [39.8283, -98.5795],
            zoom: 4,
            attributionControl: true,
            zoomControl: true
        });
        editMapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors"
        }).addTo(map);

        if (selectedPlantacao?.pontosx && selectedPlantacao?.pontosy) {
            const px = selectedPlantacao.pontosx;
            const py = selectedPlantacao.pontosy;
            const coords: L.LatLng[] = [];

            for (let i = 0; i < Math.min(px.length, py.length); i++) {
                const lat = Number(px[i]);
                const lng = Number(py[i]);
                if (!isNaN(lat) && !isNaN(lng)) coords.push(L.latLng(lat, lng));
            }

            if (coords.length > 0) {
                coords.forEach((coord, index) => {
                    const markerNumber = index + 1;
                    const marker = L.marker(coord).addTo(map);
                    markersRef.current.push(marker);
                    setPins(prev => [...prev, { id: `existing_${index}`, marker, number: markerNumber, latlng: coord }]);
                });

                map.fitBounds(L.latLngBounds(coords), { padding: [20, 20] });
            }
        }

        map.on("click", (e: L.LeafletMouseEvent) => addMarker(e.latlng));

        setTimeout(() => map.invalidateSize(), 200);
    };

    const addMarker = (latlng: L.LatLng) => {
        if (!editMapInstanceRef.current) return;

        if (polygonRef.current) {
            const polyLatLngs = polygonRef.current.getLatLngs()[0] as L.LatLng[];
            if (isPointInPolygon(latlng, polyLatLngs)) return;
        }

        const marker = L.marker(latlng).addTo(editMapInstanceRef.current);
        markersRef.current.push(marker);

        const newPin = {
            id: crypto.randomUUID(),
            marker,
            number: pins.length + 1,
            latlng
        };

        setPins(prev => [...prev, newPin]);

    };

    const updatePolygon = (currentPins: typeof pins) => {
        if (!editMapInstanceRef.current) return;
        if (currentPins.length < 3) return;

        // 1️⃣ limpar linhas
        polylinesRef.current.forEach(line => editMapInstanceRef.current!.removeLayer(line));
        polylinesRef.current = [];

        // 2️⃣ remover polígono anterior
        if (polygonRef.current) {
            editMapInstanceRef.current.removeLayer(polygonRef.current);
            polygonRef.current = null;
        }

        // 3️⃣ calcular convex hull
        const hull = convexHull(currentPins.map(p => p.latlng));
        const tempPolygon = L.polygon(hull);

        // 4️⃣ filtrar pins internos e remover visualmente
        const validPins: typeof pins = [];

        currentPins.forEach(pin => {
            const isHullVertex = hull.some(h => h.equals(pin.latlng));
            const isInside = isPointInPolygon(pin.latlng, hull);

            if (isHullVertex || !isInside) {
                validPins.push(pin);
            } else {
                // remover do mapa
                editMapInstanceRef.current!.removeLayer(pin.marker);
                markersRef.current = markersRef.current.filter(m => m !== pin.marker);
            }
        });

        // 5️⃣ atualizar estado
        if (validPins.length !== currentPins.length) {
            setPins(validPins);
            return;
        }

        // 6️⃣ criar polígono final
        polygonRef.current = L.polygon(hull, {
            color: "#4A9782",
            weight: 2,
            fillOpacity: 0.15
        }).addTo(editMapInstanceRef.current);

        // 7️⃣ desenhar linhas
        for (let i = 0; i < hull.length; i++) {
            const a = hull[i];
            const b = hull[(i + 1) % hull.length];

            const line = L.polyline([a, b], { color: "#4A9782", weight: 2 }).addTo(editMapInstanceRef.current);
            polylinesRef.current.push(line);
        }
    };


    (window as any).removePinById = (pinId: string) => {
        if (!editMapInstanceRef.current) return;
        const pinIndex = pins.findIndex(pin => pin.id === pinId);
        if (pinIndex === -1) return;

        const pinToRemove = pins[pinIndex];
        editMapInstanceRef.current.removeLayer(pinToRemove.marker);
        markersRef.current = markersRef.current.filter(m => m !== pinToRemove.marker);

        const newPins = pins.filter(pin => pin.id !== pinId);
        setPins(newPins);
        setNextPinNumber(newPins.length > 0 ? Math.max(...newPins.map(p => p.number)) + 1 : 1);
    };

    const createPlantacaoMap = () => {
        if (!mapRef.current || !selectedPlantacao) return;

        if (mapInstanceRef.current) try { mapInstanceRef.current.remove(); } catch { }
        mapRef.current.innerHTML = "";

        const map = L.map(mapRef.current, { center: [0, 0], zoom: 13, attributionControl: true, zoomControl: true });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);

        const px = selectedPlantacao.pontosx || [];
        const py = selectedPlantacao.pontosy || [];
        const coords: L.LatLngExpression[] = [];
        for (let i = 0; i < Math.min(px.length, py.length); i++) {
            const lat = Number(px[i]);
            const lng = Number(py[i]);
            if (!isNaN(lat) && !isNaN(lng)) coords.push([lat, lng]);
        }

        if (coords.length > 0) {
            coords.forEach((c, i) => {
                const m = L.marker(c).addTo(map);
                m.bindTooltip(`Ponto ${i + 1}`, { permanent: true, direction: "center" });
            });
            if (coords.length >= 3) L.polygon(coords, { color: "#4A9782", weight: 1, fillOpacity: 0.04, opacity: 0.5 }).addTo(map);
            map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
        } else if (selectedPlantacao.localizacaoX !== undefined && selectedPlantacao.localizacaoY !== undefined) {
            const pt: L.LatLngExpression = [selectedPlantacao.localizacaoX, selectedPlantacao.localizacaoY];
            L.marker(pt).addTo(map);
            map.setView(pt, 13);
        } else {
            map.setView([0, 0], 2);
        }

        setTimeout(() => map.invalidateSize(), 200);
    };

    const getToken = () => {
        const match = document.cookie.match(/(^| )auth=([^;]+)/);
        return match ? match[2] : localStorage.getItem("authToken");
    };
    const handleEditPlantacao = async () => {
        try {
            const token = getToken();
            if (!token) throw new Error("Não autenticado");

            if (!selectedPlantacao?._id) throw new Error("Plantação não selecionada para editar");
            if (!plantacao.planta) { alert("Por favor preencha o nome da planta"); return; }
            if (pins.length < 3) { alert("São necessários pelo menos 3 pontos"); return; }

            // Preparar dados para enviar
            const pontosx = pins.map(pin => pin.latlng.lat);
            const pontosy = pins.map(pin => pin.latlng.lng);

            const plantacaoData = {
                id: selectedPlantacao._id,
                nome: plantacao.nome || selectedPlantacao.nome,
                planta: plantacao.planta,
                pontosx,
                pontosy
            };

            const response = await axios.post(`${API_BASE}/editplantacoes`, plantacaoData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                alert("Plantação editada com sucesso!");
                history.goBack();
            } else {
                alert(response.data.message || "Erro ao editar plantação");
            }

        } catch (err: any) {
            console.error("Erro ao editar plantação:", err);
            alert(err?.response?.data?.message || err.message || "Erro desconhecido");
        }
    };

    const handleSubmit = async () => {
        try {
            const token = getToken();
            if (!token) throw new Error("Não autenticado");
            const decoded: DecodedToken = jwtDecode(token);
            const userId = decoded.user_id;

            if (!plantacao.planta) { alert("Por favor preencha o nome da planta"); return; }
            if (pins.length === 0 && !selectedPlantacao) { alert("Por favor adicione pelo menos um ponto no mapa"); return; }

            const pontosx = pins.map(pin => pin.latlng.lat);
            const pontosy = pins.map(pin => pin.latlng.lng);

            const plantacaoData = { ...plantacao, localizacaoX: pontosx[0] || 0, localizacaoY: pontosy[0] || 0, pontosx, pontosy, dono_id: userId };

            if (selectedPlantacao?._id) {
                await axios.put(`${API_BASE}/plantacoes/${selectedPlantacao._id}`, plantacaoData, { headers: { Authorization: `Bearer ${token}` } });
                alert("Plantação atualizada com sucesso!");
            } else {
                await axios.post(`${API_BASE}/plantacoes`, plantacaoData, { headers: { Authorization: `Bearer ${token}` } });
                alert("Plantação adicionada com sucesso!");
            }
            history.goBack();
        } catch (err: any) {
            console.error("Erro ao salvar plantação:", err);
            alert(err?.response?.data?.message || "Erro ao salvar plantação");
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar style={{ "--background": "#FFF9E5", "--color": "#004030" }}>
                    <IonButtons slot="start">
                        <IonButton onClick={() => history.goBack()}><IonIcon icon={arrowBackOutline} /></IonButton>
                    </IonButtons>
                    <IonTitle>{selectedPlantacao ? "Plantação" : "Adicionar Plantação"}</IonTitle>
                </IonToolbar>
                {selectedPlantacao && (
                    <IonToolbar style={{ "--background": "#FFF9E5" }}>
                        <IonSegment value={tab} onIonChange={e => setTab(e.detail.value as "edit" | "details")}>
                            <IonSegmentButton value="details"><IonLabel>Detalhes</IonLabel></IonSegmentButton>
                            <IonSegmentButton value="edit"><IonLabel>Editar</IonLabel></IonSegmentButton>
                        </IonSegment>
                    </IonToolbar>
                )}
            </IonHeader>

            <IonContent style={{ "--background": "#FFF9E5" }}>
                {tab === "details" && selectedPlantacao ? (
                    <div style={{ padding: "20px" }}>
                        <IonCard style={{ "--background": "#FFF9E5", border: "1px solid #004030", borderRadius: "8px" }}>
                            <div style={{ padding: "16px" }}>
                                <h3 style={{ color: "#004030", marginBottom: "8px" }}>{selectedPlantacao.planta}</h3>
                                {selectedPlantacao.nome && <p style={{ color: "#004030", marginBottom: "16px" }}>Nome: {selectedPlantacao.nome}</p>}
                                <div ref={mapRef} style={{ height: "300px", width: "100%", borderRadius: "8px", overflow: "hidden" }}></div>
                            </div>
                        </IonCard>
                    </div>
                ) : (
                    <>
                        <IonList style={{ background: "#FFF9E5" }}>
                            <IonItem>
                                <IonInput label="Nome da Planta" labelPlacement="stacked" placeholder="Ex: Tomate, Milho..." value={plantacao.planta} onIonChange={e => setPlantacao(prev => ({ ...prev, planta: e.detail.value! }))} />
                            </IonItem>
                            <IonItem>
                                <IonInput label="Nome (Opcional)" labelPlacement="stacked" placeholder="Nome personalizado da plantação" value={plantacao.nome} onIonChange={e => setPlantacao(prev => ({ ...prev, nome: e.detail.value! }))} />
                            </IonItem>
                        </IonList>

                        <IonCard style={{ "--background": "#FFF9E5", border: "1px solid #004030", borderRadius: "8px", margin: "0" }}>
                            <div style={{ padding: "16px" }}>
                                <h4 style={{ color: "#004030", marginBottom: "10px" }}>Definir Área da Plantação</h4>
                                <p style={{ color: "#004030", fontSize: "14px", marginBottom: "15px" }}>Clique no mapa para adicionar pontos que definem a área da sua plantação. Cada ponto recebe um número sequencial único.</p>
                                <div ref={editMapRef} style={{ height: "300px", width: "100%", borderRadius: "8px", overflow: "hidden", border: "2px solid #004030", position: "relative", backgroundColor: "#f0f0f0", zIndex: 1 }}>
                                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#666", fontSize: "14px", zIndex: 1000 }}>Carregando mapa...</div>
                                </div>
                                <p style={{ color: "#004030", fontSize: "12px", marginTop: "10px", textAlign: "center" }}>
                                    Pontos adicionados: {pins.length} | Próximo: Ponto {nextPinNumber}
                                    {pins.length > 0 && (
                                        <IonButton
                                            fill="clear"
                                            size="small"
                                            onClick={() => {
                                                if (!editMapInstanceRef.current) return;

                                                console.log('=== CLEARING PINS AND POLYGON ONLY ===');

                                                // Remove all markers from the map
                                                markersRef.current.forEach(marker => {
                                                    editMapInstanceRef.current!.removeLayer(marker);
                                                });

                                                // Remove polylines
                                                polylinesRef.current.forEach(line => {
                                                    editMapInstanceRef.current!.removeLayer(line);
                                                });
                                                polylinesRef.current = [];

                                                // Remove polygon if it exists (though not used now)
                                                if (polygonRef.current) {
                                                    editMapInstanceRef.current!.removeLayer(polygonRef.current);
                                                    polygonRef.current = null;
                                                }

                                                // Clear all state
                                                setPins([]);
                                                setNextPinNumber(1);
                                                markersRef.current = [];

                                                console.log('=== PINS AND POLYGON CLEARED, MAP VIEW PRESERVED ===');
                                            }}
                                            style={{ "--color": "#dc3545", fontSize: "12px", marginLeft: "10px" }}
                                        >
                                            Limpar
                                        </IonButton>
                                    )}
                                </p>
                            </div>
                        </IonCard>

                        <IonButton
                            expand="block"
                            onClick={selectedPlantacao?._id ? handleEditPlantacao : handleSubmit}
                            style={{ "--background": "#004030", color: "#FFF9E5", margin: "20px" }}
                        >
                            {selectedPlantacao ? "Atualizar Plantação" : "Salvar Plantação"}
                        </IonButton>
                    </>
                )}
            </IonContent>

            <IonFooter>
                <IonToolbar style={{ "--background": "#DCD0A8", "--border-color": "#DCD0A8", "--min-height": "64px", "--padding": "6px 6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                        <IonButton fill="clear" routerLink="/mapa" style={{ flex: 1 }}><IonIcon icon={mapOutline} /><IonLabel>Mapa</IonLabel></IonButton>
                        <IonButton fill="clear" routerLink="/market" style={{ flex: 1 }}><IonIcon icon={cartOutline} /><IonLabel>Market</IonLabel></IonButton>
                        <IonButton fill="clear" routerLink="/lista" style={{ flex: 1 }}><IonIcon icon={listOutline} /><IonLabel>Lista</IonLabel></IonButton>
                        <IonButton fill="clear" routerLink="/veterinarios" style={{ flex: 1 }}><IonIcon icon={bandageOutline} /><IonLabel>Veterinária</IonLabel></IonButton>
                        <IonButton fill="clear" routerLink="/settings/conta" style={{ flex: 1 }}><IonIcon icon={personOutline} /><IonLabel>Perfil</IonLabel></IonButton>
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default AdicionarPlantacao;
