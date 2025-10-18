import React, { useEffect, useState } from "react";
import { IonPage, IonContent, IonInput, IonButton, IonItem } from "@ionic/react";
import { useAuth } from "../../AuthProvider";
import authApi from "../../hooks/authApi";
import { useHistory } from "react-router-dom";
import './login.css';

const Login: React.FC = () => {
  const { user, Login } = useAuth();
  const { login } = authApi(user, Login);
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });

  useEffect(() => {
    if (pendingError && !showLoading) {
      setTimeout(() => {
        alert(pendingError);
        setPendingError(null);
      }, 50);
    }
  }, [pendingError, showLoading]);

  const handleChange = (field: "username" | "password", value: string | null | undefined) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value || "",
    }));
  };

  const handleLogin = async () => {
   const result = await login(credentials);

    if (result.success && result.data.token) {
      history.push("/home");
    } else {
      setPendingError(result.error);
      setLoading(false);
    }
  };

  const goTo = (path: string) => {
    history.push(path);
  };

  return (
    <>


      {(
        <IonPage className="login-page">
          <IonContent fullscreen>
            <div className="login-wrapper">

              <div className="static-splash">
                <div className="static-splash-content">
                  <img
                    src="/icon/image.png"
                    alt="SeaWatch Logo"
                    className="splash-logo "
                  />
                  <h1 className="splash-title " style={{ color: "black" }}>
                    AgroFieldTrack
                  </h1>
                </div>
              </div>

              <div className="login-container">
                <div className="login-logo">
                  <div className="logo-content">
                    <h2>Bem vindo</h2>
                  </div>
                </div>
                <IonItem>
                  <IonInput className="modal-input"
                    label="Username"
                    labelPlacement="floating"
                    fill="solid"
                    value={credentials.username}
                    onIonInput={(e) => handleChange("username", e.detail.value)}
                  />
                </IonItem>

                <IonItem>
                  <IonInput
                    className="modal-input"
                    label="Password"
                    labelPlacement="floating"
                    fill="solid"
                    type="password"
                    value={credentials.password}
                    onIonInput={(e) => handleChange("password", e.detail.value)}
                  />
                </IonItem>

               

                <IonButton expand="block" onClick={handleLogin}>
                  Entrar
                </IonButton>
                <br />
                <div >
                  <span style={{ color: "#8b8b8bda" }}>Não tem uma conta? </span>
                  <a onClick={() => goTo("/signup")} style={{ color: "#4A9782" }}> Cadastre - se</a>
                </div>
                <div>
                  <a onClick={() => goTo("/fishwiki")} style={{ color: "#5bbfa4ff" }}>Entrar sem iniciar a sessão</a>
                </div>
              </div>
            </div>
          </IonContent>
        </IonPage >
      )}
    </>
  );
};

export default Login;