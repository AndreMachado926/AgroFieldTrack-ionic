import { Route, Switch } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactHashRouter } from '@ionic/react-router';
import Home from './pages/Home';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';

import Login from './pages/login/login';
import Signup from './pages/login/signup';
import Verification from './pages/login/verification';
import VeterinariosPage from './pages/lista_veterinarios/veterinarios';
import lista from './pages/lista/listas';
import ListaVetPage from './pages/lista-vet/lista-vet';
import { setupIonicReact } from '@ionic/react';
import MarketDetalhes from './pages/marketplace/marketdetails';
import Market from './pages/marketplace/market';
import Settings from './pages/SettingsPages/Settings';
import Conta from './pages/SettingsPages/conta';
import Mapa from './pages/mapa/mapa';
import AdicionarAnimal from './pages/lista/adicionar-animal';
import AdicionarPlantacao from './pages/lista/adicionar-plantacao';
import AdicionarPasto from './pages/lista/adicionar-pasto';
import ChatPage from './pages/lista_veterinarios/ChatPage';
import ContatosPage from './pages/lista_veterinarios/ContactsPage';
import VeterinarioContatosPage from './pages/veterinario/contactos'; // nova página de contatos para veterinários
import AgentPage from './pages/agent_helper/agent_chat'; // nova página de contatos para veterinários
import ArduinoPage from './pages/arduino/arduino'; // nova página de contatos para veterinários
import Settings_graficas from './pages/SettingsPages/grafica/settings_grafica'; // nova página de contatos para veterinários

import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import './theme/global-theme.css';

setupIonicReact();

const App: React.FC = () => {
  return (
    <InnerApp />
  );
};

const InnerApp: React.FC = () => {
  const [userMode, setUserMode] = useState<'white' | 'dark'>('white');
  const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";

  const getToken = () => {
    const match = document.cookie.match(/(^| )auth=([^;]+)/);
    return match ? match[2] : localStorage.getItem("authToken");
  };

  useEffect(() => {
    const applyUserMode = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const decoded: any = jwtDecode(token);
        const response = await axios.post(`${API_BASE}/settings/getusermode`, { id: decoded.user_id });
        if (response.data.mode === 'dark') {
          document.body.classList.add('dark-mode');
          setUserMode('dark');
        } else {
          document.body.classList.remove('dark-mode');
          setUserMode('white');
        }
      } catch (err) {
        console.error("Erro ao buscar modo do usuário:", err);
      }
    };

    applyUserMode();
  }, []);

  return (
    <IonApp>
      <IonReactHashRouter>
        <IonRouterOutlet>
          <Switch>

            <Route exact path="/" component={Login} />
            <Route exact path="/signup" component={Signup} />
            <Route exact path="/verification" component={Verification} />
            <Route exact path="/marketdetalhes/:id" component={MarketDetalhes} />
            <Route exact path="/market" component={Market} />
            <Route exact path="/lista" component={lista} />
            <Route exact path="/lista-vet" component={ListaVetPage} />
            <Route exact path="/veterinarios" component={VeterinariosPage} />
            <Route exact path="/settings" component={Settings} />
            <Route exact path="/perfil" component={Conta} />
            <Route exact path="/mapa" component={Mapa} />
            <Route path="/adicionar-animal/:id?" component={AdicionarAnimal} />
            <Route path="/adicionar-plantacao/:id?" component={AdicionarPlantacao} />
            <Route path="/adicionar-pasto/:id?" component={AdicionarPasto} />
            <Route exact path="/chat" component={ChatPage} />
            <Route exact path="/contatos" component={ContatosPage} />
            <Route exact path="/veterinario/contatos" component={VeterinarioContatosPage} />
            <Route exact path="/agent" component={AgentPage} />
            <Route exact path="/arduino" component={ArduinoPage} />
            <Route exact path="/settings-graficas" component={Settings_graficas} />
          </Switch>
        </IonRouterOutlet>
      </IonReactHashRouter>
    </IonApp>
  );
};

export default App;
