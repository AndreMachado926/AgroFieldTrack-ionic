import React from "react";
import axios from "axios";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonItem,
  IonText,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./login.css";

// 🔥 Backend base
const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

// 🔥 Axios configurado para enviar cookies
axios.defaults.withCredentials = true; // obrigatório para cookies cross-site

const Login: React.FC = () => {
  const history = useHistory();

  // 🔥 variáveis diretas sem useState
  let username: string = "";
  let password: string = "";

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        `${API_BASE}/login`,
        { username, password },
        { withCredentials: true }
      );

      const token = res.data.token;
      if (token) {
        localStorage.setItem("authToken", token); // ✅ Guardar no localStorage
        console.log("Token guardado:", token);
      }

      history.replace("/lista");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data || "Credenciais inválidas");
    }
  };


  return (
    <IonPage className="login-page">
      <IonContent fullscreen>
        <div className="login-wrapper">
          {/* Splash */}
          <div className="static-splash">
            <div className="static-splash-content">
              <img
                src="/icon/image.png"
                alt="AgroFieldTrack Logo"
                className="splash-logo"
              />
            </div>
          </div>

          {/* Form */}
          <div className="login-container">
            <div className="login-logo">
              <h2>Bem-vindo</h2>
            </div>

            <IonItem>
              <IonInput
                placeholder="Username"
                fill="solid"
                onIonInput={e => (username = e.detail.value!)}
              />
            </IonItem>

            <IonItem>
              <IonInput
                placeholder="Password"
                fill="solid"
                type="password"
                onIonInput={e => (password = e.detail.value!)}
              />
            </IonItem>

            <IonButton
              expand="block"
              onClick={handleLogin}
              style={{ marginTop: 20 }}
            >
              Entrar
            </IonButton>

            <div style={{ textAlign: "center", marginTop: 10 }}>
              <span style={{ color: "#8b8b8bda" }}>Não tem uma conta?</span>
              <a
                onClick={() => history.push("/signup")}
                style={{ color: "#4A9782", marginLeft: 5, cursor: "pointer" }}
              >
                Cadastre-se
              </a>
            </div>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
