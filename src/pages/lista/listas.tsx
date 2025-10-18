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
  addOutline,  // add this import
} from "ionicons/icons";

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

  const API_BASE = ("http://localhost:8000").replace(/\/+$/,'');

  const fetchAnimais = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/animais`);
      // axios coloca o payload em res.data
      const payload = res.data;
      const data = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : (payload.data ?? payload));
      setAnimais(data);
    } catch (err: any) {
      console.error("Fetch animais erro:", err);
      const msg = err?.response?.data?.message || err.message || "Erro ao obter animais";
      setError(msg);
      setAnimais([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/plantacoes`);
      const payload = res.data;
      const data = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : (payload.data ?? payload));
      setPlantacoes(data);
    } catch (err: any) {
      console.error("Fetch plantações erro:", err);
      const msg = err?.response?.data?.message || err.message || "Erro ao obter plantações";
      setError(msg);
      setPlantacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (segment === 'animais') {
        // Add default values for required fields
        const animalData = {
          ...newAnimal,
          localizacaoX: 0, // you might want to get real coordinates
          localizacaoY: 0, // you might want to get real coordinates
          dono_id: "65a6b1234c5d6e7f89012345" // replace with actual user ID
        };

        if (!animalData.nome || !animalData.idade || !animalData.raca) {
          alert('Por favor preencha todos os campos');
          return;
        }

        await axios.post(`${API_BASE}/animais`, animalData);
        await fetchAnimais(); // refresh the list
        setShowModal(false);
        setNewAnimal({}); // reset form
      } else {
        // Handle plantação creation
        const plantacaoData = {
          ...newPlantacao,
          localizacaoX: 0,
          localizacaoY: 0,
          dono_id: "65a6b1234c5d6e7f89012345"
        };

        if (!plantacaoData.planta) {
          alert('Por favor preencha o nome da planta');
          return;
        }

        await axios.post(`${API_BASE}/plantacoes`, plantacaoData);
        await fetchPlantacoes();
        setShowModal(false);
        setNewPlantacao({});
      }
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      alert(err?.response?.data?.message || 'Erro ao salvar');
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
                        onIonInput={e => setNewAnimal({...newAnimal, nome: e.detail.value!})}
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
                        onIonInput={e => setNewAnimal({...newAnimal, idade: Number(e.detail.value)})}
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
                        onIonInput={e => setNewAnimal({...newAnimal, raca: e.detail.value!})}
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
                        onIonInput={e => setNewPlantacao({...newPlantacao, planta: e.detail.value!})}
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

      {/* MENU INFERIOR */}
      <IonFooter
        style={{
          borderTop: "2px solid #DCD0A8",
          backgroundColor: "#DCD0A8", // tom claro do footer / navbar
        }}
      >
        <IonTabBar
          slot="bottom"
          style={{
            backgroundColor: "#DCD0A8", // tom claro
            color: "#004030",
            "--color-selected": "#004030",
          }}
        >
          <IonTabButton tab="mapa">
            <IonIcon icon={mapOutline} style={{ color: "#004030" }} />
            <IonLabel style={{ color: "#004030" }}>Mapa</IonLabel>
          </IonTabButton>

          <IonTabButton tab="market">
            <IonIcon icon={cartOutline} style={{ color: "#004030" }} />
            <IonLabel style={{ color: "#004030" }}>Market</IonLabel>
          </IonTabButton>

          <IonTabButton tab="lista" selected>
            <IonIcon icon={listOutline} style={{ color: "#004030" }} />
            <IonLabel style={{ color: "#004030" }}>Lista</IonLabel>
          </IonTabButton>

          <IonTabButton tab="ai">
            <IonIcon icon={sparklesOutline} style={{ color: "#004030" }} />
            <IonLabel style={{ color: "#004030" }}>AI</IonLabel>
          </IonTabButton>

          <IonTabButton tab="perfil">
            <IonIcon icon={personOutline} style={{ color: "#004030" }} />
            <IonLabel style={{ color: "#004030" }}>Perfil</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonFooter>
    </IonPage>
  );
};

export default AnimaisPage;
