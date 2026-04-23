// src/pages/VeterinariosPage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import logo from "../lista/logo.png";
import {
  AppBar,
  Toolbar,
  Avatar,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Container,
  IconButton
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from "@mui/icons-material";
import FooterNav from "../../components/FooterNav";
import HeaderNav from "../../components/HeaderNav";
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

  const setChatCookie = (user1Id: string, user2Id: string) => {
    const value = encodeURIComponent(JSON.stringify({ user1_id: user1Id, user2_id: user2Id }));
    document.cookie = `chatUsers=${value}; path=/; sameSite=Lax`;
  };

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
        const res = await axios.get(`${API_BASE}/veterinarios/${userId}/chats`);
        const chats = res.data?.data || [];

        const contatos: Contact[] = chats.map((chat: any) => {
          const otherUser = String(chat.user1_id._id) === userId ? chat.user2_id : chat.user1_id;
          return {
            _id: otherUser._id,
            username: otherUser.username || otherUser.nome_completo || otherUser.nome || "Sem nome",
            email: otherUser.email || "",
            telefone: otherUser.telefone || otherUser.phone || "",
            type: otherUser.type === "user" ? "cliente" : otherUser.type,
          };
        });

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
    }
  };
  const renderCard = (item: any, isContact = false) => (
    <Card
      key={item._id}
      sx={{
        backgroundColor: "#DCD0A8",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        mb: 1.5,
        position: "relative",
        p: 1
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <Avatar sx={{
          width: 42,
          height: 42,
          backgroundColor: "#4A9782",
          color: "#FFF9E5",
          fontWeight: "bold",
          mr: 2
        }}>
          {isContact ? item.username?.[0]?.toUpperCase() : item.nome?.[0]?.toUpperCase() || "?"}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{
            fontWeight: 600,
            color: "#004030",
            fontSize: "15px",
            mb: 0.5
          }}>
            {isContact ? item.username : item.nome}
          </Typography>

          {!isContact && item.especialidade && (
            <Typography variant="body2" sx={{
              color: "#004030b0",
              fontSize: "13px",
              m: 0
            }}>
              {item.especialidade}
            </Typography>
          )}
          {isContact && item.email && (
            <Typography variant="body2" sx={{
              color: "#004030b0",
              fontSize: "12px",
              mt: 0.5
            }}>
              {item.email}
            </Typography>
          )}
          {isContact && item.type && (
            <Typography variant="body2" sx={{
              color: "#666",
              fontSize: "12px",
              mt: 0.5
            }}>
              {item.type}
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          size="small"
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            fontSize: "12px",
            px: 1,
            backgroundColor: '#004030',
            color: '#FFF9E5',
            zIndex: 10,
            '&:hover': { backgroundColor: '#003020' }
          }}
          onClick={() => {
            const targetId = item._id;
            if (!userId || !targetId) return;
            setChatCookie(userId, targetId);
            window.location.href = "/#/chat";
          }}
        >
          Chat
        </Button>
      </Box>
    </Card>
  );

  return (
    <Box sx={{ backgroundColor: "#FFF9E5", color: "#004030", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderNav onLogout={handleLogout} />

      <Container maxWidth="md" sx={{ py: 2, backgroundColor: "#FFF9E5", flex: 1 }}>
        {loading && <Typography sx={{ color: "#004030" }}>A carregar...</Typography>}
        {error && <Typography sx={{ color: "error.main" }}>{error}</Typography>}

        {!loading && userType === "veterinario" && contacts.length === 0 && (
          <Typography sx={{ color: "#004030b0" }}>Nenhum contato encontrado.</Typography>
        )}
        {!loading && userType !== "veterinario" && veterinarios.length === 0 && !error && (
          <Typography sx={{ color: "#004030b0" }}>Nenhum veterinário encontrado.</Typography>
        )}

        {/* Lista de cards */}
        {userType === "veterinario"
          ? contacts.map((c) => renderCard(c, true))
          : veterinarios.map((v) => renderCard(v))}
      </Container>

      <FooterNav />
    </Box>
  );
};

export default VeterinariosPage;
