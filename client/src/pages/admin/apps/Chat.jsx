import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { FiMessageCircle, FiSearch, FiSend, FiUsers } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Card from "../../../components/ui/Card";
import Avatar from "../../../components/ui/Avatar";
import api from "../../../services/api";
import getStoredUser from "../../../utils/authStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";

const getCurrentParticipant = (user) => ({
  participantType: user?.role === "admin" ? "admin" : "employee",
  participantId: Number(user?.id),
});

const sameParticipant = (a, b) =>
  a?.participantType === b?.participantType &&
  Number(a?.participantId) === Number(b?.participantId);

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const conversationTitle = (conversation, current) => {
  const others =
    conversation?.participants?.filter((participant) => !sameParticipant(participant, current)) ||
    [];

  if (others.length) {
    return others.map((participant) => participant.name || "Unknown").join(", ");
  }

  return conversation?.participants?.map((participant) => participant.name).join(", ") || "Chat";
};

const conversationSubtitle = (conversation, currentUser) => {
  if (currentUser?.role === "admin") {
    return "Admin full access";
  }

  const other = conversation?.participants?.find(
    (participant) => !sameParticipant(participant, getCurrentParticipant(currentUser))
  );
  return other?.participantType === "admin" ? "Admin" : "Employee";
};

export function ChatInbox() {
  const [currentUser] = useState(() => getStoredUser());
  const [conversations, setConversations] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const currentParticipant = useMemo(
    () => getCurrentParticipant(currentUser),
    [currentUser]
  );

  const loadConversations = useCallback(async () => {
    const res = await api.get("/chats/conversations");
    setConversations(res.data.data || []);
    return res.data.data || [];
  }, []);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    let alive = true;

    async function loadInitialData() {
      try {
        setLoading(true);
        setError("");
        const [conversationRows, userRows] = await Promise.all([
          loadConversations(),
          api.get("/chats/users").then((res) => res.data.data || []),
        ]);

        if (!alive) return;
        setChatUsers(userRows);
        setSelectedConversation((current) => current || conversationRows[0] || null);
      } catch (err) {
        if (alive) {
          setError(err.response?.data?.message || "Unable to load chats");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadInitialData();
    return () => {
      alive = false;
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedConversation) return;

    let alive = true;
    socketRef.current?.emit("conversation:join", { conversationId: selectedConversation.id });

    api
      .get(`/chats/conversations/${selectedConversation.id}/messages`)
      .then((res) => {
        if (alive) setMessages(res.data.data || []);
      })
      .catch((err) => {
        if (alive) setError(err.response?.data?.message || "Unable to load messages");
      });

    return () => {
      alive = false;
    };
  }, [selectedConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversation]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const nextSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = nextSocket;

    const handleNewMessage = (message) => {
      setMessages((current) => {
        if (
          Number(message.conversationId) !==
          Number(selectedConversationRef.current?.id)
        ) {
          return current;
        }
        if (current.some((item) => Number(item.id) === Number(message.id))) {
          return current;
        }
        return [...current, message];
      });
    };

    const handleConversationUpdated = ({ conversationId, message }) => {
      setConversations((current) =>
        current.map((conversation) =>
          Number(conversation.id) === Number(conversationId)
            ? {
                ...conversation,
                lastMessage: message.body,
                lastMessageAt: message.createdAt,
                updatedAt: message.createdAt,
              }
            : conversation
        )
      );
      loadConversations().catch(() => {});
    };

    nextSocket.on("message:new", handleNewMessage);
    nextSocket.on("conversation:updated", handleConversationUpdated);

    return () => {
      nextSocket.off("message:new", handleNewMessage);
      nextSocket.off("conversation:updated", handleConversationUpdated);
      nextSocket.disconnect();
      socketRef.current = null;
    };
  }, [loadConversations]);

  const filteredConversations = conversations.filter((conversation) =>
    conversationTitle(conversation, currentParticipant)
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const availableUsers = chatUsers.filter((user) =>
    `${user.name} ${user.email} ${user.designation} ${user.department}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const startConversation = async (participant) => {
    try {
      setError("");
      const res = await api.post("/chats/conversations", {
        participantType: participant.participantType,
        participantId: participant.participantId,
      });
      const conversation = res.data.data;
      const rows = await loadConversations();
      setSelectedConversation(
        rows.find((item) => Number(item.id) === Number(conversation.id)) || conversation
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to start chat");
    }
  };

  const sendMessage = () => {
    const body = input.trim();
    if (!body || !selectedConversation || sending) return;
    if (!socketRef.current) {
      setError("Chat connection is not ready yet");
      return;
    }

    setSending(true);
    setError("");
    socketRef.current?.emit(
      "message:send",
      { conversationId: selectedConversation.id, body },
      (response) => {
        setSending(false);
        if (!response?.success) {
          setError(response?.message || "Message not sent");
          return;
        }
        setInput("");
      }
    );
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const selectedTitle = conversationTitle(selectedConversation, currentParticipant);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat"
        subtitle={
          currentUser?.role === "admin"
            ? "Real-time team messages with admin access to all history."
            : "Real-time internal team messaging."
        }
      />

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-[#E7E8F0] bg-white shadow-[0_14px_40px_rgba(17,24,39,0.05)] xl:grid-cols-[330px_1fr]">
        <aside className="border-r border-[#E7E8F0]">
          <div className="border-b border-[#E7E8F0] p-4">
            <div className="flex items-center gap-2 rounded-xl border border-[#E0E3EC] px-3 py-2">
              <FiSearch className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search chats or people"
                className="min-w-0 flex-1 text-sm outline-none"
              />
            </div>
          </div>

          <div className="max-h-[560px] overflow-y-auto">
            <div className="px-4 pb-2 pt-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Conversations
            </div>

            {loading ? (
              <p className="px-4 py-3 text-sm text-slate-500">Loading chats...</p>
            ) : filteredConversations.length ? (
              filteredConversations.map((conversation) => {
                const title = conversationTitle(conversation, currentParticipant);
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversation(conversation)}
                    className={[
                      "flex w-full gap-3 px-4 py-3 text-left transition hover:bg-[#F8F9FC]",
                      selectedConversation?.id === conversation.id ? "bg-[#F1EDFF]" : "",
                    ].join(" ")}
                  >
                    <Avatar name={title} className="h-10 w-10 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {title}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {conversation.lastMessage || "No messages yet"}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-3 text-sm text-slate-500">No conversations yet.</p>
            )}

            <div className="px-4 pb-2 pt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Start New Chat
            </div>
            {availableUsers.map((user) => (
              <button
                key={`${user.participantType}-${user.participantId}`}
                type="button"
                onClick={() => startConversation(user)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#F8F9FC]"
              >
                <Avatar name={user.name} className="h-9 w-9 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {user.designation || user.participantType}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[620px] flex-col">
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-[#E7E8F0] px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={selectedTitle} className="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{selectedTitle}</p>
                    <p className="text-xs text-slate-400">
                      {conversationSubtitle(selectedConversation, currentUser)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-[#F5F3FC] px-3 py-1 text-xs font-semibold text-[#302568]">
                  <FiUsers />
                  {selectedConversation.participants?.length || 0}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {messages.length ? (
                  messages.map((message) => {
                    const mine = sameParticipant(
                      {
                        participantType: message.senderType,
                        participantId: message.senderId,
                      },
                      currentParticipant
                    );

                    return (
                      <div
                        key={message.id}
                        className={["flex", mine ? "justify-end" : "justify-start"].join(" ")}
                      >
                        <div
                          className={[
                            "max-w-[72%] rounded-2xl px-4 py-2 text-sm",
                            mine
                              ? "rounded-br-sm bg-[#302568] text-white"
                              : "rounded-bl-sm bg-[#F1F2F7] text-slate-800",
                          ].join(" ")}
                        >
                          {!mine && currentUser?.role === "admin" && (
                            <p className="mb-1 text-[11px] font-bold text-slate-500">
                              {message.senderName || "Unknown"}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          <p
                            className={[
                              "mt-1 text-[10px]",
                              mine ? "text-purple-100" : "text-slate-400",
                            ].join(" ")}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                    <FiMessageCircle className="mb-3 text-4xl" />
                    <p className="text-sm font-semibold">No messages yet</p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="flex gap-3 border-t border-[#E7E8F0] px-4 py-3">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message"
                  className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-[#E0E3EC] px-4 py-2 text-sm outline-none focus:border-[#5B3FD6] focus:ring-2 focus:ring-[#5B3FD6]/20"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#302568] px-4 text-sm font-semibold text-white transition hover:bg-[#3d3080] disabled:opacity-60"
                >
                  <FiSend />
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
              <FiMessageCircle className="mb-3 text-5xl" />
              <p className="text-sm font-semibold">Select a chat or start a new one</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function ChatPreview() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const basePath = user?.role === "employee" ? "/employee" : "/admin";

  return (
    <div className="space-y-6">
      <PageHeader title="Chat Preview" subtitle="Open the live chat inbox." />
      <Card>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <FiMessageCircle className="text-4xl text-[#302568]" />
          <p className="text-slate-500">Use Chat Inbox to view conversations.</p>
          <button
            type="button"
            onClick={() => navigate(`${basePath}/chat/inbox`)}
            className="rounded-xl bg-[#302568] px-5 py-2 text-sm font-semibold text-white"
          >
            Go to Chat Inbox
          </button>
        </div>
      </Card>
    </div>
  );
}
