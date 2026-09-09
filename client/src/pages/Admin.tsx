import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Check, Eye, FileImage, Inbox, Loader2, Plus, Send, Trash2, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const emptyForm = { title: "", eyebrow: "", description: "", previewUrl: "", tags: "", color: "mint", glyph: "✦", sortOrder: 0, isPublished: true };

type FormState = typeof emptyForm;

function AdminContent() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const projectsQuery = trpc.projects.adminList.useQuery(undefined, { enabled: user?.role === "admin" });
  const contactsQuery = trpc.contacts.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const createProject = trpc.projects.create.useMutation({ onSuccess: async () => { await utils.projects.adminList.invalidate(); await utils.projects.list.invalidate(); } });
  const updateProject = trpc.projects.update.useMutation({ onSuccess: async () => { await utils.projects.adminList.invalidate(); await utils.projects.list.invalidate(); } });
  const removeProject = trpc.projects.remove.useMutation({ onSuccess: async () => { await utils.projects.adminList.invalidate(); await utils.projects.list.invalidate(); } });
  const uploadImage = trpc.projects.uploadImage.useMutation();
  const setContactStatus = trpc.contacts.setStatus.useMutation({ onSuccess: async () => { await utils.contacts.list.invalidate(); } });

  const newMessages = useMemo(() => contactsQuery.data?.filter((item) => item.status === "new").length ?? 0, [contactsQuery.data]);

  if (user && user.role !== "admin") {
    return <div className="admin-denied"><span className="mono-note">403 / ADMIN ONLY</span><h1>This desk is private.</h1><p>Your account is signed in, but it does not have content-management permissions.</p></div>;
  }

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setImage(null); };

  const editProject = (project: NonNullable<typeof projectsQuery.data>[number]) => {
    setEditingId(project.id);
    setForm({ title: project.title, eyebrow: project.eyebrow, description: project.description, previewUrl: project.previewUrl ?? "", tags: project.tags.join(", "), color: project.color, glyph: project.glyph, sortOrder: project.sortOrder, isPublished: project.isPublished });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.eyebrow || form.description.length < 10) {
      toast.error("Add a title, category, and a description of at least 10 characters.");
      return;
    }
    setBusy(true);
    try {
      let imageUrl: string | undefined;
      let imageKey: string | undefined;
      if (image) {
        const data = await fileToDataUrl(image);
        const uploaded = await uploadImage.mutateAsync({ filename: image.name, contentType: image.type, data });
        imageUrl = uploaded.url;
        imageKey = uploaded.key;
      }
      const payload = { title: form.title, eyebrow: form.eyebrow, description: form.description, previewUrl: form.previewUrl, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean), color: form.color, glyph: form.glyph, sortOrder: Number(form.sortOrder), isPublished: form.isPublished, ...(imageUrl ? { imageUrl, imageKey } : {}) };
      if (editingId) await updateProject.mutateAsync({ id: editingId, data: payload });
      else await createProject.mutateAsync(payload);
      toast.success(editingId ? "Project updated." : "Project published to the content desk.");
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the project. Try again.");
    } finally { setBusy(false); }
  };

  return <div className="admin-page">
    <div className="admin-topbar"><div><span className="mono-note">SNOW CODE / CONTENT DESK</span><h1>Make the useful<br /><em>visible.</em></h1></div><div className="admin-status"><span className="status-dot" /> {user ? `Signed in as ${user.name || user.email}` : "Checking access"}</div></div>
    <div className="admin-metrics"><div><span><FileImage size={16} /> published work</span><strong>{projectsQuery.data?.filter((project) => project.isPublished).length ?? 0}</strong></div><div><span><Inbox size={16} /> new messages</span><strong>{newMessages}</strong></div><div><span><Eye size={16} /> system status</span><strong className="metric-good">operational</strong></div></div>
    <div className="admin-grid">
      <section className="admin-panel project-editor"><div className="panel-heading"><div><span className="mono-note">{editingId ? "EDIT PROJECT" : "NEW PROJECT"}</span><h2>{editingId ? "Refine the story." : "Add a new story."}</h2></div>{editingId && <button className="icon-button" onClick={resetForm} aria-label="Cancel editing"><X size={17} /></button>}</div>
        <form onSubmit={handleSave} className="admin-form">
          <label><span>Title</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Northstar Data" /></label>
          <label><span>Category / eyebrow</span><input value={form.eyebrow} onChange={(event) => setForm({ ...form, eyebrow: event.target.value })} placeholder="Analytics system" /></label>
          <label><span>Description</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What made this project matter?" rows={4} /></label>
          <div className="admin-form-row"><label><span>Preview URL</span><input value={form.previewUrl} onChange={(event) => setForm({ ...form, previewUrl: event.target.value })} placeholder="https://..." /></label><label><span>Accent</span><select value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })}><option value="mint">Mint</option><option value="mustard">Mustard</option><option value="ink">Ink</option></select></label></div>
          <label><span>Tags <small>comma separated</small></span><input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="React, API, UX" /></label>
          <label className="upload-field"><span>Project image</span><input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] ?? null)} /><div className="upload-box"><Upload size={17} /> {image ? image.name : "Choose an image to upload to secure storage"}</div></label>
          <label className="check-row"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} /><span>Visible on the public site</span></label>
          <button className="admin-submit" type="submit" disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : editingId ? <Check size={16} /> : <Plus size={16} />} {busy ? "Saving..." : editingId ? "Save changes" : "Add project"}</button>
        </form>
      </section>
      <section className="admin-panel"><div className="panel-heading"><div><span className="mono-note">PROJECT LIBRARY</span><h2>What’s on the shelf.</h2></div><span className="panel-count">{projectsQuery.data?.length ?? 0} total</span></div><div className="admin-list">{projectsQuery.isLoading ? <div className="admin-empty"><Loader2 className="spin" size={18} /> Loading projects...</div> : projectsQuery.data?.length ? projectsQuery.data.map((project) => <div className="admin-list-item" key={project.id}><div className={`mini-art project-${project.color}`}><span>{project.glyph}</span></div><div className="admin-list-copy"><strong>{project.title}</strong><span>{project.eyebrow}</span><small className={project.isPublished ? "published" : "draft"}>{project.isPublished ? "Published" : "Draft"}</small></div><div className="admin-list-actions"><button onClick={() => editProject(project)} aria-label={`Edit ${project.title}`}>Edit</button><button className="danger-action" onClick={async () => { if (!window.confirm(`Remove ${project.title}?`)) return; try { await removeProject.mutateAsync({ id: project.id }); toast.success("Project removed."); } catch { toast.error("Could not remove project."); } }} aria-label={`Remove ${project.title}`}><Trash2 size={15} /></button></div></div>) : <div className="admin-empty"><FileImage size={19} /> No projects yet. Add the first story.</div>}</div></section>
    </div>
    <section className="admin-panel messages-panel"><div className="panel-heading"><div><span className="mono-note">INBOX</span><h2>Notes from good people.</h2></div><span className="panel-count">{contactsQuery.data?.length ?? 0} total / {newMessages} new</span></div><div className="message-list">{contactsQuery.isLoading ? <div className="admin-empty"><Loader2 className="spin" size={18} /> Loading messages...</div> : contactsQuery.data?.length ? contactsQuery.data.map((contact) => <article className={`message-item message-${contact.status}`} key={contact.id}><div className="message-meta"><strong>{contact.name}</strong><span>{contact.email}</span><time>{new Date(contact.createdAt).toLocaleDateString()}</time></div><p>{contact.message}</p><div className="message-actions"><span className={`message-status status-${contact.status}`}>{contact.status}</span>{contact.status !== "read" && <button onClick={() => setContactStatus.mutate({ id: contact.id, status: "read" })}>Mark read</button>}{contact.status !== "archived" && <button onClick={() => setContactStatus.mutate({ id: contact.id, status: "archived" })}>Archive</button>}</div></article>) : <div className="admin-empty"><Send size={18} /> Your inbox is quiet for now.</div>}</div></section>
  </div>;
}

export default function Admin() {
  return <DashboardLayout><AdminContent /></DashboardLayout>;
}
