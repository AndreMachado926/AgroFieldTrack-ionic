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
  IonTitle,
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
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
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
  bandageOutline,
  addOutline,
  backspace,  // add this import
} from "ionicons/icons";
import { jwtDecode } from "jwt-decode";

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
};

type Plantacao = {
  _id?: string;
  id?: string;
  planta: string;
  localizacaoX: number;
  localizacaoY: number;
  dono_id: string;
  createdAt?: string;
  updatedAt?: string;
};

interface Veterinario {
  _id?: string;
  id?: string;
  nome: string;
  especialidade: string;
  telefone: string;
  email?: string;
  disponivel: boolean;
}

const VeterinariosPage: React.FC = () => {
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newVeterinario, setNewVeterinario] = useState<Partial<Veterinario>>({});

  const API_BASE = ("https://agrofieldtrack-node-1yka.onrender.com").replace(/\/+$/, '');

  const fetchVeterinarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/veterinarios`, { withCredentials: true });
      const payload = res.data;
      const rawList = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : payload.data ?? payload;

      // normalizar campos do backend para o nosso tipo Veterinario
      const list = rawList.map((item: any) => ({
        _id: item._id || item.id,
        nome:
          item.nome_completo ||
          item.username ||
          item.nome ||
          item.name ||
          'Sem nome',
        especialidade:
          item.especializacao ||
          item.especialidade ||
          item.descricao ||
          '',
        telefone: item.telefone || item.phone || '',
        email: item.email || '',
        disponivel: item.disponivel ?? true,
      }));

      setVeterinarios(list);
    } catch (err: any) {
      console.error('Fetch veterinários erro:', err);
      setError(err?.response?.data?.message || err.message || 'Erro ao obter veterinários');
      setVeterinarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVeterinarios();
  }, []);

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
      </IonHeader>

      {/* CONTEÚDO */}
      <IonContent
        style={{
          backgroundColor: "#FFF9E5",
          padding: "16px",
        }}
      >
        {loading && <p style={{ color: "#004030" }}>A carregar veterinários...</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {!loading && veterinarios.length === 0 && !error && (
          <p style={{ color: "#004030b0" }}>Nenhum veterinário encontrado.</p>
        )}

        {veterinarios.map((vet, i) => (
          <IonCard
            key={vet._id ?? vet.id ?? i}
            style={{
              backgroundColor: "#DCD0A8",
              borderRadius: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: "12px",
              position: "relative" // 🔹 necessário para posicionar botão absoluto
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
                    icon={bandageOutline}
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
                  {vet.nome}
                </h2>
                <p style={{ color: "#004030b0", fontSize: "13px", margin: 0 }}>
                  {vet.especialidade || "Sem especialidade"}
                </p>
                {vet.email ? (
                  <p
                    style={{
                      color: "#004030b0",
                      fontSize: "12px",
                      marginTop: 4,
                    }}
                  >
                    {vet.email}
                  </p>
                ) : null}
              </IonLabel>

              <IonNote
                slot="end"
                style={{
                  color: "#004030",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {vet.telefone || "—"}
              </IonNote>
            </IonItem>

            {/* 🔹 Botão de Chat no canto inferior direito */}
            <IonButton
              fill="solid"
              size="small"
              style={{
                position: "absolute",
                bottom: "8px",
                right: "8px",
                fontSize: "12px",
                padding: "4px 8px",
                backgroundColor: "#004030",
                color: "#FFF9E5",
                zIndex: 10, // garante que fique acima do card
              }}
              onClick={() => {
                const token = localStorage.getItem("authToken") || "";
                const decoded: DecodedToken = jwtDecode(token);
                const user1_id = decoded.user_id;
                const user1_type = "user"; // ou "admin", dependendo do tipo do usuário logado
                const user2_id = vet._id;
                const user2_type = "veterinario";

                // redireciona para a rota com os parâmetros
                window.location.href = `/chat/${user1_id}/${user1_type}/${user2_id}/${user2_type}`;
              }}
            >
              Chat
            </IonButton>
          </IonCard>
        ))}
      </IonContent>

      {/* Floating Action Button */}


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
          </div>
        </IonToolbar>
      </IonFooter>

    </IonPage>
  );
};

export default VeterinariosPage;
