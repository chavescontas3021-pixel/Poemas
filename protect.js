(()=>{
const style=document.createElement('style');
style.textContent='.sheet,.menu,.hero{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}@media print{body *{display:none!important}}';
document.head.appendChild(style);
const editable=t=>t&&t.closest&&t.closest('input,textarea,select');
document.addEventListener('contextmenu',e=>{
if(!editable(e.target))e.preventDefault();
});
['copy','cut'].forEach(n=>document.addEventListener(n,e=>{
if(!editable(document.activeElement))e.preventDefault();
}));
document.addEventListener('dragstart',e=>e.preventDefault());
document.addEventListener('keydown',e=>{
const k=String(e.key).toLowerCase();
const mod=e.ctrlKey||e.metaKey;
if(k==='f12'||(mod&&e.shiftKey&&['i','j','c'].includes(k))||(mod&&['u','s','p'].includes(k))){
e.preventDefault();
}
});
})();
