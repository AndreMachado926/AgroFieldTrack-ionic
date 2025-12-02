import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonList, IonItem, IonLabel, IonModal, IonInput, IonAvatar, IonCard, IonCardContent,
  IonAlert, IonToast, useIonViewWillEnter,
  IonTabBar,
  IonTabButton,
  IonGrid,
  IonCol,
  IonRow
} from '@ionic/react';
import {
  camera, person, key, basketOutline, repeatOutline, createSharp, trashBin,
  saveOutline, close, settingsOutline,
  personOutline,
  sparklesOutline,
  listOutline,
  cartOutline,
  mapOutline,
  bandageOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import settingsApi from '../../hooks/settingsApi';
import { authApi } from '../../hooks/authApi';
import { useAuth } from '../../AuthProvider';
import logo from "../lista/logo.png";

const Conta: React.FC = () => {
  const history = useHistory();
  const { user, Login, updateProPic } = useAuth();
  const { updateProfile, updateProfilePic, deleteAccount } = settingsApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('');
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [historico, setHistorico] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [profileData, setProfileData] = useState({
    _id: "",
    username: '',
    profilePic: '',
  });

  const fetchUser = async () => {
    if (user) {
      setCurrentUser(user);
      setProfileData({
        _id: user._id || "",
        username: user.username || '',
        profilePic: user.profilePic || '',
      });
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useIonViewWillEnter(() => {
    fetchUser();
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const filename = await updateProfilePic(file);
        updateProPic(filename);
        fetchUser();
        setToastMessage('Foto de perfil atualizada com sucesso!');
        setToastColor('success');
        setShowToast(true);
      } catch (error) {
        console.error('Error updating profile picture:', error);
        setToastMessage('Erro ao atualizar foto de perfil. Tente novamente.');
        setToastColor('danger');
        setShowToast(true);
      }
    }
  };

  const handleDeleteAccount = async (data: any) => {
    if (data.password) {
      try {
        await deleteAccount(data.password);
        authApi(user, Login).logout();
        history.push('/login');
      } catch (error) {
        console.error('Error deleting account:', error);
        setToastMessage('Erro ao excluir conta. Verifique sua senha e tente novamente.');
        setToastColor('danger');
        setShowToast(true);
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { username } = profileData;
      await updateProfile({ username });
      const updatedUser = { ...currentUser, username, profilePic: profileData.profilePic };
      updateProPic(profileData.profilePic);
      Login(updatedUser);
      setToastMessage('Perfil atualizado com sucesso!');
      setToastColor('success');
      setShowToast(true);
      setShowEditProfile(false);
      fetchUser();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setToastMessage('Erro ao atualizar perfil. Tente novamente.');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
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
            <IonButton fill="clear" href="/settings">
              <IonIcon icon={settingsOutline} style={{ color: "#004030", fontSize: "24px" }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="page-background" fullscreen>
        <IonCard className="profile-card">
          <IonCardContent>
            <IonItem lines="none" className="profile-item">
              <IonAvatar className="profile-avatar">
                <img src={profileData.profilePic} alt="Profile" />
              </IonAvatar>
              <IonLabel className="profile-label">
                <h2>{currentUser?.username || 'Nome do Usuário'}</h2>
                <p>{currentUser?.email || 'email@example.com'}</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Modal de edição de perfil */}
        <IonModal isOpen={showEditProfile} onDidDismiss={() => setShowEditProfile(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
              <IonTitle>Editar Perfil</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditProfile(false)}>Cancelar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent style={{ '--background': '#FFF9E5' }}>
            <IonGrid>
              <IonRow>
                <IonCol size="12" style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <IonAvatar style={{ width: 100, height: 100, margin: '0 auto' }}>
                    <img src={profileData.profilePic} alt="Perfil" />
                  </IonAvatar>
                  <IonButton fill="clear" onClick={() => fileInputRef.current?.click()} style={{ marginTop: '10px' }}>
                    Mudar Foto
                  </IonButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12">
                  <IonItem>
                    <IonLabel position="stacked">Username</IonLabel>
                    <IonInput value={profileData.username} onIonChange={e => setProfileData(prev => ({ ...prev, username: e.detail.value! }))} />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12">
                  <IonButton expand="block" style={{ '--background': '#004030', color: '#FFF9E5', marginTop: '20px' }} onClick={handleSaveProfile}>
                    Salvar Alterações
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>


        {/* Alerta de exclusão */}
        <IonAlert
          isOpen={showDeleteConfirm}
          onDidDismiss={() => setShowDeleteConfirm(false)}
          header="Excluir Conta"
          message="Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita."
          cssClass="custom-delete-alert"
          inputs={[{ name: 'password', type: 'password', placeholder: 'Digite sua senha para confirmar' }]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Excluir', role: 'destructive', handler: handleDeleteAccount },
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
        />

        {/* CSS embutido */}
        <style>{`
          .toolbar-custom {
            --background: #FFF9E5;
            --color: #004030;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 12px;
          }
          .toolbar-logo {
            border-radius: 50%;
            width: 40px;
            height: 40px;
            border: 2px solid #DCD0A8;
            object-fit: cover;
          }
          .icon-green { color: #004030; font-size: 24px; }

          .page-background {
            --background: #f7f7f7;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .profile-card {
            margin: 20px;
            border-radius: 16px;
            background: white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }

          .profile-item {
            display: flex;
            align-items: center;
          }
          .profile-avatar {
            width: 80px;
            height: 80px;
            margin-right: 10px;
          }
          .profile-label h2 {
            color: #000;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .profile-label p {
            color: #555;
            font-size: 14px;
          }

          .custom-toolbar {
            --background: #3B6C9C;
            color: white;
          }

          .edit-header {
            padding: 20px;
            text-align: center;
          }
          .edit-avatar {
            margin: 0 auto;
            width: 100px;
            height: 100px;
          }

          .btn-change-photo {
            background-color: #3B6C9C !important;
            color: white !important;
            border-radius: 12px;
            margin-top: 10px;
          }

          .input-item {
            background-color: white;
            border-radius: 12px;
            margin: 12px;
          }

          .icon-gray { color: #bababa; }

          .btn-save-wrapper {
            display: flex;
            justify-content: center;
            padding: 20px;
          }
          .btn-save {
            --background: #3B6C9C;
            color: white;
            border-radius: 12px;
            width: 180px;
          }

          ion-alert.custom-delete-alert {
            --background: white !important;
            --message-color: black !important;
            --button-color: black !important;
          }
          .alert-title.sc-ion-alert-md {
            color: #000;
            font-size: 1.25rem;
            font-weight: 500;
          }
          .alert-input.sc-ion-alert-md {
            color: #000;
          }
        `}</style>
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

export default Conta;
