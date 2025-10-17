import React, { useEffect, useState } from "react";
import { IonPage, IonContent, IonInput, IonButton, IonItem, IonAlert } from "@ionic/react";
import { useAuth } from "../../AuthProvider";
import authApi from "../../hooks/authApi";
import { useHistory } from "react-router-dom";
import './signup.css';

const Signup: React.FC = () => {
  const { user, Login } = useAuth();
  const { signup } = authApi(user, Login);
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (pendingError && !showLoading) {
      setTimeout(() => {
        alert(pendingError);
        setPendingError(null);
      }, 50);
    }
  }, [pendingError, showLoading]);

  const handleChange = (field: "username" | "email" | "password", value: string | null | undefined) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value || "",
    }));
  };

  const validateForm = () => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(credentials.email)) {
      alert("Por favor, insira um email válido.");
      return false;
    }

    if (credentials.password.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setShowLoading(true);
    setLoading(true);
    const user = await signup(credentials);

    if (user) {
      setLoading(false);
      setShowAlert(true);
      setTimeout(() => {
        history.push("/login");
      }, 7000);
    } else {
      setPendingError("Erro ao registrar, verifique se o email ou username já estão em uso.");
      setLoading(false);
    }
  };


  const goTo = (path: string) => {
    history.push(path);
  };

  return (
    <>


      {!showLoading && (
        <IonPage className="signup-page">
          <IonContent fullscreen>
            <IonAlert
              isOpen={showAlert}
              onDidDismiss={() => setShowAlert(false)}
              header="Confirme o seu email 📧"
              message="Registro realizado com sucesso! Enviámos um email de confirmação. 
           Verifique a sua caixa de entrada (ou pasta de spam) para ativar a sua conta."
              buttons={['OK']}
            />

            <div className="signup-wrapper">

              <div className="static-splash">
                <div className="static-splash-content">
                  <img
                    src="/icon/image.png"
                    alt="SeaWatch Logo"
                    className="splash-logo wave-animation"
                  />
                  <h1 className="splash-title">
                    {"Marineer".split("").map((char, index) => (
                      <span
                        key={index}
                        className="wave-char"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {char}
                      </span>
                    ))}
                  </h1>
                </div>
              </div>

              <div className="login-container">
                <div className="login-logo">
                  <div className="logo-content">
                    <h2>Faça o seu Registro:</h2>
                  </div>
                </div>
                <h2>Crie sua conta</h2>

                <IonItem>
                  <IonInput
                    className="modal-input"
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
                    label="Email"
                    labelPlacement="floating"
                    fill="solid"
                    type="email"
                    value={credentials.email}
                    onIonInput={(e) => handleChange("email", e.detail.value)}
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

                <IonButton expand="block" onClick={handleSignup}>
                  Registrar
                </IonButton>
                <div >
                  <span style={{ color: "#8b8b8bda" }}>Já tem uma conta? </span>
                  <a onClick={() => goTo("/login")} style={{ color: "#3396f1af" }}>Entrar</a>
                </div>
              </div>
            </div>

          </IonContent>
        </IonPage>
      )}
    </>
  );
};

export default Signup;
