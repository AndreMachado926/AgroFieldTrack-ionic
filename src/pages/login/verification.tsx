import React, { useEffect, useState } from "react";
import {IonPage, IonContent, IonButton, IonToast, IonSpinner} from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import "./login.css";

const Verification: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', color: '' });

  useEffect(() => {
    const runVerification = async () => {
      try {
        setToast({ show: true, message: "Email verificado com sucesso!", color: "success" });

        setTimeout(() => {
          history.push("/");
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
                src="/icon/image.png"
                alt="SeaWatch Logo"
                className="splash-logo "
              />
                <h1 className="splash-title" style={{ color: "black"}}>
                  AgroFieldTrack
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
              <IonButton expand="block" onClick={() => history.push("/")}>
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
