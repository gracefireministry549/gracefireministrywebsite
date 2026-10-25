(function () {
  const cfg = window.GRACE_FIRE_SUPABASE || {};
  const $ = (id) => document.getElementById(id);
  const status = (message) => { $("status").textContent = message; };
  const configReady = cfg.url && cfg.anonKey &&
    !cfg.url.includes("YOUR_PROJECT_REF") && !cfg.anonKey.includes("YOUR_SUPABASE");
  if (!configReady || !window.supabase) {
    status("Setup required: add the Supabase project URL and publishable/anon key in /js/admin-config.js, then run supabase/dynamic-content-schema.sql in the Supabase SQL Editor. Do not use a service-role or secret key here.");
    $("login-panel").hidden = true;
    return;
  }
  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  let sermons = [], events = [];
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
  const value = (id) => $(id).value.trim();
  const checked = (id) => $(id).checked;
  const toLocal = (v) => v ? new Date(v).toISOString().slice(0,16) : "";
  const toIso = (v) => v ? new Date(v).toISOString() : null;

  async function requireAdmin() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      $("login-panel").hidden = false; $("workspace").hidden = true;
      status("Sign in with the admin account. Database permissions are enforced by Supabase Row Level Security.");
      return false;
    }
    const { data, error } = await client.from("sermons").select("id").limit(1);
    if (error && /permission|row-level|JWT|policy/i.test(error.message)) {
      status("Signed in, but access was denied. Ensure this user's trusted app_metadata contains role=admin, then sign out and back in.");
      $("login-panel").hidden = true; $("workspace").hidden = true; return false;
    }
    $("login-panel").hidden = true; $("workspace").hidden = false;
    status("Signed in. Loading content…");
    return true;
  }
  async function loadAll() {
    const [s, e] = await Promise.all([
      client.from("sermons").select("*").order("created_at", {ascending:false}),
      client.from("church_events").select("*").order("starts_at", {ascending:true})
    ]);
    if (s.error || e.error) { status("Could not load content: " + (s.error || e.error).message); return; }
    sermons = s.data || []; events = e.data || [];
    $("sermon-list").innerHTML = "<h3>Saved sermons</h3>" + (sermons.map(x =>
      '<article class="record"><h3>'+safe(x.title)+'</h3><p class="muted">'+safe(x.scripture)+' · '+(x.published?'Published':'Draft')+(x.publish_at?' · Scheduled: '+safe(new Date(x.publish_at).toLocaleString()):'')+'</p><button class="admin-btn secondary" data-sermon-edit="'+x.id+'">Edit</button><button class="admin-btn secondary" data-sermon-delete="'+x.id+'">Delete</button></article>'
    ).join("") || "<p>No sermons yet.</p>");
    $("event-list").innerHTML = "<h3>Saved events</h3>" + (events.map(x =>
      '<article class="record"><h3>'+safe(x.title)+'</h3><p class="muted">'+safe(new Date(x.starts_at).toLocaleString())+' · '+(x.published?'Published':'Draft')+'</p><button class="admin-btn secondary" data-event-edit="'+x.id+'">Edit</button><button class="admin-btn secondary" data-event-delete="'+x.id+'">Delete</button></article>'
    ).join("") || "<p>No events yet.</p>");
    status("Content loaded. Changes save to Supabase.");
  }
  $("login-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    status("Signing in…");
    const { error } = await client.auth.signInWithPassword({email:value("email"),password:$("password").value});
    if (error) { status("Sign-in failed: " + error.message); return; }
    if (await requireAdmin()) await loadAll();
  });
  $("signout").addEventListener("click", async () => { await client.auth.signOut(); await requireAdmin(); });
  $("sermon-reset").addEventListener("click", () => $("sermon-form").reset() || ($("sermon-id").value = ""));
  $("event-reset").addEventListener("click", () => { $("event-form").reset(); $("event-id").value=""; });
  $("sermon-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const id = value("sermon-id");
    const payload = {
      title:value("sermon-title"), slug:value("sermon-slug"), scripture:value("sermon-scripture"),
      theme:value("sermon-theme"), opening:value("sermon-opening"),
      points:$("sermon-points").value.split("\n").map(s=>s.trim()).filter(Boolean),
      reflection:value("sermon-reflection"), prayer:value("sermon-prayer"),
      publish_at:toIso(value("sermon-publish-at")), published:checked("sermon-published")
    };
    const query = id ? client.from("sermons").update(payload).eq("id",id) : client.from("sermons").insert(payload);
    const { error } = await query;
    if (error) { status("Could not save sermon: " + error.message); return; }
    $("sermon-form").reset(); $("sermon-id").value=""; await loadAll();
  });
  $("event-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const id = value("event-id");
    const payload = {title:value("event-title"),slug:value("event-slug"),description:value("event-description"),
      location:value("event-location"),starts_at:toIso(value("event-start")),ends_at:toIso(value("event-end")),published:checked("event-published")};
    const query = id ? client.from("church_events").update(payload).eq("id",id) : client.from("church_events").insert(payload);
    const { error } = await query;
    if (error) { status("Could not save event: " + error.message); return; }
    $("event-form").reset(); $("event-id").value=""; await loadAll();
  });
  document.addEventListener("click", async (ev) => {
    const t = ev.target;
    if (t.dataset.sermonEdit) {
      const x=sermons.find(s=>s.id===t.dataset.sermonEdit); if(!x)return;
      $("sermon-id").value=x.id; $("sermon-title").value=x.title; $("sermon-slug").value=x.slug;
      $("sermon-scripture").value=x.scripture||""; $("sermon-theme").value=x.theme||"";
      $("sermon-opening").value=x.opening||""; $("sermon-points").value=(x.points||[]).join("\n");
      $("sermon-reflection").value=x.reflection||""; $("sermon-prayer").value=x.prayer||"";
      $("sermon-publish-at").value=toLocal(x.publish_at); $("sermon-published").checked=x.published;
      $("sermon-form").scrollIntoView({behavior:"smooth"});
    }
    if (t.dataset.eventEdit) {
      const x=events.find(e=>e.id===t.dataset.eventEdit); if(!x)return;
      $("event-id").value=x.id; $("event-title").value=x.title; $("event-slug").value=x.slug;
      $("event-description").value=x.description||""; $("event-location").value=x.location||"";
      $("event-start").value=toLocal(x.starts_at); $("event-end").value=toLocal(x.ends_at);
      $("event-published").checked=x.published; $("event-form").scrollIntoView({behavior:"smooth"});
    }
    const delS=t.dataset.sermonDelete, delE=t.dataset.eventDelete;
    if (delS && confirm("Delete this sermon?")) {
      const {error}=await client.from("sermons").delete().eq("id",delS);
      if(error)status("Delete failed: "+error.message);else await loadAll();
    }
    if (delE && confirm("Delete this event?")) {
      const {error}=await client.from("church_events").delete().eq("id",delE);
      if(error)status("Delete failed: "+error.message);else await loadAll();
    }
  });
  (async()=>{if(await requireAdmin()) await loadAll();})();
})();