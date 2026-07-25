import { createContext, useState } from "react";

const AuthContext = createContext({
    auth: { token: null, role: null },
    setAuth: () => {},
});

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        token: null,
        role: null,
    });

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;