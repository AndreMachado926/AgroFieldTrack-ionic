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
  IonModal,
  IonInput,
  IonGrid,
  IonRow,
  IonCol,
  IonTitle
} from '@ionic/react';
import { useHistory } from 'react-router';
import { keyOutline, chevronForward, logOutOutline, mapOutline, cartOutline, listOutline, bandageOutline, personOutline } from 'ionicons/icons';
import '../SettingsPages/Settings.css';

// 🔥 Backend
const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

// 🔥 Axios com cookies
axios.defaults.withCredentials = true;

const Settings: React.FC = () => {
  const history = useHistory();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 🔑 Mudar senha
  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setToastMessage('Preencha todos os campos');
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToastMessage('As senhas não coincidem');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      await axios.post(`${API_BASE}/change-password`, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });

      setToastMessage('Senha alterada com sucesso!');
      setToastColor('success');
      setShowToast(true);
      setShowPasswordModal(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error(err);
      setToastMessage(err.response?.data || 'Erro ao alterar senha.');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  // 🔒 Logout
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/logout`);
    } catch {
      console.warn('Erro ao deslogar');
    } finally {
      history.replace('/');
    }
  };

  return (
    <IonPage>
      {/* HEADER */}
      <IonHeader>
        <IonToolbar style={{ ["--background" as any]: "#FFF9E5", ["--color" as any]: "#004030" }}>
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
          <IonItem button onClick={() => setShowPasswordModal(true)}>
            <IonIcon slot="start" icon={keyOutline} style={{ color: '#004030' }} />
            <IonLabel style={{ color: '#004030' }}>Mudar Senha</IonLabel>
            <IonIcon slot="end" icon={chevronForward} style={{ color: '#004030' }} />
          </IonItem>

          <IonItem button onClick={handleLogout}>
            <IonIcon slot="start" icon={logOutOutline} style={{ color: '#004030' }} />
            <IonLabel style={{ color: '#004030' }}>Logout</IonLabel>
            <IonIcon slot="end" icon={chevronForward} style={{ color: '#004030' }} />
          </IonItem>
        </IonList>

        {/* MODAL DE SENHA */}
        <IonModal isOpen={showPasswordModal} onDidDismiss={() => setShowPasswordModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
              <IonTitle>Mudar Senha</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowPasswordModal(false)}>Cancelar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent style={{ '--background': '#FFF9E5' }}>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <IonItem>
                    <IonLabel position="stacked">Senha Atual</IonLabel>
                    <IonInput
                      type="password"
                      value={passwordData.oldPassword}
                      onIonChange={e => setPasswordData(prev => ({ ...prev, oldPassword: e.detail.value! }))}
                      placeholder="Digite sua senha atual"
                    />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12">
                  <IonItem>
                    <IonLabel position="stacked">Nova Senha</IonLabel>
                    <IonInput
                      type="password"
                      value={passwordData.newPassword}
                      onIonChange={e => setPasswordData(prev => ({ ...prev, newPassword: e.detail.value! }))}
                      placeholder="Digite a nova senha"
                    />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12">
                  <IonItem>
                    <IonLabel position="stacked">Confirmar Nova Senha</IonLabel>
                    <IonInput
                      type="password"
                      value={passwordData.confirmPassword}
                      onIonChange={e => setPasswordData(prev => ({ ...prev, confirmPassword: e.detail.value! }))}
                      placeholder="Confirme a nova senha"
                    />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12">
                  <IonButton
                    expand="block"
                    style={{ '--background': '#004030', color: '#FFF9E5', marginTop: '20px' }}
                    onClick={handleChangePassword}
                  >
                    Atualizar Senha
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
        />
      </IonContent>

      {/* TAB BAR */}
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
          <IonButton fill="clear" routerLink="/mapa" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0 }}>
            <IonIcon icon={mapOutline} style={{ color: "#004030" }} />
            <IonLabel style={{ color: "#004030", fontSize: "11px" }}>Mapa</IonLabel>
          </IonButton>

          <IonButton fill="clear" routerLink="/market" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0 }}>
            <IonIcon icon={cartOutline} style={{ color: "#004030" }} />
            <IonLabel style={{ color: "#004030", fontSize: "11px" }}>Market</IonLabel>
          </IonButton>

          <IonButton fill="clear" routerLink="/lista" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0 }}>
            <IonIcon icon={listOutline} style={{ color: "#004030" }} />
            <IonLabel style={{ color: "#004030", fontSize: "11px" }}>Lista</IonLabel>
          </IonButton>

          <IonButton fill="clear" routerLink="/veterinarios" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0 }}>
            <IonIcon icon={bandageOutline} style={{ color: "#004030" }} />
            <IonLabel style={{ color: "#004030", fontSize: "11px" }}>Veterinária</IonLabel>
          </IonButton>

          <IonButton fill="clear" routerLink="/settings/conta" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0 }}>
            <IonIcon icon={personOutline} style={{ color: "#004030" }} />
            <IonLabel style={{ color: "#004030", fontSize: "11px" }}>Perfil</IonLabel>
          </IonButton>
        </div>
      </IonToolbar>
    </IonPage>
  );
};

export default Settings;
