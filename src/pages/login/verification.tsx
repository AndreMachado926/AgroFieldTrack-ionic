import React, { useEffect, useState } from "react";
import {IonPage, IonContent, IonButton, IonToast, IonSpinner} from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import verifyEmailApi from "../../hooks/verificationApi";
import "./login.css";

const Verification: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { verifyEmail } = verifyEmailApi();

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', color: '' });

  useEffect(() => {
    const runVerification = async () => {
      try {
        await verifyEmail();
        setToast({ show: true, message: "Email verificado com sucesso!", color: "success" });

        setTimeout(() => {
          history.push("/login");
        }, 2000);
      } catch (error) {
        setToast({ show: true, message: "Erro ao verificar o email.", color: "danger" });
      } finally {
        setLoading(false);
      }
    };

    runVerification();
  }, [location.search]);

  return (
    <IonPage className="login-page">
      <IonContent fullscreen>
        <div className="login-wrapper">
          <div className="static-splash">
            <div className="static-splash-content">
              <img
                src="/icon/icon.png"
                alt="SeaWatch Logo"
                className="splash-logo wave-animation"
              />
              <h1 className="splash-title wave-animation">
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
              <h2>A verificar o Email...</h2>
            </div>

            {loading ? (
              <IonSpinner name="crescent" />
            ) : (
              <IonButton expand="block" onClick={() => history.push("/login")}>
                Ir para Login
              </IonButton>
            )}
          </div>
        </div>

        <IonToast
          isOpen={toast.show}
          message={toast.message}
          color={toast.color}
          duration={2000}
          onDidDismiss={() => setToast({ ...toast, show: false })}
        />
      </IonContent>
    </IonPage>
  );
};

export default Verification;
