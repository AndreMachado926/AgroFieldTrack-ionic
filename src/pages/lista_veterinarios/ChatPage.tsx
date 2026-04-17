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
    IonModal,
    IonList,
    IonItem,
    IonLabel,
} from "@ionic/react";
import { arrowBackOutline, attachOutline, navigateOutline } from "ionicons/icons";
import { jwtDecode } from "jwt-decode";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "./ChatPage.css";

interface DecodedToken {
    user_id: string;
    type?: string;
}
interface AnimalInfo {
    _id: string;
    nome: string;
    idade: number;
    raca: string;
    localizacaoX: number;
    localizacaoY: number;
}
interface Mensagem {
    sender_id: string;
    sender_type: string;
    text: string;
    createdAt: string;
    animal_id?: string | AnimalInfo;
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
    const [animals, setAnimals] = useState<AnimalInfo[]>([]);
    const [showAnimalModal, setShowAnimalModal] = useState(false);
    const [animalsLoading, setAnimalsLoading] = useState(false);
    const [animalsError, setAnimalsError] = useState<string | null>(null);
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedAnimalForMap, setSelectedAnimalForMap] = useState<AnimalInfo | null>(null);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const mensagensRef = useRef<Mensagem[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const routingControlRef = useRef<any>(null);
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

    const fetchAnimals = async () => {
        if (!currentUserId) return;

        setAnimalsLoading(true);
        setAnimalsError(null);
        try {
            const token = getToken();
            if (!token) throw new Error("Não autenticado");

            let currentUserType = decoded?.type;
            if (!currentUserType) {
                try {
                    const typeRes = await axios.get(`${API_BASE}/veterinarios/${currentUserId}/type`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    currentUserType = typeRes.data.type;
                } catch (typeErr) {
                    console.warn('Não foi possível obter tipo de usuário no chat, usando padrão.', typeErr);
                }
            }

            const endpoint = currentUserType === 'veterinario'
                ? `${API_BASE}/veterinarios/${currentUserId}/shared-animals`
                : `${API_BASE}/animais/${currentUserId}`;

            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const payload = res.data;
            const data: AnimalInfo[] = Array.isArray(payload.data)
                ? payload.data
                : Array.isArray(payload)
                ? payload
                : payload.data
                    ? payload.data
                    : [];
            setAnimals(data);
        } catch (err: any) {
            console.error("Erro ao buscar animais:", err);
            setAnimals([]);
            setAnimalsError(err?.response?.data?.message || err.message || "Erro ao obter animais");
        } finally {
            setAnimalsLoading(false);
        }
    };

    const sendAnimalInfo = async (animal: AnimalInfo) => {
        if (!currentUserId) return;

        const currentChat = chat || await fetchOrCreateChat();
        if (!currentChat) return;

        const sender_type =
            currentUserId === currentChat.user1_id ? currentChat.user1_type : currentChat.user2_type;

        const messagePayload = {
            sender_id: currentUserId,
            sender_type,
            text: "",
            animal_id: animal._id,
        };

        const token = getToken();

        console.log("sendAnimalInfo payload:", messagePayload); // Debug log

        try {
            // SEMPRE usar axios para garantir que a mensagem é guardada na DB
            await axios.post(
                `${API_BASE}/chat/${currentChat._id}`,
                messagePayload,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );

            console.log("Animal enviado com sucesso para DB"); // Debug log

            // Buscar mensagens atualizadas para garantir sincronização
            await new Promise(resolve => setTimeout(resolve, 300)); // pequeno delay para garantir que o servidor processou

            const messagesRes = await axios.get(`${API_BASE}/chat/${currentChat._id}/messages`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const updatedMessages: Mensagem[] = messagesRes.data || [];
            console.log("Mensagens atualizadas:", updatedMessages); // Debug log
            mensagensRef.current = updatedMessages;
            setMensagens(updatedMessages);
            setShowAnimalModal(false);
        } catch (err: any) {
            console.error("Erro ao enviar informações do animal:", err);
            console.error("Dados enviados:", messagePayload); // Debug log do payload
            alert("Erro ao enviar animal: " + (err?.response?.data?.message || err.message));
        }
    };

    const openLocationMap = (animal: AnimalInfo) => {
        setSelectedAnimalForMap(animal);
        setUserLocation(null); // Reset user location when opening new map
        setShowMapModal(true);
    };

    const openGoogleMapsDirections = () => {
        if (!mapRef.current || !selectedAnimalForMap) return;

        if (!userLocation) {
            alert('Localização do usuário não disponível. Permita o acesso à localização para calcular a rota.');
            return;
        }

        if (routingControlRef.current) {
            mapRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null;
        }

        const waypoints = [
            L.latLng(userLocation.lat, userLocation.lng),
            L.latLng(selectedAnimalForMap.localizacaoX, selectedAnimalForMap.localizacaoY)
        ];

        const routingControl = (L.Routing.control as any)({
            waypoints: waypoints,
            routeWhileDragging: false,
            showAlternatives: false,
            addWaypoints: false,
            fitSelectedRoute: true,
            createMarker: function() { return null; },
            lineOptions: {
                styles: [{ color: '#007AFF', weight: 6 }]
            }
        }).addTo(mapRef.current);

        routingControlRef.current = routingControl;
    };

    const createLocationMap = () => {
        if (!selectedAnimalForMap) return;

        setTimeout(() => {
            const mapContainer = document.getElementById("location-map");
            if (!mapContainer) return;

            // Limpar mapa anterior se existir
            const existingMap = (mapContainer as any)._leaflet_map;
            if (existingMap) {
                existingMap.remove();
            }

            const map = L.map("location-map").setView(
                [selectedAnimalForMap.localizacaoX, selectedAnimalForMap.localizacaoY],
                13
            );

            mapRef.current = map;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map);

            // Adicionar marcador do animal
            L.marker([selectedAnimalForMap.localizacaoX, selectedAnimalForMap.localizacaoY])
                .addTo(map)
                .bindPopup(`<b>${selectedAnimalForMap.nome}</b><br>${selectedAnimalForMap.raca}`);

            // Tentar obter localização do usuário
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLat = position.coords.latitude;
                        const userLng = position.coords.longitude;

                        // Armazenar localização do usuário
                        setUserLocation({ lat: userLat, lng: userLng });

                        // Adicionar marcador do usuário
                        const userMarker = L.circleMarker([userLat, userLng], {
                            radius: 8,
                            color: '#007AFF',
                            fillColor: '#007AFF',
                            fillOpacity: 0.9,
                            weight: 2,
                        }).addTo(map);
                        userMarker.bindPopup('Sua localização');

                        // Ajustar bounds para incluir animal e usuário
                        const bounds = L.latLngBounds([
                            [selectedAnimalForMap.localizacaoX, selectedAnimalForMap.localizacaoY],
                            [userLat, userLng]
                        ]);
                        map.fitBounds(bounds, { padding: [20, 20] });
                    },
                    (error) => {
                        console.warn('Erro ao obter localização do usuário:', error);
                        // Mesmo com erro, manter o foco no animal
                        map.setView([selectedAnimalForMap.localizacaoX, selectedAnimalForMap.localizacaoY], 13);
                    },
                    { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
                );
            } else {
                // Fallback se geolocalização não estiver disponível
                map.setView([selectedAnimalForMap.localizacaoX, selectedAnimalForMap.localizacaoY], 13);
            }
        }, 100);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens]);

    useEffect(() => {
        if (showMapModal) {
            createLocationMap();
        } else if (routingControlRef.current && mapRef.current) {
            mapRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null;
        }
    }, [showMapModal]);

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

    useEffect(() => {
        if (!currentUserId) return;
        fetchAnimals();
    }, [currentUserId]);

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
                    novasMensagens.every((m, i) => {
                        const previous = mensagensRef.current[i];
                        const animalEqual =
                            m.animal_id === previous.animal_id ||
                            (typeof m.animal_id !== "string" &&
                                typeof previous.animal_id !== "string" &&
                                m.animal_id?._id === previous.animal_id?._id);

                        return (
                            m.sender_id === previous.sender_id &&
                            m.sender_type === previous.sender_type &&
                            m.text === previous.text &&
                            m.createdAt === previous.createdAt &&
                            animalEqual
                        );
                    });

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
                                {m.animal_id && typeof m.animal_id !== "string" ? (
                                    <div className="animal-card">
                                        <div className="animal-card-title">Informações do animal</div>
                                        <div style={{ color: "#000" }}><strong>Nome:</strong> {m.animal_id.nome}</div>
                                        <div style={{ color: "#000" }}><strong>Idade:</strong> {m.animal_id.idade}</div>
                                        <div style={{ color: "#000" }}><strong>Raça:</strong> {m.animal_id.raca}</div>
                                        <IonButton
                                            type="button"
                                            fill="outline"
                                            size="small"
                                            onClick={() => openLocationMap(m.animal_id as AnimalInfo)}
                                            style={{ marginTop: "8px" }}
                                        >
                                            Ver localização
                                        </IonButton>
                                    </div>
                                ) : (
                                    m.text
                                )}
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
                    <IonButton
                        type="button"
                        fill="clear"
                        className="chat-attach-button"
                        onClick={() => setShowAnimalModal(true)}
                        disabled={!currentUserId || animals.length === 0}
                    >
                        <IonIcon icon={attachOutline} />
                    </IonButton>
                    <IonInput
                        className="chat-input"
                        value={input}
                        placeholder="Digite sua mensagem"
                        autofocus={false}
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
                <IonModal isOpen={showAnimalModal} onDidDismiss={() => setShowAnimalModal(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Enviar animal</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setShowAnimalModal(false)}>Fechar</IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        {animalsLoading && <p style={{ padding: 16 }}>Carregando animais...</p>}
                        {animalsError && <p style={{ padding: 16, color: 'crimson' }}>{animalsError}</p>}
                        {!animalsLoading && animals.length === 0 && !animalsError && (
                            <p style={{ padding: 16 }}>Nenhum animal disponível para enviar.</p>
                        )}
                        <IonList>
                            {animals.map((animal) => (
                                <IonItem key={animal._id} button onClick={() => sendAnimalInfo(animal)}>
                                    <IonLabel>
                                        <h2>{animal.nome}</h2>
                                        <p>{`${animal.raca} • ${animal.idade} anos`}</p>
                                        <p>{`Localização: ${animal.localizacaoX}, ${animal.localizacaoY}`}</p>
                                    </IonLabel>
                                </IonItem>
                            ))}
                        </IonList>
                    </IonContent>
                </IonModal>
                <IonModal isOpen={showMapModal} onDidDismiss={() => setShowMapModal(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Localização - {selectedAnimalForMap?.nome}</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setShowMapModal(false)}>Fechar</IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent style={{ position: 'relative' }}>
                        <div id="location-map" style={{ width: "100%", height: "100%" }} />
                        {selectedAnimalForMap && (
                            <IonButton
                                fill="solid"
                                color="primary"
                                style={{
                                    position: 'absolute',
                                    bottom: '20px',
                                    right: '20px',
                                    zIndex: 1000,
                                    borderRadius: '50%',
                                    width: '56px',
                                    height: '56px',
                                    '--padding-start': '0',
                                    '--padding-end': '0',
                                    '--padding-top': '0',
                                    '--padding-bottom': '0'
                                }}
                                onClick={openGoogleMapsDirections}
                            >
                                <IonIcon icon={navigateOutline} style={{ fontSize: '24px' }} />
                            </IonButton>
                        )}
                    </IonContent>
                </IonModal>
            </IonContent>
        </IonPage>
    );
};

export default ChatPage;
