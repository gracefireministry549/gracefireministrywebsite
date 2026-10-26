(function(){
 const root=document.getElementById('home-testimonies');if(!root)return;
 const cfg=window.GRACE_FIRE_SUPABASE||{};
 if(!window.supabase||!cfg.url||!cfg.publishableKey){root.innerHTML='<p>Visit the testimonies page to share your story.</p>';return;}
 const safe=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const client=window.supabase.createClient(cfg.url,cfg.publishableKey);
 client.from('testimonies').select('id,display_name,testimony,created_at').eq('published',true).eq('consent_to_publish',true).order('created_at',{ascending:false}).limit(3).then(({data,error})=>{
  if(error||!data||!data.length){root.innerHTML='<p>We give thanks for every testimony. Approved stories will appear here as they are shared.</p>';return;}
  root.innerHTML=data.map(x=>'<article class="testi-card reveal"><q>'+safe(x.testimony)+'</q><span class="testi-name">'+safe(x.display_name)+'</span></article>').join('');
 });
})();