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
    IonTitle,
    IonSegment,
    IonSegmentButton,
    IonLabel
} from "@ionic/react";
import { Box, Card, CardContent, TextField, Button, Typography } from "@mui/material";
import { arrowBackOutline } from "ionicons/icons";
import { useHistory, useLocation, useParams } from "react-router-dom";
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
    const { id } = useParams<{ id?: string }>();

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
    const [loading, setLoading] = useState(false);

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
        if (id) {
            fetchPlantacao(id);
        }
    }, [id]);

    const fetchPlantacao = async (plantId: string) => {
        setLoading(true);
        try {
            const token = getToken();
            if (!token) throw new Error("Não autenticado");

            const response = await axios.get(`${API_BASE}/plantacoes/${plantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const plant = response.data;
            setSelectedPlantacao(plant);
            setPlantacao({
                planta: plant.planta,
                nome: plant.nome || "",
                pontosx: plant.pontosx || [],
                pontosy: plant.pontosy || []
            });
            setTab("details");
        } catch (err: any) {
            console.error("Erro ao buscar plantação:", err);
            alert(err?.response?.data?.message || err.message || "Erro ao carregar plantação");
        } finally {
            setLoading(false);
        }
    };

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
                const editData = {
                    id: selectedPlantacao._id,
                    nome: plantacao.nome,
                    planta: plantacao.planta,
                    pontosx,
                    pontosy
                };
                await axios.post(`${API_BASE}/editplantacoes`, editData, { headers: { Authorization: `Bearer ${token}` } });
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
                    <Box sx={{ px: 2, py: 3, display: 'flex', justifyContent: 'center' }}>
                        <Card sx={{ width: '100%', maxWidth: 760, borderRadius: 3, bgcolor: '#FFFDF6', boxShadow: '0 18px 46px rgba(0,0,0,0.08)' }}>
                            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                                <Typography variant="h5" component="h2" sx={{ color: '#004030', fontWeight: 700, mb: 1 }}>
                                    {selectedPlantacao.planta}
                                </Typography>
                                {selectedPlantacao.nome && (
                                    <Typography variant="body1" sx={{ color: '#4A5732', mb: 2 }}>
                                        Nome: {selectedPlantacao.nome}
                                    </Typography>
                                )}
                                <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #DCD0A8' }}>
                                    <div ref={mapRef} style={{ height: '320px', width: '100%' }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                ) : (
                    <Box sx={{ px: 2, py: 3, display: 'flex', justifyContent: 'center' }}>
                        <Card sx={{ width: '100%', maxWidth: 760, borderRadius: 3, bgcolor: '#FFFDF6', boxShadow: '0 18px 46px rgba(0,0,0,0.08)' }}>
                            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'grid', gap: 2 }}>
                                <Typography variant="h5" component="h2" sx={{ color: '#004030', fontWeight: 700 }}>
                                    {selectedPlantacao ? 'Editar Plantação' : 'Adicionar Plantação'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#4A5732' }}>
                                    Informe o nome da planta e marque os pontos no mapa para definir sua área.
                                </Typography>
                                <TextField
                                    label="Nome da Planta"
                                    variant="filled"
                                    fullWidth
                                    value={plantacao.planta}
                                    onChange={e => setPlantacao(prev => ({ ...prev, planta: e.target.value }))}
                                    sx={{ '& .MuiFilledInput-root': { bgcolor: '#FFF9E5' } }}
                                />
                                <TextField
                                    label="Nome (Opcional)"
                                    variant="filled"
                                    fullWidth
                                    value={plantacao.nome}
                                    onChange={e => setPlantacao(prev => ({ ...prev, nome: e.target.value }))}
                                    sx={{ '& .MuiFilledInput-root': { bgcolor: '#FFF9E5' } }}
                                />

                                <Card sx={{ bgcolor: '#F6F0D1', borderRadius: 2, border: '1px solid #D7C499' }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" sx={{ color: '#004030', fontWeight: 700, mb: 1 }}>
                                            Definir área da plantação
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#4A5732', mb: 2 }}>
                                            Clique no mapa para adicionar pontos que delimitam a área. Cada ponto será numerado sequencialmente.
                                        </Typography>
                                        <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '2px solid #004030', position: 'relative', bgcolor: '#f7f2e4' }}>
                                            <div ref={editMapRef} style={{ height: '320px', width: '100%' }} />
                                            <Box sx={{ position: 'absolute', top: 0, left: 0, p: 1, color: '#004030', fontSize: 13 }}>
                                                Pontos adicionados: {pins.length} | Próximo: Ponto {nextPinNumber}
                                            </Box>
                                        </Box>
                                        {pins.length > 0 && (
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => {
                                                    if (!editMapInstanceRef.current) return;
                                                    markersRef.current.forEach(marker => editMapInstanceRef.current!.removeLayer(marker));
                                                    polylinesRef.current.forEach(line => editMapInstanceRef.current!.removeLayer(line));
                                                    polylinesRef.current = [];
                                                    if (polygonRef.current) {
                                                        editMapInstanceRef.current!.removeLayer(polygonRef.current);
                                                        polygonRef.current = null;
                                                    }
                                                    setPins([]);
                                                    setNextPinNumber(1);
                                                    markersRef.current = [];
                                                }}
                                                sx={{ mt: 2 }}
                                            >
                                                Limpar pontos
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={selectedPlantacao?._id ? handleEditPlantacao : handleSubmit}
                                    sx={{ mt: 1, bgcolor: '#004030', color: '#FFF9E5', '&:hover': { bgcolor: '#3A8772' } }}
                                >
                                    {selectedPlantacao ? 'Atualizar Plantação' : 'Salvar Plantação'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </IonContent>
        </IonPage>
    );
};

export default AdicionarPlantacao;
