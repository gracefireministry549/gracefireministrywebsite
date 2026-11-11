(function(){
  const cfg=window.GRACE_FIRE_SUPABASE||{};
  const $=id=>document.getElementById(id);
  const status=$('testimonies-admin-status');
  const list=$('testimonies-admin-list');
  const safe=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  if(!cfg.url||!cfg.anonKey||cfg.url.includes('YOUR_PROJECT_REF')||cfg.anonKey.includes('YOUR_SUPABASE')||!window.supabase){
    status.textContent='Configure the Supabase URL and publishable/anon key in /js/admin-config.js first.';return;
  }
  const client=window.supabase.createClient(cfg.url,cfg.anonKey);
  let rows=[];
  async function load(){
    const {data:{session}}=await client.auth.getSession();
    if(!session||session.user?.app_metadata?.role!=='admin'){
      status.textContent='Sign in at the admin panel with an account whose trusted app_metadata role is admin, then reload this page.';
      list.innerHTML='';return;
    }
    status.textContent='Loading testimony submissions…';
    const {data,error}=await client.from('testimonies').select('*').order('created_at',{ascending:false});
    if(error){status.textContent='Could not load testimonies: '+safe(error.message);return;}
    rows=data||[];
    if(!rows.length){list.innerHTML='<p>No testimony submissions yet.</p>';status.textContent='No submissions found.';return;}
    list.innerHTML=rows.map(x=>'<article class="record"><h3>'+safe(x.display_name)+'</h3><p class="muted">'+safe(new Date(x.created_at).toLocaleString())+' · '+(x.published?'Published':'Pending review')+' · '+(x.consent_to_publish?'Publication consent recorded':'No publication consent')+'</p><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+safe(x.testimony)+'</p>'+(x.consent_to_publish?'<button class="admin-btn" data-testimony-publish="'+x.id+'" data-next="'+(!x.published)+'">'+(x.published?'Unpublish':'Approve & publish')+'</button>':'<p class="muted">Cannot publish without consent.</p>')+'<button class="admin-btn secondary" data-testimony-delete="'+x.id+'">Delete</button></article>').join('');
    status.textContent=rows.length+' submission(s). Only approved stories are public.';
  }
  document.addEventListener('click',async ev=>{
    const t=ev.target;
    if(t.dataset.testimonyPublish){
      const id=t.dataset.testimonyPublish,next=t.dataset.next==='true';
      if(!confirm(next?'Publish this testimony publicly?':'Remove this testimony from public display?'))return;
      const {error}=await client.from('testimonies').update({published:next}).eq('id',id);
      if(error){status.textContent='Could not update testimony: '+error.message;return;}
      await load();
    }
    if(t.dataset.testimonyDelete&&confirm('Permanently delete this testimony?')){
      const {error}=await client.from('testimonies').delete().eq('id',t.dataset.testimonyDelete);
      if(error){status.textContent='Could not delete testimony: '+error.message;return;}
      await load();
    }
  });
  document.addEventListener('click',ev=>{if(ev.target.id==='signout')setTimeout(()=>{list.innerHTML='';status.textContent='Sign in to review testimonies.';},100);});
  load();
})();