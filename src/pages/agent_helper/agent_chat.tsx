import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { useHistory } from "react-router-dom";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  isLoading?: boolean;
}

const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

const AgentChatPage: React.FC = () => {
  const history = useHistory();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "agent",
      text: "Olá! Sou um assistente de IA aqui para ajudá-lo com informações sobre seus animais, plantações e muito mais. Como posso ajudá-lo hoje?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<"available" | "unavailable" | "checking">("checking");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showAboutDialog, setShowAboutDialog] = useState(false);

  // Verificar status do Ollama ao carregar
  useEffect(() => {
    const checkAiStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE}/ai/status`);
        setAiStatus(response.data.status?.ollamaAvailable ? "available" : "unavailable");
      } catch (err) {
        console.error("[Agent] Erro ao verificar status da IA:", err);
        setAiStatus("unavailable");
      }
    };
    checkAiStatus();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || aiStatus !== "available") return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Enviar para IA
    axios
      .post(`${API_BASE}/ai/chat`, {
        message: input.trim(),
        conversationHistory: messages.map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
      })
      .then((response) => {
        const agentMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          sender: "agent",
          text: response.data.response || "Desculpe, recebi uma resposta vazia.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, agentMessage]);
      })
      .catch((err) => {
        console.error("[Agent] Erro ao enviar mensagem:", err);
        const errorMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          sender: "agent",
          text:
            err.response?.data?.error ||
            "Desculpe, ocorreu um erro ao processar sua pergunta. Verifique se o serviço de IA está disponível.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canSend = input.trim().length > 0 && !isLoading && aiStatus === "available";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#FFF9E5" }}>
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#FFF9E5",
          color: "#004030",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => history.goBack()}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Avatar
            sx={{
              bgcolor: aiStatus === "available" ? "#DCD0A8" : "#E8D5C4",
              color: "#004030",
              mr: 2,
              width: 40,
              height: 40,
            }}
          >
            <SmartToyIcon />
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#004030" }}>
              Assistente de IA
            </Typography>
            <Typography variant="caption" sx={{ color: aiStatus === "available" ? "#4A9782" : "#B42318" }}>
              {aiStatus === "checking" && "Verificando status..."}
              {aiStatus === "available" && "Online • Pronto para ajudar"}
              {aiStatus === "unavailable" && "Offline • Serviço indisponível"}
            </Typography>
          </Box>

          <IconButton
            color="inherit"
            onClick={() => setShowAboutDialog(true)}
            sx={{ ml: 1 }}
          >
            <Typography variant="body2" sx={{ color: "#004030", fontWeight: 600 }}>
              ?
            </Typography>
          </IconButton>
        </Toolbar>
        <Divider sx={{ backgroundColor: "#DCD0A8" }} />
      </AppBar>

      {/* Status Alert */}
      {aiStatus === "unavailable" && (
        <Alert severity="warning" sx={{ m: 2, mb: 1 }}>
          <Typography variant="body2">
            <strong>Serviço de IA indisponível.</strong> Certifique-se de que o Ollama está em execução localmente. Execute: <code>ollama serve</code>
          </Typography>
        </Alert>
      )}

      {/* Messages Container */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#DCD0A8",
            borderRadius: "4px",
            "&:hover": {
              background: "#B5A88C",
            },
          },
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: "flex",
              justifyContent: message.sender === "user" ? "flex-end" : "flex-start",
              mb: 1,
            }}
          >
            <Paper
              sx={{
                maxWidth: "75%",
                px: 2,
                py: 1.5,
                borderRadius: "16px",
                backgroundColor:
                  message.sender === "user" ? "#004030" : "#DCD0A8",
                color: message.sender === "user" ? "#FFF9E5" : "#004030",
                boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
              }}
            >
              <Typography variant="body2" sx={{ mb: 0.5, lineHeight: 1.5 }}>
                {message.text}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  opacity: 0.7,
                  fontSize: "0.75rem",
                }}
              >
                {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Paper>
          </Box>
        ))}

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
            <Paper
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: "16px",
                backgroundColor: "#DCD0A8",
                color: "#004030",
                boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CircularProgress size={16} sx={{ color: "#004030" }} />
              <Typography variant="body2">Digitando...</Typography>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          backgroundColor: "#FFF9E5",
          borderTop: "1px solid #DCD0A8",
          p: 2,
          display: "flex",
          gap: 1,
          alignItems: "flex-end",
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          minRows={1}
          placeholder={aiStatus === "available" ? "Digite sua pergunta..." : "Serviço indisponível..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || aiStatus !== "available"}
          variant="outlined"
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#FFF",
              borderRadius: "24px",
              color: "#004030",
              "& fieldset": {
                borderColor: "#DCD0A8",
              },
              "&:hover fieldset": {
                borderColor: aiStatus === "available" ? "#004030" : "#DCD0A8",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#004030",
              },
              "&.Mui-disabled": {
                backgroundColor: "#F5F5F5",
              },
            },
            "& .MuiOutlinedInput-input::placeholder": {
              color: "#004030b0",
              opacity: 1,
            },
          }}
        />

        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!canSend}
          sx={{
            backgroundColor: "#004030",
            color: "#FFF9E5",
            borderRadius: "50%",
            minWidth: "44px",
            height: "44px",
            p: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": {
              backgroundColor: "#3A8772",
            },
            "&:disabled": {
              backgroundColor: "#DCD0A8",
              color: "#004030b0",
            },
          }}
        >
          <SendIcon />
        </Button>
      </Box>

      {/* About Dialog */}
      <Dialog
        open={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#FFF9E5",
            color: "#004030",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#004030" }}>
          Sobre o Assistente de IA
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
              Este é um assistente de inteligência artificial desenvolvido para
              ajudá-lo com informações sobre:
            </Typography>
            <ul style={{ color: "#004030", paddingLeft: "20px" }}>
              <li>Manejo de animais</li>
              <li>Cultivo de plantações</li>
              <li>Recomendações de remédios</li>
              <li>Dicas gerais de agricultura</li>
              <li>Informações sobre serviços veterinários</li>
            </ul>
            <Typography variant="body2" sx={{ mt: 2, color: "#004030b0" }}>
              Estou disponível 24/7 para responder suas dúvidas e fornecer orientações úteis.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowAboutDialog(false)}
            variant="contained"
            sx={{
              backgroundColor: "#004030",
              color: "#FFF9E5",
              "&:hover": {
                backgroundColor: "#3A8772",
              },
            }}
          >
            Entendi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentChatPage;
