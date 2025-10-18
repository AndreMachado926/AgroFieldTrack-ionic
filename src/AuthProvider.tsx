import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
    _id: string;
    username: string;
    profilePic: string;
    password: string;
    email: string;
    type: string;
    pontos: number;
    title:string;
    token: string;
}

interface AuthContextType {
    user: User;
    isAuthenticated: () => boolean;
    Login: (userData: any) => void;
    logout: () => void;
    updateProPic:(profilePic:string)=>void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        } else {
            localStorage.removeItem("user");
        }
    }, [user]);

    const Login = (userData: User) => {
        setUser(userData);
        localStorage.setItem("user",JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    const isAuthenticated = () => !!user && !!user.token;



    const updateProPic=(profilePic:string)=>{
       const userpl=user;
       userpl.profilePic=profilePic;
       localStorage.setItem("user",JSON.stringify(userpl));
    }

    
    return (
        <AuthContext.Provider value={{ user, Login, logout, isAuthenticated,updateProPic}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};