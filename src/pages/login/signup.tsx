import React, { useState } from "react";
import { IonPage, IonContent, IonInput, IonButton, IonItem, IonAlert, IonText } from "@ionic/react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import "./signup.css";

// 🔥 Backend
const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

// 🔥 Axios com cookies se necessário
axios.defaults.withCredentials = true;

const Signup: React.FC = () => {
  const history = useHistory();

  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  const handleChange = (
    field: "username" | "email" | "password",
    value: string | null | undefined
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value || ""
    }));
  };

  const validateForm = () => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(credentials.email)) {
      setError("Por favor, insira um email válido.");
      return false;
    }
    if (credentials.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return false;
    }
    if (!credentials.username.trim()) {
      setError("O username é obrigatório.");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_BASE}/signup`, credentials);
      // ✅ Cadastro ok, mostra alerta
      setShowAlert(true);

      // Redireciona após 5 segundos
      setTimeout(() => {
        history.replace("/login");
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data || "Erro ao registrar usuário.");
    } finally {
      setLoading(false);
    }
  };

  const goTo = (path: string) => history.push(path);

  return (
    <IonPage className="signup-page">
      <IonContent fullscreen>
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Confirme seu email 📧"
          message="Registro realizado com sucesso! Verifique sua caixa de entrada para ativar sua conta."
          buttons={['OK']}
        />

        <div className="signup-wrapper">

          {/* Splash */}
          <div className="static-splash">
            <div className="static-splash-content">
              <img src="/icon/image.png" alt="AgroFieldTrack Logo" className="splash-logo" />
              <h1 className="splash-title" style={{ color: "black" }}>AgroFieldTrack</h1>
            </div>
          </div>

          {/* Form */}
          <div className="login-container">
            <h2>Faça o seu registro</h2>

            <IonItem>
              <IonInput
                label="Username"
                labelPlacement="floating"
                fill="solid"
                value={credentials.username}
                onIonInput={e => handleChange("username", e.detail.value)}
              />
            </IonItem>

            <IonItem>
              <IonInput
                label="Email"
                labelPlacement="floating"
                fill="solid"
                type="email"
                value={credentials.email}
                onIonInput={e => handleChange("email", e.detail.value)}
              />
            </IonItem>

            <IonItem>
              <IonInput
                label="Password"
                labelPlacement="floating"
                fill="solid"
                type="password"
                value={credentials.password}
                onIonInput={e => handleChange("password", e.detail.value)}
              />
            </IonItem>

            {error && <IonText color="danger"><p style={{ textAlign: "center" }}>{error}</p></IonText>}

            <IonButton expand="block" onClick={handleSignup} disabled={loading}>
              {loading ? "Registrando..." : "Registrar"}
            </IonButton>

            <div style={{ marginTop: 15 }}>
              <span style={{ color: "#8b8b8bda" }}>Já tem uma conta? </span>
              <a onClick={() => goTo("/login")} style={{ color: "#4A9782" }}>Entrar</a>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Signup;
