import { createContext, useState, useEffect } from "react";

const AuthContext = createContext({
    auth: { token: null, user: null, userId: null, role: null },
    setAuth: () => {},
});

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(() => {
        const savedToken = localStorage.getItem("jwt") || localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;

        return {
            token: savedToken || null,
            user: parsedUser,
            userId: parsedUser?._id || parsedUser?.id || null,
            role: parsedUser?.role || localStorage.getItem("role") || null,
        };
    });

    // Keep localStorage synced whenever `auth` updates
    useEffect(() => {
        if (auth.token) {
            localStorage.setItem("token", auth.token);
            if (auth.user) {
                localStorage.setItem("user", JSON.stringify(auth.user));
            }
            if (auth.role) {
                localStorage.setItem("role", auth.role);
            }
        } else {
            localStorage.removeItem("jwt");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("role");
        }
    }, [auth]);

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;