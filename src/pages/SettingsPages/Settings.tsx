import React, { useState } from 'react';
import axios from 'axios';
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

const Settings: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('');

  const handleEditProfile = () => {
    // Redireciona para a página de edição de perfil
    window.location.href = "/perfil";
  };

  return (
    <IonPage>
      {/* HEADER */}
      <IonHeader>
        <IonToolbar style={{ ["--background" as any]: "#FFF9E5", ["--color" as any]: "#004030" }}>
          {/* Botão de voltar para /lista */}
          <IonButtons slot="start">
            <IonButton fill="clear" href="/lista">
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
