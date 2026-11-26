import{T,LANGS,LOCALES}from'./i18n.js';

const view=document.getElementById('view');
const sel=document.getElementById('lang');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^\s*(javascript|data|vbscript):/i.test(String(u||''))?'#':String(u||'#');

let lang='';
try{lang=localStorage.getItem('cv_lang')||''}catch(e){}
if(!T[lang]){
const n=String(navigator.language||'').slice(0,2).toLowerCase();
lang=T[n]?n:'en';
}
let viewsN=null;

const t=(k,v={})=>String(T[lang][k]??T.pt[k]).replace(/\{(\w+)\}/g,(_,x)=>v[x]??'');
const hasTr=(o,f)=>lang!=='pt'&&!!(o.tr&&o.tr[lang]&&o.tr[lang][f]);
const pick=(o,f)=>hasTr(o,f)?o.tr[lang][f]:o[f];
const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
const fmtDate=d=>{
const [y,m,day]=String(d).split('-').map(Number);
return y&&m&&day?new Date(y,m-1,day).toLocaleDateString(LOCALES[lang]):'';
};
const bean='<svg><use href="#bean"/></svg>';
const cup=`<svg class="cup" viewBox="0 0 90 90" aria-hidden="true">
<g class="steam"><path d="M30 28c-6-6 6-10 0-18"/><path d="M45 28c-6-6 6-10 0-18"/><path d="M60 28c-6-6 6-10 0-18"/></g>
<path d="M14 36h50v22c0 14-10 24-25 24S14 72 14 58z" fill="#fffaf2" stroke="#4a2c1a" stroke-width="4"/>
<path d="M64 42h6a10 10 0 0 1 0 22h-8" fill="none" stroke="#4a2c1a" stroke-width="4"/>
<path d="M14 36h50" stroke="#4a2c1a" stroke-width="4"/>
<ellipse cx="39" cy="36" rx="25" ry="5" fill="#6f4a32"/>
<path d="M8 86h62" stroke="#4a2c1a" stroke-width="4" stroke-linecap="round"/>
</svg>`;
const stanzas=text=>String(text).split(/\n\s*\n/).map(s=>`<p>${s.split('\n').map(esc).join('<br>')}</p>`).join('');
const average=(list,id)=>{
const r=list.filter(x=>x.poemId===id);
if(!r.length)return null;
return{avg:r.reduce((a,b)=>a+b.stars,0)/r.length,count:r.length};
};

const paintViews=()=>{
const txt=viewsN==null?'':'☕ '+t(viewsN===1?'visitors_one':'visitors_many',{n:viewsN.toLocaleString(LOCALES[lang])});
document.querySelectorAll('.views').forEach(e=>{e.textContent=txt});
};

const profileHtml=p=>{
const avatar=p.photo?`<img src="${esc(safeUrl(p.photo))}" alt="${esc(p.name)}">`:esc((p.name||'?').trim().charAt(0).toUpperCase());
const links=(p.links||[]).map(l=>`<a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`).join('');
return`<section class="hero">
${cup}
<div class="avatar">${avatar}</div>
<div>
<h1>${esc(p.name)}</h1>
<div class="handle">${esc(p.handle)}</div>
<p class="bio">${esc(pick(p,'bio'))}</p>
<div class="links">${links}</div>
<div class="counter views"></div>
</div>
</section>`;
};

const menuHtml=poems=>{
if(!poems.length)return`<p class="empty">${esc(t('empty_poems'))}</p>`;
return`<ul class="menu">${poems.map((p,i)=>`<li><a href="#/poema/${esc(p.id)}"><span class="n">${i+1}.</span><span class="t">${esc(pick(p,'title'))}</span><span class="dots"></span><span class="d">${esc(fmtDate(p.date))}</span></a></li>`).join('')}</ul>`;
};

const reviewsHtml=(ratings,poems)=>{
if(!ratings.length)return`<p class="empty">${esc(t('no_reviews'))}</p>`;
const names=Object.fromEntries(poems.map(p=>[p.id,pick(p,'title')]));
return`<div class="reviews">${ratings.slice(0,8).map(r=>`<article class="review"><h4>${esc(names[r.poemId]||t('poem_fallback'))}</h4><div class="s" aria-label="${esc(t('stars_aria',{n:r.stars}))}">${stars(r.stars)}</div><p>${esc(r.text)}</p><small>— ${esc(r.name||t('anonymous'))}</small></article>`).join('')}</div>`;
};

const rateHtml=poems=>`<section class="rate" id="avaliar">
<form id="rateForm" novalidate>
<label class="f">${esc(t('which_poem'))}
<select id="rPoem" required>
<option value="">${esc(t('choose_poem'))}</option>
${poems.map(p=>`<option value="${esc(p.id)}">${esc(pick(p,'title'))}</option>`).join('')}
</select>
</label>
<div>
<span class="f" style="display:block;margin-bottom:6px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;font-size:.85rem;color:var(--coffee)">${esc(t('your_rating'))}</span>
<div class="stars" role="radiogroup" aria-label="${esc(t('your_rating'))}">
${[5,4,3,2,1].map(n=>`<input type="radio" name="stars" id="st${n}" value="${n}"><label for="st${n}" title="${esc(t('stars_aria',{n}))}">★</label>`).join('')}
</div>
</div>
<label class="f">${esc(t('name_opt'))}
<input type="text" id="rName" maxlength="40" autocomplete="nickname">
</label>
<label class="f">${esc(t('feedback'))}
<textarea id="rText" maxlength="600" required></textarea>
</label>
<button class="btn" type="submit">${esc(t('send'))}</button>
<div id="rMsg" role="status"></div>
</form>
<div id="reviewList"></div>
</section>`;

const home=async(preset,keep)=>{
const [profile,poems,ratings]=await Promise.all([DB.getProfile(),DB.getPoems(),DB.getRatings()]);
view.innerHTML=`${profileHtml(profile)}
<div class="divider">${bean}<h2>${esc(t('poems'))}</h2>${bean}</div>
<section class="board">
<div class="title">${esc(t('board'))}</div>
${menuHtml(poems)}
</section>
<div class="divider">${bean}<h2>${esc(t('rate_title'))}</h2>${bean}</div>
${rateHtml(poems)}`;
paintViews();
const list=document.getElementById('reviewList');
list.innerHTML=reviewsHtml(ratings,poems);
const sel2=document.getElementById('rPoem');
if(preset&&poems.some(p=>p.id===preset))sel2.value=preset;
const form=document.getElementById('rateForm');
const msg=document.getElementById('rMsg');
form.addEventListener('submit',async e=>{
e.preventDefault();
const poemId=sel2.value;
const chosen=form.querySelector('input[name=stars]:checked');
const text=document.getElementById('rText').value.trim();
const name=document.getElementById('rName').value.trim();
const fail=m=>{msg.className='msg err';msg.textContent=m};
if(!poemId)return fail(t('err_poem'));
if(!chosen)return fail(t('err_stars'));
if(text.length<3)return fail(t('err_text'));
try{
await DB.addRating({poemId,stars:Number(chosen.value),name,text});
form.reset();
msg.className='msg';
msg.textContent=t('thanks');
list.innerHTML=reviewsHtml(await DB.getRatings(),poems);
}catch(err){
fail(t('err_send'));
}
});
if(keep)return;
if(location.hash.startsWith('#/avaliar')){
document.getElementById('avaliar').scrollIntoView();
}else{
window.scrollTo(0,0);
}
};

const poemPage=async(id,keep)=>{
const [poem,ratings]=await Promise.all([DB.getPoem(id),DB.getRatings()]);
if(!poem){
view.innerHTML=`<a class="back" href="#/">${esc(t('back'))}</a><div class="msg">${esc(t('not_found'))}</div>`;
return;
}
const a=average(ratings,poem.id);
const notes=pick(poem,'notes');
const avgText=a?`<span class="s">${stars(Math.round(a.avg))}</span><br>${esc(t('of_five',{a:a.avg.toLocaleString(LOCALES[lang],{minimumFractionDigits:1,maximumFractionDigits:1})}))} · ${esc(t(a.count>1?'rating_many':'rating_one',{n:a.count}))}`:esc(t('no_ratings'));
view.innerHTML=`<a class="back" href="#/">${esc(t('back_menu'))}</a>
<article class="sheet">
<h1>${esc(pick(poem,'title'))}</h1>
<div class="meta">${esc(fmtDate(poem.date))}</div>
<div class="orn" aria-hidden="true">${bean}${bean}${bean}</div>
${hasTr(poem,'text')?`<div class="tnote">${esc(t('auto_tr'))}</div>`:''}
<div class="poem">${stanzas(pick(poem,'text'))}</div>
${notes?`<aside class="note"><h3>${esc(t('notes'))}</h3><p>${esc(notes)}</p></aside>`:''}
<div class="avg">${avgText}</div>
<div class="cta"><a class="btn" href="#/avaliar/${esc(poem.id)}">${esc(t('rate_this'))}</a></div>
</article>`;
if(!keep)window.scrollTo(0,0);
};

const route=async keep=>{
const parts=location.hash.split('/');
try{
if(parts[1]==='poema')return await poemPage(decodeURIComponent(parts[2]||''),keep);
return await home(parts[1]==='avaliar'?decodeURIComponent(parts[2]||''):'',keep);
}catch(err){
view.innerHTML=`<div class="msg err">${esc(t('load_error'))}</div>`;
}
};

const applyStatic=()=>{
document.documentElement.lang=LOCALES[lang];
document.getElementById('navHome').textContent=t('nav_home');
document.getElementById('navRate').textContent=t('nav_rate');
document.getElementById('langLbl').textContent=t('lang');
document.getElementById('footTxt').textContent=t('footer');
sel.innerHTML=LANGS.map(([c,n])=>`<option value="${c}"${c===lang?' selected':''}>${n}</option>`).join('');
sel.setAttribute('aria-label',t('lang'));
paintViews();
};

sel.addEventListener('change',()=>{
lang=sel.value;
try{localStorage.setItem('cv_lang',lang)}catch(e){}
applyStatic();
route(true);
});

window.addEventListener('hashchange',()=>route(false));
applyStatic();
route(false);
DB.countView().then(n=>{
viewsN=n;
paintViews();
}).catch(()=>{});
