import React from 'react';
import {
  IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonList, IonItem, IonLabel, IonModal, IonInput, IonAvatar, IonCard, IonCardContent,
  IonAlert, IonToast, IonGrid, IonCol, IonRow
} from '@ionic/react';
import {
  settingsOutline, personOutline, mapOutline, cartOutline, listOutline, bandageOutline
} from 'ionicons/icons';
import logo from "../lista/logo.png";

interface State {
  showEditProfile: boolean;
  showDeleteConfirm: boolean;
  showToast: boolean;
  toastMessage: string;
  toastColor: string;
  profileData: {
    _id: string;
    username: string;
    profilePic: string;
  };
}

class Conta extends React.Component<{}, State> {
  fileInputRef: React.RefObject<HTMLInputElement | null> = React.createRef();

  state: State = {
    showEditProfile: false,
    showDeleteConfirm: false,
    showToast: false,
    toastMessage: '',
    toastColor: 'success',
    profileData: {
      _id: '123',
      username: 'UsuárioGenérico',
      profilePic: 'https://via.placeholder.com/150'
    }
  };

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      this.setState({
        profileData: { ...this.state.profileData, profilePic: url },
        toastMessage: 'Foto de perfil atualizada com sucesso!',
        toastColor: 'success',
        showToast: true
      });
    }
  };

  handleSaveProfile = () => {
    // Simula salvar no backend
    this.setState({
      showEditProfile: false,
      toastMessage: 'Perfil atualizado com sucesso!',
      toastColor: 'success',
      showToast: true
    });
  };

  handleDeleteAccount = (data: any) => {
    // Simula exclusão de conta
    this.setState({
      showDeleteConfirm: false,
      toastMessage: 'Conta excluída com sucesso!',
      toastColor: 'danger',
      showToast: true
    });
  };

  render() {
    const { profileData, showEditProfile, showDeleteConfirm, showToast, toastMessage, toastColor } = this.state;

    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ "--background": "#FFF9E5", "--color": "#004030", display: "flex", justifyContent: "space-between", padding: "6px 12px" }}>
            <img src={logo} alt="perfil" style={{ borderRadius: "50%", width: 40, height: 40, border: "2px solid #DCD0A8", objectFit: "cover" }} />
            <IonButtons slot="end">
              <IonButton fill="clear" href="/settings">
                <IonIcon icon={settingsOutline} style={{ color: "#004030", fontSize: 24 }} />
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
                  <h2>{profileData.username}</h2>
                  <p>email@example.com</p>
                </IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>

          <input
            ref={this.fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={this.handleFileChange}
          />

          {/* Modal de edição */}
          <IonModal isOpen={showEditProfile} onDidDismiss={() => this.setState({ showEditProfile: false })}>
            <IonHeader>
              <IonToolbar style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
                <IonTitle>Editar Perfil</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => this.setState({ showEditProfile: false })}>Cancelar</IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent style={{ '--background': '#FFF9E5' }}>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" style={{ textAlign: 'center', marginBottom: 20 }}>
                    <IonAvatar style={{ width: 100, height: 100, margin: '0 auto' }}>
                      <img src={profileData.profilePic} alt="Perfil" />
                    </IonAvatar>
                    <IonButton fill="clear" onClick={() => this.fileInputRef.current?.click()} style={{ marginTop: 10 }}>
                      Mudar Foto
                    </IonButton>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12">
                    <IonItem>
                      <IonLabel position="stacked">Username</IonLabel>
                      <IonInput
                        value={profileData.username}
                        onIonChange={e => this.setState({ profileData: { ...profileData, username: e.detail.value! } })}
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12">
                    <IonButton expand="block" style={{ '--background': '#004030', color: '#FFF9E5', marginTop: 20 }} onClick={this.handleSaveProfile}>
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
            onDidDismiss={() => this.setState({ showDeleteConfirm: false })}
            header="Excluir Conta"
            message="Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita."
            cssClass="custom-delete-alert"
            inputs={[{ name: 'password', type: 'password', placeholder: 'Digite sua senha para confirmar' }]}
            buttons={[
              { text: 'Cancelar', role: 'cancel' },
              { text: 'Excluir', role: 'destructive', handler: this.handleDeleteAccount },
            ]}
          />

          {/* Toast */}
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => this.setState({ showToast: false })}
            message={toastMessage}
            duration={3000}
            color={toastColor}
          />

        </IonContent>

        {/* Footer */}
        <IonToolbar style={{ "--background": "#DCD0A8", "--border-color": "#DCD0A8", "--min-height": "64px", "--padding": "6px 6px" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 6 }}>
            <IonButton fill="clear" routerLink="/mapa" style={{ flex: '1 1 0', minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IonIcon icon={mapOutline} style={{ color: "#004030", fontSize: 18 }} />
                <IonLabel style={{ color: "#004030", fontSize: 11 }}>Mapa</IonLabel>
              </div>
            </IonButton>
            <IonButton fill="clear" routerLink="/market" style={{ flex: '1 1 0', minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IonIcon icon={cartOutline} style={{ color: "#004030", fontSize: 18 }} />
                <IonLabel style={{ color: "#004030", fontSize: 11 }}>Market</IonLabel>
              </div>
            </IonButton>
            <IonButton fill="clear" routerLink="/lista" style={{ flex: '1 1 0', minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IonIcon icon={listOutline} style={{ color: "#004030", fontSize: 18 }} />
                <IonLabel style={{ color: "#004030", fontSize: 11 }}>Lista</IonLabel>
              </div>
            </IonButton>
            <IonButton fill="clear" routerLink="/veterinarios" style={{ flex: '1 1 0', minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IonIcon icon={bandageOutline} style={{ color: "#004030", fontSize: 18 }} />
                <IonLabel style={{ color: "#004030", fontSize: 11 }}>Veterinária</IonLabel>
              </div>
            </IonButton>
          </div>
        </IonToolbar>
      </IonPage>
    );
  }
}

export default Conta;
