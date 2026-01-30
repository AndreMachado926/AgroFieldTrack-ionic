import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonList, IonItem, IonLabel, IonModal, IonInput, IonAvatar, IonCard, IonCardContent,
  IonAlert, IonToast, IonGrid, IonCol, IonRow, IonSpinner
} from '@ionic/react';
import { settingsOutline, personOutline, cameraOutline, arrowBackOutline } from 'ionicons/icons';
import logo from "../lista/logo.png";
import { jwtDecode } from "jwt-decode";

const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";
axios.defaults.withCredentials = true;

interface ProfileData {
  _id?: string;
  username: string;
  profilePic: string;
  email: string;
}

interface DecodedToken {
  user_id: string;
}

const getUserIdFromToken = (): string | null => {
  const token = document.cookie.match(/(^| )auth=([^;]+)/)?.[2] || localStorage.getItem("authToken");
  if (!token) return null;

  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.user_id;
  } catch (err) {
    console.error("Erro ao decodificar token", err);
    return null;
  }
};

const Conta: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const userId = getUserIdFromToken();

  useEffect(() => {
    if (!userId) {
      setToastMessage("Usuário não autenticado");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const res = await axios.post(`${API_BASE}/settings/getuserinfo`, { id: userId });
        setProfileData(res.data);
      } catch (err) {
        console.error("Erro ao buscar informações do usuário:", err);
        setToastMessage('Erro ao carregar perfil');
        setToastColor('danger');
        setShowToast(true);
      }
    };

    fetchUserInfo();
  }, [userId]);

  const updateProfilePic = async (file: File) => {
    if (!profileData) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_BASE}/settings/profile-pic`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfileData(prev => prev ? { ...prev, profilePic: res.data.profilePic } : prev);
      setToastMessage('Foto de perfil atualizada com sucesso!');
      setToastColor('success');
      setShowToast(true);
    } catch (err) {
      console.error(err);
      setToastMessage('Erro ao atualizar foto');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) updateProfilePic(file);
  };

  const updateUsername = async () => {
    if (!profileData || !userId) return;
    try {
      const res = await axios.post(`${API_BASE}/settings/username`, { id: userId, username: profileData.username });
      setProfileData(prev => prev ? { ...prev, username: res.data.username } : prev);
      setToastMessage('Username atualizado com sucesso!');
      setToastColor('success');
      setShowToast(true);
    } catch (err) {
      console.error(err);
      setToastMessage('Erro ao atualizar username');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const deleteAccount = async (password: string) => {
    try {
      await axios.post(`${API_BASE}/settings/delete-account`, { password });
      setShowDeleteConfirm(false);
      setToastMessage('Conta excluída com sucesso!');
      setToastColor('danger');
      setShowToast(true);
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      setToastMessage('Erro ao excluir conta');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  if (!profileData) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>

            <IonTitle>Perfil</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ "--background": "#FFF9E5", "--color": "#004030", display: "flex", justifyContent: "space-between", padding: "6px 12px" }}>
          {/* Botão de voltar no canto esquerdo */}
          <IonButtons slot="start">
            <IonButton fill="clear" href="/settings">
              <IonIcon icon={arrowBackOutline} style={{ color: "#004030", fontSize: 24 }} />
            </IonButton>
          </IonButtons>

          <IonTitle>Perfil</IonTitle>

          {/* Botão de settings no canto direito */}
          <IonButtons slot="end">
            <IonButton fill="clear" href="/settings">
              <IonIcon icon={settingsOutline} style={{ color: "#004030", fontSize: 24 }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>


      <IonContent className="page-background" fullscreen>
        <IonCard>
          <IonCardContent>
            <IonItem lines="none">
              <IonAvatar>
                <img src={profileData.profilePic} alt="Profile" />
              </IonAvatar>
              <IonLabel>
                <h2>{profileData.username}</h2>
                <p>{profileData.email}</p>
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

        <IonList>
          {/* Botão para editar perfil */}
          <IonItem button onClick={() => setShowEditProfile(true)}>
            <IonIcon slot="start" icon={personOutline} style={{ color: '#004030' }} />
            <IonLabel style={{ color: '#004030' }}>Editar Perfil</IonLabel>
          </IonItem>

          {/* Novo botão separado para mudar foto */}
          <IonItem button onClick={() => fileInputRef.current?.click()}>
            <IonIcon slot="start" icon={cameraOutline} style={{ color: '#004030' }} />
            <IonLabel style={{ color: '#004030' }}>Mudar Foto</IonLabel>
          </IonItem>

          {/* Botão excluir conta */}
          <IonItem button onClick={() => setShowDeleteConfirm(true)}>
            <IonLabel style={{ color: 'crimson' }}>Excluir Conta</IonLabel>
          </IonItem>
        </IonList>

        {/* Modal de edição de username */}
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
                <IonCol size="12">
                  <IonItem>
                    <IonLabel position="stacked">Username</IonLabel>
                    <IonInput
                      value={profileData.username}
                      onIonChange={e => setProfileData(prev => prev ? { ...prev, username: e.detail.value! } : prev)}
                    />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12">
                  <IonButton expand="block" style={{ '--background': '#004030', color: '#FFF9E5', marginTop: 20 }} onClick={updateUsername}>
                    Salvar Username
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showDeleteConfirm}
          onDidDismiss={() => setShowDeleteConfirm(false)}
          header="Excluir Conta"
          message="Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita."
          inputs={[{ name: 'password', type: 'password', placeholder: 'Digite sua senha para confirmar' }]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Excluir', role: 'destructive', handler: (data) => deleteAccount(data.password) }
          ]}
        />

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

export default Conta;
