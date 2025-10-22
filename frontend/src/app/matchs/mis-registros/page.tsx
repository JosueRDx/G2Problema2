"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useMatchSettings } from "@/context/MatchSettingsContext";
import { MatchRecord, MatchEstado } from "@/types/match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Check, MessageSquare, ShieldAlert, X } from "lucide-react";

const estadoLabels: Record<MatchEstado, string> = {
  pendiente_unsa: "Pendiente de UNSA",
  pendiente_externo: "Pendiente de Externo",
  aceptado: "Aceptado",
  rechazado_unsa: "Rechazado por UNSA",
  rechazado_externo: "Rechazado por Externo",
  cancelado: "Cancelado",
};

const estadoVariant: Record<MatchEstado, "default" | "secondary" | "destructive" | "outline"> = {
  pendiente_unsa: "secondary",
  pendiente_externo: "secondary",
  aceptado: "default",
  rechazado_unsa: "destructive",
  rechazado_externo: "destructive",
  cancelado: "outline",
};

const formatDate = (value: string) => new Date(value).toLocaleString();

export default function MisMatchsPage() {
  const { user } = useAuth();
  const { enabled, loading: settingsLoading } = useMatchSettings();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingMatchId, setUpdatingMatchId] = useState<number | null>(null);

  const fetchMatches = async () => {
    if (!user || !enabled) return;
    setIsLoading(true);
    setError(null);
    const token = Cookies.get("token");

    if (!token) {
      toast.error("No se pudo obtener las credenciales.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/matches/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "No se pudieron obtener tus matchs.");
      }
      const data = await response.json();
      setMatches(data);
    } catch (err: any) {
      console.error("Error al cargar matchs:", err);
      setError(err.message);
      toast.error("Error al cargar tus matchs", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !enabled) {
      setMatches([]);
      return;
    }
    fetchMatches();
  }, [user, enabled]);

  const canTakeAction = (match: MatchRecord, action: "aceptar" | "rechazar" | "cancelar") => {
    if (!user) return false;
    const isSolicitante = match.solicitante_usuario_id === user.id;
    const isReceptor = match.receptor_usuario_id === user.id;

    switch (action) {
      case "aceptar":
        return (
          isReceptor &&
          ((match.estado === "pendiente_unsa" && user.rol === "unsa") ||
            (match.estado === "pendiente_externo" && user.rol === "externo"))
        );
      case "rechazar":
        return (
          isReceptor &&
          ((match.estado === "pendiente_unsa" && user.rol === "unsa") ||
            (match.estado === "pendiente_externo" && user.rol === "externo"))
        );
      case "cancelar":
        return (
          isSolicitante &&
          (match.estado === "pendiente_unsa" || match.estado === "pendiente_externo")
        );
      default:
        return false;
    }
  };

  const handleAction = async (matchId: number, accion: "aceptar" | "rechazar" | "cancelar") => {
    if (!enabled) {
      toast.warning("El sistema de matchs está desactivado actualmente.");
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      toast.error("No se pudo obtener las credenciales.");
      return;
    }

  setUpdatingMatchId(matchId);

  (async () => {
    try {
      await toast.promise(
        (async () => {
          const res = await fetch(`http://localhost:3001/api/matches/${matchId}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ accion }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "No se pudo actualizar el match.");
          return data;
        })(),
        {
          loading: "Procesando solicitud...",
          success: (data) => data.message || "Estado actualizado",
          error: (err) => err.message,
        }
      );
    } catch (error) {
      console.error("Error al actualizar el estado del match:", error);
    } finally {
      setUpdatingMatchId(null);
      fetchMatches();
    }
  })();
};

  const acceptedMatches = useMemo(
    () => matches.filter((match) => match.estado === "aceptado"),
    [matches]
  );

  if (settingsLoading) {
    return <p>Verificando estado del sistema de matchs...</p>;
  }

  if (!enabled) {
    return (
      <div className="rounded-md border border-yellow-300 bg-yellow-50 p-6 text-yellow-900">
        <h2 className="text-lg font-semibold">Sistema de matchs desactivado</h2>
        <p className="text-sm mt-2">Cuando un administrador active la opción “Iniciar Matchs” podrás gestionar tus solicitudes aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis Matchs</h1>
          <p className="text-sm text-neutral-600">Revisa el estado de tus solicitudes y gestiona las acciones pendientes.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMatches} disabled={isLoading}>
          <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-neutral-500">Cargando...</p>
      ) : matches.length === 0 ? (
        <div className="rounded-md border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
          No tienes registros de match por el momento. Ve a la sección "Realizar Match" para iniciar uno.
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => {
            const isSolicitante = user && match.solicitante_usuario_id === user.id;
            const isReceptor = user && match.receptor_usuario_id === user.id;
            const puedeChatear = match.estado === "aceptado";
            const accionPendiente =
              match.estado === "pendiente_unsa"
                ? "Respuesta del investigador UNSA"
                : match.estado === "pendiente_externo"
                ? "Respuesta del participante externo"
                : null;

            return (
              <Card key={match.match_id} className="border border-neutral-200">
                <CardHeader className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">Match #{match.match_id}</CardTitle>
                    <Badge variant={estadoVariant[match.estado]}>{estadoLabels[match.estado]}</Badge>
                  </div>
                  <CardDescription className="text-xs text-neutral-500">
                    Actualizado el {formatDate(match.fecha_actualizacion)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-neutral-800">Desafío:</p>
                    <p className="text-neutral-600">
                      {match.desafio_titulo ? match.desafio_titulo : `ID ${match.desafio_id}`}<br />
                      <span className="text-xs text-neutral-500">
                        {match.desafio_participante_nombre || "Participante externo"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-800">Capacidad:</p>
                    <p className="text-neutral-600">
                      {match.capacidad_desc_corta ? `${match.capacidad_desc_corta}…` : `ID ${match.capacidad_id}`}<br />
                      <span className="text-xs text-neutral-500">
                        {match.capacidad_investigador_nombre || "Investigador UNSA"}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-md border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-600">
                    <p className="font-semibold text-neutral-700">Resumen:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>Eres {isSolicitante ? "quien inició" : isReceptor ? "quien recibe" : "parte del"} este match.</li>
                      {accionPendiente && <li>Pendiente: {accionPendiente}.</li>}
                      <li>Creado el {formatDate(match.fecha_creacion)}.</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {canTakeAction(match, "aceptar") && (
                      <Button
                        size="sm"
                        onClick={() => handleAction(match.match_id, "aceptar")}
                        disabled={updatingMatchId === match.match_id}
                      >
                        <Check className="w-4 h-4 mr-1" /> Aceptar
                      </Button>
                    )}
                    {canTakeAction(match, "rechazar") && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleAction(match.match_id, "rechazar")}
                        disabled={updatingMatchId === match.match_id}
                      >
                        <X className="w-4 h-4 mr-1" /> Rechazar
                      </Button>
                    )}
                    {canTakeAction(match, "cancelar") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(match.match_id, "cancelar")}
                        disabled={updatingMatchId === match.match_id}
                      >
                        <ShieldAlert className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                    )}
                  </div>
                  <div>
                    {puedeChatear ? (
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/matchs/chats?matchId=${match.match_id}`}>
                          <MessageSquare className="w-4 h-4 mr-1" /> Abrir chat
                        </Link>
                      </Button>
                    ) : (
                      <p className="text-xs text-neutral-500">El chat se habilitará cuando ambos acepten.</p>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {acceptedMatches.length > 0 && (
        <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-xs text-blue-900">
          <p className="font-semibold">Tienes {acceptedMatches.length} match(s) aceptados.</p>
          <p className="mt-1">
            Ingresa a la pestaña <strong>Chats</strong> o utiliza los accesos directos para continuar la conversación.
          </p>
        </div>
      )}
    </div>
  );
}