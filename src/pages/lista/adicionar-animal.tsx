import React, { useState, useEffect } from "react";
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
  IonModal,
  IonCard,
  IonTextarea
} from "@ionic/react";
import {
  arrowBackOutline,
  pawOutline,
  mapOutline,
  cartOutline,
  listOutline,
  sparklesOutline,
  personOutline,
  bandageOutline
} from "ionicons/icons";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

interface DecodedToken {
  user_id: string;
}

interface Animal {
  _id?: string;
  nome: string;
  idade: number;
  raca: string;
  localizacaoX?: number;
  localizacaoY?: number;
}

const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const AdicionarAnimal: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const locationState = location.state as { animal?: Animal } | undefined;
  
  const [animal, setAnimal] = useState<Partial<Animal>>(() => {
    // Usar dados do state passado via location (dados frescos da API)
    if (locationState?.animal) {
      console.log("Animal recebido da listagem:", locationState.animal);
      return locationState.animal;
    }
    
    // Default vazio para novo animal
    return {
      nome: "",
      idade: 0,
      raca: ""
    };
  });

  // lê o cookie "auth" e tenta extrair o token JWT (suporta formatos: token directo, "name=token" ou JSON)
  const getToken = () => {
    // Primeiro tenta cookie, depois localStorage
    const match = document.cookie.match(/(^| )auth=([^;]+)/);
    return match ? match[2] : localStorage.getItem("authToken");
  };

  // Se há ID na URL, buscar dados frescos do servidor
  useEffect(() => {
    const fetchAnimalData = async () => {
      try {
        if (!id) return; // Se não há ID, é novo animal

        console.log("Buscando dados frescos do animal ID:", id);
        const token = getToken();
        if (!token) throw new Error("Não autenticado");
        
        const res = await axios.get(`${API_BASE}/getanimalbyyd/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const freshAnimal = res.data.data;
        console.log("Dados frescos do animal recebidos no adicionar-animal:", freshAnimal);
        setAnimal(freshAnimal);
      } catch (err: any) {
        console.error('Erro ao buscar dados do animal:', err);
        // Fallback: usa dados do state se disponível
        if (locationState?.animal) {
          setAnimal(locationState.animal);
        }
      }
    };

    fetchAnimalData();
  }, [id]);

  const handleSubmit = async () => {
    try {
      console.log("Submetendo animal:", animal);
      const token = getToken();
      if (!token) throw new Error("Não autenticado");
      const decoded: DecodedToken = jwtDecode(token);
      const userId = decoded.user_id;

      if (!animal.nome || !animal.raca || animal.idade === undefined) {
        alert('Por favor preencha todos os campos');
        return;
      }

      const animalData = {
        ...animal,
        nome: animal.nome || "",
        raca: animal.raca || "",
        idade: animal.idade || 0,
        localizacaoX: animal.localizacaoX || 0,
        localizacaoY: animal.localizacaoY || 0,
        dono_id: userId
      };

      console.log("Dados a enviar:", animalData);

      // Se tem _id, é uma atualização; senão é um novo animal
      if (animal._id) {
        console.log("Atualizando animal com ID:", animal._id);
        await axios.put(`${API_BASE}/animais/${animal._id}`, animalData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Animal atualizado com sucesso!');
      } else {
        console.log("Criando novo animal");
        await axios.post(`${API_BASE}/animais`, animalData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Animal adicionado com sucesso!');
      }

      history.goBack();
    } catch (err: any) {
      console.error('Erro ao salvar animal:', err);
      alert(err?.response?.data?.message || 'Erro ao salvar animal');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{id ? 'Editar Animal' : 'Adicionar Animal'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#FFF9E5' }}>
        <IonList style={{ background: '#FFF9E5' }}>
          <IonItem>
            <IonInput
              label="Nome"
              labelPlacement="stacked"
              placeholder="Nome do animal"
              value={animal.nome || ""}
              onIonChange={(e) => setAnimal(prev => ({ ...prev, nome: e.detail.value || "" }))}
            />
          </IonItem>
          <IonItem>
            <IonInput
              label="Raça"
              labelPlacement="stacked"
              placeholder="Raça do animal"
              value={animal.raca || ""}
              onIonChange={(e) => setAnimal(prev => ({ ...prev, raca: e.detail.value || "" }))}
            />
          </IonItem>
          <IonItem>
            <IonInput
              type="number"
              label="Idade"
              labelPlacement="stacked"
              placeholder="Idade em anos"
              value={animal.idade?.toString() || "0"}
              onIonChange={(e) => setAnimal(prev => ({ ...prev, idade: parseInt(e.detail.value || "0") }))}
            />
          </IonItem>
        </IonList>

        <IonButton
          expand="block"
          onClick={handleSubmit}
          style={{ '--background': '#004030', color: '#FFF9E5', margin: '20px' }}
        >
          {id ? 'Atualizar Animal' : 'Salvar Animal'}
        </IonButton>
      </IonContent>

      <IonFooter>
        <IonToolbar style={{ "--background": "#DCD0A8", "--border-color": "#DCD0A8", "--min-height": "64px", "--padding": "6px 6px" }}>
          <div style={{ display: "flex", flexWrap: "nowrap", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "6px", overflow: "hidden" }}>
            <IonButton fill="clear" routerLink="/mapa" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <IonIcon icon={mapOutline} style={{ color: "#004030", fontSize: "18px" }} />
                <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Mapa</IonLabel>
              </div>
            </IonButton>
            <IonButton fill="clear" routerLink="/market" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <IonIcon icon={cartOutline} style={{ color: "#004030", fontSize: "18px" }} />
                <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Market</IonLabel>
              </div>
            </IonButton>
            <IonButton fill="clear" routerLink="/lista" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
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
            <IonButton fill="clear" routerLink="/settings/conta" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
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

export default AdicionarAnimal;