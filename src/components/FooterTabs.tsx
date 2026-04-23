import React from "react";
import {
  IonFooter,
  IonToolbar,
  IonButton,
  IonIcon,
  IonLabel,
} from "@ionic/react";
import {
  mapOutline,
  cartOutline,
  listOutline,
  bandageOutline,
  sparklesOutline,
} from "ionicons/icons";

type FooterTab = "mapa" | "market" | "lista" | "veterinarios";

interface FooterTabsProps {
  activeTab?: FooterTab;
  isVeterinario?: boolean;
}

const FooterTabs: React.FC<FooterTabsProps> = ({ activeTab, isVeterinario = false }) => {
  const mapRoute = isVeterinario ? "/mapa-vet" : "/mapa";
  const vetRoute = isVeterinario ? "/veterinario/contatos" : "/veterinarios";
  const vetLabel = isVeterinario ? "Contatos" : "Veterinários";

  const getButtonStyle = (tab: FooterTab) => ({
    flex: "1 1 0",
    minWidth: 0,
    opacity: activeTab === tab ? 1 : 0.7,
  });

  return (
    <IonFooter>
      <IonToolbar style={{ "--background": "#DCD0A8", "--border-color": "#DCD0A8", "--min-height": "64px", "--padding": "6px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 6 }}>
          <IonButton fill="clear" routerLink={mapRoute} style={getButtonStyle("mapa")}> 
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <IonIcon icon={mapOutline} style={{ color: "#004030", fontSize: 18 }} />
              <IonLabel style={{ color: "#004030", fontSize: 11 }}>Mapa</IonLabel>
            </div>
          </IonButton>

          <IonButton fill="clear" routerLink="/market" style={getButtonStyle("market")}> 
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <IonIcon icon={cartOutline} style={{ color: "#004030", fontSize: 18 }} />
              <IonLabel style={{ color: "#004030", fontSize: 11 }}>Market</IonLabel>
            </div>
          </IonButton>

          <IonButton fill="clear" routerLink="/agent" style={getButtonStyle("lista")}> 
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <IonIcon icon={sparklesOutline} style={{ color: "#004030", fontSize: 18 }} />
              <IonLabel style={{ color: "#004030", fontSize: 11 }}>Agent</IonLabel>
            </div>
          </IonButton>

          <IonButton fill="clear" routerLink="/lista" style={getButtonStyle("lista")}> 
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <IonIcon icon={listOutline} style={{ color: "#004030", fontSize: 18 }} />
              <IonLabel style={{ color: "#004030", fontSize: 11 }}>Lista</IonLabel>
            </div>
          </IonButton>

          <IonButton fill="clear" routerLink={vetRoute} style={getButtonStyle("veterinarios")}> 
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <IonIcon icon={bandageOutline} style={{ color: "#004030", fontSize: 18 }} />
              <IonLabel style={{ color: "#004030", fontSize: 11 }}>{vetLabel}</IonLabel>
            </div>
          </IonButton>
        </div>
      </IonToolbar>
    </IonFooter>
  );
};

export default FooterTabs;
