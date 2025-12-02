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
  IonTabButton,
  IonModal,
  IonInput,
  IonGrid,
  IonRow,
  IonCol,
  IonTitle
} from '@ionic/react';
import { useHistory } from 'react-router';
import { personOutline, cardOutline, chevronForward, settingsOutline, logOutOutline, mapOutline, cartOutline, listOutline, sparklesOutline, bandageOutline, keyOutline } from 'ionicons/icons';
import { useAuth } from '../../AuthProvider';
import { authApi } from '../../hooks/authApi';
import settingsApi from '../../hooks/settingsApi';
import '../SettingsPages/Settings.css';

const Settings: React.FC = () => {
  const { user, Login } = useAuth();
  const { logout } = authApi(user, Login);
  const { editPassword } = settingsApi();
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

  const handleChangePassword = async () => {
    try {
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
      await editPassword(passwordData.oldPassword, passwordData.newPassword);
      setToastMessage('Senha alterada com sucesso!');
      setToastColor('success');
      setShowToast(true);
      setShowPasswordModal(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      setToastMessage(error?.response?.data?.error || error?.response?.data?.message || 'Erro ao alterar senha. Verifique sua senha atual.');
      setToastColor('danger');
      setShowToast(true);
    }
  };

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

        {/* Modal de mudança de senha */}
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
                  <IonButton expand="block" style={{ '--background': '#004030', color: '#FFF9E5', marginTop: '20px' }} onClick={handleChangePassword}>
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
