// src/pages/VeterinariosPage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import logo from "../lista/logo.png";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonCard,
  IonItem,
  IonAvatar,
  IonNote,
  IonLabel,
  IonFooter,
} from "@ionic/react";
import { settingsOutline, mapOutline, cartOutline, listOutline, bandageOutline, logOutOutline } from "ionicons/icons";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  user_id: string;
}

interface Veterinario {
  _id?: string;
  nome: string;
  especialidade: string;
  telefone: string;
  email?: string;
  disponivel: boolean;
}

interface Contact {
  _id: string;
  username: string;
  email?: string;
  telefone?: string;
  type?: string;
}

const VeterinariosPage: React.FC = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

  // 🔹 pegar id do usuário do token
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      setUserId(decoded.user_id);
    } catch (err) {
      console.error("Erro ao decodificar token:", err);
    }
  }, []);

  // 🔹 buscar tipo do usuário no backend
  useEffect(() => {
    if (!userId) return;
    const fetchUserType = async () => {
      try {
        const res = await axios.get(`${API_BASE}/veterinarios/${userId}/type`, { withCredentials: true });
        setUserType(res.data.type || null);
      } catch (err) {
        console.error("Erro ao buscar tipo do usuário:", err);
      }
    };
    fetchUserType();
  }, [userId]);

  // 🔹 buscar veterinários se não for veterinário
  useEffect(() => {
    if (userType === "veterinario" || !userType) return;

    const fetchVeterinarios = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/veterinarios`, { withCredentials: true });
        const rawList: any[] = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const list = rawList.map((item) => ({
          _id: item._id || item.id,
          nome: item.nome_completo || item.username || item.nome || item.name || "Sem nome",
          especialidade: item.especializacao || item.especialidade || item.descricao || "",
          telefone: item.telefone || item.phone || "",
          email: item.email || "",
          disponivel: item.disponivel ?? true,
        }));
        setVeterinarios(list);
      } catch (err: any) {
        console.error("Erro ao buscar veterinários:", err);
        setError(err?.response?.data?.message || err.message || "Erro ao obter veterinários");
        setVeterinarios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVeterinarios();
  }, [userType]);

  // 🔹 buscar contatos de chat se for veterinário
  useEffect(() => {
    if (userType !== "veterinario" || !userId) return;

    const fetchContacts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/chats/contacts/${userId}`);
        const contatos: Contact[] = (res.data || []).map((c: Contact) => ({
          ...c,
          type: c.type === "user" ? "cliente" : c.type,
        }));
        setContacts(contatos);
      } catch (err) {
        console.error("Erro ao buscar contatos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [userType, userId]);

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
  const renderCard = (item: any, isContact = false) => (
    <IonCard
      key={item._id}
      style={{
        backgroundColor: "#DCD0A8",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        marginBottom: "12px",
        position: "relative",
      }}
    >
      <IonItem lines="none" style={{ "--background": "#DCD0A8", borderRadius: "16px", padding: "8px 4px" }}>
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
              color: "#FFF9E5",
              fontWeight: "bold",
            }}
          >
            {isContact ? item.username?.[0]?.toUpperCase() : item.nome?.[0]?.toUpperCase() || "?"}
          </div>
        </IonAvatar>

        <IonLabel>
          <h2 style={{ fontWeight: 600, color: "#004030", fontSize: "15px", marginBottom: "2px" }}>
            {isContact ? item.username : item.nome}
          </h2>

          {!isContact && item.especialidade && (
            <p style={{ color: "#004030b0", fontSize: "13px", margin: 0 }}>{item.especialidade}</p>
          )}
          {isContact && item.email && (
            <p style={{ color: "#004030b0", fontSize: "12px", marginTop: 2 }}>{item.email}</p>
          )}
          {isContact && item.type && (
            <p style={{ color: "#666", fontSize: "12px", marginTop: 2 }}>{item.type}</p>
          )}
        </IonLabel>


        <IonButton
          fill="solid"
          size="small"
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            fontSize: "12px",
            padding: "4px 8px",
            '--background': '#004030', // verde completo
            '--color': '#FFF9E5',       // cor do texto
            zIndex: 10,
          }}
          onClick={() => {
            if (!userId) return;
            const targetId = item._id;
            window.location.href = `/chat/${userId}/${targetId}`;
          }}
        >
          Chat
        </IonButton>
      </IonItem>
    </IonCard>
  );

  return (
    <IonPage style={{ backgroundColor: "#FFF9E5", color: "#004030" }}>
      <IonHeader translucent={false}>
        <IonToolbar
          style={{
            ["--background" as any]: "#FFF9E5",
            ["--color" as any]: "#004030",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 12px",
          }}
        >
          <img
            src={logo}
            alt="perfil"
            style={{ borderRadius: "50%", width: 40, height: 40, border: "2px solid #DCD0A8", objectFit: "cover" }}
          />
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

      <IonContent style={{ backgroundColor: "#FFF9E5", padding: "16px" }}>
        {loading && <p style={{ color: "#004030" }}>A carregar...</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {!loading && userType === "veterinario" && contacts.length === 0 && (
          <p style={{ color: "#004030b0" }}>Nenhum contato encontrado.</p>
        )}
        {!loading && userType !== "veterinario" && veterinarios.length === 0 && !error && (
          <p style={{ color: "#004030b0" }}>Nenhum veterinário encontrado.</p>
        )}

        {/* Lista de cards */}
        {userType === "veterinario"
          ? contacts.map((c) => renderCard(c, true))
          : veterinarios.map((v) => renderCard(v))}
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
                <IonLabel style={{ color: "#004030", fontSize: 11 }}>Veterinários</IonLabel>
              </div>
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default VeterinariosPage;
