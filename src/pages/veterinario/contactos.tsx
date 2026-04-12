// src/pages/veterinario/contactos.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton,
  IonSpinner,
} from "@ionic/react";

interface DecodedToken {
  user_id: string;
}

interface Contact {
  _id: string;
  username: string;
  email?: string;
  telefone?: string;
  type?: string;
  lastMessage?: string;
  lastAt?: string;
}

const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

const VeterinarioContatosPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserId = (): string | null => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.user_id;
    } catch (err) {
      console.error("Erro ao decodificar token:", err);
      return null;
    }
  };

  const setChatCookie = (user1Id: string, user2Id: string) => {
    const value = encodeURIComponent(JSON.stringify({ user1_id: user1Id, user2_id: user2Id }));
    document.cookie = `chatUsers=${value}; path=/; sameSite=Lax`;
  };

  useEffect(() => {
    const fetchContacts = async () => {
      const userId = getUserId();
      if (!userId) {
        setError("Usuário não autenticado.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE}/veterinarios/${userId}/chats`);
        const chats = response.data?.data || [];

        const contatos = chats
          .filter((chat: any) => Array.isArray(chat.mensagens) && chat.mensagens.length > 0)
          .map((chat: any) => {
            const otherUser = String(chat.user1_id._id) === userId ? chat.user2_id : chat.user1_id;
            const lastMessage = chat.mensagens[chat.mensagens.length - 1];

            return {
              _id: otherUser._id,
              username: otherUser.username || otherUser.nome_completo || "Sem nome",
              email: otherUser.email || "",
              telefone: otherUser.telefone || otherUser.phone || "",
              type: otherUser.type === "user" ? "cliente" : otherUser.type || "",
              lastMessage: lastMessage?.text || "",
              lastAt: lastMessage?.createdAt ? new Date(lastMessage.createdAt).toLocaleString() : "",
            };
          });

        setContacts(contatos);
      } catch (err: any) {
        console.error("Erro ao buscar contatos:", err);
        setError(err?.response?.data?.message || "Erro ao buscar contatos.");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const openChat = (contactId: string) => {
    const userId = getUserId();
    if (!userId) return;
    setChatCookie(userId, contactId);
    window.location.href = "/#/chat";
  };

  return (
    <IonPage style={{ backgroundColor: "#f7f3ea" }}>
      <IonHeader>
        <IonToolbar style={{ ["--background" as any]: "#2f5d50", ["--color" as any]: "#ffffff" }}>
          <IonTitle>Chat do veterinário</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ padding: 16 }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <IonSpinner name="crescent" color="medium" />
          </div>
        )}

        {!loading && error && <p style={{ color: "#b22222" }}>{error}</p>}
        {!loading && !error && contacts.length === 0 && (
          <p style={{ color: "#444" }}>Nenhum chat encontrado com mensagens.</p>
        )}

        {contacts.map((contact) => (
          <IonCard key={contact._id} style={{ marginBottom: 14, borderRadius: 14 }}>
            <IonItem lines="none" style={{ ['--background' as any]: '#ffffff', borderRadius: 14 }}>
              <IonAvatar slot="start">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: '#2f5d50',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                >
                  {contact.username?.[0]?.toUpperCase() || '?'}
                </div>
              </IonAvatar>
              <IonLabel>
                <h2 style={{ margin: 0, color: '#222' }}>{contact.username}</h2>
                {contact.email && (
                  <p style={{ margin: '2px 0 0', color: '#666', fontSize: 13 }}>{contact.email}</p>
                )}
                {contact.telefone && (
                  <p style={{ margin: '2px 0 0', color: '#666', fontSize: 13 }}>{contact.telefone}</p>
                )}
                {contact.lastMessage && (
                  <p style={{ margin: '6px 0 0', color: '#555', fontSize: 13 }}>
                    Última mensagem: {contact.lastMessage}
                  </p>
                )}
              </IonLabel>
              <IonButton
                fill="solid"
                color="secondary"
                size="small"
                onClick={() => openChat(contact._id)}
              >
                Chat
              </IonButton>
            </IonItem>
          </IonCard>
        ))}
      </IonContent>
    </IonPage>
  );
};

export default VeterinarioContatosPage;
