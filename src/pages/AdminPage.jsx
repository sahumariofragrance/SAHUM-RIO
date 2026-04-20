import React, { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Save, X, LogOut } from "lucide-react";
import { Card } from "../components/ui";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = { name: "", description: "", price: "", image: "", alt: "" };

export default function AdminPage({ setCurrentPage }) {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const isAdmin = useMemo(() => user?.role === "admin", [user]);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");
      const data = await api("/products", { noAuth: true });
      setProducts(data?.products || []);
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openAdd() {
    setEditingId(-1);
    setForm(EMPTY_FORM);
  }

  function openEdit(product) {
    setEditingId(product.id);
    setForm({ ...product, price: String(product.price) });
  }

  function closeEditor() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function saveProduct() {
    if (!isAdmin) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      image: form.image.trim(),
      alt: form.alt.trim(),
    };

    if (!payload.name || !payload.description || !payload.price || !payload.image || !payload.alt) {
      setError("All fields are required.");
      return;
    }

    try {
      setError("");
      if (editingId === -1) {
        await api("/products", { method: "POST", body: payload });
      } else {
        await api(`/products/${editingId}`, { method: "PUT", body: payload });
      }
      closeEditor();
      loadProducts();
    } catch (err) {
      setError(err.message || "Failed to save product");
    }
  }

  async function deleteProduct(id) {
    if (!isAdmin) return;
    if (!window.confirm("Delete this product?")) return;
    try {
      await api(`/products/${id}`, { method: "DELETE" });
      loadProducts();
    } catch (err) {
      setError(err.message || "Failed to delete product");
    }
  }

  async function handleLogout() {
    await logout();
    setCurrentPage("home");
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold">Admin access required</h2>
        <p className="mt-2 text-[var(--color-muted)]">Only admin users can manage products.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Backend Product Manager</h2>
          <p className="text-sm text-[var(--color-muted)]">All updates are saved by the backend API.</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-surface-muted)]"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mb-4">
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {editingId !== null && (
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              ["name", "Name"],
              ["description", "Description"],
              ["price", "Price"],
              ["image", "Image URL"],
              ["alt", "Alt Text"],
            ].map(([field, label]) => (
              <label key={field} className="text-sm">
                {label}
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
                  value={form[field]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={saveProduct} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white">
              <Save className="h-4 w-4" /> Save
            </button>
            <button onClick={closeEditor} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2">
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <p className="p-4 text-sm text-[var(--color-muted)]">Loading products…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-muted)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3">{product.name}</td>
                  <td className="px-4 py-3">₹{Number(product.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(product)} className="rounded border px-2 py-1"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => deleteProduct(product.id)} className="rounded border px-2 py-1 text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </section>
  );
}
