"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  onSelectRol: (rol: "externo" | "unsa") => void;
}

export function SeleccionRol({ onSelectRol }: Props) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Bienvenido al Registro</CardTitle>
          <CardDescription className="text-lg pt-2">
            Por favor, seleccione el tipo de cuenta que desea crear.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            <div
              className="flex flex-col p-6 border rounded-lg cursor-pointer hover:bg-neutral-100 hover:shadow-md transition-all"
              onClick={() => onSelectRol("externo")}
            >
              <h3 className="text-xl font-semibold mb-2">Hélice Externa</h3>
              <p className="text-neutral-600 mb-4">
                Gobierno, Empresas, Sociedad Civil, Academia (externa), etc.
              </p>
              <Button className="mt-auto">Seleccionar</Button>
            </div>
            <div
              className="flex flex-col p-6 border rounded-lg cursor-pointer hover:bg-neutral-100 hover:shadow-md transition-all"
              onClick={() => onSelectRol("unsa")}
            >
              <h3 className="text-xl font-semibold mb-2">Hélice UNSA</h3>
              <p className="text-neutral-600 mb-4">
                Investigadores, docentes o personal administrativo de la UNSA.
              </p>
              <Button variant="outline" className="mt-auto">Seleccionar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}