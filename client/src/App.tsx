import React from 'react';
import './App.css';
import CheckoutForm from './CheckoutForm';

function App() {
  return (
    // CHANGE: We are changing the className from "App" to "app-wrapper"
    <div className="app-wrapper">
      <header className="app-header">
        <h1>TypeScript Payment Project</h1>
      </header>
      <main>
        <CheckoutForm />
      </main>
    </div>
  );
}

export default App;