import{api}from'./core.js';

const root=document.getElementById('adm');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toLocaleDateString('sv-SE');
const say=(el,t,err)=>{
el.className='msg'+(err?' err':'');
el.textContent=t;
};
let tab='perfil';
let editId=null;

const TARGETS=['en','es','fr','it','de'];
const decode=s=>{
const e=document.createElement('textarea');
e.innerHTML=s;
return e.value;
};
const email=()=>{
const u=api.user();
return u&&u.email?u.email:'';
};
const mm=async(q,to)=>{
const mail=email();
const url='https://api.mymemory.translated.net/get?q='+encodeURIComponent(q)+'&langpair=pt|'+to+(mail?'&de='+encodeURIComponent(mail):'');
const r=await fetch(url);
const j=await r.json();
if(Number(j.responseStatus)!==200)throw new Error('tr');
return decode(j.responseData.translatedText);
};
const trText=async(text,to)=>{
const out=[];
for(const st of String(text).split(/\n\s*\n/)){
if(!st.trim())continue;
if(st.length<=450){
out.push(await mm(st,to));
continue;
}
const lines=[];
for(const ln of st.split('\n')){
lines.push(ln.trim()?await mm(ln.slice(0,450),to):'');
}
out.push(lines.join('\n'));
}
return out.join('\n\n');
};
const trFields=async fields=>{
const res={};
await Promise.all(TARGETS.map(async to=>{
const o={};
for(const[k,v]of Object.entries(fields)){
o[k]=v&&v.trim()?await trText(v,to):'';
}
res[to]=o;
}));
return res;
};

const loginView=()=>{
root.innerHTML=`<section class="rate plain"><form id="lf" novalidate>
<div class="formtitle">Entrar</div>
<label class="f">E-mail<input type="email" id="em" autocomplete="username" required></label>
<label class="f">Senha<input type="password" id="pw" autocomplete="current-password" required></label>
<button class="btn" type="submit">Entrar</button>
<div id="lm" role="status"></div>
</form></section>`;
const form=document.getElementById('lf');
const msg=document.getElementById('lm');
form.addEventListener('submit',async e=>{
e.preventDefault();
try{
await api.login(document.getElementById('em').value.trim(),document.getElementById('pw').value);
}catch(err){
say(msg,'E-mail ou senha incorretos.',true);
}
});
};

const shell=()=>{
root.innerHTML=`<div class="tabs">
<button class="btn ghost ${tab==='perfil'?'on':''}" data-tab="perfil">Perfil</button>
<button class="btn ghost ${tab==='poemas'?'on':''}" data-tab="poemas">Poemas</button>
<button class="btn ghost ${tab==='avaliacoes'?'on':''}" data-tab="avaliacoes">Avaliações</button>
<button class="btn ghost" data-tab="sair">Sair</button>
</div><div id="tab"></div>`;
root.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',async()=>{
if(b.dataset.tab==='sair'){
await api.logout();
return;
}
tab=b.dataset.tab;
editId=null;
render();
}));
};

const profileTab=async()=>{
const p=await api.getProfile();
const box=document.getElementById('tab');
box.innerHTML=`<section class="rate plain"><form id="pf" novalidate>
<div class="formtitle">Meu perfil</div>
<label class="f">Nome<input type="text" id="pn" maxlength="60" value="${esc(p.name)}"></label>
<label class="f">Usuário<input type="text" id="ph" maxlength="40" value="${esc(p.handle)}"></label>
<label class="f">Apresentação (em português)<textarea id="pb" maxlength="500">${esc(p.bio)}</textarea><span class="hint">É traduzida automaticamente para os outros idiomas ao salvar.</span></label>
<label class="f">Foto (endereço da imagem)<input type="text" id="pp" maxlength="300" value="${esc(p.photo)}"><span class="hint">Ex.: foto.jpg (arquivo enviado junto com o site) ou um link https://…</span></label>
<label class="f">Links (um por linha: Nome | endereço)<textarea id="pl">${esc((p.links||[]).map(l=>`${l.label} | ${l.url}`).join('\n'))}</textarea></label>
<button class="btn" type="submit">Salvar perfil</button>
<div id="pm" role="status"></div>
</form></section>`;
const msg=document.getElementById('pm');
document.getElementById('pf').addEventListener('submit',async e=>{
e.preventDefault();
const links=document.getElementById('pl').value.split('\n').map(l=>{
const i=l.indexOf('|');
return i<0?null:{label:l.slice(0,i).trim(),url:l.slice(i+1).trim()};
}).filter(l=>l&&l.label&&l.url);
const bio=document.getElementById('pb').value.trim();
say(msg,'Salvando e traduzindo…');
let tr=p.tr||{};
let failed=false;
try{
tr=await trFields({bio});
}catch(err){
failed=true;
}
try{
await api.saveProfile({
name:document.getElementById('pn').value.trim(),
handle:document.getElementById('ph').value.trim(),
bio,
photo:document.getElementById('pp').value.trim(),
links,
tr
});
say(msg,failed?'Perfil salvo, mas a tradução automática falhou. Tente salvar de novo mais tarde.':'Perfil salvo e traduzido!',failed);
}catch(err){
say(msg,'Não foi possível salvar.',true);
}
});
};

const poemsTab=async()=>{
const poems=await api.getPoems();
const cur=poems.find(p=>p.id===editId)||{title:'',text:'',notes:'',date:today()};
const box=document.getElementById('tab');
box.innerHTML=`<section class="rate plain"><form id="sf" novalidate>
<div class="formtitle">${editId?'Editar poema':'Novo poema'}</div>
<label class="f">Título<input type="text" id="tt" maxlength="150" value="${esc(cur.title)}"></label>
<label class="f">Data<input type="date" id="td" value="${esc(cur.date)}"></label>
<label class="f">Poema (em português)<textarea class="tall" id="tx" maxlength="20000">${esc(cur.text)}</textarea><span class="hint">Pule uma linha em branco para separar as estrofes. A tradução para inglês, espanhol, francês, italiano e alemão é feita sozinha ao salvar.</span></label>
<label class="f">Anotações (opcional)<textarea id="tn" maxlength="2000">${esc(cur.notes||'')}</textarea></label>
<div style="display:flex;gap:12px;flex-wrap:wrap">
<button class="btn" type="submit">${editId?'Salvar alterações':'Publicar poema'}</button>
${editId?'<button class="btn ghost" type="button" id="cn">Cancelar</button>':''}
</div>
<div id="sm" role="status"></div>
</form></section>
<div class="divider gap"><h2>Poemas publicados</h2></div>
<div style="margin-bottom:16px"><button class="btn ghost" type="button" id="trall">Traduzir poemas sem tradução</button><div id="tm" role="status" style="margin-top:10px"></div></div>
<div id="pl">${poems.length?poems.map(p=>`<div class="row"><div class="grow"><strong>${esc(p.title)}</strong><small>${esc(p.date)}${p.tr&&p.tr.en?' · traduzido':' · sem tradução'}</small></div><button class="btn ghost" data-edit="${esc(p.id)}">Editar</button><button class="btn danger" data-del="${esc(p.id)}">Apagar</button></div>`).join(''):'<p class="empty">Nenhum poema ainda.</p>'}</div>`;
const msg=document.getElementById('sm');
document.getElementById('sf').addEventListener('submit',async e=>{
e.preventDefault();
const title=document.getElementById('tt').value.trim();
const text=document.getElementById('tx').value.trim();
const date=document.getElementById('td').value||today();
const notes=document.getElementById('tn').value.trim();
if(!title||!text)return say(msg,'Preencha o título e o poema.',true);
say(msg,'Salvando e traduzindo para os outros idiomas… pode levar alguns segundos.');
let tr=cur.tr||{};
let failed=false;
try{
tr=await trFields({title,text,notes});
}catch(err){
failed=true;
}
try{
await api.savePoem(editId,{title,text,date,notes,tr});
editId=null;
await poemsTab();
say(document.getElementById('sm'),failed?'Poema salvo, mas a tradução automática falhou (limite diário ou sem conexão). Use "Traduzir poemas sem tradução" mais tarde.':'Poema salvo e traduzido!',failed);
}catch(err){
say(msg,'Não foi possível salvar.',true);
}
});
const cn=document.getElementById('cn');
if(cn)cn.addEventListener('click',()=>{
editId=null;
poemsTab();
});
document.getElementById('trall').addEventListener('click',async()=>{
const tm=document.getElementById('tm');
const pending=poems.filter(p=>!(p.tr&&p.tr.en));
if(!pending.length)return say(tm,'Todos os poemas já têm tradução.');
let done=0;
for(const p of pending){
say(tm,`Traduzindo ${done+1} de ${pending.length}…`);
try{
const tr=await trFields({title:p.title,text:p.text,notes:p.notes||''});
await api.savePoem(p.id,{title:p.title,text:p.text,date:p.date,notes:p.notes||'',tr});
done++;
}catch(err){
await poemsTab();
say(document.getElementById('tm'),`Traduzi ${done} de ${pending.length}. Parou por limite diário ou falta de conexão; tente de novo mais tarde.`,true);
return;
}
}
await poemsTab();
say(document.getElementById('tm'),'Todos os poemas foram traduzidos!');
});
box.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{
editId=b.dataset.edit;
poemsTab();
window.scrollTo(0,0);
}));
box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',async()=>{
if(!confirm('Apagar este poema para sempre?'))return;
try{
await api.deletePoem(b.dataset.del);
await poemsTab();
}catch(err){
say(msg,'Não foi possível apagar.',true);
}
}));
};

const ratingsTab=async()=>{
const [ratings,poems]=await Promise.all([api.getRatings(),api.getPoems()]);
const names=Object.fromEntries(poems.map(p=>[p.id,p.title]));
const box=document.getElementById('tab');
box.innerHTML=`<div class="divider"><h2>Avaliações recebidas</h2></div>
${ratings.length?ratings.map(r=>`<div class="row"><div class="grow"><strong>${esc(names[r.poemId]||'Poema apagado')} · ${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</strong><small>${esc(r.name||'Anônimo')} · ${esc(r.date)}</small><div>${esc(r.text)}</div></div><button class="btn danger" data-rdel="${esc(r.id)}">Apagar</button></div>`).join(''):'<p class="empty">Nenhuma avaliação ainda.</p>'}`;
box.querySelectorAll('[data-rdel]').forEach(b=>b.addEventListener('click',async()=>{
if(!confirm('Apagar esta avaliação?'))return;
await api.deleteRating(b.dataset.rdel);
await ratingsTab();
}));
};

const render=async()=>{
shell();
try{
if(tab==='perfil')await profileTab();
else if(tab==='poemas')await poemsTab();
else await ratingsTab();
}catch(err){
document.getElementById('tab').innerHTML='<div class="msg err">Sem permissão ou sem conexão. Entre novamente com a conta correta.</div>';
}
};

api.watch(user=>{
if(user)render();
else loginView();
});
