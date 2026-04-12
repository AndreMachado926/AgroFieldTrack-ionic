// src/pages/ChatPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonButton,
    IonButtons,
    IonIcon,
} from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { jwtDecode } from "jwt-decode";
import "./ChatPage.css";

interface DecodedToken {
    user_id: string;
}
interface Mensagem {
    sender_id: string;
    sender_type: string;
    text: string;
    createdAt: string;
}

interface Chat {
    _id: string;
    user1_id: string;
    user1_type: string;
    user2_id: string;
    user2_type: string;
}

interface ChatCookie {
    user1_id: string;
    user2_id: string;
}

const ChatPage: React.FC = () => {
    const { user2_id } = useParams<{ user2_id?: string }>();
    
    const [chat, setChat] = useState<Chat | null>(null);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [input, setInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const mensagensRef = useRef<Mensagem[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const [chatUsers, setChatUsers] = useState<ChatCookie | null>(null);

    const getToken = (): string | null => {
        const match = document.cookie.match(/(^| )auth=([^;]+)/);
        return match ? decodeURIComponent(match[2]) : localStorage.getItem("authToken");
    };

    const getCookie = (name: string): string | null => {
        const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
        return match ? decodeURIComponent(match[2]) : null;
    };

    const getChatUsers = (): ChatCookie | null => {
        const raw = getCookie("chatUsers");
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            if (parsed?.user1_id && parsed?.user2_id) return parsed;
        } catch (err) {
            console.error("Erro ao parsear cookie chatUsers:", err);
        }
        return null;
    };

    const token = getToken();
    const decoded = token ? jwtDecode<DecodedToken>(token) : null;
    const user1_id = decoded ? decoded.user_id : null;
    const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

    const currentUserId = user1_id || chatUsers?.user1_id || null;
    const chatUser2Id = chatUsers?.user2_id || user2_id || null;

    const fetchOrCreateChat = async (): Promise<Chat | null> => {
        if (!currentUserId || !chatUser2Id) return null;

        setChatLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/chat/${currentUserId}/${chatUser2Id}`);
            setChat(res.data);
            return res.data;
        } catch (err) {
            console.error("Erro ao buscar/criar chat:", err);
            return null;
        } finally {
            setChatLoading(false);
        }
    };

    // 🔹 scroll automático
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens]);

    useEffect(() => {
        setChatUsers(getChatUsers());
    }, []);

    useEffect(() => {
        const socket = io(API_BASE, {
            transports: ["websocket"],
            auth: { token },
            withCredentials: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket conectado:", socket.id);
        });

        socket.on("new-message", (message: Mensagem) => {
            setMensagens((prev) => [...prev, message]);
        });

        socket.on("connect_error", (err) => {
            console.error("Erro de conexão websocket:", err);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [API_BASE, token]);

    // 🔹 buscar ou criar chat
    useEffect(() => {
        if (!currentUserId || !chatUser2Id) return;
        fetchOrCreateChat();
    }, [currentUserId, chatUser2Id]);

    const canSend = !!input.trim() && !!currentUserId && !!chat && !chatLoading;

    useEffect(() => {
        if (!chat?._id || !socketRef.current || !currentUserId) return;
        socketRef.current.emit("join-chat", {
            chatId: chat._id,
            userId: currentUserId,
        });
    }, [chat?._id, currentUserId]);

    // 🔹 buscar mensagens antigas
    useEffect(() => {
        if (!chat?._id) return;

        const fetchMessages = async () => {
            try {
                const res = await axios.get(`${API_BASE}/chat/${chat._id}/messages`);
                const novasMensagens: Mensagem[] = res.data || [];

                const igual =
                    novasMensagens.length === mensagensRef.current.length &&
                    novasMensagens.every((m, i) =>
                        m.sender_id === mensagensRef.current[i].sender_id &&
                        m.sender_type === mensagensRef.current[i].sender_type &&
                        m.text === mensagensRef.current[i].text &&
                        m.createdAt === mensagensRef.current[i].createdAt
                    );

                if (!igual) {
                    mensagensRef.current = novasMensagens;
                    setMensagens(novasMensagens);
                }
            } catch (err) {
                console.error("Erro ao buscar mensagens:", err);
            }
        };

        fetchMessages();
    }, [chat?._id]);

    // 🔹 enviar mensagem
    const sendMessage = async () => {
        if (!input.trim() || !currentUserId) return;

        const currentChat = chat || await fetchOrCreateChat();
        if (!currentChat) return;

        const sender_type =
            currentUserId === currentChat.user1_id ? currentChat.user1_type : currentChat.user2_type;

        const message: Mensagem = {
            sender_id: currentUserId,
            sender_type,
            text: input,
            createdAt: new Date().toISOString(),
        };

        if (socketRef.current?.connected) {
            socketRef.current.emit("send-message", {
                chatId: currentChat._id,
                sender_id: currentUserId,
                sender_type,
                text: input,
            });
            setMensagens((prev) => [...prev, message]);
            setInput("");
            return;
        }

        try {
            await axios.post(`${API_BASE}/chat/${currentChat._id}`, {
                sender_id: currentUserId,
                sender_type,
                text: input,
            });
            setMensagens((prev) => [...prev, message]);
            setInput("");
        } catch (err) {
            console.error("Erro ao enviar mensagem:", err);
        }
    };

    return (
        <IonPage className="chat-page">
            <IonHeader>
                <IonToolbar className="chat-toolbar">
                    {/* 🔹 Botão de voltar */}
                    <IonButtons slot="start">
                        <IonButton routerLink="/veterinarios" fill="clear">
                            <IonIcon icon={arrowBackOutline} className="back-icon" />
                        </IonButton>
                    </IonButtons>

                    <IonTitle className="chat-title">Chat</IonTitle>
                </IonToolbar>

            </IonHeader>

            <IonContent className="chat-content">
                {/* mensagens */}
                <div className="message-list">
                    {mensagens.map((m, i) => (
                        <div
                            key={i}
                            className={`message-row ${m.sender_id === currentUserId ? "message-self" : "message-other"}`}
                        >
                            <span className="message-bubble">
                                {m.text}
                            </span>
                            <div className="message-time">
                                {new Date(m.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* input */}
                <div className="chat-input-row">
                    <IonInput
                        className="chat-input"
                        value={input}
                        placeholder="Digite sua mensagem"
                        onIonChange={(e) => setInput(e.detail.value ?? "")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && canSend) sendMessage();
                        }}
                    />
                    <IonButton
                        type="button"
                        className="chat-send-button"
                        onClick={sendMessage}
                        disabled={!canSend}
                    >
                        Enviar
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ChatPage;
