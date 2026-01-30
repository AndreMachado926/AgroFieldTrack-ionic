import { Redirect, Route } from 'react-router-dom';
import { Switch } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';

import Login from './pages/login/login';
import Signup from './pages/login/signup';
import Verification from './pages/login/verification';
import VeterinariosPage from './pages/lista_veterinarios/veterinarios';
import lista from './pages/lista/listas';
import { setupIonicReact } from '@ionic/react';
import MarketDetalhes from './pages/marketplace/marketdetails';
import Market from './pages/marketplace/market';
import Settings from './pages/SettingsPages/Settings';
import Conta from './pages/SettingsPages/conta';
import Mapa from './pages/mapa/mapa';
import AdicionarAnimal from './pages/lista/adicionar-animal';
import AdicionarPlantacao from './pages/lista/adicionar-plantacao';
import ChatPage from './pages/lista_veterinarios/ChatPage';
import ContatosPage from './pages/lista_veterinarios/ContactsPage';
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

setupIonicReact();

const App: React.FC = () => {
  return (
    <InnerApp />
  );
};

const InnerApp: React.FC = () => {

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Switch>

            <Route exact path="/" component={Login} />
            <Route exact path="/signup" component={Signup} />
            <Route exact path="/verification" component={Verification} />
            <Route exact path="/marketdetalhes/:id" component={MarketDetalhes} />
            <Route exact path="/market" component={Market} />
            <Route exact path="/lista" component={lista} />
            <Route exact path="/veterinarios" component={VeterinariosPage} />
            <Route exact path="/settings" component={Settings} />
            <Route exact path="/perfil" component={Conta} />
            <Route exact path="/mapa" component={Mapa} />
            <Route exact path="/adicionar-animal" component={AdicionarAnimal} />
            <Route exact path="/adicionar-plantacao" component={AdicionarPlantacao} />
            <Route exact path="/chat/:user1_id/:user2_id" component={ChatPage} />
            <Route exact path="/contatos" component={ContatosPage} />

          </Switch>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
