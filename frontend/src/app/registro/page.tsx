"use client";
import { useState } from "react";
import { SeleccionRol } from "./components/SeleccionRol";
import { FormularioRegistro } from "./components/FormularioRegistro";

type RolSeleccionado = "externo" | "unsa";
type VistaActual = "seleccion" | "formulario";

export default function RegistroPage() {
  const [rol, setRol] = useState<RolSeleccionado | null>(null);
  const [vista, setVista] = useState<VistaActual>("seleccion");

  const handleSelectRol = (rol: RolSeleccionado) => {
    setRol(rol);
    setVista("formulario");
  };

  const handleVolver = () => {
    setRol(null);
    setVista("seleccion");
  };

  if (vista === "seleccion") {
    return <SeleccionRol onSelectRol={handleSelectRol} />;
  }

  if (vista === "formulario" && rol) {
    return <FormularioRegistro rol={rol} onVolver={handleVolver} />;
  }
  
  return <SeleccionRol onSelectRol={handleSelectRol} />;
}