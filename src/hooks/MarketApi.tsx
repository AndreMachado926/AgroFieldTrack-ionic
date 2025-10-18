import axios from 'axios';
import { useAuth } from '../AuthProvider';

export interface Participante {
    _id: string;
    username: string;
}

export interface Publicacoes {
    pontos: number;
    _id: string
    author: Participante,
    title: string,
    message: string,
    tags: string[] | string,
    imagens: string | File | null,
    publication_type: string,
    comentarios: string[],
    createdAt: string | number | Date;
}

export const comunidadeApi = () => {
    const url = "http://localhost:8000";

    const { user } = useAuth();
    const getAllPublicacoes = async (user: any): Promise<Publicacoes[]> => {
        const { data } = await axios.get<Publicacoes[]>(`${url}/comunidade`, {
            headers: {
                Authorization: `Bearer ${user.token}`,
            },
        });
        return data;
    };

    const getPublicacoesDetails = async (id: string): Promise<Publicacoes> => {
        const { data } = await axios.get<Publicacoes>(`${url}/detalhescomunidade/${id}`, {
            headers: {
                Authorization: `Bearer ${user.token}`,
            },
            withCredentials: true,
        });
        return data;
    };

    const editDataPublicacoes = async (publicacao: Publicacoes): Promise<Publicacoes> => {
        try {
            const formData = new FormData();
            formData.append('title', publicacao.title);
            formData.append('message', publicacao.message);
            formData.append('publication_type', publicacao.publication_type);
            formData.append('pontos', String(publicacao.pontos ?? 0));

            formData.append('tags', Array.isArray(publicacao.tags) ? publicacao.tags.join(',') : publicacao.tags);

            if (publicacao.imagens && publicacao.imagens instanceof File) {
                formData.append('file', publicacao.imagens);
            }

            const { data } = await axios.post<Publicacoes>(
                `${url}/updatecomunidade/${publicacao._id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true,
                }
            );
            return data;
        } catch (error) {
            alert('Erro ao atualizar a publicação')
            throw error;
        }
    };

    const deleteDataPublicacoes = async (id: string): Promise<Publicacoes> => {
        const { data } = await axios.post<Publicacoes>(
            `${url}/deletecomunidade/${id}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
                withCredentials: true,
            }
        );
        return data;
    };

    const insertDataPublicacoes = async (publicacao: FormData): Promise<any> => {

        if (!publicacao.has('pontos')) {
            publicacao.append('pontos', '0');
        }

        try {
            const { data } = await axios.post<Publicacoes>(
                `${url}/insertcomunidade`,
                publicacao,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                    withCredentials: true,
                }
            );
            return {success: true, data: data};
        } catch (error: any) {
            const msg = error.response?.data || error.message || "Erro desconhecido";
            return { success: false, error: msg };
        };
    };

    const addPraticipantes = async (publicacao: Publicacoes, add: boolean): Promise<any> => {

        const publi = {
            ...publicacao,
            user: { _id: user._id, username: user.username },
            add: add,
        };

        const { data } = await axios.post(`${url}/updateparticipantes`, publi, {
            headers: {
                Authorization: `Bearer ${user.token}`,
            },
            withCredentials: true,
        });
        return data;
    };

    const addComentario = async (id: string, user: any, message: string): Promise<Publicacoes> => {
        const { data } = await axios.post<Publicacoes>(`${url}/comentario/${id}`,
            { message, user },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                withCredentials: true,
            }
        );
        return data;
    };

    const editDataComment = async (id: string, newMessage: string): Promise<Publicacoes> => {
        try {
            const { data } = await axios.put<Publicacoes>(`${url}/comentarios/${id}/editar`,
                { message: newMessage },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                    withCredentials: true,
                }
            );
            return data;
        } catch (error) {
            alert('Erro ao editar o comentário')
            throw error;
        }
    };

    const deleteDataComment = async (id: string): Promise<Publicacoes> => {
        try {
            const { data } = await axios.delete<Publicacoes>(`${url}/comentarios/${id}/remover`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
                withCredentials: true,
            });
            return data;
        } catch (error) {
            alert('Erro ao remover comentário')
            throw error;
        }
    };

    const getQRCodePublicacao = async (id: string): Promise<Blob> => {
        try {
            const response = await axios.post(`${url}/qrtoken`, {
                userId: user._id,
                publicationId: id
            }, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
                responseType: 'blob',
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            alert('Erro ao buscar QR Code')
            throw error;
        }
    };

    return {
        getAllPublicacoes, getPublicacoesDetails, editDataPublicacoes, deleteDataPublicacoes, insertDataPublicacoes,
        addPraticipantes, addComentario, editDataComment, deleteDataComment, getQRCodePublicacao
    }
}

export default comunidadeApi;