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
} from "@ionic/react";

interface Mensagem {
    sender_id: string;
    sender_type: string;
    text: string;
    createdAt: string;
}

interface ChatParams {
    user1_id: string;
    user1_type: string;
    user2_id: string;
    user2_type: string;
}

const ChatPage: React.FC = () => {
    const { user1_id, user1_type, user2_id, user2_type } = useParams<ChatParams>();
    const [chatId, setChatId] = useState<string>("");
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

    // Scroll automático para última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens]);

    // Buscar ou criar chat
    useEffect(() => {
        const fetchOrCreateChat = async () => {
            try {
                const res = await axios.get(
                    `${API_BASE}/chat/${user1_id}/${user1_type}/${user2_id}/${user2_type}`
                );
                setChatId(res.data._id);
                setMensagens(res.data.mensagens || []);
            } catch (err) {
                console.error("Erro ao buscar/criar chat:", err);
            }
        };
        fetchOrCreateChat();

        const interval = setInterval(fetchOrCreateChat, 2000);
        return () => clearInterval(interval);
    }, [user1_id, user1_type, user2_id, user2_type]);

    // Enviar mensagem
    const sendMessage = async () => {
        if (!input.trim() || !chatId) return;

        const novaMensagem: Mensagem = {
            sender_id: user1_id,
            sender_type: user1_type,
            text: input,
            createdAt: new Date().toISOString(),
        };

        try {
            await axios.post(`${API_BASE}/chat/${chatId}`, {
                sender_id: user1_id,
                sender_type: user1_type,
                text: input, // 🔹 CORRIGIDO: antes estava "content"
            });

            setMensagens((prev) => [...prev, novaMensagem]);
            setInput("");
        } catch (err) {
            console.error("Erro ao enviar mensagem:", err);
        }
    };


    return (
        <IonPage>
            <IonHeader>
                <IonToolbar style={{ "--background": "#004030" } as React.CSSProperties}>
                    <IonTitle style={{ color: "#FFF9E5" }}>Chat</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
                {/* Lista de mensagens */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        border: "1px solid #ccc",
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
                                textAlign: m.sender_id === user1_id ? "right" : "left",
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    padding: "6px 10px",
                                    borderRadius: "12px",
                                    backgroundColor: m.sender_id === user1_id ? "#4A9782" : "#DCD0A8",
                                    color: m.sender_id === user1_id ? "#FFF9E5" : "#004030",
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

                {/* Input de mensagem */}
                <div style={{ display: "flex", gap: "8px" }}>
                    <IonInput
                        value={input}
                        placeholder="Digite sua mensagem"
                        onIonChange={(e) => setInput(e.detail.value!)}
                        style={{ flex: 1, border: "1px solid #ccc", borderRadius: "8px", padding: "6px 8px" }}
                    />
                    <IonButton onClick={sendMessage} style={{ "--background": "#004030", color: "#FFF9E5" }}>
                        Enviar
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ChatPage;
