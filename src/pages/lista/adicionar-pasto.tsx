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
import { Box, Card, CardContent, TextField, Button, Typography, Checkbox, FormControlLabel, FormGroup } from "@mui/material";
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

interface Pasto {
    _id?: string;
    nome: string;
    animais_ids?: string[];
    pontosx?: number[];
    pontosy?: number[];
}

interface Animal {
    _id?: string;
    nome: string;
    raca?: string;
    idade?: number;
}

const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

L.Marker.prototype.options.icon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const AdicionarPasto: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const { id } = useParams<{ id?: string }>();

    const distance = (a: L.LatLng, b: L.LatLng) => a.distanceTo(b);

    const cross = (o: L.LatLng, a: L.LatLng, b: L.LatLng) => (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);

    const convexHull = (points: L.LatLng[]) => {
        if (points.length <= 1) return points;
        points = points.slice().sort((a, b) => a.lng - b.lng || a.lat - b.lat);
        const hull: L.LatLng[] = [];
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
        let x = point.lng;
        let y = point.lat;
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            let xi = polygon[i].lng, yi = polygon[i].lat;
            let xj = polygon[j].lng, yj = polygon[j].lat;

            const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }

        return inside;
    };

    const [pasto, setPasto] = useState<Partial<Pasto>>({
        nome: "",
        animais_ids: [],
        pontosx: [],
        pontosy: []
    });
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
    const [tab, setTab] = useState<"edit" | "details">("edit");
    const [selectedPasto, setSelectedPasto] = useState<Pasto | null>(null);
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

    useEffect(() => {
        if (id) {
            fetchPasto(id);
        }
        fetchAnimais();
    }, [id]);

    const fetchAnimais = async () => {
        try {
            const token = getToken();
            if (!token) throw new Error("Não autenticado");
            const decoded: DecodedToken = jwtDecode(token);
            const userId = decoded.user_id;

            const response = await axios.get(`${API_BASE}/animais/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const payload = response.data;
            const data = Array.isArray(payload)
                ? payload
                : Array.isArray(payload.data)
                    ? payload.data
                    : payload.data
                        ? payload.data
                        : [payload];
            setAnimals(data);
        } catch (err: any) {
            console.error("Erro ao carregar animais:", err);
            setAnimals([]);
        }
    };

    const toggleAnimalSelection = (animalId: string) => {
        setSelectedAnimalIds(prev => prev.includes(animalId)
            ? prev.filter(id => id !== animalId)
            : [...prev, animalId]
        );
    };

    const fetchPasto = async (pastoId: string) => {
        setLoading(true);
        try {
            const token = getToken();
            if (!token) throw new Error("Não autenticado");
            const decoded: DecodedToken = jwtDecode(token);
            const userId = decoded.user_id;

            const response = await axios.get(`${API_BASE}/pastos/${pastoId}?user_id=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const fetched = response.data;
            setSelectedPasto(fetched);
            setPasto({
                nome: fetched.nome || "",
                animais_ids: fetched.animais_ids || [],
                pontosx: fetched.pontosx || [],
                pontosy: fetched.pontosy || []
            });
            setSelectedAnimalIds(fetched.animais_ids || []);
            setTab("details");
        } catch (err: any) {
            console.error("Erro ao buscar pasto:", err);
            alert(err?.response?.data?.message || err.message || "Erro ao carregar pasto");
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
        if (tab === "details" && selectedPasto) {
            setTimeout(() => createPastoMap(), 100);
        }
    }, [tab, selectedPasto]);

    useEffect(() => {
        if (tab === "edit" && editMapRef.current) {
            initializeEditMap();
        }
    }, [tab]);

    useEffect(() => {
        if (pins.length >= 3) {
            updatePolygon(pins);
        } else {
            // Se menos de 3 pontos, remover polígono e linhas
            if (editMapInstanceRef.current && polygonRef.current) {
                editMapInstanceRef.current.removeLayer(polygonRef.current);
                polygonRef.current = null;
            }
            polylinesRef.current.forEach(line => editMapInstanceRef.current?.removeLayer(line));
            polylinesRef.current = [];
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

        if (selectedPasto?.pontosx && selectedPasto?.pontosy) {
            const px = selectedPasto.pontosx;
            const py = selectedPasto.pontosy;
            const coords: L.LatLng[] = [];

            for (let i = 0; i < Math.min(px.length, py.length); i++) {
                const lat = Number(px[i]);
                const lng = Number(py[i]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    const coord = L.latLng(lat, lng);
                    coords.push(coord);
                    
                    const marker = L.marker(coord).addTo(map);
                    markersRef.current.push(marker);
                    
                    const pinId = `existing_${i}`;
                    const newPin = { id: pinId, marker, number: i + 1, latlng: coord };
                    setPins(prev => [...prev, newPin]);
                    
                    // Adicionar popup com botão de delete ao marker
                    const deleteButton = document.createElement('button');
                    deleteButton.innerHTML = '🗑️';
                    deleteButton.style.cssText = 'background-color: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 16px;';
                    deleteButton.onclick = () => {
                        if (editMapInstanceRef.current) {
                            editMapInstanceRef.current.removeLayer(marker);
                        }
                        markersRef.current = markersRef.current.filter(m => m !== marker);
                        setPins(prev => prev.filter(p => p.id !== pinId));
                        marker.closePopup();
                    };
                    
                    marker.bindPopup(deleteButton);
                }
            }

            if (coords.length > 0) {
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

        const pinId = crypto.randomUUID();
        
        const newPin = {
            id: pinId,
            marker,
            number: pins.length + 1,
            latlng
        };

        setPins(prev => [...prev, newPin]);
        
        // Adicionar popup com botão de delete ao marker
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '🗑️';
        deleteButton.style.cssText = 'background-color: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 16px;';
        deleteButton.onclick = () => {
            if (editMapInstanceRef.current) {
                editMapInstanceRef.current.removeLayer(marker);
            }
            markersRef.current = markersRef.current.filter(m => m !== marker);
            setPins(prev => prev.filter(p => p.id !== pinId));
            marker.closePopup();
        };
        
        marker.bindPopup(deleteButton);
    };

    const updatePolygon = (currentPins: typeof pins) => {
        if (!editMapInstanceRef.current) return;
        if (currentPins.length < 3) return;

        polylinesRef.current.forEach(line => editMapInstanceRef.current!.removeLayer(line));
        polylinesRef.current = [];

        if (polygonRef.current) {
            editMapInstanceRef.current.removeLayer(polygonRef.current);
            polygonRef.current = null;
        }

        const hull = convexHull(currentPins.map(p => p.latlng));
        const tempPolygon = L.polygon(hull);

        const validPins: typeof pins = [];
        currentPins.forEach(pin => {
            const isHullVertex = hull.some(h => h.equals(pin.latlng));
            const isInside = isPointInPolygon(pin.latlng, hull);
            if (isHullVertex || !isInside) {
                validPins.push(pin);
            } else {
                editMapInstanceRef.current!.removeLayer(pin.marker);
                markersRef.current = markersRef.current.filter(m => m !== pin.marker);
            }
        });

        if (validPins.length !== currentPins.length) {
            setPins(validPins);
            return;
        }

        polygonRef.current = L.polygon(hull, {
            color: "#4A9782",
            weight: 2,
            fillOpacity: 0.15
        }).addTo(editMapInstanceRef.current);

        for (let i = 0; i < hull.length; i++) {
            const a = hull[i];
            const b = hull[(i + 1) % hull.length];
            const line = L.polyline([a, b], { color: "#4A9782", weight: 2 }).addTo(editMapInstanceRef.current);
            polylinesRef.current.push(line);
        }
    };

    const createPastoMap = () => {
        if (!mapRef.current || !selectedPasto) return;

        if (mapInstanceRef.current) try { mapInstanceRef.current.remove(); } catch { }
        mapRef.current.innerHTML = "";

        const map = L.map(mapRef.current, { center: [0, 0], zoom: 13, attributionControl: true, zoomControl: true });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);

        const px = selectedPasto.pontosx || [];
        const py = selectedPasto.pontosy || [];
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
            if (coords.length >= 3) {
                L.polygon(coords, { color: "#4A9782", weight: 1, fillOpacity: 0.04, opacity: 0.5 }).addTo(map);
            }
            map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
        } else {
            map.setView([0, 0], 2);
        }

        setTimeout(() => map.invalidateSize(), 200);
    };

    const getToken = () => {
        const match = document.cookie.match(/(^| )auth=([^;]+)/);
        return match ? match[2] : localStorage.getItem("authToken");
    };

    const handleEditPasto = async () => {
        try {
            const token = getToken();
            if (!token) throw new Error("Não autenticado");
            const decoded: DecodedToken = jwtDecode(token);
            const userId = decoded.user_id;
            if (!selectedPasto?._id) throw new Error("Pasto não selecionado para editar");
            if (!pasto.nome) { alert("Por favor preencha o nome do pasto"); return; }
            if (pins.length < 3) { alert("São necessários pelo menos 3 pontos"); return; }

            const pontosx = pins.map(pin => pin.latlng.lat);
            const pontosy = pins.map(pin => pin.latlng.lng);
            const animais_ids = selectedAnimalIds;

            const payload = {
                id: selectedPasto._id,
                nome: pasto.nome,
                pontosx,
                pontosy,
                animais_ids,
                user_id: userId
            };

            const response = await axios.post(`${API_BASE}/pastos/edit`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                alert("Pasto editado com sucesso!");
                history.goBack();
            } else {
                alert(response.data.message || "Erro ao editar pasto");
            }
        } catch (err: any) {
            console.error("Erro ao editar pasto:", err);
            alert(err?.response?.data?.message || err.message || "Erro desconhecido");
        }
    };

    const handleSubmit = async () => {
        try {
            const token = getToken();
            if (!token) throw new Error("Não autenticado");
            const decoded: DecodedToken = jwtDecode(token);
            const userId = decoded.user_id;

            if (!pasto.nome) { alert("Por favor preencha o nome do pasto"); return; }
            if (pins.length === 0 && !selectedPasto) { alert("Por favor adicione pelo menos 3 pontos no mapa"); return; }
            if (pins.length < 3) { alert("São necessários pelo menos 3 pontos"); return; }

            const pontosx = pins.map(pin => pin.latlng.lat);
            const pontosy = pins.map(pin => pin.latlng.lng);
            const animais_ids = selectedAnimalIds;

            const pastoData = {
                nome: pasto.nome,
                pontosx,
                pontosy,
                animais_ids,
                dono_id: userId
            };

            if (selectedPasto?._id) {
                await axios.post(`${API_BASE}/pastos/edit`, { id: selectedPasto._id, ...pastoData }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Pasto atualizado com sucesso!");
            } else {
                await axios.post(`${API_BASE}/pastos`, pastoData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Pasto adicionado com sucesso!");
            }
            history.goBack();
        } catch (err: any) {
            console.error("Erro ao salvar pasto:", err);
            alert(err?.response?.data?.message || "Erro ao salvar pasto");
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar style={{ "--background": "#FFF9E5", "--color": "#004030" }}>
                    <IonButtons slot="start">
                        <IonButton onClick={() => history.goBack()}><IonIcon icon={arrowBackOutline} /></IonButton>
                    </IonButtons>
                    <IonTitle>{selectedPasto ? "Pasto" : "Adicionar Pasto"}</IonTitle>
                </IonToolbar>
                {selectedPasto && (
                    <IonToolbar style={{ "--background": "#FFF9E5" }}>
                        <IonSegment value={tab} onIonChange={e => setTab(e.detail.value as "edit" | "details")}> 
                            <IonSegmentButton value="details"><IonLabel>Detalhes</IonLabel></IonSegmentButton>
                            <IonSegmentButton value="edit"><IonLabel>Editar</IonLabel></IonSegmentButton>
                        </IonSegment>
                    </IonToolbar>
                )}
            </IonHeader>

            <IonContent style={{ "--background": "#FFF9E5" }}>
                {tab === "details" && selectedPasto ? (
                    <Box sx={{ px: 2, py: 3, display: 'flex', justifyContent: 'center' }}>
                        <Card sx={{ width: '100%', maxWidth: 760, borderRadius: 3, bgcolor: '#FFFDF6', boxShadow: '0 18px 46px rgba(0,0,0,0.08)' }}>
                            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                                <Typography variant="h5" component="h2" sx={{ color: '#004030', fontWeight: 700, mb: 1 }}>
                                    {selectedPasto.nome}
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#4A5732', mb: 1 }}>
                                    {selectedPasto.animais_ids?.length ? `${selectedPasto.animais_ids.length} animal(is) associado(s)` : 'Nenhum animal associado'}
                                </Typography>
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
                                    {selectedPasto ? 'Editar Pasto' : 'Adicionar Pasto'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#4A5732' }}>
                                    Informe o nome do pasto, adicione IDs dos animais e marque os pontos no mapa para definir a área.
                                </Typography>
                                <TextField
                                    label="Nome do Pasto"
                                    variant="filled"
                                    fullWidth
                                    value={pasto.nome}
                                    onChange={e => setPasto(prev => ({ ...prev, nome: e.target.value }))}
                                    sx={{ '& .MuiFilledInput-root': { bgcolor: '#FFF9E5' } }}
                                />
                                <Card sx={{ bgcolor: '#F6F0D1', borderRadius: 2, border: '1px solid #D7C499' }}>
                                    <CardContent sx={{ p: 2, mb: 2 }}>
                                        <Typography variant="subtitle1" sx={{ color: '#004030', fontWeight: 700, mb: 1 }}>
                                            Animais do usuário
                                        </Typography>
                                        {animals.length > 0 ? (
                                            <FormGroup>
                                                {animals.map(animal => (
                                                    <FormControlLabel
                                                        key={animal._id}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedAnimalIds.includes(animal._id || '')}
                                                                onChange={() => animal._id && toggleAnimalSelection(animal._id)}
                                                                sx={{ color: '#004030', '&.Mui-checked': { color: '#004030' } }}
                                                            />
                                                        }
                                                        label={`${animal.nome}${animal.raca ? ` • ${animal.raca}` : ''}${animal.idade !== undefined ? ` • ${animal.idade} anos` : ''}`}
                                                    />
                                                ))}
                                            </FormGroup>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: '#4A5732' }}>
                                                Carregando animais ou nenhum animal encontrado.
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card sx={{ bgcolor: '#F6F0D1', borderRadius: 2, border: '1px solid #D7C499' }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" sx={{ color: '#004030', fontWeight: 700, mb: 1 }}>
                                            Definir área do pasto
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#4A5732', mb: 2 }}>
                                            Clique no mapa para adicionar pontos que delimitam a área do pasto. Cada ponto será numerado sequencialmente.
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
                                    onClick={selectedPasto?._id ? handleEditPasto : handleSubmit}
                                    sx={{ mt: 1, bgcolor: '#004030', color: '#FFF9E5', '&:hover': { bgcolor: '#3A8772' } }}
                                >
                                    {selectedPasto ? 'Atualizar Pasto' : 'Salvar Pasto'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </IonContent>
        </IonPage>
    );
};

export default AdicionarPasto;
