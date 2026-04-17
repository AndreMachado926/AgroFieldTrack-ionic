import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Card,
  CardContent,
  Box,
  Container
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from "@mui/icons-material";
import FooterNav from "../../components/FooterNav";

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
    <Box sx={{ backgroundColor: "#FFF9E5", color: "#004030", minHeight: '100vh' }}>
      <AppBar position="static" sx={{ backgroundColor: "#FFF9E5", color: "#004030", boxShadow: 'none', borderBottom: '1px solid #DCD0A8' }}>
        <Toolbar sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Lista Veterinários
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton href="/#/settings" sx={{ color: "#004030" }}>
              <SettingsIcon />
            </IconButton>
            <IconButton onClick={handleLogout} sx={{ color: "#004030" }}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 2 }}>
        {loading && <Typography sx={{ color: "#004030" }}>Carregando...</Typography>}
        {error && <Typography sx={{ color: "error.main" }}>{error}</Typography>}
        {!loading && !error && animais.length === 0 && (
          <Typography sx={{ color: "#666" }}>Nenhum animal encontrado para este usuário.</Typography>
        )}

        {animais.map((animal) => (
          <Card key={animal._id} sx={{ mb: 1.5, borderRadius: "14px", backgroundColor: "#D1E8E2" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, color: "#004030" }}>
                {animal.nome}
              </Typography>
              <Typography variant="body2" sx={{ color: "#004030b0", mb: 0.5 }}>
                Raça: {animal.raca ?? "—"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#004030b0", mb: 0.5 }}>
                Idade: {animal.idade ?? "—"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Localização: {animal.localizacaoX ?? "—"}, {animal.localizacaoY ?? "—"}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Container>

      <FooterNav />
    </Box>
  );
};

export default ListaVetPage;
