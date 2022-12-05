import { BrowserRouter, Route, Routes } from 'react-router-dom';

const Example = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<Home />} path="/" />
    </Routes>
  </BrowserRouter>
);