import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

import {
  Box,
  Container,
  Card as MuiCard,
  CardContent,
  CardActions,
  Typography,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Button as MuiButton,
} from "@mui/material";
import FooterNav from "../../components/FooterNav";
import HeaderNav from "../../components/HeaderNav";

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
  const [filterType, setFilterType] = useState("todos");

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
    <Box sx={{ backgroundColor: "#FFF9E5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <HeaderNav onLogout={handleLogout} />

      <Container maxWidth="md" sx={{ flex: 1, py: 2 }}>
        {/* Filter Tabs */}
        <Box sx={{ mx: 2, mt: 2, mb: 1, borderRadius: 3, backgroundColor: '#FFF9E5', boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}>
          <Tabs
            value={filterType}
            onChange={(e, newValue) => setFilterType(newValue)}
            textColor="inherit"
            indicatorColor="primary"
            variant="fullWidth"
            aria-label="Publication type tabs"
            sx={{
              '& .MuiTab-root': {
                color: '#004030',
                fontWeight: 600,
              },
              '& .Mui-selected': {
                color: '#004030',
              }
            }}
          >
            <Tab label="Todos" value="todos" />
            <Tab label="Vendas" value="venda" />
            <Tab label="Serviços" value="servico" />
            <Tab label="Troca" value="troca" />
          </Tabs>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "#004030" }} />
            <Typography sx={{ ml: 2, color: "#004030" }}>A carregar publicações...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ backgroundColor: "#FDECEA", borderRadius: 2, p: 3, mb: 3, mx: 2 }}>
            <Typography sx={{ color: "#B42318", textAlign: "center" }}>{error}</Typography>
          </Box>
        )}

        {!loading && publications.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <Typography sx={{ color: "#004030b0", fontSize: "1.1rem" }}>Nenhuma publicação encontrada</Typography>
          </Box>
        )}

        {/* Publications Grid */}
        <Box sx={{ px: 2, pb: 14 }}>
          {publications
            .filter((pub) => filterType === "todos" || pub.publication_type.toLowerCase() === filterType.toLowerCase())
            .map((pub) => (
              <MuiCard
                key={pub._id}
                sx={{
                  mb: 2,
                  backgroundColor: "#DCD0A8",
                  borderRadius: "16px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  border: "1px solid #E8E0D0",
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ color: "#004030", fontWeight: 700, mb: 0.5 }}>
                        {pub.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#004030b0", mb: 1 }}>
                        Por: {pub.author.username}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ color: "#004030", mb: 1.5, lineHeight: 1.6 }}>
                    {pub.message}
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                    <Typography variant="h6" sx={{ color: "#4A9782", fontWeight: 600 }}>
                      R$ {pub.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Typography>
                    <Chip
                      label={pub.publication_type}
                      size="small"
                      sx={{
                        backgroundColor: "#FFF9E5",
                        color: "#004030",
                        fontWeight: 600,
                        border: "1px solid #DCD0A8",
                      }}
                    />
                  </Box>

                  {/* Tags */}
                  {pub.tags && pub.tags.length > 0 && (
                    <Box sx={{ mb: 1.5, display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                      {pub.tags.map((tag, idx) => (
                        <Chip
                          key={idx}
                          label={tag}
                          size="small"
                          sx={{
                            backgroundColor: "#E8F5E9",
                            color: "#2E7D32",
                            fontSize: "0.8rem",
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  {/* Imagem */}
                  {pub.imagens && (
                    <Box
                      component="img"
                      src={`data:image/jpeg;base64,${pub.imagens}`}
                      alt={pub.title}
                      sx={{
                        width: "100%",
                        borderRadius: 2,
                        mb: 1,
                        maxHeight: 250,
                        objectFit: "cover",
                      }}
                    />
                  )}

                  <Typography variant="caption" sx={{ color: "#004030b0", display: "block" }}>
                    📅 {new Date(pub.createdAt).toLocaleDateString("pt-BR")}
                  </Typography>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <MuiButton
                    fullWidth
                    variant="contained"
                    sx={{
                      backgroundColor: "#004030",
                      color: "#FFF9E5",
                      fontWeight: 600,
                      "&:hover": { backgroundColor: "#3A8772" }
                    }}
                  >
                    Ver Detalhes
                  </MuiButton>
                </CardActions>
              </MuiCard>
            ))}
        </Box>
      </Container>

      <FooterNav />
    </Box>
  );
};

export default MarketPage;
