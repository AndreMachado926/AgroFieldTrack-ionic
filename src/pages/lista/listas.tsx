import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import logo from "../lista/logo.png";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonContent,
  IonCard,
  IonItem,
  IonAvatar,
  IonNote,
  IonFooter,
  IonTabBar,
  IonTabButton,
  IonModal,
  IonInput,
  IonTitle,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonDatetime,
  IonTextarea
} from "@ionic/react";
import {
  settingsOutline,
  pawOutline,
  mapOutline,
  cartOutline,
  listOutline,
  sparklesOutline,
  personOutline,
  leafOutline,
  addOutline,
  bandageOutline
} from "ionicons/icons";
import * as jwtDecode from "jwt-decode";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

interface DecodedToken {
  user_id: string;
}

type Animal = {
  _id?: string;
  id?: string;
  nome: string;
  idade: number;
  localizacaoX?: number;
  localizacaoY?: number;
  dono_id?: string;
  tipo?: string;
  raca?: string;
  locationHistory?: Array<{
    x: number;
    y: number;
    at: string;
  }>;
};

type Plantacao = {
  _id?: string;
  id?: string;
  planta: string;
  // pontos do polígono: arrays de latitude (pontosx) e longitude (pontosy)
  pontosx?: number[] | null;
  pontosy?: number[] | null;
  // localização pontual (legacy) — deixamos explícito que pode ser null
  localizacaoX?: number | null;
  localizacaoY?: number | null;
  dono_id?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

// Add type for Remedio (if not already defined)
interface Remedio {
  _id: string;
  nome: string;
  animal_id: string;
  data: string;
  observacoes?: string;
}

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const AnimaisPage: React.FC = () => {
  const [segment, setSegment] = useState("animais");
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [plantacoes, setPlantacoes] = useState<Plantacao[]>([]);
  // plantacao modal + mapa
  const [selectedPlantacao, setSelectedPlantacao] = useState<Plantacao | null>(null);
  const [showPlantacaoModal, setShowPlantacaoModal] = useState(false);
  const [plantacaoModalTab, setPlantacaoModalTab] = useState<'info' | 'mapa'>('info');
  const mapRefPlant = useRef<HTMLDivElement | null>(null);
  const mapInstanceRefPlant = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newAnimal, setNewAnimal] = useState<Partial<Animal>>({});
  const [newPlantacao, setNewPlantacao] = useState<Partial<Plantacao>>({});
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  // guarda a instância do leaflet para poder remover/recriar sem erro
  const mapInstanceRef = useRef<L.Map | null>(null);
  // helpers seguros para formatar/parsear YYYY-MM-DD
  const formatYMD = (d: Date) => d.toISOString().slice(0, 10);
  const parseYMD = (s: string | null) => {
    if (!s) return null;
    // adiciona horário para evitar parsing ambíguo em alguns navegadores
    const d = new Date(`${s}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  };

  // filtro por data (yyyy-mm-dd) e lista filtrada usada pelo mapa
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filteredLocations, setFilteredLocations] = useState<Animal["locationHistory"]>([]);

  // modal tabs: 'info' | 'mapa' | 'remedios' (inicia em 'info')
  const [modalTab, setModalTab] = useState<'info' | 'mapa' | 'remedios'>('info');

  const API_BASE = ("http://localhost:8000").replace(/\/+$/, '');

  // helper: ler token do cookie e decodificar payload JWT
  const getTokenFromCookie = (name = 'jwt'): string | null => {
    const match = document.cookie.split('; ').find(c => c.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  };

  // lê o cookie "auth" e tenta extrair o token JWT (suporta formatos: token directo, "name=token" ou JSON)
  const getJwtFromAuthCookie = (): string | null => {
    const raw = document.cookie.split(';').map(s => s.trim()).find(c => c.startsWith('auth='));
    if (!raw) return null;
    const val = decodeURIComponent(raw.substring(5)); // remove "auth="
    const jwtMatch = val.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
    if (jwtMatch && jwtMatch[0]) return jwtMatch[0];
    if (val.split('.').length === 3) return val;
    return null;
  };

  // tenta obter userId do cookie (cliente) ou do servidor (/me)
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

  const fetchAnimais = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await getUserIdFromCookieOrServer();
      if (!userId) throw new Error('User ID não encontrado (auth cookie httpOnly ou ausente)');
      const res = await axios.get(`${API_BASE}/animais/${userId}`, { withCredentials: true });
      const payload = res.data;
      const data = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : (payload.data ?? payload));
      setAnimais(data);
    } catch (err: any) {
      console.error("Fetch animais erro:", err);
      const msg = err?.response?.data?.message || err.message || "Erro ao obter animais";
      setError(msg);
      setAnimais([]);
      if (err?.response?.status === 401) window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      // usa o mesmo fallback (cookie decode ou /me) para obter userId
      const userId = await getUserIdFromCookieOrServer();
      if (!userId) throw new Error('User ID não encontrado (auth cookie httpOnly ou ausente)');
      const res = await axios.get(`${API_BASE}/plantacoes/${userId}`, { withCredentials: true });
      const payload = res.data;
      const data = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : (payload.data ?? payload));
      setPlantacoes(data);
    } catch (err: any) {
      console.error("Fetch plantações erro:", err);
      const msg = err?.response?.data?.message || err.message || "Erro ao obter plantações";
      setError(msg);
      setPlantacoes([]);
      if (err?.response?.status === 401) window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  // Add state for remedios
  const [remedios, setRemedios] = useState<Remedio[]>([]);
  const [loadingRemedios, setLoadingRemedios] = useState(false);
  const [remediosError, setRemediosError] = useState<string | null>(null);

  // Function to fetch remedios for selected animal
  const fetchRemediosDoAnimal = async (animalId: string) => {
    setLoadingRemedios(true);
    setRemediosError(null);
    try {
      const res = await axios.get(`${API_BASE}/remedios/animal/${animalId}`, {
        withCredentials: true
      });
      const payload = res.data;
      setRemedios(payload.data || []);
    } catch (err: any) {
      console.error('Erro ao buscar remédios:', err);
      setRemediosError(err?.response?.data?.message || 'Erro ao carregar remédios');
      setRemedios([]);
    } finally {
      setLoadingRemedios(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // obtém userId usando o helper (tenta cookie -> /me)
      const userId = await getUserIdFromCookieOrServer();
      if (!userId) throw new Error('User ID não encontrado (auth cookie httpOnly ou ausente)');

      if (segment === 'animais') {
        const animalData = {
          ...newAnimal,
          localizacaoX: 0,
          localizacaoY: 0,
          dono_id: userId
        };

        if (!animalData.nome || animalData.idade === undefined || !animalData.raca) {
          alert('Por favor preencha todos os campos');
          return;
        }

        await axios.post(`${API_BASE}/animais`, animalData, { withCredentials: true });
        await fetchAnimais();
        setShowModal(false);
        setNewAnimal({});
      } else {
        const plantacaoData = {
          ...newPlantacao,
          localizacaoX: 0,
          localizacaoY: 0,
          dono_id: userId
        };

        if (!plantacaoData.planta) {
          alert('Por favor preencha o nome da planta');
          return;
        }

        await axios.post(`${API_BASE}/plantacoes`, plantacaoData, { withCredentials: true });
        await fetchPlantacoes();
        setShowModal(false);
        setNewPlantacao({});
      }
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      if ((err?.message || '').toLowerCase().includes('user id') || (err?.message || '').toLowerCase().includes('token')) {
        window.location.href = '/login';
      } else {
        alert(err?.response?.data?.message || err.message || 'Erro ao salvar');
      }
    }
  };

  const handleAnimalClick = (animal: Animal) => {
    setSelectedAnimal(animal);
    setShowLocationModal(true);
  };

  const handlePlantacaoClick = (plant: Plantacao) => {
    setSelectedPlantacao(plant);
    setPlantacaoModalTab('info');
    setShowPlantacaoModal(true);
  };

  const createMap = () => {
    try {
      if (!mapRef.current || !selectedAnimal) return;

      // remove instância anterior se existir (evita "Map container is already initialized")
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) { console.warn('failed removing previous map', e); }
        mapInstanceRef.current = null;
      }

      // garante container limpo
      mapRef.current.innerHTML = '';

      const map = L.map(mapRef.current, {
        center: [selectedAnimal.localizacaoX || 0, selectedAnimal.localizacaoY || 0],
        zoom: 13,
        attributionControl: true,
        zoomControl: true
      });
      // guarda instância
      mapInstanceRef.current = map;

      map.invalidateSize();

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // sempre mostra o marker da posição atual (visível mesmo com filtro de dia)
      const currentIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: #4A9782;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            font-size: 12px;
          ">
            Atual
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      L.marker([selectedAnimal.localizacaoX || 0, selectedAnimal.localizacaoY || 0], { icon: currentIcon })
        .addTo(map)
        .bindPopup(`${selectedAnimal.nome} está aqui agora`);

      // history: se há um filtro de dia (filterDate !== null) usa filteredLocations (mesmo que seja []),
      // caso contrário usa todo o histórico.
      const history = (filterDate !== null) ? (filteredLocations ?? []) : (selectedAnimal.locationHistory ?? []);

      // sort (opcional) por timestamp asc
      const historySorted = [...history].sort((a,b) => new Date(a.at).getTime() - new Date(b.at).getTime());

      const points: L.LatLngExpression[] = [];
      // se não estamos a filtrar por dia podemos incluir a posição atual como primeiro ponto da linha
      if (!filterDate && selectedAnimal.localizacaoX !== undefined && selectedAnimal.localizacaoY !== undefined) {
        points.push([selectedAnimal.localizacaoX, selectedAnimal.localizacaoY]);
      }

      if (historySorted.length) {
        historySorted.forEach((location, index) => {
          const point: L.LatLngExpression = [location.x, location.y];
          points.push(point);

          // Create numbered marker icon (index+1 corresponds to order in filtered history)
          const sequenceIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div style="
                background-color: #004030;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                font-size: 12px;
              ">
                ${index + 1}
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          L.marker(point, { icon: sequenceIcon })
            .addTo(map)
            .bindPopup(`Localização ${index + 1}: ${new Date(location.at).toLocaleString()}`);
        });

        // Connect points with line and fit bounds
        if (points.length > 0) {
          L.polyline(points, {
            color: '#4A9782',
            weight: 3,
            opacity: 0.8,
            dashArray: '10, 10'
          }).addTo(map);
          map.fitBounds(L.latLngBounds(points), { padding: [40,40] });
        }
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    } catch (err) {
      console.error('createMap error', err);
    }
  };

  const createPlantacaoMap = () => {
    try {
      if (!mapRefPlant.current || !selectedPlantacao) return;

      // remove instância anterior se existir
      if (mapInstanceRefPlant.current) {
        try { mapInstanceRefPlant.current.remove(); } catch (e) { /* ignore */ }
        mapInstanceRefPlant.current = null;
      }
      mapRefPlant.current.innerHTML = '';

      const map = L.map(mapRefPlant.current, {
        center: [0, 0],
        zoom: 13,
        attributionControl: true,
        zoomControl: true
      });
      mapInstanceRefPlant.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Construir coordenadas a partir de pontosx/pontosy
      const px = selectedPlantacao.pontosx || [];
      const py = selectedPlantacao.pontosy || [];
      const coords: L.LatLngExpression[] = [];

      if (Array.isArray(px) && Array.isArray(py) && px.length && py.length) {
        const len = Math.min(px.length, py.length);
        for (let i = 0; i < len; i++) {
          const lat = Number(px[i]);
          const lng = Number(py[i]);
          if (!isNaN(lat) && !isNaN(lng)) coords.push([lat, lng]);
        }
      }

      // Se houver coords suficientes, desenha polígono e ajusta bounds
      if (coords.length >= 3) {
        const polygon = L.polygon(coords, {
          color: '#4A9782',
          weight: 3,
          opacity: 0.8,
          fillColor: '#4A9782',
          fillOpacity: 0.15
        }).addTo(map);
        map.fitBounds(polygon.getBounds(), { padding: [40, 40] });
      } else if (coords.length > 0) {
        // se apenas um ou dois pontos -> marca e centra
        const marker = L.marker(coords[0], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background:#4A9782;color:#fff;padding:6px 8px;border-radius:6px;font-weight:600">${selectedPlantacao.planta}</div>`,
            iconSize: [80, 30],
            iconAnchor: [40, 15]
          })
        }).addTo(map);
        map.setView(coords[0] as L.LatLngExpression, 13);
      } else if (typeof selectedPlantacao.localizacaoX === 'number' && typeof selectedPlantacao.localizacaoY === 'number') {
        // fallback legacy localizacaoX/Y
        const pt: L.LatLngExpression = [selectedPlantacao.localizacaoX, selectedPlantacao.localizacaoY];
        L.marker(pt, {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background:#4A9782;color:#fff;padding:6px 8px;border-radius:6px;font-weight:600">${selectedPlantacao.planta}</div>`,
            iconSize: [80, 30],
            iconAnchor: [40, 15]
          })
        }).addTo(map);
        map.setView(pt, 13);
      } else {
        // nada para mostrar
        map.setView([0, 0], 2);
      }

      setTimeout(() => map.invalidateSize(), 200);
    } catch (err) {
      console.error('createPlantacaoMap error', err);
    }
  };

  // helper para formatar coordenadas
  const formatCoord = (v?: number | null) => (typeof v === 'number' ? v.toFixed(6) : '—');

  // helper para centroid (retorna [lat,lng] ou null)
  const centroidFromPoints = (px?: number[] | null, py?: number[] | null): [number, number] | null => {
    if (!px || !py) return null;
    const len = Math.min(px.length, py.length);
    if (len === 0) return null;
    let sx = 0, sy = 0;
    for (let i = 0; i < len; i++) {
      const x = Number(px[i]);
      const y = Number(py[i]);
      if (isNaN(x) || isNaN(y)) continue;
      sx += x; sy += y;
    }
    const count = len;
    return count > 0 ? [sx / count, sy / count] : null;
  };

  // recalcula filteredLocations quando seleciona animal ou altera data
  useEffect(() => {
    if (!selectedAnimal) {
      setFilteredLocations([]);
      return;
    }

    // sem filtro -> mostra todo o histórico
    if (!filterDate) {
      setFilteredLocations(selectedAnimal.locationHistory ?? []);
      return;
    }

    // parse seguro da data selecionada e intervalo do dia
    const parsed = parseYMD(filterDate);
    if (!parsed) {
      setFilteredLocations([]);
      return;
    }
    const start = new Date(parsed);
    start.setHours(0,0,0,0);
    const end = new Date(parsed);
    end.setHours(23,59,59,999);

    const filtered = (selectedAnimal.locationHistory ?? []).filter(loc => {
      const t = new Date(loc.at);
      if (isNaN(t.getTime())) return false;
      return t.getTime() >= start.getTime() && t.getTime() <= end.getTime();
    });
    setFilteredLocations(filtered);
  }, [selectedAnimal, filterDate]);

  // recria mapa quando modal abre, animal muda, lista filtrada muda ou troca para a tab 'mapa'
  useEffect(() => {
    if (showLocationModal && selectedAnimal && modalTab === 'mapa') {
      createMap();
    }
  }, [showLocationModal, selectedAnimal, filteredLocations, modalTab]);

  useEffect(() => {
    if (segment === "animais") {
      fetchAnimais();
    } else if (segment === "plantacoes") {
      fetchPlantacoes();
    }
  }, [segment]);

  // Add useEffect to load remedios when animal selected and tab is 'remedios'
  useEffect(() => {
    if (selectedAnimal?._id && modalTab === 'remedios') {
      fetchRemediosDoAnimal(selectedAnimal._id);
    }
  }, [selectedAnimal?._id, modalTab]);

  // Update the Info tab content in modal
  {
    modalTab === 'info' && (
      <div style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>{selectedAnimal?.nome}</h3>
        <p><strong>Raça:</strong> {selectedAnimal?.raca ?? '—'}</p>
        <p><strong>Idade:</strong> {selectedAnimal?.idade ?? '—'} anos</p>
        <p style={{ marginTop: 8, color: '#444' }}>
          {selectedAnimal ? `Última posição: ${selectedAnimal.localizacaoX ?? '—'}, ${selectedAnimal.localizacaoY ?? '—'}` : ''}
        </p>
      </div>
    )
  }

  // Update the remedios tab content in the modal
  {
    modalTab === 'remedios' && (
      <div style={{ padding: 12 }}>
        <h4 style={{ marginTop: 0, color: '#004030' }}>Remédios / Vacinas</h4>

        {loadingRemedios && (
          <p style={{ color: '#666' }}>Carregando remédios...</p>
        )}

        {remediosError && (
          <p style={{ color: 'crimson' }}>{remediosError}</p>
        )}

        {!loadingRemedios && !remediosError && remedios.length === 0 && (
          <p style={{ color: '#666' }}>Nenhum remédio registrado.</p>
        )}

        {remedios.map(remedio => (
          <IonCard key={remedio._id} style={{
            backgroundColor: "#DCD0A8",
            borderRadius: "12px",
            margin: "8px 0",
            padding: "12px"
          }}>
            <h5 style={{ margin: 0, color: '#004030' }}>{remedio.nome}</h5>
            <p style={{ margin: "4px 0", fontSize: '14px', color: '#004030' }}>
              Data: {new Date(remedio.data).toLocaleDateString()}
            </p>
            {remedio.observacoes && (
              <p style={{ margin: "4px 0", fontSize: '13px', color: '#004030b0' }}>
                {remedio.observacoes}
              </p>
            )}
          </IonCard>
        ))}

        <IonButton
          expand="block"
          onClick={() => setShowAddRemedioModal(true)}
          style={{ marginTop: 16 }}
        >
          Adicionar Remédio
        </IonButton>
      </div>
    )
  }

  // Add new state for the add remedio modal
  const [showAddRemedioModal, setShowAddRemedioModal] = useState(false);
  const [newRemedio, setNewRemedio] = useState({
    nome: '',
    observacoes: ''
  });

  // Add function to handle remedio creation
  const handleCreateRemedio = async () => {
    try {
      if (!selectedAnimal?._id) return;

      const payload = {
        ...newRemedio,
        animal_id: selectedAnimal._id
      };

      await axios.post(`${API_BASE}/remedios`, payload, {
        withCredentials: true
      });

      // Reset form and close modal
      setNewRemedio({
        nome: '',
        observacoes: ''
      });
      setShowAddRemedioModal(false);

      // Refresh remedios list
      fetchRemediosDoAnimal(selectedAnimal._id);
    } catch (err: any) {
      console.error('Erro ao criar remédio:', err);
      // Optional: add error handling UI
    }
  };

  // cleanup plantacao map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRefPlant.current) {
        try { mapInstanceRefPlant.current.remove(); } catch (e) { /* ignore */ }
        mapInstanceRefPlant.current = null;
      }
    };
  }, []);

  // cria mapa da plantação quando o modal estiver aberto e a tab for 'mapa'
  useEffect(() => {
    if (showPlantacaoModal && plantacaoModalTab === 'mapa' && selectedPlantacao) {
      // delay pequeno para garantir que o container do modal/mapa está no DOM
      const t = setTimeout(() => {
        console.log('Opening plantacao mapa, selectedPlantacao:', selectedPlantacao);
        createPlantacaoMap();
      }, 120);
      return () => clearTimeout(t);
    }
  }, [showPlantacaoModal, plantacaoModalTab, selectedPlantacao]);

  return (
    <IonPage style={{ backgroundColor: "#FFF9E5", color: "#004030" }}>
      {/* CABEÇALHO */}
      <IonHeader translucent={false}>
        <IonToolbar
          style={
            {
              ["--background" as any]: "#FFF9E5",
              ["--color" as any]: "#004030",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 12px",
            } as React.CSSProperties
          }
        >
          <img
            src={logo}
            alt="perfil"
            style={{
              borderRadius: "50%",
              width: 40,
              height: 40,
              border: "2px solid #DCD0A8",
              objectFit: "cover",
            }}
          />

          <IonButtons slot="end">
            <IonButton fill="clear" href="/settings" >
              <IonIcon
                icon={settingsOutline}
                style={{ color: "#004030", fontSize: "24px" }}
              />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        {/* ABAS */}
        <div
          style={{
            backgroundColor: "#FFF9E5",
            display: "flex",
            justifyContent: "center",
            padding: "0 12px 8px",
          }}
        >
          <IonSegment
            value={segment}
            onIonChange={(e: any) => setSegment(e.detail.value)}
            style={{
              backgroundColor: "#4A9782",
              borderRadius: "9999px",
              width: "100%",
              maxWidth: "380px",
              height: "40px",
            }}
          >
            <IonSegmentButton
              value="animais"
              style={{
                "--color-checked": "#FFF9E5",
                "--color": "#FFF9E5aa",
                "--indicator-color": "transparent",
                borderRadius: "9999px",
              }}
            >
              <IonLabel>Animais</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton
              value="plantacoes"
              style={{
                "--color-checked": "#FFF9E5",
                "--color": "#FFF9E5aa",
                "--indicator-color": "transparent",
                borderRadius: "9999px",
              }}
            >
              <IonLabel>Plantações</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>
      </IonHeader>

      {/* CONTEÚDO */}
      <IonContent
        style={{
          backgroundColor: "#FFF9E5",
          padding: "16px",
        }}
      >
        {segment === "animais" ? (
          <>
            {loading && <p style={{ color: "#004030" }}>A carregar animais...</p>}
            {error && <p style={{ color: "crimson" }}>{error}</p>}
            {!loading && animais.length === 0 && !error && (
              <p style={{ color: "#004030b0" }}>Nenhum animal encontrado.</p>
            )}

            {animais.map((item, i) => (
              <IonCard
                key={item._id ?? item.id ?? i}
                onClick={() => handleAnimalClick(item)}
                style={{
                  backgroundColor: "#DCD0A8",
                  borderRadius: "16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  marginBottom: "12px",
                  cursor: "pointer"
                }}
              >
                <IonItem
                  lines="none"
                  style={{
                    "--background": "#DCD0A8",
                    borderRadius: "16px",
                    padding: "8px 4px",
                  }}
                >
                  <IonAvatar slot="start">
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        backgroundColor: "#4A9782",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IonIcon
                        icon={pawOutline}
                        style={{ color: "#FFF9E5", fontSize: "20px" }}
                      />
                    </div>
                  </IonAvatar>

                  <IonLabel>
                    <h2
                      style={{
                        fontWeight: 600,
                        color: "#004030",
                        fontSize: "15px",
                        marginBottom: "2px",
                      }}
                    >
                      {item.nome}
                    </h2>
                    <p style={{ color: "#004030b0", fontSize: "13px" }}>
                      {item.raca ?? "—"}  {/* Mostra raça ou traço se não houver */}
                    </p>
                  </IonLabel>

                  <IonNote
                    slot="end"
                    style={{
                      color: "#004030",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {item.idade} anos
                  </IonNote>
                </IonItem>
              </IonCard>
            ))}
          </>
        ) : (
          <>
            {loading && <p style={{ color: "#004030" }}>A carregar plantações...</p>}
            {error && <p style={{ color: "crimson" }}>{error}</p>}
            {!loading && plantacoes.length === 0 && !error && (
              <p style={{ color: "#004030b0" }}>Nenhuma plantação encontrada.</p>
            )}

            {plantacoes.map((item, i) => (
              <IonCard
                key={item._id ?? item.id ?? i}
                onClick={() => handlePlantacaoClick(item)}
                style={{
                  backgroundColor: "#DCD0A8",
                  borderRadius: "16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  marginBottom: "12px",
                  cursor: "pointer"
                }}
              >
                <IonItem
                  lines="none"
                  style={{
                    "--background": '#DCD0A8',
                    borderRadius: "16px",
                    padding: "8px 4px",
                  }}
                >
                  <IonAvatar slot="start">
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        backgroundColor: "#4A9782",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IonIcon
                        icon={leafOutline}
                        style={{ color: "#FFF9E5", fontSize: "20px" }}
                      />
                    </div>
                  </IonAvatar>

                  <IonLabel>
                    <h2
                      style={{
                        fontWeight: 600,
                        color: "#004030",
                        fontSize: "15px",
                        marginBottom: "2px",
                      }}
                    >
                      {item.planta}
                    </h2>
                    <p style={{ color: "#004030b0", fontSize: "13px" }}>
                      Plantação
                    </p>
                  </IonLabel>
                </IonItem>
              </IonCard>
            ))}
          </>
        )}
      </IonContent>

      {/* Add Modal */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
            <IonTitle>{segment === 'animais' ? 'Novo Animal' : 'Nova Plantação'}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>Cancelar</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#FFF9E5' }}>
          <IonGrid>
            <IonRow>
              <IonCol>
                {segment === 'animais' ? (
                  <IonList style={{ background: '#FFF9E5' }}>
                    <IonItem style={{
                      '--background': '#FFF9E5',
                      '--color': '#004030',
                    }}>
                      <IonInput
                        label="Nome"
                        labelPlacement="stacked"
                        placeholder="Nome do animal"
                        value={newAnimal.nome}
                        debounce={0}
                        onIonInput={e => setNewAnimal({ ...newAnimal, nome: e.detail.value! })}
                        style={{
                          '--color': '#004030',
                          '--placeholder-color': '#004030',
                        }}
                      />
                    </IonItem>
                    <IonItem style={{
                      '--background': '#FFF9E5',
                      '--color': '#004030',
                    }}>
                      <IonInput
                        label="Idade"
                        labelPlacement="stacked"
                        type="number"
                        placeholder="Idade do animal"
                        value={newAnimal.idade}
                        debounce={0}
                        onIonInput={e => setNewAnimal({ ...newAnimal, idade: Number(e.detail.value) })}
                        style={{
                          '--color': '#004030',
                          '--placeholder-color': '#004030',
                        }}
                      />
                    </IonItem>
                    <IonItem style={{
                      '--background': '#FFF9E5',
                      '--color': '#004030',
                    }}>
                      <IonInput
                        label="Raça"
                        labelPlacement="stacked"
                        placeholder="Raça do animal"
                        value={newAnimal.raca}
                        debounce={0}
                        onIonInput={e => setNewAnimal({ ...newAnimal, raca: e.detail.value! })}
                        style={{
                          '--color': '#004030',
                          '--placeholder-color': '#004030',
                        }}
                      />
                    </IonItem>
                  </IonList>
                ) : (
                  <IonList style={{ background: '#FFF9E5' }}>
                    <IonItem style={{
                      '--background': '#FFF9E5',
                      '--color': '#004030',
                    }}>
                      <IonInput
                        label="Nome da Planta"
                        labelPlacement="stacked"
                        placeholder="Nome da plantação"
                        value={newPlantacao.planta}
                        debounce={0}
                        onIonInput={e => setNewPlantacao({ ...newPlantacao, planta: e.detail.value! })}
                        style={{
                          '--color': '#004030',
                          '--placeholder-color': '#004030',
                        }}
                      />
                    </IonItem>
                  </IonList>
                )}
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonButton
                  expand="block"
                  onClick={handleSubmit}
                  style={{
                    '--background': '#004030',
                    '--background-activated': '#003020',
                    marginTop: '20px'
                  }}
                >
                  Salvar
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      {/* Modal com várias tabs — 1: Info, 2: Mapa, 3: Remédios */}
      <IonModal
        isOpen={showLocationModal}
        onDidDismiss={() => {
          setShowLocationModal(false);
          setFilterDate(null);
          setModalTab('mapa');
          // remove mapa ao fechar modal
          if (mapInstanceRef.current) {
            try { mapInstanceRef.current.remove(); } catch (e) { /* ignore */ }
            mapInstanceRef.current = null;
          }
        }}
        onWillPresent={() => {
          // abrir inicialmente em 'info', mapa criado quando trocar para 'mapa'
          setModalTab('info');
          setTimeout(() => {
            setFilterDate(null);
            if (modalTab === 'mapa') createMap();
          }, 120);
        }}
      >
        <IonHeader>
          <IonToolbar style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
            <IonTitle>{selectedAnimal ? `Detalhes: ${selectedAnimal.nome}` : 'Detalhes'}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowLocationModal(false)}>Fechar</IonButton>
            </IonButtons>
          </IonToolbar>
          {/* Tabs (segment) */}
          <IonToolbar style={{ '--background': '#FFF9E5', padding: '6px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <IonSegment value={modalTab} onIonChange={(e: any) => setModalTab(e.detail.value)}>
                <IonSegmentButton value="info">
                  <IonLabel>Info</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="mapa">
                  <IonLabel>Mapa</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="remedios">
                  <IonLabel>Remédios</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {modalTab === 'info' && (
            <div style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>{selectedAnimal?.nome}</h3>
              <p><strong>Raça:</strong> {selectedAnimal?.raca ?? '—'}</p>
              <p><strong>Idade:</strong> {selectedAnimal?.idade ?? '—'} anos</p>
              <p style={{ marginTop: 8, color: '#444' }}>
                {selectedAnimal ? `Última posição: ${selectedAnimal.localizacaoX ?? '—'}, ${selectedAnimal.localizacaoY ?? '—'}` : ''}
              </p>
            </div>
          )}

          {modalTab === 'mapa' && (
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
              {/* Small day picker (today by default) with prev/next arrows */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1000,
                  backgroundColor: "#FFF9E5",
                  borderRadius: "10px",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.12)"
                }}
              >
                <IonButton
                  size="small"
                  fill="clear"
                  onClick={() => {
                    try {
                      const base = parseYMD(filterDate) ?? new Date();
                      base.setDate(base.getDate() - 1);
                      setFilterDate(formatYMD(base));
                    } catch (err) {
                      console.error('prev day error', err);
                    }
                  }}
                >
                  ‹
                </IonButton>

                <div style={{ minWidth: 110, textAlign: "center", fontSize: 13, color: "#004030" }}>
                  {(() => {
                    const d = parseYMD(filterDate) ?? new Date();
                    return d.toLocaleDateString();
                  })()}
                </div>

                <IonButton
                  size="small"
                  fill="clear"
                  onClick={() => {
                    try {
                      const base = parseYMD(filterDate) ?? new Date();
                      base.setDate(base.getDate() + 1);
                      setFilterDate(formatYMD(base));
                    } catch (err) {
                      console.error('next day error', err);
                    }
                  }}
                >
                  ›
                </IonButton>
              </div>

              {/* Mapa */}
              <div id="map-container" ref={mapRef} style={{ width: "100%", height: "100%" }} />
            </div>
          )}


          {modalTab === 'remedios' && (
            <div style={{ padding: 12 }}>
              <h4 style={{ marginTop: 0, color: '#004030' }}>Remédios / Vacinas</h4>

              {loadingRemedios && (
                <p style={{ color: '#666' }}>Carregando remédios...</p>
              )}

              {remediosError && (
                <p style={{ color: 'crimson' }}>{remediosError}</p>
              )}

              {!loadingRemedios && !remediosError && remedios.length === 0 && (
                <p style={{ color: '#666' }}>Nenhum remédio registrado.</p>
              )}

              {remedios.map(remedio => (
                <IonCard key={remedio._id} style={{
                  backgroundColor: "#DCD0A8",
                  borderRadius: "12px",
                  margin: "8px 0",
                  padding: "12px"
                }}>
                  <h5 style={{ margin: 0, color: '#004030' }}>{remedio.nome}</h5>
                  <p style={{ margin: "4px 0", fontSize: '14px', color: '#004030' }}>
                    Data: {new Date(remedio.data).toLocaleDateString()}
                  </p>
                  {remedio.observacoes && (
                    <p style={{ margin: "4px 0", fontSize: '13px', color: '#004030b0' }}>
                      {remedio.observacoes}
                    </p>
                  )}
                </IonCard>
              ))}

              <IonButton
                expand="block"
                onClick={() => setShowAddRemedioModal(true)}
                style={{ marginTop: 16 }}
              >
                Adicionar Remédio
              </IonButton>
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* Add Remedio Modal */}
      <IonModal
        isOpen={showAddRemedioModal}
        onDidDismiss={() => setShowAddRemedioModal(false)}
      >
        <IonHeader>
          <IonToolbar style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
            <IonTitle>Novo Remédio</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowAddRemedioModal(false)}>
                Cancelar
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#FFF9E5' }}>
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <IonLabel style={{ color: '#004030' }}>Nome do Remédio *</IonLabel>
              <IonInput
                value={newRemedio.nome}
                onIonChange={e => setNewRemedio(prev => ({ ...prev, nome: e.detail.value || '' }))}
                placeholder="Digite o nome do remédio"
                style={{
                  '--background': '#DCD0A8',
                  '--color': '#004030',
                  '--padding-start': '10px',
                  '--padding-end': '10px',
                  marginTop: 4,
                  borderRadius: 8
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <IonLabel style={{ color: '#004030' }}>Observações</IonLabel>
              <IonTextarea
                value={newRemedio.observacoes}
                onIonChange={e => setNewRemedio(prev => ({ ...prev, observacoes: e.detail.value || '' }))}
                placeholder="Observações adicionais"
                style={{
                  '--background': '#DCD0A8',
                  '--color': '#004030',
                  '--padding-start': '10px',
                  '--padding-end': '10px',
                  marginTop: 4,
                  borderRadius: 8
                }}
              />
            </div>

            <IonButton
              expand="block"
              onClick={handleCreateRemedio}
              disabled={!newRemedio.nome}
              style={{
                '--background': '#4A9782',
                marginTop: 20
              }}
            >
              Adicionar Remédio
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* Plantacao Modal (Info + Mapa) */}
      <IonModal
        isOpen={showPlantacaoModal}
        onDidDismiss={() => {
          setShowPlantacaoModal(false);
          setSelectedPlantacao(null);
          // remove plant map
          if (mapInstanceRefPlant.current) {
            
            try { mapInstanceRefPlant.current.remove(); } catch (e) { /* ignore */ }
            mapInstanceRefPlant.current = null;
          }
        }}
        onWillPresent={() => {
          setPlantacaoModalTab('info');
          setTimeout(() => {
            if (plantacaoModalTab === 'mapa') createPlantacaoMap();
          }, 120);
        }}
      >
        <IonHeader>
          <IonToolbar style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
            <IonTitle>{selectedPlantacao ? `Plantação: ${selectedPlantacao.planta}` : 'Plantação'}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowPlantacaoModal(false)}>Fechar</IonButton>
            </IonButtons>
          </IonToolbar>
          <IonToolbar style={{ '--background': '#FFF9E5', padding: '6px 12px' }}>
            <IonSegment value={plantacaoModalTab} onIonChange={(e: any) => setPlantacaoModalTab(e.detail.value)}>
              <IonSegmentButton value="info">
                <IonLabel>Info</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="mapa">
                <IonLabel>Mapa</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {plantacaoModalTab === 'info' && selectedPlantacao && (
            <div style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>{selectedPlantacao.planta}</h3>

              {/* Mostrar localização pontual (se existir) */}
              
              {/* Se houver pontos do polígono, mostrar resumo (centro e número de vértices) */}
              {Array.isArray(selectedPlantacao.pontosx) && Array.isArray(selectedPlantacao.pontosy) && selectedPlantacao.pontosx.length > 0 && selectedPlantacao.pontosy.length > 0 ? (
                (() => {
                  const c = centroidFromPoints(selectedPlantacao.pontosx, selectedPlantacao.pontosy);
                  return (
                    <div>
                      <p><strong>Polígono:</strong> {Math.min(selectedPlantacao.pontosx.length, selectedPlantacao.pontosy.length)} pontos</p>
                      <p><strong>Centro aproximado:</strong> {c ? `${c[0].toFixed(6)}, ${c[1].toFixed(6)}` : '—'}</p>
                    </div>
                  );
                })()
              ) : null}

              <p><strong>Criado em:</strong> {selectedPlantacao.createdAt ? new Date(selectedPlantacao.createdAt).toLocaleString() : '—'}</p>
            </div>
          )}

          {plantacaoModalTab === 'mapa' && (
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
              <div id="map-container-plant" ref={mapRefPlant} style={{ width: '100%', height: '100%' }} />
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* Floating Action Button */}
      <IonButton
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: '80px', // above navbar
          right: '20px',  // right side
          '--border-radius': '50%',
          '--padding-start': '0',
          '--padding-end': '0',
          width: '56px',
          height: '56px',
          '--background': '#004030',
          '--background-activated': '#3A8772',
          zIndex: 1000,
        }}
      >
        <IonIcon
          icon={addOutline}
          style={{
            fontSize: '24px',
            marginInline: 'auto',
            color: '#FFF9E5',
          }}
        />
      </IonButton>

      {/* MENU INFERIOR - UMA SÓ LINHA */}
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

      {/* Add to your CSS */}
      <style>
        {`
          .leaflet-container {
            width: 100% !important;
            height: 100% !important;
            z-index: 1;
            background-color: #f8f8f8;
          }

          #map-container {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #f8f8f8;
          }

          .leaflet-control-container {
            z-index: 2;
          }

          .leaflet-popup-content-wrapper {
            background-color: #fff;
            color: #004030;
            border-radius: 8px;
          }

          .leaflet-popup-tip {
            background-color: #fff;
          }
        `}
      </style>
    </IonPage>
  );
};

export default AnimaisPage;
