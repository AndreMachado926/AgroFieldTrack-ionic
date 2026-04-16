import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonCard,
  IonLabel,
  IonIcon,
} from "@ionic/react";
import FooterNav from "../../components/FooterNav";
import {
  mapOutline,
  cartOutline,
  listOutline,
  bandageOutline,
  logOutOutline,
  settingsOutline,
} from "ionicons/icons";

interface DecodedToken {
  user_id: string;
  type?: string;
}

type Animal = {
  _id?: string;
  nome: string;
  raca?: string;
  idade?: number;
  localizacaoX?: number | null;
  localizacaoY?: number | null;
  dono_id?: string | { nome_completo?: string; username?: string };
};

const ListaVetPage: React.FC = () => {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com".replace(/\/+$/, "");

  const getToken = () => {
    const match = document.cookie.match(/(^| )auth=([^;]+)/);
    return match ? match[2] : localStorage.getItem("authToken");
  };

  const fetchAnimais = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) throw new Error("Não autenticado");

      const decoded = jwtDecode<DecodedToken>(token);
      const userId = decoded.user_id;
      let currentUserType = decoded.type;

      if (!currentUserType) {
        try {
          const typeRes = await axios.get(`${API_BASE}/veterinarios/${userId}/type`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          currentUserType = typeRes.data.type;
        } catch (typeErr) {
          console.warn("Falha ao obter tipo de usuário:", typeErr);
        }
      }

      const endpoint = currentUserType === "veterinario"
        ? `${API_BASE}/veterinarios/${userId}/shared-animals`
        : `${API_BASE}/animais/${userId}`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = res.data;
      const data: Animal[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : payload.data || [];

      setAnimais(data);
    } catch (err: any) {
      console.error("Erro ao buscar animais:", err);
      setError(err?.response?.data?.message || err.message || "Erro ao obter animais");
      if (err?.response?.status === 401) window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimais();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <IonPage style={{ backgroundColor: "#FFF9E5", color: "#004030" }}>
      <IonHeader>
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
          <IonTitle>Lista Veterinários</IonTitle>
          <IonButtons slot="end" style={{ display: "flex", gap: "4px" }}>
            <IonButton fill="clear" href="/#/settings">
              <IonIcon icon={settingsOutline} style={{ color: "#004030", fontSize: "24px" }} />
            </IonButton>
            <IonButton fill="clear" onClick={handleLogout}>
              <IonIcon icon={logOutOutline} style={{ color: "#004030", fontSize: "24px" }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ padding: "16px" }}>
        {loading && <p style={{ color: "#004030" }}>Carregando...</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {!loading && !error && animais.length === 0 && (
          <p style={{ color: "#666" }}>Nenhum animal encontrado para este usuário.</p>
        )}

        {animais.map((animal) => (
          <IonCard key={animal._id} style={{ marginBottom: "12px", borderRadius: "14px" }}>
            <div style={{ padding: "16px" }}>
              <h2 style={{ margin: "0 0 6px", color: "#004030" }}>{animal.nome}</h2>
              <p style={{ margin: 0, color: "#004030b0" }}>
                Raça: {animal.raca ?? "—"}
              </p>
              <p style={{ margin: "6px 0 0", color: "#004030b0" }}>
                Idade: {animal.idade ?? "—"}
              </p>
              <p style={{ margin: "6px 0 0", color: "#666" }}>
                Localização: {animal.localizacaoX ?? "—"}, {animal.localizacaoY ?? "—"}
              </p>
            </div>
          </IonCard>
        ))}
      </IonContent>

      <FooterNav />
    </IonPage>
  );
};

export default ListaVetPage;
