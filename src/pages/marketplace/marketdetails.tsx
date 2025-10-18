import { IonAlert, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonList, IonModal, IonPage, IonRow, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/react';
import { comunidadeApi, Publicacoes } from '../../hooks/MarketApi';
import { useEffect, useRef, useState } from 'react';
import { trashBin, chatbubbleOutline, createSharp, happyOutline, sadOutline, cashOutline, createOutline, trashBinOutline, chevronExpandOutline, sendSharp, qrCodeOutline, trophyOutline, settingsOutline, arrowBack, } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { useAuth } from '../../AuthProvider';
import './marketdetails.css'
import logo from "../lista/logo.png";
import './market.css'

interface DetailsProps extends RouteComponentProps<{
    id: string
}> { }

const DetalhesPublicacao: React.FC<DetailsProps> = ({ match }) => {
    const { getPublicacoesDetails, editDataPublicacoes, deleteDataPublicacoes, addPraticipantes, addComentario, editDataComment, deleteDataComment, getQRCodePublicacao } = comunidadeApi();
    const history = useHistory();
    const [showConfirmAlert, setShowConfirmAlert] = useState(false);
    const [showConfirmLeaveAlert, setShowConfirmLeaveAlert] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [editCommentId, setEditCommentId] = useState<string | null>(null);
    const { user } = useAuth();

    const [publicacao, setPublicacao] = useState<Publicacoes>({
        _id: "",
        preco: 0,
        author: {
            _id: "",
            username: ""
        },
        title: "",
        message: "",
        tags: [],
        imagens: "",
        publication_type: "publi",
        comentarios: [],
        createdAt: ""
    });
    const [isParticipating, setIsParticipating] = useState<boolean>(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [showQrModal, setShowQrModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [qrData, setQrData] = useState('');


    const fetchPublicacaoDetails = async () => {
        try {
            const result = await getPublicacoesDetails(match.params.id);
            if (result) {
                setPublicacao(result);
                return result;
            }
        } catch (err) {
            alert('Erro ao buscar os detalhes da publicação');
        }
    };

    useEffect(() => {
        fetchPublicacaoDetails();
    }, []);


    const deleteModal = useRef<HTMLIonModalElement>(null);

    const handleChange = (event: CustomEvent) => {
        const { name, value } = event.target as HTMLInputElement;
        setPublicacao((values: any) => ({
            ...values,
            [name]: name === "tags" ? value.split(",").map(tag => tag.trim()) : value
        }));
    };

    const handleSubmit = () => {
        editDataPublicacoes(publicacao);
        closeModal();
    };

    const handleDelete = async () => {
        try {
            await deleteDataPublicacoes(publicacao._id);
            setShowDeleteAlert(false);
            history.goBack();
        } catch (err) {
            alert('Erro ao deletar')
        } finally {
            if (deleteModal.current) {
                deleteModal.current.dismiss();
            }
        }
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

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;

        try {
            if (editCommentId) {
                await editDataComment(editCommentId, newComment);
            } else {
                await addComentario(publicacao._id, user, newComment);
            }

            setNewComment("");
            setEditCommentId(null);
            setShowCommentInput(false);
            fetchPublicacaoDetails();
        } catch (error) {
            alert('Erro ao enviar comentário')
        }
    };

    const handleEditComment = (comentario: any) => {
        setNewComment(comentario.message);
        setEditCommentId(comentario._id);
        setShowCommentInput(true);
    };


    const handleDeleteComment = async (comentarioId: string) => {
        try {
            await deleteDataComment(comentarioId);

            fetchPublicacaoDetails();
        } catch (error) {
            alert('Erro ao deletar comentário')
        }
    };

    const handleCancel = () => {
        setShowDeleteAlert(false);
    };

    const dataObj = new Date(publicacao.createdAt);

    const dia = dataObj.getDate().toString().padStart(2, '0');
    const mes = dataObj.toLocaleString('pt-PT', { month: 'short' });
    const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
    const ano = dataObj.getFullYear();
    const horas = dataObj.getHours().toString().padStart(2, '0');
    const minutos = dataObj.getMinutes().toString().padStart(2, '0');

    const dataCriacao = `${dia} ${mesCapitalizado} ${ano} - ${horas}:${minutos}`;

    const closeModal = () => {
        setShowEditModal(false);
    };
    
    const getImageSrc = (imagens: string | File | null) => {
        if (!imagens) return '';
        if (typeof imagens === 'string') return imagens; 
        if (imagens instanceof File) return URL.createObjectURL(imagens); 
        return '';
    };
    return (
        <IonPage className='detalhes-page'>
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
                        <IonButton fill="clear" href="/settings" >
                            <IonIcon
                                icon={settingsOutline}
                                style={{ color: "#004030", fontSize: "24px" }}
                            />
                        </IonButton>
                    </IonButtons>
                    <IonButtons slot="start">
                        <IonButton fill="clear" href="/market" >
                            <IonIcon
                                icon={arrowBack}
                                style={{ color: "#004030", fontSize: "24px" }}
                            />
                        </IonButton>
                    </IonButtons>
                    <IonButtons slot="end">
                        <>
                            <IonButton onClick={() => setShowEditModal(true)} size='large'>
                                <IonIcon icon={createSharp} slot="icon-only" />
                            </IonButton>
                            <IonButton onClick={() => setShowDeleteAlert(true)} size='large'>
                                <IonIcon icon={trashBin} slot="icon-only" />
                            </IonButton>
                        </>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="page-background page-detalhes">
                <IonCard className="card-container" style={{
                    backgroundColor: "#DCD0A8",
                    color: "#004030",
                    borderRadius: "12px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                }}>
                    <IonCardContent className="card-content">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <div className="tag-retangulo">
                                {publicacao.publication_type}
                            </div>


                        </div>
                    </IonCardContent>
                    <IonCardHeader className="card-content" style={{ paddingTop: '0px' }}>
                        <IonCardTitle className="card-header" style={{ marginTop: '0px' }}>{publicacao.title}</IonCardTitle>
                    </IonCardHeader>

                    <IonCardContent className="card-content">
                        <p><strong></strong> {publicacao.message}</p>
                    </IonCardContent>

                    {publicacao.preco > 0 && (
                        <IonCardContent className="card-content" style={{ marginTop: '-10px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#004030',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                }}
                            >
                                <IonIcon icon={cashOutline} style={{ fontSize: '20px', color: '#004030' }} />
                                <span>
                                    Preço:{' '}
                                    {publicacao.preco && publicacao.preco > 0
                                        ? `€${publicacao.preco.toFixed(2)}`
                                        : 'Grátis'}
                                </span>
                            </div>
                        </IonCardContent>
                    )}
                    {publicacao.imagens && (
                        <IonCardContent style={{ marginTop: '-35px' }}>
                            <div style={{ position: 'relative' }}>
                                <IonImg
                                    src={getImageSrc(publicacao.imagens)}
                                    alt="Imagem da publicação"
                                    style={{
                                        width: '100%',
                                        maxHeight: '200px',
                                        height: '200px',
                                        maxWidth: '600px',
                                        margin: '0 auto',
                                        display: 'block',
                                        objectFit: 'contain',
                                        borderRadius: '12px'
                                    }}
                                />
                                <IonIcon
                                    icon={chevronExpandOutline}
                                    onClick={() => setShowImageModal(true)}
                                    style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        right: '10px',
                                        fontSize: '24px',
                                        color: '#ffffffcc',
                                        backgroundColor: '#004030',
                                        borderRadius: '50%',
                                        padding: '6px',
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                        </IonCardContent>

                    )}

                    <IonCardContent className="card-tags tags-conteudo" >
                        <div className="tags-row" style={{ color: "#004030" }}>
                            <strong>Tags:</strong>
                            <div className="tags-grid">
                                {Array.isArray(publicacao.tags) && publicacao.tags.length > 0 ? (
                                    publicacao.tags.map((tag, index) => (
                                        <IonChip key={index} color="primary" outline>
                                            {tag}
                                        </IonChip>
                                    ))
                                ) : (
                                    <IonChip color="medium" outline>
                                        Sem tags
                                    </IonChip>
                                )}
                            </div>
                        </div>
                    </IonCardContent>
                    <IonCardContent className="card-tags tags-conteudo">

                    </IonCardContent>
                    <IonCardContent>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0px',
                                paddingBottom: '0px',
                                paddingTop: '2px',
                                fontSize: '14px',
                                color: '#666',
                                marginTop: '-10px',
                                borderBottom: '2px solid #004030'
                            }}
                        >
                            <span>Autor: {publicacao.author?.username || 'Desconhecido'}</span>
                            <span className="data"> {dataCriacao}</span>
                        </div>
                    </IonCardContent>
                    <IonCardContent>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',

                        }}>
                            <strong>Comentários:</strong>
                        </div>
                        {publicacao.comentarios?.length > 0 ? (
                            publicacao.comentarios.map((comentario: any) => {
                                const dataComentario = new Date(comentario.createdAt);
                                const dia = dataComentario.getDate();
                                const mes = dataComentario.toLocaleString('pt-PT', { month: 'short' });
                                const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
                                const ano = dataComentario.getFullYear();
                                const horaFormatada = dataComentario.toLocaleTimeString('pt-PT', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                });
                                const dataFinal = `${dia} ${mesCapitalizado} ${ano} - ${horaFormatada}`;

                                return (
                                    <div key={comentario._id} className="comment-box">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong className="comentario-autor">
                                                {comentario.author?.username}{" "}
                                                <span className="data2">
                                                    ({dataFinal})
                                                </span>
                                            </strong>

                                            {user && user._id && (
                                                <div style={{ display: 'flex' }}>
                                                    <IonButton fill="clear" size="small" color="primary" onClick={() => handleEditComment(comentario)}>
                                                        <IonIcon icon={createOutline} slot="icon-only" />
                                                    </IonButton>
                                                    <IonButton fill="clear" size="small" color="danger" onClick={() => handleDeleteComment(comentario._id)}>
                                                        <IonIcon icon={trashBinOutline} slot="icon-only" />
                                                    </IonButton>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ marginTop: '4px' }}>
                                            <p className="comentario-msg" style={{ margin: 0 }}>{comentario.message}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p>Sem comentários</p>
                        )}
                    </IonCardContent>
                    {
                        publicacao.publication_type === 'evento' && user.username !== publicacao.author.username && (
                            <IonCardContent>
                                <IonButton
                                    expand="block"
                                    fill="outline"
                                    color={isParticipating ? 'danger' : 'success'}
                                    shape="round"
                                    onClick={() => {
                                        if (isParticipating) {
                                            setShowConfirmLeaveAlert(true);
                                        } else {
                                            setShowConfirmAlert(true);

                                        }

                                    }}
                                >
                                    <IonIcon icon={isParticipating ? sadOutline : happyOutline} slot="start" />
                                    {isParticipating ? 'Cancelar participação' : 'Participar do Evento'}
                                </IonButton>

                            </IonCardContent>
                        )
                    }

                    <IonCardContent>
                        <div style={{
                            paddingTop: '0px',
                            marginTop: '-15px'
                        }}>
                            {!showCommentInput ? (
                                <IonButton
                                    expand="block"
                                    fill="outline"
                                    className="btn-adicionar-comentario"
                                    shape="round"
                                    onClick={() => setShowCommentInput(true)}
                                >
                                    <IonIcon icon={chatbubbleOutline} slot="start" />
                                    Adicionar Comentário
                                </IonButton>
                            ) : (
                                <>
                                    <IonItem
                                        className="comentario-input">
                                        <IonInput
                                            className="comentario-input"
                                            placeholder="Escreva seu comentário..."
                                            value={newComment}
                                            onIonInput={(e) => setNewComment(e.detail.value!)}
                                            onKeyDown={(e: any) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSubmitComment();
                                                }
                                            }}
                                        />
                                        <IonButton onClick={handleSubmitComment} color="#004030">
                                            <IonIcon icon={sendSharp} />
                                        </IonButton>
                                    </IonItem>
                                    <IonButton
                                        expand="block"
                                        fill="clear"
                                        color="medium"
                                        onClick={() => {
                                            setNewComment("");
                                            setEditCommentId(null);
                                            setShowCommentInput(false);
                                        }}
                                    >
                                        Cancelar
                                    </IonButton>
                                </>
                            )}
                        </div>

                    </IonCardContent>
                </IonCard>

                <IonModal isOpen={showEditModal} onDidDismiss={closeModal}>
                    <IonHeader>
                        <IonToolbar style={{ '--background': '#FFF9E5', '--color': '#004030' }}>
                            <IonTitle>Editar Publicação</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={closeModal}>Cancelar</IonButton>
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
                                                type="number"
                                                label="Preço (€)"
                                                labelPlacement="stacked"
                                                placeholder="Digite o preço do produto"
                                                name="preco"
                                                value={publicacao.preco}
                                                onIonInput={(e) => {
                                                    const value = parseFloat(e.detail.value ?? "0");
                                                    setPublicacao(prev => ({ ...prev, preco: isNaN(value) ? 0 : value }));
                                                }}
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
                                            '--background': '#004030',
                                            '--color': '#FFF9E5',
                                            '--background-activated': '#003020',
                                            marginTop: '20px',
                                            borderRadius: '10px'
                                        }}
                                    >
                                        Guardar
                                    </IonButton>
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    </IonContent>
                </IonModal>

                <IonModal
                    isOpen={showQrModal}
                    onDidDismiss={() => setShowQrModal(false)}
                    breakpoints={[0, 0.5, 0.75]}
                    initialBreakpoint={0.5}
                >
                    <div style={{
                        background: "#fff",
                        padding: "1.5rem",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center"
                    }}>
                        <h3 style={{ marginBottom: "1rem", color: "#000" }}>QR Code de Participação</h3>

                        {qrData ? (
                            <img src={qrData} alt="QR Code" style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }} />
                        ) : (
                            <p style={{ color: "#333" }}>Carregando QR Code...</p>
                        )}

                        <IonButton
                            expand="block"
                            onClick={() => setShowQrModal(false)}
                            style={{ marginTop: "1.5rem" }}
                            color="primary"
                        >
                            Fechar
                        </IonButton>
                    </div>
                </IonModal>
                <IonAlert
                    isOpen={showDeleteAlert}
                    onDidDismiss={() => setShowDeleteAlert(false)}
                    header={'excluir publicação'}
                    message={'Queres mesmo apagar?'}
                    buttons={[
                        {
                            text: 'Não',
                            role: 'cancel',
                            handler: handleCancel,
                        },
                        {
                            text: 'Sim',
                            handler: handleDelete,
                        },
                    ]}
                />
            </IonContent>
            <IonModal className="custom-modal2"
                isOpen={showImageModal}
                onDidDismiss={() => setShowImageModal(false)}
                initialBreakpoint={0.75}
                breakpoints={[0, 0.5, 0.75, 1]}
                handleBehavior="cycle"
            >
                <IonContent className="custom-modal2">
                    <div className="custom-modal2">
                        <img
                            src={typeof publicacao.imagens === "string"
                                ? publicacao.imagens
                                : ''}
                            style={{
                                width: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px',
                            }}
                            onClick={() => setShowImageModal(false)}
                        />
                    </div>
                </IonContent>
            </IonModal>
        </IonPage>

    );
};

export default DetalhesPublicacao;