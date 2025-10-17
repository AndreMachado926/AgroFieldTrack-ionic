import axios from "axios";
import Cookies from "js-cookie";

export interface User {
  username: string;
  password: string;
}

export interface UserDatabase {
  _id: string;
  username: string;
  profilePic: string;
  password: string;
  email: string;
  type: string;
  pontos: number;
  planos: {
    _id:string,
    title:string,
    features:[string],
    icon: string,
    price: string,
    color:string
  };
  token: string;
}

export interface UserC{
  username: string;
  password: string;
  profilePic: string;
}

export interface CreateUser {
  email: string;
  username: string;
  password: string;
}

const url = "http://localhost:3000";

export const authApi = (user: UserDatabase | null, Login: (userData: any) => void) => {
  const login = async (user: User): Promise<any> => {
    try {
      const response = await axios.post(`${url}/login`, user, { withCredentials: true });
      Login(response.data);

      return {success: true, data: response.data};
    } catch (error: any) {
      const msg = error.response?.data || error.message || "Erro desconhecido";
      return { success: false, error: msg };
  }
  };

  const recover = async (email: string): Promise<any> => {
    try {
      const response = await axios.post(`${url}/recover-password`,
        { email: email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return {success: true, data: response.data};
    } catch (error: any) {
      const msg = error.message || "Erro desconhecido";
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    Login(null);
    localStorage.removeItem("user");
    await axios.post(`${url}/logout`, user, { withCredentials: true });
    Cookies.remove('auth')
  }

  const isAuthenticated = async (): Promise<boolean> => {
    try {
      if (!user) return false;
      const response = await axios.get(`${url}/auth/validate`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        withCredentials: true,
      });
      return response.data.authenticated;
    } catch (error) {
      console.error("Erro ao verificar autenticação", error);
      return false;
    }
  };

  const signup = async (user: CreateUser): Promise<boolean> => {
    try {
      const response = await axios.post(`${url}/register`, user);
      return response.status === 201;
    } catch (error: any) {
      console.error("Erro ao registrar", error?.response?.data || error.message);
      return false;
    }
  };

  const getUser = async (): Promise<UserC | null> => {
    if (!user) return null;
    try {
        const response = await axios.post<UserC>(`${url}/getuser`, { userId: user._id }, {
            headers: {
                Authorization: `Bearer ${user.token}`,
            },
        });
        
        return response.data;
    } catch (error) {
        console.error("Erro ao obter usuário", error);
        return null;
    }
  };

  const getCurrentUser = async (): Promise<any> => {
    if (!user) return null;
    try {
      const response = await axios.post(`${url}/getuser`, {userId: user._id }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao obter usuário atual", error);
      return null;
    }
  };

  

  return { login, recover, logout, isAuthenticated, signup, getUser, getCurrentUser };
};

export default authApi;