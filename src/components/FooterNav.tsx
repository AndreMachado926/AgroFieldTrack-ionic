import React, { useMemo } from "react";
import { IonFooter, IonToolbar, IonButton, IonIcon, IonLabel } from "@ionic/react";
import { jwtDecode } from "jwt-decode";
import { mapOutline, cartOutline, listOutline, bandageOutline } from "ionicons/icons";

interface DecodedToken {
  type?: string;
}

const getToken = () => {
  const match = document.cookie.match(/(^| )auth=([^;]+)/);
  return match ? match[2] : localStorage.getItem("authToken");
};

const FooterNav: React.FC = () => {
  const navItems = useMemo(() => {
    const token = getToken();
    let type = "user";

    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded?.type) type = decoded.type;
      } catch (err) {
        console.warn("FooterNav: não foi possível decodificar token", err);
      }
    }

    if (type === "admin") {
      return [
        { href: "/mapa", icon: mapOutline, label: "Mapa" },
        { href: "/market", icon: cartOutline, label: "Market" },
        { href: "/lista", icon: listOutline, label: "Lista" },
        { href: "/lista-vet", icon: listOutline, label: "Lista Vet" },
        { href: "/veterinarios", icon: bandageOutline, label: "Veterinários" },
      ];
    }

    if (type === "veterinario") {
      return [
        { href: "/mapa", icon: mapOutline, label: "Mapa" },
        { href: "/lista-vet", icon: listOutline, label: "Lista Vet" },
        { href: "/veterinarios", icon: bandageOutline, label: "Veterinários" },
      ];
    }

    return [
      { href: "/mapa", icon: mapOutline, label: "Mapa" },
      { href: "/market", icon: cartOutline, label: "Market" },
      { href: "/lista", icon: listOutline, label: "Lista" },
      { href: "/veterinarios", icon: bandageOutline, label: "Veterinários" },
    ];
  }, []);

  return (
    <IonFooter>
      <IonToolbar style={{ "--background": "#DCD0A8", "--border-color": "#DCD0A8", "--min-height": "64px", "--padding": "6px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 6 }}>
          {navItems.map((item) => (
            <IonButton key={item.href} fill="clear" routerLink={item.href} style={{ flex: "1 1 0", minWidth: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <IonIcon icon={item.icon} style={{ color: "#004030", fontSize: 18 }} />
                <IonLabel style={{ color: "#004030", fontSize: 11 }}>{item.label}</IonLabel>
              </div>
            </IonButton>
          ))}
        </div>
      </IonToolbar>
    </IonFooter>
  );
};

export default FooterNav;
