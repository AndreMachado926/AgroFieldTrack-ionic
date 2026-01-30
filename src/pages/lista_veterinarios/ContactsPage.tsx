// src/pages/ContactsPage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
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
} from "@ionic/react";

interface Contact {
  _id: string;
  username: string;
  email?: string;
  type?: string;
}

interface Props {
  user_id: string;
  API_BASE: string;
}

const ContactsPage: React.FC<Props> = ({ user_id, API_BASE }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/chats/contacts/${user_id}`);
        const contatos: Contact[] = (res.data || []).map((c: Contact) => ({
          ...c,
          type: c.type === "user" ? "cliente" : c.type, // transforma "user" em "cliente"
        }));
        setContacts(contatos);
      } catch (err) {
        console.error("Erro ao buscar contatos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [user_id, API_BASE]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Contatos</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent >
        {loading && <p>Carregando contatos...</p>}
        {!loading && contacts.length === 0 && <p>Nenhum contato encontrado.</p>}

        {contacts.map((c) => (
          <IonCard key={c._id} style={{ marginBottom: 12 }}>
            <IonItem lines="none">
              <IonAvatar slot="start">
                <div
                  
                >
                  {c.username?.[0]?.toUpperCase() || "?"}
                </div>
              </IonAvatar>

              <IonLabel>
                <span >{c.username}</span>
                {c.email && <span >{c.email}</span>}
                {c.type && <span >{c.type}</span>}
              </IonLabel>

              <IonButton
                slot="end"
                size="small"
                onClick={() => {
                  window.location.href = `/chat/${user_id}/${c._id}`;
                }}
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

export default ContactsPage;
