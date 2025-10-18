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
import { personOutline, cardOutline, chevronForward, settingsOutline, logOutOutline, mapOutline, cartOutline, listOutline, sparklesOutline, bandageOutline } from 'ionicons/icons';
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
      <IonToolbar
        style={{
          "--background": "#DCD0A8",
          "--border-color": "#DCD0A8",
          "--min-height": "64px",
          "--padding": "6px 6px"
        }}
      >
        <div style={{
          display: "flex",
          flexWrap: "nowrap",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          gap: "6px",
          overflow: "hidden"
        }}>
          <IonButton fill="clear" routerLink="/mapa" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <IonIcon icon={mapOutline} style={{ color: "#004030", fontSize: "18px" }} />
              <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Mapa</IonLabel>
            </div>
          </IonButton>

          <IonButton fill="clear" routerLink="/market" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <IonIcon icon={cartOutline} style={{ color: "#004030", fontSize: "18px" }} />
              <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Market</IonLabel>
            </div>
          </IonButton>

          <IonButton fill="clear" routerLink="/lista" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <IonIcon icon={listOutline} style={{ color: "#004030", fontSize: "18px" }} />
              <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Lista</IonLabel>
            </div>
          </IonButton>

          <IonButton fill="clear" routerLink="/veterinarios" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <IonIcon icon={bandageOutline} style={{ color: "#004030", fontSize: "18px" }} />
              <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Veterinária</IonLabel>
            </div>
          </IonButton>

          <IonButton fill="clear" routerLink="/settings/conta" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <IonIcon icon={personOutline} style={{ color: "#004030", fontSize: "18px" }} />
              <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Perfil</IonLabel>
            </div>
          </IonButton>
        </div>
      </IonToolbar>
    </IonPage>
  );
};

export default Settings;
