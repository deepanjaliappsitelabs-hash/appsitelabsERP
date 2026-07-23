import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  FiArchive,
  FiAtSign,
  FiCheckCircle,
  FiEdit3,
  FiInbox,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiUser,
} from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Avatar from "../../../components/ui/Avatar";
import getStoredUser from "../../../utils/authStorage";
import {
  getEmailUsers,
  getEmails,
  markEmailRead,
  sendEmail,
} from "../../../services/emailService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";

const getBasePath = () => {
  const user = getStoredUser();
  return user?.role === "employee" ? "/employee" : "/admin";
};

const mailboxOptions = (role) =>
  role === "admin"
    ? [
        { id: "inbox", label: "Inbox", icon: FiInbox },
        { id: "sent", label: "Sent", icon: FiSend },
        { id: "all", label: "All Mail", icon: FiArchive },
      ]
    : [
        { id: "inbox", label: "Inbox", icon: FiInbox },
        { id: "sent", label: "Sent", icon: FiSend },
      ];

const formatPerson = (name, email) => {
  if (name && email) return `${name} <${email}>`;
  return name || email || "Unknown";
};

function EmailShell({ children, title, subtitle, action }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </div>
  );
}

export function EmailInbox() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const basePath = getBasePath();
  const [mailbox, setMailbox] = useState("inbox");
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const socketRef = useRef(null);

  const loadEmails = useCallback(async (nextMailbox = mailbox) => {
    setLoading(true);
    try {
      const rows = await getEmails(nextMailbox);
      setEmails(rows);
      setSelected((current) =>
        current ? rows.find((email) => email.id === current.id) || rows[0] || null : rows[0] || null
      );
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load emails");
      setEmails([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [mailbox]);

  useEffect(() => {
    queueMicrotask(() => loadEmails(mailbox));
  }, [loadEmails, mailbox]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const socket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    const refresh = () => loadEmails(mailbox);
    socket.on("email:new", refresh);
    socket.on("email:sent", refresh);
    socket.on("email:activity", refresh);

    return () => {
      socket.off("email:new", refresh);
      socket.off("email:sent", refresh);
      socket.off("email:activity", refresh);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [loadEmails, mailbox]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return emails;
    return emails.filter((email) =>
      [
        email.from,
        email.fromEmail,
        email.to,
        email.toEmail,
        email.subject,
        email.preview,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [emails, search]);

  const unread = emails.filter((email) => !email.read).length;

  const openEmail = (email) => {
    setSelected(email);
    if (mailbox !== "sent" && !email.read) {
      setEmails((current) =>
        current.map((item) => (item.id === email.id ? { ...item, read: true } : item))
      );
      markEmailRead(email.id).catch(() => {});
    }
  };

  return (
    <EmailShell
      title="Email"
      subtitle={
        user?.role === "admin"
          ? `${unread} unread. Admin can monitor all internal mail.`
          : `${unread} unread internal message${unread === 1 ? "" : "s"}.`
      }
      action={
        <button
          type="button"
          onClick={() => navigate(`${basePath}/email/compose`)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#302568] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#302568]/20 transition hover:bg-[#3d3080]"
        >
          <FiEdit3 />
          Compose
        </button>
      }
    >
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <div className="grid min-h-[680px] overflow-hidden rounded-2xl border border-[#E7E8F0] bg-white shadow-[0_24px_70px_rgba(48,37,104,0.08)] xl:grid-cols-[360px_1fr]">
        <aside className="border-r border-[#E7E8F0] bg-[#FBFCFF]">
          <div className="border-b border-[#E7E8F0] p-4">
            <div className="mb-3 grid grid-cols-3 gap-2">
              {mailboxOptions(user?.role).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMailbox(id)}
                  className={[
                    "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition",
                    mailbox === id
                      ? "bg-[#302568] text-white shadow-sm shadow-[#302568]/20"
                      : "bg-white text-slate-500 hover:bg-[#F1EDFF] hover:text-[#302568]",
                  ].join(" ")}
                >
                  <Icon />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#E0E3EC] bg-white px-3 py-2">
              <FiSearch className="text-[#7560A7]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search mail"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => loadEmails(mailbox)}
                title="Refresh"
                className="rounded-lg p-1 text-slate-400 hover:bg-[#F1EDFF] hover:text-[#302568]"
              >
                <FiRefreshCw />
              </button>
            </div>
          </div>

          <div className="max-h-[606px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-sm text-slate-500">Loading emails...</p>
            ) : filtered.length ? (
              filtered.map((email) => {
                const active = selected?.id === email.id;
                return (
                  <button
                    key={email.id}
                    type="button"
                    onClick={() => openEmail(email)}
                    className={[
                      "flex w-full gap-3 border-b border-[#F1F2F7] px-4 py-3 text-left transition hover:bg-white",
                      active ? "bg-white shadow-[inset_3px_0_0_#302568]" : "",
                    ].join(" ")}
                  >
                    <Avatar name={mailbox === "sent" ? email.to : email.from} className="h-10 w-10 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={[
                            "truncate text-sm",
                            email.read || mailbox === "sent"
                              ? "font-semibold text-slate-700"
                              : "font-extrabold text-slate-950",
                          ].join(" ")}
                        >
                          {mailbox === "sent" ? email.to : email.from}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {email.date}
                        </span>
                      </span>
                      <span
                        className={[
                          "mt-1 block truncate text-sm",
                          email.read || mailbox === "sent"
                            ? "font-medium text-slate-600"
                            : "font-bold text-slate-900",
                        ].join(" ")}
                      >
                        {email.subject}
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-slate-400">{email.preview}</span>
                        {!email.read && mailbox !== "sent" && (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#56C7F2]" />
                        )}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-5 py-12 text-center">
                <FiMail className="mx-auto mb-3 text-3xl text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">No emails found</p>
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-[680px] flex-col">
          {selected ? (
            <>
              <div className="border-b border-[#E7E8F0] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#F1EDFF] px-3 py-1 text-xs font-bold text-[#302568]">
                      <FiAtSign />
                      {selected.tag || "General"}
                    </p>
                    <h2 className="truncate text-2xl font-extrabold tracking-tight text-slate-950">
                      {selected.subject}
                    </h2>
                  </div>
                  {selected.read || mailbox === "sent" ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                      <FiCheckCircle />
                      {mailbox === "sent" ? "Sent" : "Read"}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 border-b border-[#E7E8F0] px-6 py-4 text-sm md:grid-cols-2">
                <div className="rounded-xl bg-[#F8F9FC] px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">From</p>
                  <p className="mt-1 font-bold text-slate-900">
                    {formatPerson(selected.from, selected.fromEmail)}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F8F9FC] px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">To</p>
                  <p className="mt-1 font-bold text-slate-900">
                    {formatPerson(selected.to, selected.toEmail)}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {selected.body}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
              <FiMail className="mb-3 text-5xl" />
              <p className="text-sm font-semibold">Select an email to read it</p>
            </div>
          )}
        </section>
      </div>
    </EmailShell>
  );
}

export function EmailCompose() {
  const navigate = useNavigate();
  const basePath = getBasePath();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ to: "", subject: "", body: "", tag: "General" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getEmailUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  const handleSend = async () => {
    if (!form.to.trim() || !form.subject.trim() || !form.body.trim()) {
      setError("To, subject and message are required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await sendEmail(form);
      setSent(true);
      setTimeout(() => navigate(`${basePath}/email/inbox`), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Email not sent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmailShell
      title="Compose Email"
      subtitle="Send an internal message to an admin or employee."
      action={
        <button
          type="button"
          onClick={() => navigate(`${basePath}/email/inbox`)}
          className="rounded-xl border border-[#E0E3EC] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#F8F9FC]"
        >
          Back to Inbox
        </button>
      }
    >
      <div className="rounded-2xl border border-[#E7E8F0] bg-white shadow-[0_24px_70px_rgba(48,37,104,0.08)]">
        {sent ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FiCheckCircle className="mb-4 text-5xl text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900">Email sent</h2>
            <p className="mt-1 text-sm text-slate-500">Redirecting to inbox...</p>
          </div>
        ) : (
          <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
            <div className="space-y-5 p-6">
              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">To</label>
                <input
                  list="email-recipients"
                  value={form.to}
                  onChange={(event) => setForm((current) => ({ ...current, to: event.target.value }))}
                  placeholder="Select or type employee/admin email"
                  className="w-full rounded-xl border border-[#E0E3EC] px-4 py-3 text-sm outline-none transition focus:border-[#302568] focus:ring-4 focus:ring-[#302568]/10"
                />
                <datalist id="email-recipients">
                  {users.map((item) => (
                    <option
                      key={`${item.participantType}-${item.participantId}`}
                      value={item.email}
                    >
                      {item.name} - {item.designation || item.participantType}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Subject</label>
                <input
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="Email subject"
                  className="w-full rounded-xl border border-[#E0E3EC] px-4 py-3 text-sm outline-none transition focus:border-[#302568] focus:ring-4 focus:ring-[#302568]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Message</label>
                <textarea
                  rows={13}
                  value={form.body}
                  onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                  placeholder="Write your message here..."
                  className="w-full resize-none rounded-xl border border-[#E0E3EC] px-4 py-3 text-sm leading-7 outline-none transition focus:border-[#302568] focus:ring-4 focus:ring-[#302568]/10"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#302568] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#302568]/20 transition hover:bg-[#3d3080] disabled:opacity-60"
                >
                  <FiSend />
                  {loading ? "Sending..." : "Send Email"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/email/inbox`)}
                  className="rounded-xl border border-[#E0E3EC] px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#F8F9FC]"
                >
                  Discard
                </button>
              </div>
            </div>

            <aside className="border-t border-[#E7E8F0] bg-[#FBFCFF] p-5 lg:border-l lg:border-t-0">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Recipients
              </p>
              <div className="max-h-[520px] space-y-2 overflow-y-auto">
                {users.map((item) => (
                  <button
                    key={`${item.participantType}-${item.participantId}`}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, to: item.email }))}
                    className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2 text-left transition hover:bg-[#F1EDFF]"
                  >
                    <Avatar name={item.name} className="h-8 w-8 shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-900">
                        {item.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {item.email}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </EmailShell>
  );
}

export function EmailPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = getBasePath();
  const [email, setEmail] = useState(null);

  useEffect(() => {
    getEmails("inbox")
      .then((rows) => setEmail(rows[0] || null))
      .catch(() => setEmail(null));
  }, [location.pathname]);

  return (
    <EmailShell
      title="Email Preview"
      subtitle="Latest inbox message."
      action={
        <button
          type="button"
          onClick={() => navigate(`${basePath}/email/inbox`)}
          className="rounded-xl border border-[#E0E3EC] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#F8F9FC]"
        >
          Back to Inbox
        </button>
      }
    >
      <div className="rounded-2xl border border-[#E7E8F0] bg-white p-6 shadow-[0_24px_70px_rgba(48,37,104,0.08)]">
        {!email ? (
          <div className="flex min-h-72 flex-col items-center justify-center text-center text-slate-400">
            <FiUser className="mb-3 text-4xl" />
            <p className="text-sm font-semibold">No email selected</p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-5">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#F1EDFF] px-3 py-1 text-xs font-bold text-[#302568]">
                <FiMail />
                {email.tag || "General"}
              </p>
              <h2 className="text-2xl font-extrabold text-slate-950">{email.subject}</h2>
              <p className="mt-2 text-sm text-slate-500">
                From <span className="font-bold text-slate-800">{formatPerson(email.from, email.fromEmail)}</span>
              </p>
            </div>
            <hr className="border-[#E7E8F0]" />
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{email.body}</p>
          </div>
        )}
      </div>
    </EmailShell>
  );
}
