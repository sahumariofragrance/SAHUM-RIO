import React, { useState, useCallback, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Upload,
  Clock,
  Check,
  XCircle,
  Image as ImageIcon,
} from "lucide-react";
import { Card } from "../components/ui";
import initialProducts from "../data/products.json";
import { getGitHubFile, commitGitHubFile } from "../lib/github";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { useRouter } from "../router";

const PRODUCTS_REPO_PATH = "src/data/products.json";

const EMPTY_SUBMIT_FORM = { name: "", description: "", price: "", alt: "", notes: "" };
const EMPTY_LIVE_FORM = { name: "", description: "", price: "", image: "", alt: "" };

function validateBase(form) {
  const errs = {};
  if (!form.name?.trim()) errs.name = "Name is required";
  if (!form.description?.trim()) errs.description = "Description is required";
  if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
    errs.price = "Enter a valid price greater than 0";
  if (!form.alt?.trim()) errs.alt = "Alt text required for accessibility";
  return errs;
}

function FormField({ label, name, value, onChange, error, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-sm text-[var(--color-text)]">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:ring-2 focus:ring-amber-600 outline-none transition-colors ${
          error ? "border-red-500" : "border-[var(--color-border)]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function AdminPage() {
  const { navigate } = useRouter();
  const { user, logout } = useAuth();

  // --- Tab state ---
  const [tab, setTab] = useState("pending");

  // --- Live products state ---
  const [products, setProducts] = useState(initialProducts);
  const [editingId, setEditingId] = useState(null);
  const [liveForm, setLiveForm] = useState(EMPTY_LIVE_FORM);
  const [liveFormErrors, setLiveFormErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [commitState, setCommitState] = useState("idle");
  const [commitMsg, setCommitMsg] = useState("");

  // --- Pending products state ---
  const [pendingProducts, setPendingProducts] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState("");

  // --- Submit form state ---
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitForm, setSubmitForm] = useState(EMPTY_SUBMIT_FORM);
  const [submitErrors, setSubmitErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- Per-item action state for approve/reject ---
  const [actionState, setActionState] = useState({});

  useEffect(() => {
    loadPending();
  }, []);

  async function loadPending() {
    setPendingLoading(true);
    setPendingError("");
    const { data, error } = await supabase
      .from("pending_products")
      .select("*")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false });
    if (error) {
      setPendingError(error.message);
    } else {
      setPendingProducts(data || []);
    }
    setPendingLoading(false);
  }

  async function uploadImage(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false });
    if (error) throw new Error("Image upload failed: " + error.message);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setSubmitErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
  }

  function handleSubmitFieldChange(e) {
    const { name, value } = e.target;
    setSubmitForm((prev) => ({ ...prev, [name]: value }));
    setSubmitErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function handleSubmitProduct() {
    const errs = validateBase(submitForm);
    if (!imageFile) errs.image = "Please upload a product image";
    if (Object.keys(errs).length) {
      setSubmitErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const imageUrl = await uploadImage(imageFile);
      const { error } = await supabase.from("pending_products").insert({
        name: submitForm.name.trim(),
        description: submitForm.description.trim(),
        price: Number(submitForm.price),
        image_url: imageUrl,
        alt: submitForm.alt.trim(),
        notes: submitForm.notes.trim(),
        submitted_by: user?.email,
      });
      if (error) throw new Error(error.message);
      setShowSubmitForm(false);
      setSubmitForm(EMPTY_SUBMIT_FORM);
      setImageFile(null);
      setImagePreview("");
      loadPending();
    } catch (err) {
      setSubmitErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(pending) {
    setActionState((s) => ({ ...s, [pending.id]: "loading" }));
    try {
      const newProduct = {
        id: Math.max(0, ...products.map((p) => p.id)) + 1,
        name: pending.name,
        description: pending.description,
        price: Number(pending.price),
        image: pending.image_url,
        alt: pending.alt,
      };
      const newProducts = [...products, newProduct];

      // Auto-commit to GitHub if credentials are configured
      const token = process.env.REACT_APP_GITHUB_TOKEN;
      const owner = process.env.REACT_APP_GITHUB_OWNER;
      const repo = process.env.REACT_APP_GITHUB_REPO;
      const branch = process.env.REACT_APP_GITHUB_BRANCH || "main";

      if (token && owner && repo) {
        const fileData = await getGitHubFile({
          token, owner, repo, path: PRODUCTS_REPO_PATH, branch,
        });
        await commitGitHubFile({
          token, owner, repo, path: PRODUCTS_REPO_PATH, branch,
          content: JSON.stringify(newProducts, null, 2),
          sha: fileData.sha,
          message: `feat: add product "${pending.name}" via admin approval`,
        });
      }

      setProducts(newProducts);
      setDirty(!token || !owner || !repo);

      await supabase
        .from("pending_products")
        .update({
          status: "approved",
          reviewed_by: user?.email,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", pending.id);

      setActionState((s) => ({ ...s, [pending.id]: "done" }));
      loadPending();
    } catch (err) {
      console.error("[Admin] Approve error:", err);
      setActionState((s) => ({ ...s, [pending.id]: "error-approve" }));
    }
  }

  async function handleReject(pending) {
    setActionState((s) => ({ ...s, [pending.id]: "loading" }));
    await supabase
      .from("pending_products")
      .update({
        status: "rejected",
        reviewed_by: user?.email,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", pending.id);
    setActionState((s) => ({ ...s, [pending.id]: "done" }));
    loadPending();
  }

  // --- Live product handlers ---
  const openAdd = useCallback(() => {
    setLiveForm(EMPTY_LIVE_FORM);
    setLiveFormErrors({});
    setEditingId(-1);
  }, []);

  const openEdit = useCallback((product) => {
    setLiveForm({ ...product, price: String(product.price) });
    setLiveFormErrors({});
    setEditingId(product.id);
  }, []);

  const closeLiveForm = useCallback(() => {
    setEditingId(null);
    setLiveForm(EMPTY_LIVE_FORM);
    setLiveFormErrors({});
  }, []);

  const handleLiveFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    setLiveForm((prev) => ({ ...prev, [name]: value }));
    setLiveFormErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const handleSaveProduct = useCallback(() => {
    const errs = validateBase(liveForm);
    if (!liveForm.image?.trim()) errs.image = "Image URL or path required";
    if (Object.keys(errs).length) {
      setLiveFormErrors(errs);
      return;
    }
    const product = {
      id: editingId === -1 ? Math.max(0, ...products.map((p) => p.id)) + 1 : editingId,
      name: liveForm.name.trim(),
      description: liveForm.description.trim(),
      price: Number(liveForm.price),
      image: liveForm.image.trim(),
      alt: liveForm.alt.trim(),
    };
    setProducts((prev) =>
      editingId === -1 ? [...prev, product] : prev.map((p) => (p.id === editingId ? product : p))
    );
    setDirty(true);
    setCommitState("idle");
    closeLiveForm();
  }, [liveForm, editingId, products, closeLiveForm]);

  const handleDelete = useCallback((id) => {
    if (!window.confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDirty(true);
    setCommitState("idle");
  }, []);

  const handleCommit = useCallback(async () => {
    const token = process.env.REACT_APP_GITHUB_TOKEN;
    const owner = process.env.REACT_APP_GITHUB_OWNER;
    const repo = process.env.REACT_APP_GITHUB_REPO;
    const branch = process.env.REACT_APP_GITHUB_BRANCH || "main";

    if (!token || !owner || !repo) {
      setCommitState("error");
      setCommitMsg(
        "GitHub credentials missing. Add REACT_APP_GITHUB_TOKEN, REACT_APP_GITHUB_OWNER, and REACT_APP_GITHUB_REPO to your .env file."
      );
      return;
    }

    try {
      setCommitState("loading");
      setCommitMsg("");
      const fileData = await getGitHubFile({
        token, owner, repo, path: PRODUCTS_REPO_PATH, branch,
      });
      const result = await commitGitHubFile({
        token, owner, repo, path: PRODUCTS_REPO_PATH, branch,
        content: JSON.stringify(products, null, 2),
        sha: fileData.sha,
        message: "chore: update products catalogue via admin panel",
      });
      setCommitState("success");
      setCommitMsg(`Committed successfully! SHA: ${result.commit.sha.slice(0, 7)}`);
      setDirty(false);
    } catch (err) {
      setCommitState("error");
      setCommitMsg(err.message || "Commit failed. Check console for details.");
      console.error("[Admin] GitHub commit error:", err);
    }
  }, [products]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Product Admin</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Submit products for review, approve them, and publish to GitHub.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-muted)]">
            Signed in as{" "}
            <span className="font-medium text-[var(--color-text)]">
              {user?.user_metadata?.name || user?.email}
            </span>
          </span>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-red-600 hover:border-red-300 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)] mb-6">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "pending"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          Pending Review
          {pendingProducts.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              {pendingProducts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("live")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "live"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          Live Products
          {dirty && <span className="ml-1 text-amber-600">●</span>}
        </button>
      </div>

      {/* ===== PENDING REVIEW TAB ===== */}
      {tab === "pending" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[var(--color-muted)]">
              Submit a product for review. Approving auto-commits it to GitHub.
            </p>
            <button
              onClick={() => {
                setShowSubmitForm(true);
                setSubmitForm(EMPTY_SUBMIT_FORM);
                setImageFile(null);
                setImagePreview("");
                setSubmitErrors({});
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Submit Product
            </button>
          </div>

          {/* Submit form */}
          {showSubmitForm && (
            <Card className="mb-6 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">New Product Submission</h2>
                <button
                  onClick={() => setShowSubmitForm(false)}
                  aria-label="Close"
                  className="rounded-lg p-1 hover:bg-[var(--color-surface-muted)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Name"
                  name="name"
                  value={submitForm.name}
                  onChange={handleSubmitFieldChange}
                  error={submitErrors.name}
                  placeholder="Bloom"
                />
                <FormField
                  label="Price (₹)"
                  name="price"
                  type="number"
                  value={submitForm.price}
                  onChange={handleSubmitFieldChange}
                  error={submitErrors.price}
                  placeholder="749"
                />
              </div>

              <div className="mt-4">
                <label className="text-sm text-[var(--color-text)]">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={submitForm.description}
                  onChange={handleSubmitFieldChange}
                  rows={2}
                  placeholder="Warm, resinous amber with smoky oud base."
                  className={`mt-1 w-full resize-none rounded-lg border px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:ring-2 focus:ring-amber-600 outline-none transition-colors ${
                    submitErrors.description ? "border-red-500" : "border-[var(--color-border)]"
                  }`}
                />
                {submitErrors.description && (
                  <p className="mt-1 text-xs text-red-500">{submitErrors.description}</p>
                )}
              </div>

              <div className="mt-4">
                <FormField
                  label="Alt Text"
                  name="alt"
                  value={submitForm.alt}
                  onChange={handleSubmitFieldChange}
                  error={submitErrors.alt}
                  placeholder="Bottle of Bloom perfume"
                />
              </div>

              {/* Image upload */}
              <div className="mt-4">
                <label className="text-sm text-[var(--color-text)]">
                  Product Image <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex items-start gap-4">
                  <label
                    className={`flex flex-col items-center justify-center w-32 h-32 rounded-lg border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
                      submitErrors.image
                        ? "border-red-400"
                        : "border-[var(--color-border)] hover:border-amber-400"
                    }`}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-[var(--color-muted)]" />
                        <span className="mt-1 text-xs text-[var(--color-muted)]">
                          Click to upload
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                  <div className="text-xs text-[var(--color-muted)] mt-2">
                    <p>Supported: JPG, PNG, WebP</p>
                    <p className="mt-1">Stored in Supabase Storage.</p>
                  </div>
                </div>
                {submitErrors.image && (
                  <p className="mt-1 text-xs text-red-500">{submitErrors.image}</p>
                )}
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="text-sm text-[var(--color-text)]">
                  Notes{" "}
                  <span className="text-[var(--color-muted)] text-xs">(optional)</span>
                </label>
                <textarea
                  name="notes"
                  value={submitForm.notes}
                  onChange={handleSubmitFieldChange}
                  rows={2}
                  placeholder="Any additional context for the reviewer…"
                  className="mt-1 w-full resize-none rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:ring-2 focus:ring-amber-600 outline-none transition-colors"
                />
              </div>

              {submitErrors.submit && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{submitErrors.submit}</span>
                </div>
              )}

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={handleSubmitProduct}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  )}
                  {submitting ? "Submitting…" : "Submit for Review"}
                </button>
                <button
                  onClick={() => setShowSubmitForm(false)}
                  className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </Card>
          )}

          {/* Pending list */}
          {pendingLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" aria-hidden="true" />
            </div>
          ) : pendingError ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{pendingError}</span>
            </div>
          ) : pendingProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="h-10 w-10 text-[var(--color-muted)] mx-auto mb-3" aria-hidden="true" />
              <p className="text-[var(--color-muted)]">No pending submissions.</p>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                Click "Submit Product" to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProducts.map((p) => (
                <Card key={p.id} className="p-5">
                  <div className="flex gap-4">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.alt}
                        className="w-20 h-20 object-cover rounded-lg shrink-0 bg-[var(--color-surface-muted)]"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg shrink-0 bg-[var(--color-surface-muted)] flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-[var(--color-muted)]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{p.name}</p>
                          <p className="text-xs text-[var(--color-muted)] mt-0.5 line-clamp-2">
                            {p.description}
                          </p>
                          <p className="mt-1.5 text-sm font-medium text-amber-600">₹{p.price}</p>
                          {p.notes && (
                            <div className="mt-2 rounded-md bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-muted)]">
                              <span className="font-medium">Notes:</span> {p.notes}
                            </div>
                          )}
                          <p className="mt-1 text-xs text-[var(--color-muted)]">
                            Submitted by {p.submitted_by} ·{" "}
                            {new Date(p.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {actionState[p.id] === "error-approve" && (
                            <span className="text-xs text-red-500 self-center">
                              Commit failed
                            </span>
                          )}
                          <button
                            onClick={() => handleApprove(p)}
                            disabled={actionState[p.id] === "loading"}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {actionState[p.id] === "loading" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(p)}
                            disabled={actionState[p.id] === "loading"}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== LIVE PRODUCTS TAB ===== */}
      {tab === "live" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[var(--color-muted)]">
              Edit live products directly. Click{" "}
              <strong>Commit to GitHub</strong> to publish changes.
            </p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Product
            </button>
          </div>

          {/* Inline add / edit form */}
          {editingId !== null && (
            <Card className="mb-6 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">
                  {editingId === -1 ? "New Product" : "Edit Product"}
                </h2>
                <button
                  onClick={closeLiveForm}
                  aria-label="Close form"
                  className="rounded-lg p-1 hover:bg-[var(--color-surface-muted)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Name"
                  name="name"
                  value={liveForm.name}
                  onChange={handleLiveFieldChange}
                  error={liveFormErrors.name}
                  placeholder="Bloom"
                />
                <FormField
                  label="Price (₹)"
                  name="price"
                  type="number"
                  value={liveForm.price}
                  onChange={handleLiveFieldChange}
                  error={liveFormErrors.price}
                  placeholder="749"
                />
              </div>

              <div className="mt-4">
                <label className="text-sm text-[var(--color-text)]">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={liveForm.description}
                  onChange={handleLiveFieldChange}
                  rows={2}
                  placeholder="Warm, resinous amber with smoky oud base."
                  className={`mt-1 w-full resize-none rounded-lg border px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:ring-2 focus:ring-amber-600 outline-none transition-colors ${
                    liveFormErrors.description ? "border-red-500" : "border-[var(--color-border)]"
                  }`}
                />
                {liveFormErrors.description && (
                  <p className="mt-1 text-xs text-red-500">{liveFormErrors.description}</p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Image Path or URL"
                  name="image"
                  value={liveForm.image}
                  onChange={handleLiveFieldChange}
                  error={liveFormErrors.image}
                  placeholder="/products/bloom.jpg"
                />
                <FormField
                  label="Alt Text"
                  name="alt"
                  value={liveForm.alt}
                  onChange={handleLiveFieldChange}
                  error={liveFormErrors.alt}
                  placeholder="Bottle of Bloom perfume"
                />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={handleSaveProduct}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save Product
                </button>
                <button
                  onClick={closeLiveForm}
                  className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </Card>
          )}

          {/* Product cards grid */}
          {products.length === 0 ? (
            <p className="py-12 text-center text-[var(--color-muted)]">
              No products yet. Click "Add Product" to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <Card key={p.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)] line-clamp-2">
                        {p.description}
                      </p>
                      <p className="mt-2 text-sm font-medium text-amber-600">₹{p.price}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)] truncate">
                        {p.image}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        aria-label={`Edit ${p.name}`}
                        className="rounded-lg p-1.5 text-[var(--color-muted)] hover:text-amber-600 hover:bg-[var(--color-surface-muted)] transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        aria-label={`Delete ${p.name}`}
                        className="rounded-lg p-1.5 text-[var(--color-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* GitHub publish section */}
          <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 font-semibold">
                  <GitCommit className="h-4 w-4 text-[var(--color-muted)]" aria-hidden="true" />
                  Publish to GitHub
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Commits{" "}
                  <code className="rounded bg-[var(--color-surface-muted)] px-1 py-0.5 text-xs">
                    src/data/products.json
                  </code>{" "}
                  to your repository.
                </p>
              </div>
              <button
                onClick={handleCommit}
                disabled={commitState === "loading" || !dirty}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-text)] px-4 py-2.5 text-sm font-semibold text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {commitState === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Committing…
                  </>
                ) : (
                  <>
                    <GitCommit className="h-4 w-4" aria-hidden="true" />
                    Commit to GitHub
                  </>
                )}
              </button>
            </div>

            {commitState === "success" && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {commitMsg}
              </div>
            )}
            {commitState === "error" && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{commitMsg}</span>
              </div>
            )}
            {dirty && commitState === "idle" && (
              <p className="mt-2 text-xs text-amber-600">
                ● Unsaved local changes — commit to publish them.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Security notice */}
      <p className="mt-6 text-xs text-[var(--color-muted)]">
        ⚠ Admin only. Requires a GitHub Fine-grained PAT with{" "}
        <em>Contents: Read &amp; write</em> scope set in{" "}
        <code>.env</code> as <code>REACT_APP_GITHUB_TOKEN</code>. Never deploy
        with this token in a public bundle.
      </p>
    </section>
  );
}
