// src/pages/ChatPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
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
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const mensagensRef = useRef<Mensagem[]>([]);
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

    // 🔹 scroll automático
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens]);

    useEffect(() => {
        setChatUsers(getChatUsers());
    }, []);

    // 🔹 buscar ou criar chat
    useEffect(() => {
        if (!currentUserId || !chatUser2Id) return;

        const fetchOrCreateChat = async () => {
            try {
                const res = await axios.get(`${API_BASE}/chat/${currentUserId}/${chatUser2Id}`);
                setChat(res.data);
            } catch (err) {
                console.error("Erro ao buscar/criar chat:", err);
            }
        };
        fetchOrCreateChat();
    }, [currentUserId, chatUser2Id]);

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
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }, [chat?._id]);

    // 🔹 enviar mensagem
    const sendMessage = async () => {
        if (!input.trim() || !chat || !currentUserId) return;

        const sender_type =
            currentUserId === chat.user1_id ? chat.user1_type : chat.user2_type;

        try {
            await axios.post(`${API_BASE}/chat/${chat._id}`, {
                sender_id: currentUserId,
                sender_type,
                text: input,
            });

            setMensagens((prev) => [
                ...prev,
                {
                    sender_id: currentUserId,
                    sender_type,
                    text: input,
                    createdAt: new Date().toISOString(),
                },
            ]);

            setInput("");
        } catch (err) {
            console.error("Erro ao enviar mensagem:", err);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar style={{ "--background": "#004030" } as React.CSSProperties}>
                    {/* 🔹 Botão de voltar */}
                    <IonButtons slot="start">
                        <IonButton routerLink="/veterinarios" fill="clear">
                            <IonIcon icon={arrowBackOutline} style={{ color: "#FFF9E5", fontSize: "24px" }} />
                        </IonButton>
                    </IonButtons>

                    <IonTitle style={{ color: "#FFF9E5" }}>Chat</IonTitle>
                </IonToolbar>

            </IonHeader>

            <IonContent
                style={{
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* mensagens */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        borderRadius: "8px",
                        padding: "8px",
                        marginBottom: "16px",
                        backgroundColor: "#f9f9f9",
                    }}
                >
                    {mensagens.map((m, i) => (
                        <div
                            key={i}
                            style={{
                                marginBottom: "8px",
                                textAlign: m.sender_id === currentUserId ? "right" : "left",
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    padding: "6px 10px",
                                    borderRadius: "12px",
                                    backgroundColor: m.sender_id === currentUserId ? "#4A9782" : "#DCD0A8",
                                    color: m.sender_id === currentUserId ? "#FFF9E5" : "#004030",
                                    maxWidth: "70%",
                                    wordWrap: "break-word",
                                    fontSize: "14px",
                                }}
                            >
                                {m.text}
                            </span>
                            <div style={{ fontSize: "10px", color: "#999" }}>
                                {new Date(m.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* input */}
                <div style={{ display: "flex", gap: "8px" }}>
                    <IonInput
                        value={input}
                        placeholder="Digite sua mensagem"
                        onIonChange={(e) => setInput(e.detail.value ?? "")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") sendMessage();
                        }}
                        style={{
                            flex: 1,
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            padding: "6px 8px",
                        }}
                    />
                    <IonButton
                        type="button"
                        onClick={sendMessage}
                        style={{ "--background": "#004030", color: "#FFF9E5" }}
                    >
                        Enviar
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ChatPage;
