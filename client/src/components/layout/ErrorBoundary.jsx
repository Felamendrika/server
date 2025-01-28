/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }; // Mettre à jour l'état en cas d'erreur
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erreur capturée par ErrorBoundary :", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1 className="text-center justify-center font-medium text-gray-600">Quelque chose a mal tourné. Veuillez réessayer en rafraichissant la page</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
