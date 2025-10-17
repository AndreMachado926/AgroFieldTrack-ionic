import axios from "axios";

const url = "http://localhost:8000"; 

const verifyEmailApi = () => {
    const verifyEmail = async (): Promise<any> => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get("token")?.replace(/^\/+/, "");
            if (!token) throw new Error("Token não encontrado.");

            const response = await axios.get(`${url}/verification?token=${token}`);
            return response.data;
        } catch (error) {
            console.error("Erro ao verificar email:", error);
            throw error;
        }
    };

    return { verifyEmail };
};

export default verifyEmailApi;
