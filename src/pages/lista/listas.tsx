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
  IonRefresher,
  IonRefresherContent,
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
  bandageOutline,
  arrowUndoOutline,
  trashOutline
} from "ionicons/icons";
import { searchCircleOutline } from 'ionicons/icons';
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
  nome?: string;
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
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const toggleAccordion = () => setIsAccordionOpen(!isAccordionOpen);
  const [showModal, setShowModal] = useState(false);
  const [newAnimal, setNewAnimal] = useState<Partial<Animal>>({});
  const [newPlantacao, setNewPlantacao] = useState<Partial<Plantacao>>({});
  // add map editor state/refs for creating plantacao
  const mapAddRef = useRef<HTMLDivElement | null>(null);
  const mapAddInstanceRef = useRef<L.Map | null>(null);
  const addMarkersRef = useRef<L.Marker[]>([]);
  const [addPoints, setAddPoints] = useState<[number, number][]>([]);
  const [pasteText, setPasteText] = useState<string>('');
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

  const API_BASE = ("https://agrofieldtrack-node-1yka.onrender.com").replace(/\/+$/, '');

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
      // current position: use default pin marker (with default icon)
      const currentMarker = L.marker([selectedAnimal.localizacaoX || 0, selectedAnimal.localizacaoY || 0]);
      currentMarker.addTo(map).bindPopup(`${selectedAnimal.nome} está aqui agora`);

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

          const m = L.marker(point).addTo(map);
          m.bindPopup(`Localização ${index + 1}: ${new Date(location.at).toLocaleString()}`);
          // add a small permanent tooltip badge with the sequence number
          try {
            m.bindTooltip(String(index + 1), { permanent: true, direction: 'center', className: 'map-seq-badge' });
          } catch (e) { /* ignore */ }
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

      // Se houver pontos, desenha markers e ligações NN
      if (coords.length > 0) {
        // Adiciona markers
        coords.forEach((c, i) => {
          const m = L.marker(c).addTo(map);
          try { m.bindTooltip(String(i+1), { permanent: true, direction: 'center', className: 'map-seq-badge' }); } catch (e) {}
        });

        // Ligações: para cada ponto, conecta aos 2 mais próximos
        if (coords.length > 1) {
          const pts = coords.map(c => ({ lat: Number((c as any)[0]), lng: Number((c as any)[1]) }));
          const dist2 = (a: {lat:number,lng:number}, b: {lat:number,lng:number}) => {
            const dx = a.lat - b.lat; const dy = a.lng - b.lng; return dx*dx + dy*dy;
          };
          for (let i = 0; i < pts.length; i++) {
            const dists: Array<{ idx: number; d: number }> = [];
            for (let j = 0; j < pts.length; j++) {
              if (i === j) continue;
              dists.push({ idx: j, d: dist2(pts[i], pts[j]) });
            }
            dists.sort((a,b) => a.d - b.d);
            const nearest = dists.slice(0, 2).map(x => x.idx);
            nearest.forEach(nidx => {
              L.polyline([[pts[i].lat, pts[i].lng], [pts[nidx].lat, pts[nidx].lng]], { color: '#4A9782', weight: 2, opacity: 0.9 }).addTo(map);
            });
          }
        }

        // Se >=3 pontos, desenha polígono leve
        if (coords.length >= 3) {
          const poly = L.polygon(coords, { color: '#4A9782', weight: 1, fillOpacity: 0.04, opacity: 0.5 }).addTo(map);
        }

        // Ajusta bounds
        map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
      } else if (typeof selectedPlantacao.localizacaoX === 'number' && typeof selectedPlantacao.localizacaoY === 'number') {
        // fallback legacy localizacaoX/Y
        const pt: L.LatLngExpression = [selectedPlantacao.localizacaoX, selectedPlantacao.localizacaoY];
        L.marker(pt).addTo(map);
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
      const t = setTimeout(() => createMap(), 220);
      return () => clearTimeout(t);
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

  // helper: update map markers/polygon for add map
  const updateAddMap = () => {
    try {
      const map = mapAddInstanceRef.current;
      if (!map) return;
      // remove old markers and non-tile layers
      addMarkersRef.current.forEach(m => { try { map.removeLayer(m); } catch(e){} });
      addMarkersRef.current = [];
      // remove previously added overlay layers (if stored)
      try {
        const prev = (map as any)._agro_overlayLayers as L.Layer[] | undefined;
        if (Array.isArray(prev)) {
          prev.forEach(l => { try { map.removeLayer(l); } catch {} });
        }
      } catch (e) {}

      map.eachLayer(layer => {
        try {
          // keep tile layers (base map). Only remove other overlay layers (markers, polylines, polygons)
          if (layer instanceof L.TileLayer) return;
        } catch (e) {
          // fallback: if instanceof check fails in some envs, try to detect tile layers by _url
          if ((layer as any)?._url) return;
        }
        try { map.removeLayer(layer); } catch (e) {}
      });

      const coords = addPoints.map(p => [p[0], p[1]] as L.LatLngExpression);
      coords.forEach((c, i) => {
        const m = L.marker(c).addTo(map);
        // add small permanent tooltip badge showing index
        try { m.bindTooltip(String(i+1), { permanent: true, direction: 'center', className: 'map-seq-badge' }); } catch (e) {}
        addMarkersRef.current.push(m);
      });

      // remove any previous overlay lines/polygons (tile layers preserved above)
      // We'll draw connections between each point and its two nearest neighbors
      // First, compute simple nearest neighbors (O(n^2) is fine for small n)
      const overlayLayers: L.Layer[] = [];
      if (coords.length === 1) {
        // Don't change zoom when adding a single point; just pan the map to the point
        try {
          map.panTo(coords[0]);
        } catch (e) {
          // fallback for any map errors: keep existing behavior but still try not to zoom
          try { map.setView(coords[0], map.getZoom()); } catch (err) { /* ignore */ }
        }
      } else if (coords.length > 1) {
        // compute NN for each point
        const pts = coords.map(c => ({ lat: Number((c as any)[0]), lng: Number((c as any)[1]) }));

        // helper distance^2
        const dist2 = (a: {lat:number,lng:number}, b: {lat:number,lng:number}) => {
          const dx = a.lat - b.lat; const dy = a.lng - b.lng; return dx*dx + dy*dy;
        };

        for (let i = 0; i < pts.length; i++) {
          const dists: Array<{ idx: number; d: number }> = [];
          for (let j = 0; j < pts.length; j++) {
            if (i === j) continue;
            dists.push({ idx: j, d: dist2(pts[i], pts[j]) });
          }
          dists.sort((a,b) => a.d - b.d);
          const nearest = dists.slice(0, 2).map(x => x.idx);
          // draw lines to nearest neighbors
          nearest.forEach(nidx => {
            const line = L.polyline([[pts[i].lat, pts[i].lng], [pts[nidx].lat, pts[nidx].lng]], { color: '#4A9782', weight: 2, opacity: 0.9 }).addTo(map);
            overlayLayers.push(line);
          });
        }

        // if 3 or more points, optionally draw a faint polygon to indicate area
        if (coords.length >= 3) {
          const poly = L.polygon(coords, { color: '#4A9782', weight: 1, fillOpacity: 0.04, opacity: 0.5 }).addTo(map);
          overlayLayers.push(poly);
        }

        // Keep current zoom and pan to make sure points are visible.
        // Using panInsideBounds avoids zoom changes while still ensuring map pans only if needed.
        try {
          // padding is not present on PanOptions in some Leaflet type definitions,
          // so cast the options object to any to allow the padding property.
          map.panInsideBounds(L.latLngBounds(coords), { padding: [20, 20] } as any);
        } catch (e) {
          // If panInsideBounds isn't available or fails, fall back to panTo center
          try { map.panTo(L.latLngBounds(coords).getCenter()); } catch (err) { /* ignore */ }
        }
      }

      // store overlayLayers in map (attach to map object) so we can remove them next update
      try {
        (map as any)._agro_overlayLayers = overlayLayers;
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('updateAddMap error', err);
    }
  };

  // Remove any point that is inside the polygon formed by the other points,
  // or that sits (approximately) at the centroid of the other points.
  // This makes the editor robust to pasted/accidental central pins and to
  // the case where a point was placed first and later surrounded by others.
  const removeCentralPoints = (points: [number, number][]) => {
    if (!points || points.length < 1) return points;

    const thresholdDeg = 0.00005; // ~5.5m approx — adjust if needed
    const thr2 = thresholdDeg * thresholdDeg;

    // Monotone chain convex hull (returns points in CCW order, no duplicates)
    const convexHull = (pts: [number, number][]) => {
      const arr = pts.map(p => [p[0], p[1]] as [number, number]);
      if (arr.length <= 1) return arr;
      arr.sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
      const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lower: [number, number][] = [];
      for (const p of arr) {
        while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop();
        lower.push(p);
      }
      const upper: [number, number][] = [];
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop();
        upper.push(p);
      }
      upper.pop(); lower.pop();
      return lower.concat(upper);
    };

    const pointInPolygon = (pt: [number, number], poly: [number, number][]) => {
      if (!poly || poly.length < 3) return false;
      let x = pt[0], y = pt[1];
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1];
        const xj = poly[j][0], yj = poly[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 0.0) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    // Iterate removals until stable (removing a central point may cause other
    // points to become central, so repeat).
    let current = points.slice();
    while (true) {
      const keep: [number, number][] = [];
      let removedAny = false;

      for (let idx = 0; idx < current.length; idx++) {
        const p = current[idx];
        const others = current.filter((_, i) => i !== idx);

        let removed = false;

        if (others.length >= 3) {
          try {
            const hull = convexHull(others);
            if (hull.length >= 3 && pointInPolygon(p, hull)) {
              removed = true;
            }
          } catch (e) {
            console.warn('hull or pip failed', e);
          }
        }

        if (!removed && others.length > 0) {
          // centroid proximity fallback
          let sx = 0, sy = 0;
          for (const o of others) { sx += o[0]; sy += o[1]; }
          const cx = sx / others.length;
          const cy = sy / others.length;
          if (!isNaN(cx) && !isNaN(cy)) {
            const dx = p[0] - cx;
            const dy = p[1] - cy;
            if ((dx*dx + dy*dy) <= thr2) removed = true;
          }
        }

        if (removed) {
          removedAny = true;
        } else {
          keep.push(p);
        }
      }

      if (!removedAny) break;
      current = keep;
    }

    return current;
  };

  // init map for adding points
  const initAddMap = () => {
    try {
      if (!mapAddRef.current) return;
      if (mapAddInstanceRef.current) {
        try { mapAddInstanceRef.current.remove(); } catch { }
        mapAddInstanceRef.current = null;
        addMarkersRef.current = [];
      }
      mapAddRef.current.innerHTML = '';
      const map = L.map(mapAddRef.current, { center: [0,0], zoom: 2, zoomControl: true });
      mapAddInstanceRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      // helper: point-in-polygon (ray-casting)
      const pointInPolygon = (x: number, y: number, poly: [number, number][]) => {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const xi = poly[i][0], yi = poly[i][1];
          const xj = poly[j][0], yj = poly[j][1];
          const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 0.0) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      };

      const degDistance2 = (a: [number, number], b: [number, number]) => {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        return dx*dx + dy*dy;
      };

      map.on('click', (e: any) => {
        // Ignore click events that are part of a double-click (detail > 1)
        try {
          if (e && e.originalEvent && e.originalEvent.detail && e.originalEvent.detail > 1) {
            return; // ignore double-click
          }
        } catch (err) { /* ignore */ }

        const lat = Number(e.latlng.lat);
        const lng = Number(e.latlng.lng);

        // proximity threshold in degrees ~ approx (0.0001 deg ~ 11m)
        const proximityThresholdDeg = 0.0001;

        const candidate: [number, number] = [lat, lng];

        // if close to existing point, ignore
        for (const p of addPoints) {
          if (degDistance2(p, candidate) <= proximityThresholdDeg * proximityThresholdDeg) {
            // ignore silent
            return;
          }
        }

        // if there are >=3 points and candidate is strictly inside polygon, ignore
        if (addPoints.length >= 3) {
          const poly = addPoints.slice();
          if (pointInPolygon(lat, lng, poly as [number, number][])) {
            return;
          }
        }

        setAddPoints(prev => {
          const next = [...prev, candidate as [number, number]];
          // sincroniza para enviar
          setNewPlantacao(np => ({ ...np, pontosx: next.map(p => p[0]), pontosy: next.map(p => p[1]) }));
          return next;
        });
      });

      updateAddMap();
    } catch (err) {
      console.error('initAddMap error', err);
    }
  };

  useEffect(() => {
    // sanitize points: remove any that sit at the centroid of the others
    try {
      const cleaned = removeCentralPoints(addPoints);
      if (cleaned.length !== addPoints.length) {
        setAddPoints(cleaned);
        // sync newPlantacao now so UI stays consistent (updateAddMap will run on next effect)
        setNewPlantacao(np => ({ ...np, pontosx: cleaned.map(p => p[0]), pontosy: cleaned.map(p => p[1]) }));
        return;
      }
    } catch (e) {
      console.warn('removeCentralPoints failed', e);
    }

    updateAddMap();
    // also sync newPlantacao in case addPoints changed externally
    setNewPlantacao(np => ({ ...np, pontosx: addPoints.map(p => p[0]), pontosy: addPoints.map(p => p[1]) }));
  }, [addPoints]);

  // init/cleanup when opening/closing the add modal for plantacao
  useEffect(() => {
    if (showModal && segment === 'plantacoes') {
      setTimeout(() => initAddMap(), 120);
    }
    if (!showModal && mapAddInstanceRef.current) {
      try { mapAddInstanceRef.current.remove(); } catch (e) {}
      mapAddInstanceRef.current = null;
      addMarkersRef.current = [];
      setAddPoints([]);
    }
  }, [showModal, segment]);

  const clearAddPoints = () => {
    setAddPoints([]);
    setNewPlantacao(np => ({ ...np, pontosx: [], pontosy: [] }));
    if (mapAddInstanceRef.current) {
      mapAddInstanceRef.current.eachLayer(layer => {
        try {
          if (layer instanceof L.TileLayer) return;
        } catch (e) {
          if ((layer as any)?._url) return;
        }
        try { mapAddInstanceRef.current!.removeLayer(layer); } catch {}
      });
    }
    addMarkersRef.current = [];
  };

  const undoLastPoint = () => {
    setAddPoints(prev => {
      const next = prev.slice(0, -1);
      setNewPlantacao(np => ({ ...np, pontosx: next.map(p => p[0]), pontosy: next.map(p => p[1]) }));
      return next;
    });
  };

  const pasteCoordsFromText = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed: [number, number][] = [];
    for (const ln of lines) {
      const sep = ln.includes(',') ? ',' : (ln.includes(';') ? ';' : ' ');
      const parts = ln.split(sep).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const a = Number(parts[0]);
        const b = Number(parts[1]);
        if (!isNaN(a) && !isNaN(b)) parsed.push([a, b]);
      }
    }
    if (parsed.length) {
      setAddPoints(parsed);
      setNewPlantacao(np => ({ ...np, pontosx: parsed.map(p => p[0]), pontosy: parsed.map(p => p[1]) }));
    }
  };
// distância mínima em metros entre pontos (evita overlap)
const MIN_DISTANCE = 3; // ajusta se quiseres

function isPointTooClose(lat: number, lng: number, points: any[]) {
  for (const p of points) {
    const dist = Math.sqrt(
      Math.pow(lat - p.lat, 2) + Math.pow(lng - p.lng, 2)
    );

    // como lat/lng não são metros, mas serve para impedir overlap no zoom
    if (dist < 0.00003) { 
      return true;
    }
  }
  return false;
}

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
              <IonButton fill="clear" href="/settings">
                <IonIcon icon={settingsOutline} style={{ color: "#004030", fontSize: "24px" }} />
              </IonButton>
            </IonButtons>
            <IonButtons slot="end" id="search">
              <IonButton onClick={() => toggleAccordion()}>
                <IonIcon icon={searchCircleOutline} size="large" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

      <IonContent>
        <IonSegment value={segment} onIonChange={(e: any) => {
          const val = e?.detail?.value;
          setSegment(typeof val === 'string' ? val : String(val ?? 'animais'));
        }}>
          <IonSegmentButton value="animais">
            <IonLabel>Animais</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="plantacoes">
            <IonLabel>Plantações</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <IonRefresher slot="fixed" onIonRefresh={fetchAnimais}>
          <IonRefresherContent
            pullingIcon={null}
            refreshingSpinner="bubbles"
            refreshingText="Atualizando..."
          />
        </IonRefresher>

        <IonGrid>
          <IonRow>
            {segment === "animais" && animais.length === 0 && (
              <IonCol>
                <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>
                  <IonIcon name="paw-outline" style={{ fontSize: '48px', marginBottom: '8px', color: '#004030' }} />
                  <p style={{ margin: 0, fontSize: '16px' }}>
                    Nenhum animal encontrado.
                  </p>
                </div>
              </IonCol>
            )}

            {segment === "plantacoes" && plantacoes.length === 0 && (
              <IonCol>
                <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>
                  <IonIcon name="leaf-outline" style={{ fontSize: '48px', marginBottom: '8px', color: '#004030' }} />
                  <p style={{ margin: 0, fontSize: '16px' }}>
                    Nenhuma plantação encontrada.
                  </p>
                </div>
              </IonCol>
            )}

            {segment === "animais" ? animais.map((item) => (
              <IonCol size="6" key={item._id}>
                <IonCard
                  button
                  onClick={() => handleAnimalClick(item)}
                  style={{
                    margin: "8px",
                    background: "#D1E8E2",
                    borderRadius: "12px",
                    overflow: "hidden",
                    position: "relative",
                    paddingBottom: "56.25%" // 16:9 aspect ratio
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `url(${logo}) no-repeat center center`,
                    backgroundSize: "cover",
                    opacity: 0.1,
                    zIndex: 1
                  }} />
                  <div style={{ position: "relative", zIndex: 2, padding: "16px" }}>
                    <h2 style={{
                      margin: 0,
                      fontSize: "18px",
                      color: "#004030",
                      fontWeight: "bold"
                    }}>
                      {item.nome}
                    </h2>
                    <p style={{
                      margin: "4px 0",
                      fontSize: "14px",
                      color: "#004030",
                      fontWeight: "medium"
                    }}>
                      {`Raça: ${item.raca} | Idade: ${item.idade} anos`}
                    </p>
                    <IonNote style={{ fontSize: "12px", color: "#999" }}>
                      {`Última localização: ${item.localizacaoX}, ${item.localizacaoY}`}
                    </IonNote>
                  </div>
                </IonCard>
              </IonCol>
            )) : plantacoes.map((item) => (
              <IonCol size="6" key={item._id}>
                <IonCard
                  button
                  onClick={() => handlePlantacaoClick(item)}
                  style={{
                    margin: "8px",
                    background: "#F9EBD7",
                    borderRadius: "12px",
                    overflow: "hidden",
                    position: "relative",
                    paddingBottom: "56.25%" // 16:9 aspect ratio
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `url(${logo}) no-repeat center center`,
                    backgroundSize: "cover",
                    opacity: 0.1,
                    zIndex: 1
                  }} />
                  <div style={{ position: "relative", zIndex: 2, padding: "16px" }}>
                    <h2 style={{
                      margin: 0,
                      fontSize: "18px",
                      color: "#7D5B29",
                      fontWeight: "bold"
                    }}>
                      {item.planta}
                    </h2>
                    <p style={{
                      margin: "4px 0",
                      fontSize: "14px",
                      color: "#7D5B29",
                      fontWeight: "medium"
                    }}>
                      {`Planta: ${item.planta}`}
                    </p>
                    <IonNote style={{ fontSize: "12px", color: "#999" }}>
                      {`Criado em: ${new Date(item.createdAt || '').toLocaleDateString()}`}
                    </IonNote>
                  </div>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>

      {/* Add Modal */}
      <IonModal
        isOpen={showModal}
        onDidDismiss={() => {
          setShowModal(false);
          setAddPoints([]);
          setNewPlantacao({});
          if (mapAddInstanceRef.current) {
            try { mapAddInstanceRef.current.remove(); } catch (e) { /* ignore */ }
            mapAddInstanceRef.current = null;
            addMarkersRef.current = [];
          }
        }}
      >
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
                    <IonItem style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
                      <IonInput
                        label="Nome"
                        labelPlacement="stacked"
                        placeholder="Nome do animal"
                        value={newAnimal.nome}
                        debounce={0}
                        onIonInput={e => setNewAnimal({ ...newAnimal, nome: e.detail.value! })}
                        style={{ '--color': '#004030', '--placeholder-color': '#004030' }}
                      />
                    </IonItem>
                    <IonItem style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
                      <IonInput
                        label="Idade"
                        labelPlacement="stacked"
                        type="number"
                        placeholder="Idade do animal"
                        value={newAnimal.idade}
                        debounce={0}
                        onIonInput={e => setNewAnimal({ ...newAnimal, idade: Number(e.detail.value) })}
                        style={{ '--color': '#004030', '--placeholder-color': '#004030' }}
                      />
                    </IonItem>
                    <IonItem style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
                      <IonInput
                        label="Raça"
                        labelPlacement="stacked"
                        placeholder="Raça do animal"
                        value={newAnimal.raca}
                        debounce={0}
                        onIonInput={e => setNewAnimal({ ...newAnimal, raca: e.detail.value! })}
                        style={{ '--color': '#004030', '--placeholder-color': '#004030' }}
                      />
                    </IonItem>
                  </IonList>
                ) : (
                  <IonList style={{ background: '#FFF9E5' }}>
                    <IonItem>
                      <IonInput
                        label="ó nome"
                        labelPlacement="stacked"
                        placeholder="Nome da planta"
                        value={newPlantacao.planta}
                        debounce={0}
                        onIonInput={e => setNewPlantacao({ ...newPlantacao, planta: e.detail.value! })}
                      />
                    </IonItem>
                    <IonItem>
                      <IonInput
                        label="nome"
                        labelPlacement="stacked"
                        placeholder="nome ds plantação"
                        value={(newPlantacao as any).nome}
                        debounce={0}
                        onIonInput={e => setNewPlantacao({ ...newPlantacao, nome: e.detail.value! })}
                      />
                    </IonItem>
                    <div style={{ padding: 12 }}>
                      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                        <IonButton size="small" fill="clear" onClick={undoLastPoint} style={{ color: '#4A9782', minWidth: 0, padding: '0 8px' }}>
                          <IonIcon icon={arrowUndoOutline} style={{ color: '#4A9782', fontSize: 22 }} />
                        </IonButton>
                        <IonButton size="small" fill="clear" onClick={clearAddPoints} style={{ color: '#4A9782', minWidth: 0, padding: '0 8px' }}>
                          <IonIcon icon={trashOutline} style={{ color: '#4A9782', fontSize: 22 }} />
                        </IonButton>
                        <div style={{ flex: 1, textAlign: 'right', alignSelf: 'center', color: '#004030' }}>
                          Pontos: {addPoints.length}
                        </div>
                      </div>
                      <div ref={mapAddRef} id="map-add-container" style={{ width: '100%', minHeight: 300, borderRadius: 8, overflow: 'hidden' }} />
                      <div style={{ marginTop: 8 }}>
                        <IonLabel>Editor de pontos — clique no mapa para adicionar pins</IonLabel>
                      </div>
                    </div>
                  </IonList>
                )}
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <IonButton expand="block" onClick={handleSubmit} style={{ '--background': '#004030', marginTop: '20px' }}>
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
              <div id="map-container" ref={mapRef} style={{ width: "100%", height: "100%", minHeight: 320 }} />
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
        onClick={() => {
          if (segment === 'animais') {
            setShowModal(true);
          } else if (segment === 'plantacoes') {
            setShowModal(true);
          }
        }}
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
          /* Hide the 'Leaflet' credit link but keep other tile attributions (e.g. OpenStreetMap) */
          .leaflet-control-attribution a[href*="leaflet"] { display: none !important; }
          /* Ensure add/map containers have explicit min-heights so Leaflet can initialize */
          #map-add-container { min-height: 300px; height: 300px; }
          #map-container-plant { min-height: 320px; height: 100%; }
          /* When modal places map with absolute positioning, ensure ion-content occupies full height */
          ion-modal .modal-wrapper { height: 100%; }
          .map-seq-badge {
            background: #004030 !important;
            color: #fff !important;
            border-radius: 50% !important;
            width: 20px !important;
            height: 20px !important;
            line-height: 20px !important;
            text-align: center !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
            border: 2px solid #fff !important;
          }
        `}
      </style>
    </IonPage>
  );
};

export default AnimaisPage;
