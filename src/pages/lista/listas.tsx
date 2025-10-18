import React, { useState, useEffect } from "react";
import axios from "axios";
import logo from "../lista/logo.png";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonContent,
  IonCard,
  IonItem,
  IonAvatar,
  IonNote,
  IonFooter,
  IonTabBar,
  IonTabButton,
  IonModal,
  IonInput,
  IonTitle,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import {
  settingsOutline,
  pawOutline,
  mapOutline,
  cartOutline,
  listOutline,
  sparklesOutline,
  personOutline,
  leafOutline,
  addOutline,
  bandageOutline
} from "ionicons/icons";
import * as jwtDecode from "jwt-decode";

interface DecodedToken {
  user_id: string;
}

type Animal = {
  _id?: string;
  id?: string;
  nome: string;
  idade: number;
  localizacaoX?: number;
  localizacaoY?: number;
  dono_id?: string;
  tipo?: string;
  raca?: string;
};

type Plantacao = {
  _id?: string;
  id?: string;
  planta: string;
  localizacaoX: number;
  localizacaoY: number;
  dono_id: string;
  createdAt?: string;
  updatedAt?: string;
};

const AnimaisPage: React.FC = () => {
  const [segment, setSegment] = useState("animais");
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [plantacoes, setPlantacoes] = useState<Plantacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newAnimal, setNewAnimal] = useState<Partial<Animal>>({});
  const [newPlantacao, setNewPlantacao] = useState<Partial<Plantacao>>({});

  const API_BASE = ("http://localhost:8000").replace(/\/+$/, '');

  // helper: ler token do cookie e decodificar payload JWT
  const getTokenFromCookie = (name = 'jwt'): string | null => {
    const match = document.cookie.split('; ').find(c => c.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  };

  // lê o cookie "auth" e tenta extrair o token JWT (suporta formatos: token directo, "name=token" ou JSON)
  const getJwtFromAuthCookie = (): string | null => {
    const raw = document.cookie.split(';').map(s => s.trim()).find(c => c.startsWith('auth='));
    if (!raw) return null;
    const val = decodeURIComponent(raw.substring(5)); // remove "auth="
    const jwtMatch = val.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
    if (jwtMatch && jwtMatch[0]) return jwtMatch[0];
    if (val.split('.').length === 3) return val;
    return null;
  };

  // tenta obter userId do cookie (cliente) ou do servidor (/me)
  const getUserIdFromCookieOrServer = async (): Promise<string | null> => {
    // 1) tenta cookie no cliente
    const token = getJwtFromAuthCookie();
    if (token) {
      try {
        const decoded = (jwtDecode as any)(token);
        return decoded?.user_id || decoded?.id || decoded?.sub || null;
      } catch (e) {
        console.warn('jwt-decode falhou:', e);
      }
    }

    // 2) fallback: pedir ao servidor (usa cookie httpOnly)
    try {
      const res = await axios.get(`${API_BASE}/me`, { withCredentials: true });
      // espere res.data ter algo como { user_id: '...' } ou { user: { _id: '...' } }
      return res.data?.user_id || res.data?.id || res.data?._id || res.data?.user?._id || null;
    } catch (err) {
      console.warn('fallback /me falhou:', err);
      return null;
    }
  };

  const fetchAnimais = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await getUserIdFromCookieOrServer();
      if (!userId) throw new Error('User ID não encontrado (auth cookie httpOnly ou ausente)');
      const res = await axios.get(`${API_BASE}/animais/${userId}`, { withCredentials: true });
      const payload = res.data;
      const data = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : (payload.data ?? payload));
      setAnimais(data);
    } catch (err: any) {
      console.error("Fetch animais erro:", err);
      const msg = err?.response?.data?.message || err.message || "Erro ao obter animais";
      setError(msg);
      setAnimais([]);
      if (err?.response?.status === 401) window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      // usa o mesmo fallback (cookie decode ou /me) para obter userId
      const userId = await getUserIdFromCookieOrServer();
      if (!userId) throw new Error('User ID não encontrado (auth cookie httpOnly ou ausente)');
      const res = await axios.get(`${API_BASE}/plantacoes/${userId}`, { withCredentials: true });
      const payload = res.data;
      const data = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : (payload.data ?? payload));
      setPlantacoes(data);
    } catch (err: any) {
      console.error("Fetch plantações erro:", err);
      const msg = err?.response?.data?.message || err.message || "Erro ao obter plantações";
      setError(msg);
      setPlantacoes([]);
      if (err?.response?.status === 401) window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // obtém userId usando o helper (tenta cookie -> /me)
      const userId = await getUserIdFromCookieOrServer();
      if (!userId) throw new Error('User ID não encontrado (auth cookie httpOnly ou ausente)');

      if (segment === 'animais') {
        const animalData = {
          ...newAnimal,
          localizacaoX: 0,
          localizacaoY: 0,
          dono_id: userId
        };

        if (!animalData.nome || animalData.idade === undefined || !animalData.raca) {
          alert('Por favor preencha todos os campos');
          return;
        }

        await axios.post(`${API_BASE}/animais`, animalData, { withCredentials: true });
        await fetchAnimais();
        setShowModal(false);
        setNewAnimal({});
      } else {
        const plantacaoData = {
          ...newPlantacao,
          localizacaoX: 0,
          localizacaoY: 0,
          dono_id: userId
        };

        if (!plantacaoData.planta) {
          alert('Por favor preencha o nome da planta');
          return;
        }

        await axios.post(`${API_BASE}/plantacoes`, plantacaoData, { withCredentials: true });
        await fetchPlantacoes();
        setShowModal(false);
        setNewPlantacao({});
      }
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      if ((err?.message || '').toLowerCase().includes('user id') || (err?.message || '').toLowerCase().includes('token')) {
        window.location.href = '/login';
      } else {
        alert(err?.response?.data?.message || err.message || 'Erro ao salvar');
      }
    }
  };

  useEffect(() => {
    if (segment === "animais") {
      fetchAnimais();
    } else if (segment === "plantacoes") {
      fetchPlantacoes();
    }
  }, [segment]);

  return (
    <IonPage style={{ backgroundColor: "#FFF9E5", color: "#004030" }}>
      {/* CABEÇALHO */}
      <IonHeader translucent={false}>
        <IonToolbar
          style={
            {
              ["--background" as any]: "#FFF9E5",
              ["--color" as any]: "#004030",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 12px",
            } as React.CSSProperties
          }
        >
          <img
            src={logo}
            alt="perfil"
            style={{
              borderRadius: "50%",
              width: 40,
              height: 40,
              border: "2px solid #DCD0A8",
              objectFit: "cover",
            }}
          />

          <IonButtons slot="end">
            <IonButton fill="clear">
              <IonIcon
                icon={settingsOutline}
                style={{ color: "#004030", fontSize: "24px" }}
              />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        {/* ABAS */}
        <div
          style={{
            backgroundColor: "#FFF9E5",
            display: "flex",
            justifyContent: "center",
            padding: "0 12px 8px",
          }}
        >
          <IonSegment
            value={segment}
            onIonChange={(e: any) => setSegment(e.detail.value)}
            style={{
              backgroundColor: "#4A9782",
              borderRadius: "9999px",
              width: "100%",
              maxWidth: "380px",
              height: "40px",
            }}
          >
            <IonSegmentButton
              value="animais"
              style={{
                "--color-checked": "#FFF9E5",
                "--color": "#FFF9E5aa",
                "--indicator-color": "transparent",
                borderRadius: "9999px",
              }}
            >
              <IonLabel>Animais</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton
              value="plantacoes"
              style={{
                "--color-checked": "#FFF9E5",
                "--color": "#FFF9E5aa",
                "--indicator-color": "transparent",
                borderRadius: "9999px",
              }}
            >
              <IonLabel>Plantações</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>
      </IonHeader>

      {/* CONTEÚDO */}
      <IonContent
        style={{
          backgroundColor: "#FFF9E5",
          padding: "16px",
        }}
      >
        {segment === "animais" ? (
          <>
            {loading && <p style={{ color: "#004030" }}>A carregar animais...</p>}
            {error && <p style={{ color: "crimson" }}>{error}</p>}
            {!loading && animais.length === 0 && !error && (
              <p style={{ color: "#004030b0" }}>Nenhum animal encontrado.</p>
            )}

            {animais.map((item, i) => (
              <IonCard
                key={item._id ?? item.id ?? i}
                style={{
                  backgroundColor: "#DCD0A8",
                  borderRadius: "16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  marginBottom: "12px",
                }}
              >
                <IonItem
                  lines="none"
                  style={{
                    "--background": "#DCD0A8",
                    borderRadius: "16px",
                    padding: "8px 4px",
                  }}
                >
                  <IonAvatar slot="start">
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        backgroundColor: "#4A9782",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IonIcon
                        icon={pawOutline}
                        style={{ color: "#FFF9E5", fontSize: "20px" }}
                      />
                    </div>
                  </IonAvatar>

                  <IonLabel>
                    <h2
                      style={{
                        fontWeight: 600,
                        color: "#004030",
                        fontSize: "15px",
                        marginBottom: "2px",
                      }}
                    >
                      {item.nome}
                    </h2>
                    <p style={{ color: "#004030b0", fontSize: "13px" }}>
                      {item.raca ?? "—"}  {/* Mostra raça ou traço se não houver */}
                    </p>
                  </IonLabel>

                  <IonNote
                    slot="end"
                    style={{
                      color: "#004030",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {item.idade} anos
                  </IonNote>
                </IonItem>
              </IonCard>
            ))}
          </>
        ) : (
          <>
            {loading && <p style={{ color: "#004030" }}>A carregar plantações...</p>}
            {error && <p style={{ color: "crimson" }}>{error}</p>}
            {!loading && plantacoes.length === 0 && !error && (
              <p style={{ color: "#004030b0" }}>Nenhuma plantação encontrada.</p>
            )}

            {plantacoes.map((item, i) => (
              <IonCard
                key={item._id ?? item.id ?? i}
                style={{
                  backgroundColor: "#DCD0A8",
                  borderRadius: "16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  marginBottom: "12px",
                }}
              >
                <IonItem
                  lines="none"
                  style={{
                    "--background": "#DCD0A8",
                    borderRadius: "16px",
                    padding: "8px 4px",
                  }}
                >
                  <IonAvatar slot="start">
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        backgroundColor: "#4A9782",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IonIcon
                        icon={leafOutline}
                        style={{ color: "#FFF9E5", fontSize: "20px" }}
                      />
                    </div>
                  </IonAvatar>

                  <IonLabel>
                    <h2
                      style={{
                        fontWeight: 600,
                        color: "#004030",
                        fontSize: "15px",
                        marginBottom: "2px",
                      }}
                    >
                      {item.planta}
                    </h2>
                    <p style={{ color: "#004030b0", fontSize: "13px" }}>
                      Plantação
                    </p>
                  </IonLabel>
                </IonItem>
              </IonCard>
            ))}
          </>
        )}
      </IonContent>

      {/* Add Modal */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
            <IonTitle>{segment === 'animais' ? 'Novo Animal' : 'Nova Plantação'}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>Cancelar</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#FFF9E5' }}>
          <IonGrid>
            <IonRow>
              <IonCol>
                {segment === 'animais' ? (
                  <IonList style={{ background: '#FFF9E5' }}>
                    <IonItem style={{
                      '--background': '#FFF9E5',
                      '--color': '#004030',
                    }}>
                      <IonInput
                        label="Nome"
                        labelPlacement="stacked"
                        placeholder="Nome do animal"
                        value={newAnimal.nome}
                        debounce={0}
                        onIonInput={e => setNewAnimal({ ...newAnimal, nome: e.detail.value! })}
                        style={{
                          '--color': '#004030',
                          '--placeholder-color': '#004030',
                        }}
                      />
                    </IonItem>
                    <IonItem style={{
                      '--background': '#FFF9E5',
                      '--color': '#004030',
                    }}>
                      <IonInput
                        label="Idade"
                        labelPlacement="stacked"
                        type="number"
                        placeholder="Idade do animal"
                        value={newAnimal.idade}
                        debounce={0}
                        onIonInput={e => setNewAnimal({ ...newAnimal, idade: Number(e.detail.value) })}
                        style={{
                          '--color': '#004030',
                          '--placeholder-color': '#004030',
                        }}
                      />
                    </IonItem>
                    <IonItem style={{
                      '--background': '#FFF9E5',
                      '--color': '#004030',
                    }}>
                      <IonInput
                        label="Raça"
                        labelPlacement="stacked"
                        placeholder="Raça do animal"
                        value={newAnimal.raca}
                        debounce={0}
                        onIonInput={e => setNewAnimal({ ...newAnimal, raca: e.detail.value! })}
                        style={{
                          '--color': '#004030',
                          '--placeholder-color': '#004030',
                        }}
                      />
                    </IonItem>
                  </IonList>
                ) : (
                  <IonList style={{ background: '#FFF9E5' }}>
                    <IonItem style={{
                      '--background': '#FFF9E5',
                      '--color': '#004030',
                    }}>
                      <IonInput
                        label="Nome da Planta"
                        labelPlacement="stacked"
                        placeholder="Nome da plantação"
                        value={newPlantacao.planta}
                        debounce={0}
                        onIonInput={e => setNewPlantacao({ ...newPlantacao, planta: e.detail.value! })}
                        style={{
                          '--color': '#004030',
                          '--placeholder-color': '#004030',
                        }}
                      />
                    </IonItem>
                  </IonList>
                )}
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonButton
                  expand="block"
                  onClick={handleSubmit}
                  style={{
                    '--background': '#004030',
                    '--background-activated': '#003020',
                    marginTop: '20px'
                  }}
                >
                  Salvar
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      {/* Floating Action Button */}
      <IonButton
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: '80px', // above navbar
          right: '20px',  // right side
          '--border-radius': '50%',
          '--padding-start': '0',
          '--padding-end': '0',
          width: '56px',
          height: '56px',
          '--background': '#004030',
          '--background-activated': '#3A8772',
          zIndex: 1000,
        }}
      >
        <IonIcon
          icon={addOutline}
          style={{
            fontSize: '24px',
            marginInline: 'auto',
            color: '#FFF9E5',
          }}
        />
      </IonButton>

      {/* MENU INFERIOR - UMA SÓ LINHA */}
      <IonFooter>
        <IonToolbar
          style={{
            "--background": "#DCD0A8",
            "--border-color": "#DCD0A8",
            "--min-height": "64px",
            "--padding": "6px 6px"
          }}
        >
          <div style={{
            display: "flex",
            flexWrap: "nowrap",        // forçar 1 linha
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            gap: "6px",
            overflow: "hidden"        // evita overflow vertical/linhas extras
          }}>
            <IonButton fill="clear" href="/mapa" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <IonIcon icon={mapOutline} style={{ color: "#004030", fontSize: "18px" }} />
                <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Mapa</IonLabel>
              </div>
            </IonButton>

            <IonButton fill="clear" href="/market" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <IonIcon icon={cartOutline} style={{ color: "#004030", fontSize: "18px" }} />
                <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Market</IonLabel>
              </div>
            </IonButton>

            <IonButton fill="clear" href="/lista" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <IonIcon icon={listOutline} style={{ color: "#004030", fontSize: "18px" }} />
                <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Lista</IonLabel>
              </div>
            </IonButton>

            <IonButton fill="clear" routerLink="/veterinarios" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <IonIcon icon={bandageOutline} style={{ color: "#004030", fontSize: "18px" }} />
                <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Veterinária</IonLabel>
              </div>
            </IonButton>


            <IonButton fill="clear" href="/perfil" style={{ textTransform: 'none', flex: '1 1 0', minWidth: 0, padding: '6px 4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <IonIcon icon={personOutline} style={{ color: "#004030", fontSize: "18px" }} />
                <IonLabel style={{ color: "#004030", fontSize: "11px", textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Perfil</IonLabel>
              </div>
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default AnimaisPage;
