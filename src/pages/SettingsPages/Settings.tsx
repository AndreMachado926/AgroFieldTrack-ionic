import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import logo from "../lista/logo.png";
import {
  IonContent,
  IonPage,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonToast,
} from '@ionic/react';
import { personOutline, chevronForward, arrowBackOutline } from 'ionicons/icons';
import '../SettingsPages/Settings.css';

// 🔥 Backend
const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

// 🔥 Axios com cookies
axios.defaults.withCredentials = true;

interface DecodedToken {
  user_id: string;
  username: string;
  iat: number;
  exp: number;
}

const Settings: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const getToken = () => {
    const match = document.cookie.match(/(^| )auth=([^;]+)/);
    return match ? match[2] : localStorage.getItem("authToken");
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      // Verifica se o token não está expirado
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        localStorage.removeItem("authToken");
        window.location.href = "/";
        return;
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Erro ao decodificar token:", err);
      window.location.href = "/#/mapa";
    }
  }, []);

  const handleEditProfile = () => {
    // Redireciona para a página de edição de perfil
    window.location.href = "/#/perfil";
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="page-background" fullscreen>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p>A carregar...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      {/* HEADER */}
      <IonHeader>
        <IonToolbar style={{ ["--background" as any]: "#FFF9E5", ["--color" as any]: "#004030" }}>
          {/* Botão de voltar para /lista */}
          <IonButtons slot="start">
            <IonButton fill="clear" href="/#/lista">
              <IonIcon icon={arrowBackOutline} style={{ color: "#004030", fontSize: 24 }} />
            </IonButton>
          </IonButtons>

          {/* Logo no centro */}
          <img
            src={logo}
            alt="perfil"
            style={{
              borderRadius: "50%",
              width: 40,
              height: 40,
              border: "2px solid #DCD0A8",
              objectFit: "cover",
            }}
          />
        </IonToolbar>
      </IonHeader>
      <IonContent className="page-background" fullscreen>
        <IonList>
          <IonItem button onClick={handleEditProfile}>
            <IonIcon slot="start" icon={personOutline} style={{ color: '#004030' }} />
            <IonLabel style={{ color: '#004030' }}>Editar Perfil</IonLabel>
            <IonIcon slot="end" icon={chevronForward} style={{ color: '#004030' }} />
          </IonItem>
        </IonList>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default Settings;
