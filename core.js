import{initializeApp}from'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import{getFirestore,collection,doc,getDoc,getDocs,addDoc,setDoc,deleteDoc,query,orderBy,serverTimestamp,increment}from'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import{getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import{firebaseConfig}from'./config.js';

const app=initializeApp(firebaseConfig);
const db=getFirestore(app);
const auth=getAuth(app);

const defaultProfile={
name:'Seu Nome',
handle:'@seuusuario',
bio:'Escrevo versos entre um gole e outro de café.',
photo:'',
links:[]
};

const day=ts=>{
const d=ts&&ts.toDate?ts.toDate():new Date();
return d.toISOString().slice(0,10);
};

export const api={
async getProfile(){
const snap=await getDoc(doc(db,'site','profile'));
return snap.exists()?{...defaultProfile,...snap.data()}:defaultProfile;
},
async getPoems(){
const snap=await getDocs(query(collection(db,'poems'),orderBy('date','desc')));
return snap.docs.map(d=>({id:d.id,...d.data()}));
},
async getPoem(id){
if(!id)return null;
const snap=await getDoc(doc(db,'poems',id));
return snap.exists()?{id:snap.id,...snap.data()}:null;
},
async getRatings(){
const snap=await getDocs(query(collection(db,'ratings'),orderBy('createdAt','desc')));
return snap.docs.map(d=>{
const x=d.data();
return{id:d.id,poemId:x.poemId,stars:x.stars,name:x.name,text:x.text,date:day(x.createdAt)};
});
},
async addRating(r){
await addDoc(collection(db,'ratings'),{
poemId:String(r.poemId),
stars:Number(r.stars),
name:String(r.name||'').slice(0,40),
text:String(r.text).slice(0,600),
createdAt:serverTimestamp()
});
},
async countView(){
const ref=doc(db,'site','stats');
let seen=false;
try{seen=localStorage.getItem('cv_seen')==='1'}catch(e){}
if(!seen){
try{
await setDoc(ref,{views:increment(1)},{merge:true});
try{localStorage.setItem('cv_seen','1')}catch(e){}
}catch(e){}
}
const snap=await getDoc(ref);
return snap.exists()?Number(snap.data().views)||0:0;
},
user:()=>auth.currentUser,
login:(email,pass)=>signInWithEmailAndPassword(auth,email,pass),
logout:()=>signOut(auth),
watch:cb=>onAuthStateChanged(auth,cb),
saveProfile:data=>setDoc(doc(db,'site','profile'),data),
async savePoem(id,data){
if(id){
await setDoc(doc(db,'poems',id),data);
return id;
}
const ref=await addDoc(collection(db,'poems'),data);
return ref.id;
},
deletePoem:id=>deleteDoc(doc(db,'poems',id)),
deleteRating:id=>deleteDoc(doc(db,'ratings',id))
};
