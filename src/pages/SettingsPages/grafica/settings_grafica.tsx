import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import logo from "../logo.png";
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
    IonToggle,
    IonSegment,
    IonSegmentButton,
    IonNote,
} from '@ionic/react';
import { arrowBackOutline, colorPaletteOutline } from 'ionicons/icons';
import '../Settings.css';

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

const SettingsGrafica: React.FC = () => {
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastColor, setToastColor] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userMode, setUserMode] = useState<'white' | 'dark'>('white');
    const [userId, setUserId] = useState<string>('');

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
            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
                localStorage.removeItem("authToken");
                window.location.href = "/";
                return;
            }
            setUserId(decoded.user_id);
            fetchUserMode(decoded.user_id);
            setIsLoading(false);
        } catch (err) {
            console.error("Erro ao decodificar token:", err);
            window.location.href = "/#/mapa";
        }
    }, []);

    const fetchUserMode = async (id: string) => {
        try {
            const response = await axios.post(`${API_BASE}/settings/getusermode`, { id });
            if (response.data.mode) {
                setUserMode(response.data.mode);
                // Aplica o modo ao carregar a página
                if (response.data.mode === 'dark') {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
            }
        } catch (err) {
            console.error("Erro ao buscar modo do usuário:", err);
        }
    };

    const handleModeChange = async (mode: 'white' | 'dark') => {
        try {
            const response = await axios.post(`${API_BASE}/settings/updatemode`, {
                id: userId,
                mode: mode
            });

            if (response.status === 200) {
                setUserMode(mode);
                
                // Aplica ou remove a classe dark-mode no body
                if (mode === 'dark') {
                  document.body.classList.add('dark-mode');
                } else {
                  document.body.classList.remove('dark-mode');
                }
                
                setToastMessage(`Modo alterado para ${mode === 'white' ? 'Claro' : 'Escuro'}`);
                setToastColor("success");
                setShowToast(true);
            }
        } catch (err) {
            console.error("Erro ao atualizar modo:", err);
            setToastMessage("Erro ao atualizar modo");
            setToastColor("danger");
            setShowToast(true);
        }
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
                    <IonButtons slot="start">
                        <IonButton fill="clear" href="/#/settings">
                            <IonIcon icon={arrowBackOutline} style={{ color: "#004030", fontSize: 24 }} />
                        </IonButton>
                    </IonButtons>

                    <IonLabel style={{ color: '#004030', fontWeight: 'bold', fontSize: 18 }}>
                        Configurações Gráficas
                    </IonLabel>

                    <img
                        src={logo}
                        alt="perfil"
                        style={{
                            borderRadius: "50%",
                            width: 40,
                            height: 40,
                            border: "2px solid #DCD0A8",
                            objectFit: "cover",
                            marginRight: 10,
                        }}
                        slot="end"
                    />
                </IonToolbar>
            </IonHeader>

            <IonContent className="page-background" fullscreen>
                <IonList>
                    {/* Modo Claro/Escuro */}
                    <IonItem>
                        <IonIcon slot="start" icon={colorPaletteOutline} style={{ color: '#004030' }} />
                        <IonLabel>
                            <h2>Modo Escuro</h2>
                            <IonNote>Ative para usar o tema escuro</IonNote>
                        </IonLabel>
                        <IonToggle
                            slot="end"
                            checked={userMode === 'dark'}
                            onIonChange={(e) => handleModeChange(e.detail.checked ? 'dark' : 'white')}
                            style={{ ["--handle-background" as any]: "#004030" }}
                        />
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

export default SettingsGrafica;