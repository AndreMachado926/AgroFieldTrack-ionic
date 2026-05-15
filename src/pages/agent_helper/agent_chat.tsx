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
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { useHistory } from "react-router-dom";
import FooterNav from "../../components/FooterNav";
import HeaderNav from "../../components/HeaderNav";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<"available" | "unavailable" | "checking">("checking");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showAboutDialog, setShowAboutDialog] = useState(false);

  // Verificar status da IA (OpenAI ou Ollama)
  useEffect(() => {
    const checkAiStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE}/ai/status`);
        setAiStatus(response.data.status?.serviceRunning ? "available" : "unavailable");
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

  useEffect(() => {
    if (!attachedImage) {
      setAttachedImageUrl(null);
      return;
    }

    const url = URL.createObjectURL(attachedImage);
    setAttachedImageUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [attachedImage]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Não foi possível converter a imagem para base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async () => {
    // Debug entry
    // eslint-disable-next-line no-console
    console.debug('[Agent] handleSendMessage start', { inputPreview: input.slice(0, 120), aiStatus, isLoading });

    if (!input.trim()) {
      // eslint-disable-next-line no-console
      console.warn('[Agent] Aborting send: empty input');
      return;
    }

    if (aiStatus === 'unavailable') {
      // eslint-disable-next-line no-console
      console.warn('[Agent] AI service reports unavailable — still saving prompt and attempting AI call');
      // continue: allow saving prompts even if AI is currently unavailable
    }

    // Extract user_id from authToken in localStorage
    let userId: string | null = null;
    try {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        const parts = authToken.split('.');
        if (parts.length === 3) {
          // Decode JWT payload (second part)
          const payload = JSON.parse(atob(parts[1]));
          userId = payload.user_id || payload.id || null;
          // eslint-disable-next-line no-console
          console.debug('[Agent] Extracted user_id from authToken:', userId);
        }
      }
    } catch (err) {
      console.error('[Agent] Failed to extract user_id from authToken:', err);
    }

    const promptText = input.trim();

    // Add user message immediately for UI
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const promptPayload: any = { 
      texto: promptText,
      user_id: userId
    };
    if (attachedImage) {
      try {
        promptPayload.imagem = await fileToBase64(attachedImage);
      } catch (err) {
        console.error('[Agent] Erro ao converter imagem para base64:', err);
      }
    }

    // Send to AI FIRST and await response
    // Build conversation history including the just-added user message
    const historyForSend = [...messages, userMessage].map((m) => ({ sender: m.sender, text: m.text }));
    try {
      // eslint-disable-next-line no-console
      console.debug('[Agent] Sending to AI at', `${API_BASE}/ai/chat`, { promptText: promptText.slice(0, 50), historyLength: historyForSend.length });
      const aiRes = await axios.post(
        `${API_BASE}/ai/chat`,
        { message: promptText, conversationHistory: historyForSend },
        { withCredentials: true }
      );

      // eslint-disable-next-line no-console
      console.debug('[Agent] AI response received', { status: aiRes?.status, dataKeys: Object.keys(aiRes?.data || {}), data: aiRes?.data });
      
      const agentText = aiRes?.data?.response || aiRes?.data?.answer || 'Desculpe, recebi uma resposta vazia.';
      const agentMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        text: agentText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMessage]);
      // eslint-disable-next-line no-console
      console.debug('[Agent] AI response added to messages');

      // Only save prompt AFTER successful AI response
      try {
        // eslint-disable-next-line no-console
        console.debug('[Agent] Saving prompt to', `${API_BASE}/prompts`, { texto: promptText.slice(0, 50), hasImage: !!promptPayload.imagem, user_id: userId });
        const saveRes = await axios.post(`${API_BASE}/prompts`, promptPayload, { withCredentials: true });
        // eslint-disable-next-line no-console
        console.debug('[Agent] Prompt saved successfully', { data: saveRes?.data, status: saveRes?.status });
        // clear attached image on success
        setAttachedImage(null);
      } catch (err: any) {
        console.error('[Agent] Erro ao salvar prompt:', {
          status: err?.response?.status,
          error: err?.response?.data?.error,
          message: err?.message,
          fullError: err?.response?.data || err
        });
      }
    } catch (err: any) {
      console.error('[Agent] Erro ao enviar mensagem para AI:', {
        status: err?.response?.status,
        error: err?.response?.data?.error,
        message: err?.message,
        fullError: err?.response?.data || err
      });
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        text:
          err?.response?.data?.error ||
          'Desculpe, ocorreu um erro ao processar sua pergunta. Verifique se o serviço de IA está disponível.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      // NOTE: Prompt NOT saved on AI error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedImage(file);
    }
  };

  // Enable send when user has typed and not loading. Do not block on aiStatus here
  const canSend = input.trim().length > 0 && !isLoading;

  // Debugging: log send availability when inputs change
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[Agent] canSend=', canSend, { inputPreview: input.slice(0, 40), isLoading, aiStatus });
  }, [canSend, input, isLoading, aiStatus]);

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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#FFF9E5" }}>
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#FFF9E5",
          color: "#004030",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <HeaderNav onLogout={handleLogout} />
        <Divider sx={{ backgroundColor: "#DCD0A8" }} />
      </AppBar>

      

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

      {attachedImageUrl && (
        <Box sx={{ px: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box
            component="img"
            src={attachedImageUrl}
            alt={attachedImage?.name || 'Imagem anexada'}
            sx={{
              width: 88,
              height: 88,
              borderRadius: 2,
              objectFit: 'cover',
              border: '1px solid #DCD0A8',
            }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#004030', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {attachedImage?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              {(attachedImage?.size ? Math.round(attachedImage.size / 1024) : 0)} KB
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setAttachedImage(null)}
            sx={{ color: '#004030' }}
          >
            <ClearIcon />
          </IconButton>
        </Box>
      )}

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
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleAttachImage}
        />

        <IconButton
          aria-label="Anexar imagem"
          onClick={() => fileInputRef.current?.click()}
          sx={{
            backgroundColor: '#FFF',
            border: '1px solid #DCD0A8',
            color: '#004030',
            p: 1,
            '&:hover': {
              backgroundColor: '#F5F5F5',
            },
          }}
        >
          <AttachFileIcon />
        </IconButton>

        <TextField
          fullWidth
          multiline
          maxRows={4}
          minRows={1}
          placeholder={aiStatus === "available" ? "Digite sua pergunta..." : aiStatus === "checking" ? "Verificando serviço de IA..." : "Serviço indisponível..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
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
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#FFF9E5',
            color: '#004030',
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
      <FooterNav />
    </Box>
  );
};

export default AgentChatPage;
