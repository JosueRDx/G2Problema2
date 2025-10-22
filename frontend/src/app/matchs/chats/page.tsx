"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useMatchSettings } from "@/context/MatchSettingsContext";
import { MatchMessage, MatchRecord } from "@/types/match";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Users } from "lucide-react";

const formatDateTime = (value: string) => new Date(value).toLocaleString();

export default function MatchChatsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { enabled, loading: settingsLoading } = useMatchSettings();

  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    if (!user || !enabled) return;
    const token = Cookies.get("token");
    if (!token) {
      toast.error("No se pudo obtener las credenciales.");
      return;
    }
    setIsLoadingMatches(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/api/matches/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "No se pudieron obtener tus matchs.");
      }
      const data: MatchRecord[] = await response.json();
      const accepted = data.filter((match) => match.estado === "aceptado");
      setMatches(accepted);

      const queryMatchId = searchParams.get("matchId");
      if (queryMatchId) {
        const parsedId = parseInt(queryMatchId, 10);
        if (!isNaN(parsedId) && accepted.some((match) => match.match_id === parsedId)) {
          setSelectedMatchId(parsedId);
        } else if (accepted.length > 0) {
          setSelectedMatchId(accepted[0].match_id);
        }
      } else if (accepted.length > 0) {
        setSelectedMatchId(accepted[0].match_id);
      } else {
        setSelectedMatchId(null);
      }
    } catch (err: any) {
      console.error("Error al obtener matchs aceptados:", err);
      setError(err.message);
      toast.error("Error al cargar matchs", { description: err.message });
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const fetchMessages = async (matchId: number) => {
    if (!user || !enabled) return;
    const token = Cookies.get("token");
    if (!token) {
      toast.error("No se pudo obtener las credenciales.");
      return;
    }
    setIsLoadingMessages(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/matches/${matchId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudieron obtener los mensajes.");
      }
      setMessages(data);

      await fetch(`http://localhost:3001/api/matches/${matchId}/messages/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {
        /* evitar bloquear si falla el marcado */
      });
    } catch (err: any) {
      console.error("Error al obtener mensajes:", err);
      setError(err.message);
      toast.error("Error al cargar mensajes", { description: err.message });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!user || !enabled) {
      setMatches([]);
      setSelectedMatchId(null);
      return;
    }
    fetchMatches();
  }, [user, enabled, searchParams]);

  useEffect(() => {
    if (!enabled || !selectedMatchId) {
      setMessages([]);
      return;
    }
    fetchMessages(selectedMatchId);
  }, [enabled, selectedMatchId]);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.match_id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedMatchId || !newMessage.trim()) return;
    if (!enabled) {
      toast.warning("El sistema de matchs está desactivado actualmente.");
      return;
    }
    const token = Cookies.get("token");
    if (!token) {
      toast.error("No se pudo obtener las credenciales.");
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch(`http://localhost:3001/api/matches/${selectedMatchId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contenido: newMessage.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "No se pudo enviar el mensaje.");
      }
      setNewMessage("");
      fetchMessages(selectedMatchId);
    } catch (err: any) {
      console.error("Error al enviar mensaje:", err);
      toast.error("No se pudo enviar el mensaje", { description: err.message });
    } finally {
      setSendingMessage(false);
    }
  };

  if (settingsLoading) {
    return <p>Verificando estado del sistema de matchs...</p>;
  }

  if (!enabled) {
    return (
      <div className="rounded-md border border-yellow-300 bg-yellow-50 p-6 text-yellow-900">
        <h2 className="text-lg font-semibold">Sistema de matchs desactivado</h2>
        <p className="text-sm mt-2">Cuando un administrador active la opción “Iniciar Matchs” podrás conversar con tus matches aceptados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chats de Matchs</h1>
        <p className="text-sm text-neutral-600">Comunícate con tus contrapartes una vez que ambos hayan aceptado el match.</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <aside className="space-y-3 rounded-md border border-neutral-200 bg-white p-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-neutral-800 flex items-center gap-2">
              <Users className="w-4 h-4" /> Matchs aceptados
            </p>
            <Badge variant="secondary">{matches.length}</Badge>
          </div>
          {isLoadingMatches ? (
            <p className="text-sm text-neutral-500">Cargando matchs...</p>
          ) : matches.length === 0 ? (
            <p className="text-sm text-neutral-500">Aún no tienes matchs aceptados.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {matches.map((match) => (
                <button
                  key={match.match_id}
                  onClick={() => setSelectedMatchId(match.match_id)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-all ${
                    selectedMatchId === match.match_id
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-neutral-200 hover:border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  <p className="font-semibold truncate">Match #{match.match_id}</p>
                  <p className="text-xs text-neutral-500 truncate">Actualizado {formatDateTime(match.fecha_actualizacion)}</p>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="rounded-md border border-neutral-200 bg-white p-4 lg:col-span-3">
          {!selectedMatch ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-neutral-500">
              <MessageSquare className="w-12 h-12 text-neutral-300" />
              <p>Selecciona un match aceptado para comenzar a conversar.</p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Match #{selectedMatch.match_id}</h2>
                  <p className="text-xs text-neutral-500">
                    Desafío: {selectedMatch.desafio_titulo || `ID ${selectedMatch.desafio_id}`} · Capacidad: {selectedMatch.capacidad_desc_corta || `ID ${selectedMatch.capacidad_id}`}
                  </p>
                </div>
                <Badge variant="secondary">Aceptado</Badge>
              </div>

              <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-md border border-neutral-100 bg-neutral-50 p-3">
                {isLoadingMessages ? (
                  <p className="text-sm text-neutral-500">Cargando mensajes...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-neutral-500">Aún no hay mensajes. ¡Envía el primero!</p>
                ) : (
                  messages.map((message) => {
                    const isMine = user && message.remitente_usuario_id === user.id;
                    return (
                      <div
                        key={message.mensaje_id}
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                            isMine ? "bg-blue-500 text-white" : "bg-white text-neutral-800 border border-neutral-200"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.contenido}</p>
                        </div>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-400">
                          {isMine ? "Tú" : message.remitente_nombre || "Contraparte"} · {formatDateTime(message.fecha_envio)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="mt-4 space-y-3">
                <Textarea
                  placeholder="Escribe tu mensaje"
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  disabled={sendingMessage}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                    {sendingMessage ? (
                      <span className="flex items-center gap-2 text-sm">
                        <Send className="w-4 h-4 animate-pulse" /> Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-sm">
                        <Send className="w-4 h-4" /> Enviar
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}