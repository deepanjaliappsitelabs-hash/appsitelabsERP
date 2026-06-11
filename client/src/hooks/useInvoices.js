import { useCallback, useEffect, useState } from "react";
import { deleteInvoice, getInvoices } from "../firebase/invoiceService";

function getInvoiceLoadErrorMessage(error) {
  return error?.message || "Failed to load invoices";
}

export function useInvoices(userId) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!userId) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const rows = await getInvoices(userId);
      setInvoices(rows);
    } catch (e) {
      setError(getInvoiceLoadErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id) => {
      await deleteInvoice(id);
      await refresh();
    },
    [refresh],
  );

  return { invoices, loading, error, refresh, remove };
}
