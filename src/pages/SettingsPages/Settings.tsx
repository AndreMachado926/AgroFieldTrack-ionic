import React, { useState } from 'react';
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
  useIonViewDidEnter,
  IonTabBar,
  IonTabButton
} from '@ionic/react';
import { useHistory } from 'react-router';
import { personOutline, cardOutline, chevronForward, settingsOutline, logOutOutline, mapOutline, cartOutline, listOutline, sparklesOutline } from 'ionicons/icons';
import { useAuth } from '../../AuthProvider';
import { authApi } from '../../hooks/authApi';
import '../SettingsPages/Settings.css';

const Settings: React.FC = () => {
  const { user, Login } = useAuth();
  const { logout } = authApi(user, Login);
  const history = useHistory();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('');

  const handleLogout = () => {
    logout();
    history.push('/');
  };

  useIonViewDidEnter(() => {
    const checkAuth = async () => { };
    checkAuth();
  }, [history]);

  return (
    <IonPage>
      {/* 🔹 HEADER */}
      <IonHeader>
        <IonToolbar
          style={{
            ["--background" as any]: "#FFF9E5",
            ["--color" as any]: "#004030",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 12px",
          } as React.CSSProperties}
        >
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

          <IonButtons slot="end">
            <IonButton fill="clear">
              <IonIcon
                icon={settingsOutline}
                style={{ color: "#004030", fontSize: "24px" }}
              />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* 🔹 CONTEÚDO */}
      <IonContent className="page-background" fullscreen>
        <IonList>
          <IonItem button onClick={() => history.push('/settings/conta')}>
            <IonIcon slot="start" icon={personOutline} style={{ color: '#004030' }} />
            <IonLabel style={{ color: '#004030' }}>Conta</IonLabel>
            <IonIcon slot="end" icon={chevronForward} style={{ color: '#004030' }} />
          </IonItem>

          <IonItem button onClick={handleLogout}>
            <IonIcon slot="start" icon={logOutOutline} style={{ color: '#004030' }} />
            <IonLabel style={{ color: '#004030' }}>Logout</IonLabel>
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
      <IonTabBar
        slot="bottom"
        style={{
          backgroundColor: "#DCD0A8", // tom claro
          color: "#004030",
          "--color-selected": "#004030",
        }}
      >
        <IonTabButton tab="mapa">
          <IonIcon icon={mapOutline} style={{ color: "#004030" }} />
          <IonLabel style={{ color: "#004030" }}>Mapa</IonLabel>
        </IonTabButton>

        <IonTabButton tab="market">
          <IonIcon icon={cartOutline} style={{ color: "#004030" }} />
          <IonLabel style={{ color: "#004030" }}>Market</IonLabel>
        </IonTabButton>

        <IonTabButton tab="lista" selected>
          <IonIcon icon={listOutline} style={{ color: "#004030" }} />
          <IonLabel style={{ color: "#004030" }}>Lista</IonLabel>
        </IonTabButton>

        <IonTabButton tab="ai">
          <IonIcon icon={sparklesOutline} style={{ color: "#004030" }} />
          <IonLabel style={{ color: "#004030" }}>AI</IonLabel>
        </IonTabButton>

        <IonTabButton tab="perfil">
          <IonIcon icon={personOutline} style={{ color: "#004030" }} />
          <IonLabel style={{ color: "#004030" }}>Perfil</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonPage>
  );
};

export default Settings;
