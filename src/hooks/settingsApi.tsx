import { useAuth } from "../AuthProvider";
import axios from "axios";

export interface ProfileUpdateData {
  username?: string;
  email?: string;
  password?: string;
  image?: string;
  oldPassword?: string;
  newPassword?: string;
}

const url = "https://agrofieldtrack-node-1yka.onrender.com";


const settingsApi = () => {
  const { user } = useAuth();

  const updateProfilePic = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user", JSON.stringify(user));

      const response = await axios.post(
        `${url}/settings/profile-pic`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      return response.data.profilePic;
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw error;
    }
  };

  const updateProfile = async (data: ProfileUpdateData): Promise<any> => {
    try {
      const response = await axios.put(
        `${url}/settings/profile`,
        {
          userId: user._id,
          ...data,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
          withCredentials: true,
        }
      );
      return response.data.user;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const deleteAccount = async (password: string): Promise<void> => {
    try {
      const response = await axios.post(
        `${url}/settings/delete-account`,
        { password },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };

  const getHistoricoSubscricoes = async (): Promise<{ subscriptions: any[] }> => {
    try {
      const response = await axios.post(
        `${url}/historicoSubscricao`,
        { userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar histórico de subscrições:", error);
      throw error;
    }
  };

  const getHistoricoCompras = async (): Promise<{ payments: any[] }> => {
    try {
      const response = await axios.post(
        `${url}/historicoCompra`,
        { userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar histórico de compras:", error);
      throw error;
    }
  };

  const editPassword = async (oldPassword: string, newPassword: string): Promise<any> => {
    try {
      const response = await axios.post(
        `${url}/settings/editpassword`,
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  };
  
  return {updateProfilePic, updateProfile, deleteAccount, getHistoricoSubscricoes, getHistoricoCompras, editPassword};
};

export default settingsApi;