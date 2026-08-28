
const data = {
  keylit:{gen:"GEN 0",title:"KEYLIT",dna:100,traits:[
    ["MIDI Engine","origin"],["Lesson Engine","origin"],["WebMCP","origin"],["AI Teacher","origin"]
  ],memory:"Created the original piano-learning genome and capability map."},
  kids:{gen:"GEN 1",title:"KEYLIT Kids",dna:82,traits:[
    ["MIDI Engine","inherited"],["Lesson Engine","mutated"],["Gamification","new gene"],["AI Teacher","mutated"]
  ],memory:"Discovered that dual-note previews improve beginner confidence."},
  studio:{gen:"GEN 1",title:"KEYLIT Studio",dna:76,traits:[
    ["Audio Engine","inherited"],["MIDI Engine","inherited"],["Composition","new gene"],["Generator","new gene"]
  ],memory:"Developed lower-latency accompaniment scheduling."},
  access:{gen:"GEN 1",title:"Accessible",dna:79,traits:[
    ["Core Piano","inherited"],["Voice Nav","new gene"],["Contrast","mutated"],["Lesson Pace","mutated"]
  ],memory:"Learned to dynamically reduce visual complexity based on interaction patterns."},
  quechua:{gen:"GEN 2",title:"Quechua",dna:61,traits:[
    ["Kids Core","inherited"],["Quechua Tutor","new gene"],["Cultural Lessons","new gene"],["MIDI Engine","ancestor"]
  ],memory:"Localized pedagogy without changing the inherited piano engine."},
  autism:{gen:"GEN 2",title:"Sensory Mode",dna:64,traits:[
    ["Kids Core","inherited"],["Sensory UI","new gene"],["Adaptive Pace","mutated"],["Audio Cues","mutated"]
  ],memory:"Found a calmer visual feedback pattern that may benefit other beginner branches."},
  robot:{gen:"GEN 2",title:"Teacher Bot",dna:55,traits:[
    ["AI Teacher","ancestor"],["Vision","new gene"],["Embodiment","new gene"],["Lesson Engine","inherited"]
  ],memory:"First embodied descendant. Shares physical interaction discoveries upstream."},
  school:{gen:"GEN 2",title:"Classroom",dna:58,traits:[
    ["Lesson Engine","ancestor"],["Teacher Dashboard","new gene"],["Fleet Memory","new gene"],["Analytics","mutated"]
  ],memory:"Learns from many students while preserving each child's local adaptations."}
};

const nodes = [...document.querySelectorAll(".node")];
const title = document.getElementById("inspectorTitle");
const gen = document.getElementById("inspectorGen");
const score = document.getElementById("dnaScore");
const traits = document.getElementById("traitList");
const memory = document.getElementById("agentMemory");

function select(id){
  const d=data[id];
  nodes.forEach(n=>n.classList.toggle("selected",n.dataset.id===id));
  title.textContent=d.title; gen.textContent=d.gen; score.textContent=d.dna;
  memory.textContent=d.memory;
  traits.innerHTML=d.traits.map(([a,b])=>`<div class="trait"><span>${a}</span><span>${b}</span></div>`).join("");
}
nodes.forEach(n=>n.addEventListener("click",()=>select(n.dataset.id)));
select("keylit");

document.getElementById("evolveBtn").addEventListener("click",()=>{
  const tree=document.getElementById("tree");
  tree.classList.remove("evolving");
  void tree.offsetWidth;
  tree.classList.add("evolving");
  setTimeout(()=>select("robot"),700);
});
document.getElementById("exploreBtn").addEventListener("click",()=>document.getElementById("lineage").scrollIntoView());
document.getElementById("dnaBtn").addEventListener("click",()=>document.getElementById("genome").scrollIntoView());
document.getElementById("waitlistForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const msg=document.getElementById("formMsg");
  msg.textContent="✓ Saved locally for this prototype. Next step: connect a real backend.";
  msg.style.color="var(--acid)";
});
