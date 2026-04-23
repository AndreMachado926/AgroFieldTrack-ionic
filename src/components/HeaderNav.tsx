import React from "react";
import { IonHeader, IonToolbar, IonButtons, IonButton, IonIcon } from "@ionic/react";
import { settingsOutline, logOutOutline } from "ionicons/icons";
import { Avatar, Box } from "@mui/material";
import logo from "../pages/lista/logo.png";

interface HeaderNavProps {
  onLogout?: () => void;
}

const HeaderNav: React.FC<HeaderNavProps> = ({ onLogout }) => {
  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
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
        <Avatar
          src={logo}
          alt="perfil"
          sx={{
            width: 40,
            height: 40,
            border: "2px solid #DCD0A8",
            objectFit: "cover",
          }}
        />
        <IonButtons slot="end" style={{ display: "flex", gap: "4px" }}>
          <IonButton fill="clear" href="/#/settings">
            <IonIcon icon={settingsOutline} style={{ color: "#004030", fontSize: "24px" }} />
          </IonButton>
          <IonButton fill="clear" onClick={handleLogout}>
            <IonIcon icon={logOutOutline} style={{ color: "#004030", fontSize: "24px" }} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default HeaderNav;
