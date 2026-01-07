import React from 'react';
import axios from 'axios';
import {
  IonAlert, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonCol,
  IonContent, IonGrid, IonRow, IonHeader, IonInput, IonItem, IonLabel, IonModal, IonPage, IonToolbar, IonTitle, IonIcon, IonImg
} from '@ionic/react';
import { RouteComponentProps } from 'react-router';
import {
  trashBin, createSharp, chatbubbleOutline, sendSharp, createOutline, trashBinOutline, chevronExpandOutline,
  cashOutline, happyOutline, sadOutline, settingsOutline, arrowBack
} from 'ionicons/icons';
import logo from "../lista/logo.png";
import './marketdetails.css';
import './market.css';

interface DetailsProps extends RouteComponentProps<{ id: string }> { }

interface Publicacao {
  _id: string;
  preco: number;
  author: { _id: string; username: string };
  title: string;
  message: string;
  tags: string[];
  imagens: string | File | null;
  publication_type: string;
  comentarios: Array<{ _id: string; author: { username: string }; message: string; createdAt: string }>;
  createdAt: string;
}

interface DetalhesState {
  publicacao: Publicacao;
  isParticipating: boolean;
  showDeleteAlert: boolean;
  showEditModal: boolean;
  showImageModal: boolean;
  showCommentInput: boolean;
  editCommentId: string | null;
  newComment: string;
  qrData: string;
  showQrModal: boolean;
}

const API_BASE = "https://agrofieldtrack-node-1yka.onrender.com";
axios.defaults.withCredentials = true;

class DetalhesPublicacao extends React.Component<DetailsProps, DetalhesState> {
  state = {
    publicacao: {
      _id: "",
      preco: 0,
      author: { _id: "", username: "" },
      title: "",
      message: "",
      tags: [],
      imagens: null,
      publication_type: "publi",
      comentarios: [],
      createdAt: ""
    } as Publicacao,
    isParticipating: false,
    showDeleteAlert: false,
    showEditModal: false,
    showImageModal: false,
    showCommentInput: false,
    editCommentId: null as string | null,
    newComment: "",
    qrData: "",
    showQrModal: false
  };

  componentDidMount() {
    this.fetchPublicacaoDetails();
  }

  fetchPublicacaoDetails = async () => {
    const { id } = this.props.match.params;
    try {
      const res = await axios.get(`${API_BASE}/publicacoes/${id}`);
      if (res.data) {
        this.setState({ publicacao: res.data });
      }
    } catch (err) {
      alert('Erro ao buscar os detalhes da publicação');
    }
  };

  handleChange = (e: CustomEvent) => {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;
    this.setState(prev => ({
      publicacao: {
        ...prev.publicacao,
        [name]: name === "tags" ? value.split(",").map(t => t.trim()) : value
      }
    }));
  };

  handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      this.setState(prev => ({
        publicacao: { ...prev.publicacao, imagens: file }
      }));
    }
  };

  handleSubmit = async () => {
    const { publicacao } = this.state;
    try {
      const formData = new FormData();
      formData.append("title", publicacao.title);
      formData.append("message", publicacao.message);
      formData.append("preco", publicacao.preco.toString());
      formData.append("tags", JSON.stringify(publicacao.tags));
      if (publicacao.imagens instanceof File) {
        formData.append("imagens", publicacao.imagens);
      }

      await axios.put(`${API_BASE}/publicacoes/${publicacao._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Publicação atualizada!");
      this.setState({ showEditModal: false });
      this.fetchPublicacaoDetails();
    } catch (err) {
      alert("Erro ao atualizar publicação");
    }
  };

  handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/publicacoes/${this.state.publicacao._id}`);
      alert("Publicação deletada");
      this.props.history.push("/market");
    } catch (err) {
      alert("Erro ao deletar publicação");
    }
  };

  handleSubmitComment = async () => {
    const { newComment, editCommentId, publicacao } = this.state;
    if (!newComment.trim()) return;

    try {
      if (editCommentId) {
        await axios.put(`${API_BASE}/comentarios/${editCommentId}`, { message: newComment });
      } else {
        await axios.post(`${API_BASE}/comentarios`, { publicacaoId: publicacao._id, message: newComment });
      }
      this.setState({ newComment: "", editCommentId: null, showCommentInput: false });
      this.fetchPublicacaoDetails();
    } catch {
      alert("Erro ao enviar comentário");
    }
  };

  handleDeleteComment = async (commentId: string) => {
    try {
      await axios.delete(`${API_BASE}/comentarios/${commentId}`);
      this.fetchPublicacaoDetails();
    } catch {
      alert("Erro ao deletar comentário");
    }
  };

  getImageSrc = (imagens: string | File | null) => {
    if (!imagens) return '';
    if (typeof imagens === 'string') return imagens;
    if (imagens instanceof File) return URL.createObjectURL(imagens);
    return '';
  };

  render() {
    const {
      publicacao, showEditModal, showDeleteAlert, showImageModal, showCommentInput,
      newComment
    } = this.state;

    const dataObj = new Date(publicacao.createdAt);
    const dia = dataObj.getDate().toString().padStart(2, '0');
    const mes = dataObj.toLocaleString('pt-PT', { month: 'short' });
    const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
    const ano = dataObj.getFullYear();
    const horas = dataObj.getHours().toString().padStart(2, '0');
    const minutos = dataObj.getMinutes().toString().padStart(2, '0');
    const dataCriacao = `${dia} ${mesCapitalizado} ${ano} - ${horas}:${minutos}`;

    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ ["--background" as any]: "#FFF9E5", ["--color" as any]: "#004030" }}>
            <img src={logo} alt="perfil" style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #DCD0A8" }} />
            <IonButtons slot="start">
              <IonBackButton defaultHref="/market" />
            </IonButtons>
            <IonButtons slot="end">
              <IonButton onClick={() => this.setState({ showEditModal: true })}><IonIcon icon={createSharp} /></IonButton>
              <IonButton onClick={() => this.setState({ showDeleteAlert: true })}><IonIcon icon={trashBin} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="page-background page-detalhes">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>{publicacao.title}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>{publicacao.message}</p>
              {publicacao.preco > 0 && <div><IonIcon icon={cashOutline} /> €{publicacao.preco.toFixed(2)}</div>}
              {publicacao.imagens && <IonImg src={this.getImageSrc(publicacao.imagens)} />}
              <div>Autor: {publicacao.author?.username || "Desconhecido"}</div>
              <div>Criado em: {dataCriacao}</div>
            </IonCardContent>

            <IonCardContent>
              <strong>Comentários:</strong>
              {publicacao.comentarios?.map(c => (
                <div key={c._id}>
                  <span>{c.author.username}: {c.message}</span>
                  <IonButton size="small" onClick={() => this.handleDeleteComment(c._id)}><IonIcon icon={trashBinOutline} /></IonButton>
                </div>
              ))}
              {showCommentInput &&
                <IonItem>
                  <IonInput value={newComment} placeholder="Comente..." onIonInput={(e) => this.setState({ newComment: e.detail.value! })} />
                  <IonButton onClick={this.handleSubmitComment}><IonIcon icon={sendSharp} /></IonButton>
                </IonItem>
              }
              {!showCommentInput &&
                <IonButton onClick={() => this.setState({ showCommentInput: true })}>Adicionar comentário</IonButton>
              }
            </IonCardContent>
          </IonCard>

          <IonAlert
            isOpen={showDeleteAlert}
            onDidDismiss={() => this.setState({ showDeleteAlert: false })}
            header="Excluir publicação"
            message="Deseja realmente deletar?"
            buttons={[
              { text: 'Não', role: 'cancel' },
              { text: 'Sim', handler: this.handleDelete }
            ]}
          />
        </IonContent>

        <IonModal isOpen={showEditModal} onDidDismiss={() => this.setState({ showEditModal: false })}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Editar Publicação</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => this.setState({ showEditModal: false })}>Cancelar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonItem>
              <IonInput name="title" value={publicacao.title} placeholder="Título" onIonInput={this.handleChange} />
            </IonItem>
            <IonItem>
              <IonInput name="message" value={publicacao.message} placeholder="Mensagem" onIonInput={this.handleChange} />
            </IonItem>
            <IonItem>
              <IonInput type="number" name="preco" value={publicacao.preco} placeholder="Preço (€)"
                onIonInput={(e) => this.setState({ publicacao: { ...publicacao, preco: parseFloat(e.detail.value ?? "0") } })} />
            </IonItem>
            <IonItem>
              <IonInput name="tags" value={publicacao.tags.join(", ")} placeholder="Tags"
                onIonInput={(e) => this.setState({ publicacao: { ...publicacao, tags: e.detail.value?.split(",").map(t => t.trim()) ?? [] } })} />
            </IonItem>
            <IonItem>
              <input type="file" onChange={this.handleFileChange} />
            </IonItem>
            <IonButton expand="block" onClick={this.handleSubmit}>Salvar</IonButton>
          </IonContent>
        </IonModal>

      </IonPage>
    );
  }
}

export default DetalhesPublicacao;
