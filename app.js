const TASKS=[
["SSF & Role Understanding","Understand Sathyam Smart Farm, SSF concept and your Project Executive responsibilities."],
["Soil & Land Assessment","Learn soil type, pH, EC, water quality and basic land assessment."],
["Crop Selection","Learn how soil, climate and water availability affect crop selection."],
["Drip Irrigation","Learn pump, filter, mainline, sub-main, lateral and emitter."],
["Fertigation & Fertilizer Basics","Learn NPK, fertigation and basic fertilizer concepts."],
["Farm Project Planning","Learn the complete flow from land assessment to project execution."],
["Irrigation Automation","Learn pumps, valves, timers, controllers and basic sensors."],
["Project Costing","Learn material cost, labour, transport, installation and margin."],
["Excel Skills","Practice SUM, IF, COUNTIF, VLOOKUP/XLOOKUP, filters and Pivot Tables."],
["Quotation & Presentation","Create a simple agriculture project quotation and presentation."],
["Customer Handling","Practice requirement gathering, listening and explaining solutions."],
["Sales & Negotiation","Practice lead, follow-up, proposal, negotiation and conversion."],
["Field Visit Skills","Practice site assessment, measurements, photos, Google Maps and notes."],
["Reporting & Communication","Practice daily reports, professional WhatsApp and email communication."],
["FINAL MOCK PROJECT","Complete farmer requirement → site assessment → irrigation plan → costing → quotation → report simulation."]
];

const KEY="jobMission15";
let state=JSON.parse(localStorage.getItem(KEY)||"null");

function pad(n){return String(n).padStart(2,"0")}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function startMission(){
  const d=new Date();
  d.setHours(0,0,0,0);
  state={start:d.toISOString(),done:[],missed:[],notified:{}};
  save();
}
if(!state) startMission();

function deadline(i){
  const d=new Date(state.start);
  d.setDate(d.getDate()+i);
  d.setHours(19,0,0,0); // Every task deadline = 7:00 PM
  return d;
}

function isUnlocked(i){
  return i===0 || state.done.includes(i-1);
}

function formatDeadline(d){
  return d.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"})+
  " • "+d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
}

function render(){
  const list=document.getElementById("taskList");
  list.innerHTML="";
  TASKS.forEach((t,i)=>{
    const d=deadline(i), done=state.done.includes(i), unlocked=isUnlocked(i);
    const overdue=!done && new Date()>=d;
    const el=document.createElement("section");
    el.className="task "+(done?"completed ":(unlocked?"active ":"locked"));
    let content="";
    if(done) content=`<div class="timer ok">✅ COMPLETED</div>`;
    else if(!unlocked) content=`<div class="lock">🔒 LOCKED</div><p>Complete Day ${i} first to unlock this task.</p>`;
    else content=`<div class="timer ${overdue?"overdue":""}" id="timer-${i}"></div>
      <button onclick="completeTask(${i})">MARK TASK COMPLETED</button>`;
    el.innerHTML=`<div class="day">DAY ${i+1} / 15</div><h2>${t[0]}</h2><p>${t[1]}</p>
      <div class="deadline">⏰ Deadline: ${formatDeadline(d)}</div>${content}`;
    list.appendChild(el);
  });
  updateStats();
  document.getElementById("completeScreen").hidden=state.done.length!==15;
  updateAlert();
}

function updateStats(){
  const done=state.done.length;
  const pct=Math.round(done/15*100);
  document.getElementById("done").textContent=done;
  document.getElementById("left").textContent=15-done;
  document.getElementById("missed").textContent=state.missed.length;
  document.getElementById("percent").textContent=pct+"%";
  document.getElementById("bar").style.width=pct+"%";
  let streak=0;
  for(let i=0;i<15;i++){if(state.done.includes(i))streak++;else break}
  document.getElementById("streak").textContent=streak;
}

function updateAlert(){
  const i=state.done.length;
  const box=document.getElementById("todayAlert");
  if(i>=15){box.innerHTML="";return}
  const d=deadline(i);
  if(new Date()>=d) box.innerHTML=`<div class="alert">🔴 DAY ${i+1} IS OVERDUE — COMPLETE IT NOW.</div>`;
  else box.innerHTML="";
}

function completeTask(i){
  if(!isUnlocked(i)){alert("🔒 Complete the previous task first.");return}
  if(state.done.includes(i))return;
  state.done.push(i);
  save();
  notify("TASK COMPLETED",`Day ${i+1}: ${TASKS[i][0]}`);
  render();
}

function tick(){
  TASKS.forEach((_,i)=>{
    const el=document.getElementById("timer-"+i);
    if(!el || state.done.includes(i) || !isUnlocked(i)) return;
    const diff=deadline(i)-new Date();
    if(diff<=0){el.textContent="⚠️ OVERDUE — COMPLETE NOW";el.classList.add("overdue");return}
    const s=Math.floor(diff/1000), d=Math.floor(s/86400), h=Math.floor(s%86400/3600), m=Math.floor(s%3600/60), sec=s%60;
    el.textContent=`${d}d ${pad(h)}h ${pad(m)}m ${pad(sec)}s`;
  });
  checkDeadlineNotifications();
  updateAlert();
}

function checkDeadlineNotifications(){
  if(!("Notification" in window) || Notification.permission!=="granted")return;
  const i=state.done.length;
  if(i>=15)return;
  const d=deadline(i);
  const key=`${i}-${d.getTime()}`;
  if(new Date()>=d && !state.notified[key]){
    notify("⚠️ JOB MISSION DEADLINE",`Day ${i+1}: ${TASKS[i][0]} is overdue. Complete it now.`);
    state.notified[key]=true; save();
  }
}

async function enableNotifications(){
  if(!("Notification" in window)){alert("This browser does not support notifications.");return}
  const p=await Notification.requestPermission();
  if(p==="granted"){
    notify("JOB MISSION 15","Notifications enabled. Your 7:00 PM deadline system is active.");
    document.getElementById("notifyBtn").textContent="✅ Notifications Enabled";
  }else alert("Notification permission was not granted.");
}

function notify(title,body){
  if("Notification" in window && Notification.permission==="granted")
    new Notification(title,{body,icon:"icon-192.png"});
}

document.getElementById("notifyBtn").onclick=enableNotifications;

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(console.error));
}

let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault(); deferredPrompt=e;
  document.getElementById("installBtn").hidden=false;
});
document.getElementById("installBtn").onclick=async()=>{
  if(!deferredPrompt)return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null;
  document.getElementById("installBtn").hidden=true;
};

render();
tick();
setInterval(tick,1000);
