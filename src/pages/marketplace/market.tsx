import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonPage, IonTitle, IonToolbar, IonSelect, IonSelectOption, IonImg, IonGrid, IonRow, IonCol, IonAccordion, IonAccordionGroup, IonTabBar, IonTabButton, IonList } from '@ionic/react';
import { comunidadeApi, Publicacoes } from '../../hooks/MarketApi';
import { useAuth } from '../../AuthProvider';
import { useEffect, useRef, useState } from 'react';
import { openOutline, searchCircleOutline, saveOutline, settingsOutline, mapOutline, cartOutline, listOutline, sparklesOutline, personOutline, addCircleSharp, addOutline } from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import './market.css';
import logo from "../lista/logo.png";

const comunidade: React.FC = () => {
    const location = useLocation<{ photoFile?: File, coords?: { latitude: number, longitude: number } }>();
    const [navOpen, setNavOpen] = useState(false);
    const { getAllPublicacoes, insertDataPublicacoes } = comunidadeApi();
    const [publicacoes, setPublicacoes] = useState<Publicacoes[]>([]);
    const insertModal = useRef<HTMLIonModalElement>(null);
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
    const [pendingError, setPendingError] = useState<string | null>(null);
    const [publicacao, setPublicacao] = useState<Publicacoes>({
        _id: "",
        pontos: 0,
        author: {
            _id: "",
            username: ""
        },
        title: "",
        message: "",
        tags: [],
        imagens: null,
        publication_type: "",
        comentarios: [],
        createdAt: ""
    });
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);

    const fetchPublicacoes = async () => {
        try {
            const result = await getAllPublicacoes(user);
            setPublicacoes(result);
        } catch (error) {
            alert("Erro ao buscar publicações");
        }

    };

    useEffect(() => {
        fetchPublicacoes();
        if (pendingError && !showLoading) {
            setTimeout(() => {
                alert(pendingError);
                setPendingError(null);
            }, 50);
        }
    }, [pendingError, showLoading]);

    useEffect(() => {
        const init = async () => {
            await fetchPublicacoes();
            if (location.state?.photoFile) {
                console.log('entrei aqui: ', location.state?.photoFile);
                setPublicacao((prev) => ({
                    ...prev,
                    imagens: location.state?.photoFile ?? null,
                }));

                setTimeout(() => {
                    insertModal.current?.present();
                }, 100);
            }
        };
        init();
    }, [location.state]);

    const handleChange = (event: CustomEvent) => {
        const { name, value } = event.target as HTMLInputElement;
        setPublicacao((prevpublicacao) => ({ ...prevpublicacao, [name]: value }));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setPublicacao((prev) => ({
                ...prev,
                imagens: file,
            }));
        }
    };

    const handleSubmit = async () => {
        try {

            publicacao.author = { username: user.username, _id: user._id };

            const formData = new FormData();
            formData.append("user", JSON.stringify(publicacao.author));
            formData.append("title", publicacao.title);
            formData.append("pontos", publicacao.pontos.toString());
            formData.append("message", publicacao.message);
            formData.append("publication_type", publicacao.publication_type);

            const tagsArray = Array.isArray(publicacao.tags) ? publicacao.tags : publicacao.tags?.split(',').map((tag: string) => tag.trim()) || [];
            tagsArray.forEach((tag: string) => formData.append("tags[]", tag));
            if (publicacao.imagens instanceof File) {
                formData.append("file", publicacao.imagens);
            }

            setShowLoading(true);
            setLoading(true);
            const result = await insertDataPublicacoes(formData);

            if (result.success && result.data.token) {
                await fetchPublicacoes();
                closeInsertModal();
                setPublicacao({
                    _id: "",
                    pontos: 0,
                    author: {
                        _id: "",
                        username: ""
                    },
                    title: "",
                    message: "",
                    tags: [],
                    imagens: "",
                    publication_type: "",
                    comentarios: [],
                    createdAt: ""
                });

            } else {
                setPendingError(result.error);
            }

        } catch (error) {
            alert('Erro ao inserir publicação')
        }
    };

    const [tags, setTags] = useState<string[]>([]);
    const [publicationType, setPublicationType] = useState<string>('');

    const handlePublicationTypeChange = (e: any) => {
        setPublicationType(e.detail.value);
    };

    const toggleAccordion = () => {
        setIsAccordionOpen(!isAccordionOpen);
    };

    const filteredPublicacoes = publicacoes.filter((publicacao) => {
        const matchesType = !publicationType || publicacao.publication_type === publicationType;  // Verifica se não há filtro de tipo ou se é uma correspondência.
        const matchesTags = tags.length === 0 || (Array.isArray(publicacao.tags) && publicacao.tags.some(tag => tags.includes(tag)));

        return matchesType && matchesTags;
    });

    const toggleNavbar = () => {
        setNavOpen(prev => !prev);
    };

    const closeInsertModal = () => {
        insertModal.current?.dismiss();
    };

    const truncateWords = (text: string, wordLimit: number) => {
        const words = text.split(' ');
        if (words.length <= wordLimit) return text;
        return words.slice(0, wordLimit).join(' ') + '...';
    };

    return (
        <>

            {(
                <IonPage className='comunidade-page'>
                    <IonHeader>
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
                            <IonButtons slot="end" id="search">
                                <IonButton onClick={toggleAccordion}>
                                    <IonIcon icon={searchCircleOutline} size="large" />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className='page-background'>
                        {isAccordionOpen && (
                            <IonAccordionGroup className="ion-accordion-group">
                                {/* Tags Accordion */}
                                <IonAccordion value="search" className="ion-accordion">
                                    <IonItem slot="header" color="rose">
                                        <IonLabel style={{ color: "#000", fontWeight: "normal" }}>🎯 Selecione as Tags</IonLabel>
                                    </IonItem>
                                    <div className="ion-padding ion-accordion-content" slot="content">
                                        <IonInput
                                            value={tags.join(', ')}
                                            placeholder="Digite as tags e pressione Enter"
                                            onIonInput={(e) =>
                                                setTags(e.detail.value?.split(',').map(tag => tag.trim()) || [])
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const newTag = (e.target as HTMLInputElement).value.trim();
                                                    if (newTag && !tags.includes(newTag)) {
                                                        setTags([...tags, newTag]);
                                                    }
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                </IonAccordion>
                              <div className="ion-padding">
                                    <IonButton
                                        expand="full"
                                        style={{
                                            color: '#FFF9E5',
                                            borderRadius: '10px',
                                            '--background': '#004030'
                                        }}
                                        onClick={() => {
                                            setTags([]);
                                            setPublicationType("");
                                        }}
                                    >
                                        Limpar Filtros
                                    </IonButton>
                                </div>
                            </IonAccordionGroup>
                        )}
                        <IonModal ref={insertModal} trigger="insert-modal-comunidade">
                            <IonHeader>
                                <IonToolbar style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
                                    <IonTitle>Nova Publicação</IonTitle>
                                    <IonButtons slot="end">
                                        <IonButton onClick={() => insertModal.current?.dismiss()}>Cancelar</IonButton>
                                    </IonButtons>
                                </IonToolbar>
                            </IonHeader>

                            <IonContent style={{ '--background': '#FFF9E5' }}>
                                <IonGrid>
                                    <IonRow>
                                        <IonCol>
                                            <IonList style={{ background: '#FFF9E5' }}>
                                                <IonItem style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
                                                    <IonInput
                                                        label="Título"
                                                        labelPlacement="stacked"
                                                        placeholder="Digite o título"
                                                        name="title"
                                                        value={publicacao.title}
                                                        onIonInput={handleChange}
                                                    />
                                                </IonItem>

                                                <IonItem style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
                                                    <IonInput
                                                        label="Mensagem"
                                                        labelPlacement="stacked"
                                                        placeholder="Digite a mensagem"
                                                        name="message"
                                                        value={publicacao.message}
                                                        onIonInput={handleChange}
                                                    />
                                                </IonItem>

                                                <IonItem style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
                                                    <IonInput
                                                        label="Tags"
                                                        labelPlacement="stacked"
                                                        placeholder="Digite as tags separadas por vírgula"
                                                        name="tags"
                                                        value={Array.isArray(publicacao.tags) ? publicacao.tags.join(', ') : publicacao.tags}
                                                        onIonInput={(e) => {
                                                            const newTags = e.detail.value
                                                                ? e.detail.value.split(',').map(tag => tag.trim())
                                                                : [];
                                                            setPublicacao(prev => ({ ...prev, tags: newTags }));
                                                        }}
                                                    />
                                                </IonItem>

                                                <IonItem style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
                                                    <IonSelect
                                                        label="Tipo"
                                                        labelPlacement="stacked"
                                                        placeholder="Escolha o tipo"
                                                        name="publication_type"
                                                        value={publicacao.publication_type}
                                                        onIonChange={handleChange}
                                                    >
                                                        <IonSelectOption value="publi">Publicação</IonSelectOption>
                                                    </IonSelect>
                                                </IonItem>

                                                <IonItem style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
                                                    <label style={{ fontSize: '14px', color: '#004030' }}>
                                                        {publicacao.imagens ? 'Imagem carregada ✅' : 'Selecione uma imagem'}
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        style={{
                                                            padding: "8px",
                                                            width: "100%",
                                                            border: "none",
                                                            outline: "none",
                                                            fontSize: "15px",
                                                            color: "#004030"
                                                        }}
                                                    />
                                                </IonItem>
                                            </IonList>
                                        </IonCol>
                                    </IonRow>

                                    <IonRow>
                                        <IonCol>
                                            <IonButton
                                                expand="block"
                                                onClick={handleSubmit}
                                                style={{
                                                    '--color': '#FFF9E5',
                                                    '--background': '#004030',
                                                    '--background-activated': '#003020',
                                                    marginTop: '20px'
                                                }}
                                            >
                                                Guardar
                                            </IonButton>
                                        </IonCol>
                                    </IonRow>
                                </IonGrid>
                            </IonContent>
                        </IonModal>


                        <IonGrid>
                            <IonRow>
                                {filteredPublicacoes.map((publicacao: Publicacoes) => (
                                    <IonCol size="12" sizeMd="4" key={publicacao._id}>
                                        <div className="card-container">
                                            {publicacao.imagens && (
                                                <IonImg className="card-image"
                                                    src={typeof publicacao.imagens === "string"
                                                        ? publicacao.imagens
                                                        : ""}
                                                    alt="Imagem da publicação"
                                                />
                                            )}

                                            <div className="card-header">
                                                {publicacao.title}
                                            </div>

                                            <div
                                                className="card-subheader"
                                                style={{
                                                    fontSize: '0.9rem',
                                                    color: '#3A8772',
                                                    marginTop: '12px',
                                                }}
                                            >
                                                <strong>Tipo:</strong> {
                                                    publicacao.publication_type === 'publi'
                                                        ? 'Publicação'
                                                        : publicacao.publication_type.charAt(0).toUpperCase() + publicacao.publication_type.slice(1)
                                                }

                                            </div>

                                            <div className="card-content">
                                                <p>{truncateWords(publicacao.message, 35)}</p>
                                                <div className="card-tags">
                                                    <strong>Tags: </strong>
                                                    {Array.isArray(publicacao.tags) && publicacao.tags.length
                                                        ? publicacao.tags.join(', ')
                                                        : 'Sem tags'}
                                                </div>
                                            </div>

                                            <div className="card-button">
                                                <IonButton routerLink={`/marketdetalhes/${publicacao._id}`}>
                                                    <IonIcon icon={openOutline} size='small' />
                                                    Ver Mais
                                                </IonButton>
                                            </div>
                                        </div>
                                    </IonCol>
                                ))}
                            </IonRow>
                        </IonGrid>
                        <IonButton
                            id="insert-modal-comunidade"
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
                    </IonContent>
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
                </IonPage>
            )}
        </>
    );
};

export default comunidade;