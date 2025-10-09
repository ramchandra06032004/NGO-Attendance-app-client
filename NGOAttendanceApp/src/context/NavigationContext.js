import React, { createContext, useState } from 'react';

export const NavigationContext = createContext();

export default function NavigationProvider({ children }) {
  const [route, setRoute] = useState({ name: 'Home', params: {} });

  function navigate(name, params) {
    setRoute({ name, params: params || {} });
  }

  function goBack() {
    setRoute({ name: 'Home', params: {} });
  }

  return (
    <NavigationContext.Provider value={{ route, navigate, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
}
