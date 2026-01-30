import React, { useEffect, useState } from "react";
import axios from "axios";
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonBadge,
  IonButtons,
} from "@ionic/react";
import { mapOutline, cartOutline, listOutline, personOutline, bandageOutline, settingsOutline, logOutOutline } from "ionicons/icons";

axios.defaults.withCredentials = true;
const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

interface DecodedToken {
  user_id: string;
  username: string;
  iat: number;
  exp: number;
}

interface Publication {
  _id: string;
  title: string;
  message: string;
  preco: number;
  publication_type: string;
  tags: string[];
  author: { id: string; username: string };
  imagens: string | null;
  createdAt: string;
}

const MarketPage: React.FC = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => {
    const match = document.cookie.match(/(^| )auth=([^;]+)/);
    return match ? match[2] : localStorage.getItem("authToken");
  };

  useEffect(() => {
    const fetchPublications = async () => {
      setLoading(true);
      try {
        const token = getToken();
        if (!token) throw new Error("Não autenticado");

        const res = await axios.get(`${API_BASE}/comunidade`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data: Publication[] = res.data || [];
        setPublications(data);
      } catch (err) {
        console.error(err);
        setError("Sessão expirada ou inválida");
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
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
          <IonTitle>Market</IonTitle>
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
          <IonText style={{ display: "block", textAlign: "center", marginTop: 20 }}>
            A carregar publicações...
          </IonText>
        )}
        {error && (
          <IonText color="danger" style={{ display: "block", textAlign: "center", marginTop: 20 }}>
            {error}
          </IonText>
        )}
        {!loading && publications.length === 0 && (
          <IonText style={{ display: "block", textAlign: "center", marginTop: 20 }}>
            Nenhuma publicação encontrada
          </IonText>
        )}

        {publications.map((pub) => (
          <IonCard key={pub._id} style={{ margin: "10px" }}>
            <IonCardHeader>
              <IonCardTitle>{pub.title}</IonCardTitle>
              <small>Autor: {pub.author.username}</small>
            </IonCardHeader>
            <IonCardContent>
              <p>{pub.message}</p>
              <p>Preço: R$ {pub.preco}</p>
              <p>Tipo: {pub.publication_type}</p>

              {/* Tags */}
              {pub.tags && pub.tags.length > 0 && (
                <div style={{ marginTop: 5 }}>
                  {pub.tags.map((tag, idx) => (
                    <IonChip key={idx}>
                      <IonLabel>{tag}</IonLabel>
                    </IonChip>
                  ))}
                </div>
              )}

              {/* Imagem */}
              {pub.imagens && (
                <img
                  src={`data:image/jpeg;base64,${pub.imagens}`}
                  alt={pub.title}
                  style={{ width: "100%", marginTop: 5 }}
                />
              )}

              <small style={{ display: "block", marginTop: 5 }}>
                Publicado em: {new Date(pub.createdAt).toLocaleString()}
              </small>
            </IonCardContent>
          </IonCard>
        ))}
      </IonContent>

      {/* Footer mantido igual */}
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

export default MarketPage;
