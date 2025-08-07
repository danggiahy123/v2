import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HomeReadyContextType {
  homeReady: boolean;
  setHomeReady: (ready: boolean) => void;
}

const HomeReadyContext = createContext<HomeReadyContextType | undefined>(undefined);

export const HomeReadyProvider = ({ children }: { children: ReactNode }) => {
  const [homeReady, setHomeReady] = useState(false);
  return (
    <HomeReadyContext.Provider value={{ homeReady, setHomeReady }}>
      {children}
    </HomeReadyContext.Provider>
  );
};

export const useHomeReady = () => {
  const context = useContext(HomeReadyContext);
  if (!context) {
    throw new Error('useHomeReady must be used within a HomeReadyProvider');
  }
  return context;
};
