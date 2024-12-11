import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Outlet, Routes, Route, useLocation } from 'react-router-dom';

import { store } from './app/store';
import Login from './features/Login/Login';
import OAuth2Popup from './features/Login/OAuth2Popup';
import Viewer from './features/Viewer/Viewer';

import './App.css';

// for debugging purposes
const RouteListenerLayout = ({ children }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // console.log('pathname:', pathname);
  }, [pathname]);

  return children ?? <Outlet />;
};

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route element={<RouteListenerLayout />}>
            <Route element={<OAuth2Popup />} path="/callback" />
            <Route element={<Login />} path="/" />
            <Route element={<Login />} path="/login" />
            <Route element={<Viewer />} path="/view" />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
