(function(){
  const cfg=window.GRACE_FIRE_SUPABASE||{};
  const form=document.getElementById('testimony-form');
  const status=document.getElementById('testimony-status');
  const list=document.getElementById('testimony-list');
  const safe=(value)=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  if(!window.supabase||!cfg.url||!cfg.publishableKey){
    status.textContent='Testimony submissions are temporarily unavailable. Please contact the ministry on WhatsApp.';
    form.querySelector('button[type="submit"]').disabled=true;
    list.innerHTML='<p>Approved testimonies are temporarily unavailable.</p>';
    return;
  }
  const client=window.supabase.createClient(cfg.url,cfg.publishableKey);
  async function loadApproved(){
    const {data,error}=await client.from('testimonies').select('id,display_name,testimony,created_at').eq('published',true).eq('consent_to_publish',true).order('created_at',{ascending:false}).limit(30);
    if(error){list.innerHTML='<p>Approved testimonies could not be loaded right now.</p>';return;}
    if(!data.length){list.innerHTML='<p>No testimonies have been published yet. You can be the first to share your story.</p>';return;}
    list.innerHTML=data.map(item=>'<article class="testimony-card"><blockquote>“'+safe(item.testimony)+'”</blockquote><cite>'+safe(item.display_name)+'</cite></article>').join('');
  }
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();
    if(!document.getElementById('testimony-consent').checked){status.textContent='Please confirm permission to publish before submitting.';return;}
    const button=form.querySelector('button[type="submit"]');
    button.disabled=true;status.textContent='Submitting securely for review…';
    const displayName=document.getElementById('display-name').value.trim();
    const testimony=document.getElementById('testimony-text').value.trim();
    const {error}=await client.from('testimonies').insert({display_name:displayName,testimony,consent_to_publish:true,published:false});
    if(error){status.textContent='We could not submit your testimony. Please try again later or contact the ministry on WhatsApp.';button.disabled=false;return;}
    form.reset();status.textContent='Thank you. Your testimony was submitted for review and will not appear publicly unless an admin approves it.';button.disabled=false;
  });
  loadApproved();
})();