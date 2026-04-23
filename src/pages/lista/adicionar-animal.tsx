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
  IonTitle
} from "@ionic/react";
import { Box, Card, CardContent, TextField, Button, Typography } from "@mui/material";
import { arrowBackOutline } from "ionicons/icons";
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
        <Box sx={{ px: 2, py: 4, display: 'flex', justifyContent: 'center' }}>
          <Card sx={{ width: '100%', maxWidth: 640, borderRadius: 3, bgcolor: '#FFFDF6', boxShadow: '0 18px 46px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Typography variant="h5" component="h1" sx={{ mb: 1, color: '#004030', fontWeight: 700 }}>
                {id ? 'Editar Animal' : 'Adicionar Animal'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#4A5732' }}>
                Insira os dados do animal para registar ou atualizar.
              </Typography>

              <Box component="form" sx={{ display: 'grid', gap: 2 }}>
                <TextField
                  label="Nome do animal"
                  variant="filled"
                  fullWidth
                  value={animal.nome || ""}
                  onChange={(e) => setAnimal(prev => ({ ...prev, nome: e.target.value }))}
                  sx={{ '& .MuiFilledInput-root': { bgcolor: '#FFF9E5' } }}
                />
                <TextField
                  label="Raça"
                  variant="filled"
                  fullWidth
                  value={animal.raca || ""}
                  onChange={(e) => setAnimal(prev => ({ ...prev, raca: e.target.value }))}
                  sx={{ '& .MuiFilledInput-root': { bgcolor: '#FFF9E5' } }}
                />
                <TextField
                  label="Idade"
                  variant="filled"
                  type="number"
                  fullWidth
                  value={animal.idade?.toString() ?? ""}
                  onChange={(e) => setAnimal(prev => ({ ...prev, idade: parseInt(e.target.value || "0") }))}
                  sx={{ '& .MuiFilledInput-root': { bgcolor: '#FFF9E5' } }}
                />
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                sx={{ mt: 3, bgcolor: '#004030', color: '#FFF9E5', '&:hover': { bgcolor: '#3A8772' } }}
              >
                {id ? 'Atualizar Animal' : 'Salvar Animal'}
              </Button>
            </CardContent>
          </Card>
        </Box>
      </IonContent>
    </IonPage>
  );
};

export default AdicionarAnimal;