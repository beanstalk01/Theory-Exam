
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={
  pool:[], index:0, answers:[], start:0, timerId:null, seconds:0, target:75,
  sound:localStorage.getItem('rr_sound')!=='off',
  stats:JSON.parse(localStorage.getItem('rr_stats')||'{"answered":0,"correct":0,"best":0,"mistakes":[],"bookmarks":[]}')
};
const icons={"Road Signs":"⚠️","Road Markings":"➖","Junctions & Priority":"🔄","Safe Driving":"🛡️","Speed & Space":"🏁","Weather & Hazards":"🌫️","Motorways":"🛣️","Vehicle Safety":"🔧","Parking":"🅿️","Driver Behaviour":"🧠","Signals & Lights":"🚦","Abu Dhabi Awareness":"🏙️","Hazard Perception":"👁️"};
function save(){localStorage.setItem('rr_stats',JSON.stringify(state.stats)); updateDashboard()}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function show(id){$$('.view').forEach(v=>v.classList.remove('active')); $('#'+id).classList.add('active'); scrollTo(0,0)}
function beep(ok){if(!state.sound)return; try{const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=ok?650:210;g.gain.value=.045;o.start();o.stop(c.currentTime+.09)}catch{}}
function updateDashboard(){
 const s=state.stats, acc=s.answered?Math.round(s.correct/s.answered*100):0;
 $('#bestScore').textContent=s.best+'%'; $('#answeredCount').textContent=s.answered; $('#accuracy').textContent=acc+'%';
 $('#mistakeCount').textContent=s.mistakes.length+' saved question'+(s.mistakes.length===1?'':'s');
}
function buildCategories(){
 const cats=[...new Set(QUESTIONS.map(q=>q.cat))];
 $('#categoryList').innerHTML=cats.map(c=>`<button class="category card" data-cat="${c}"><span class="cat-icon">${icons[c]||'📘'}</span><span class="grow"><b>${c}</b><small>${QUESTIONS.filter(q=>q.cat===c).length} questions</small></span><span>→</span></button>`).join('');
 $$('.category').forEach(b=>b.onclick=()=>startQuiz(shuffle(QUESTIONS.filter(q=>q.cat===b.dataset.cat)),false,c=>c,0));
}
function startQuiz(pool,timed=false,label='PRACTICE',mins=0,target=75){
 if(!pool.length){alert('No saved mistakes yet. Complete a practice set first.');return}
 clearInterval(state.timerId); state.pool=pool;state.index=0;state.answers=[];state.start=Date.now();state.target=target;
 $('#quizMode').textContent=typeof label==='function'?label():label; state.seconds=mins*60;
 $('#timer').textContent=timed?formatTime(state.seconds):'--:--';
 if(timed) state.timerId=setInterval(()=>{state.seconds--;$('#timer').textContent=formatTime(state.seconds);if(state.seconds<=0)finish()},1000);
 show('quiz'); renderQuestion();
}
function renderQuestion(){
 const q=state.pool[state.index]; if(!q)return finish();
 $('#counter').textContent=`${state.index+1} / ${state.pool.length}`;
 $('#progressBar').style.width=`${state.index/state.pool.length*100}%`;
 $('#categoryPill').textContent=q.cat; $('#questionText').textContent=q.q;
 $('#explanation').classList.add('hidden'); $('#nextBtn').classList.add('hidden');
 const saved=state.stats.bookmarks.includes(q.id);$('#bookmarkBtn').textContent=saved?'★':'☆';
 $('#options').innerHTML=q.options.map((o,i)=>`<button class="option" data-i="${i}"><span class="letter">${'ABCD'[i]}</span><span>${o}</span></button>`).join('');
 $$('.option').forEach(b=>b.onclick=()=>answer(+b.dataset.i));
}
function answer(i){
 const q=state.pool[state.index], ok=i===q.answer;
 state.answers.push({id:q.id,selected:i,correct:ok});state.stats.answered++; if(ok)state.stats.correct++;
 if(!ok && !state.stats.mistakes.includes(q.id))state.stats.mistakes.push(q.id);
 if(ok)state.stats.mistakes=state.stats.mistakes.filter(id=>id!==q.id);
 $$('.option').forEach((b,n)=>{b.disabled=true;if(n===q.answer)b.classList.add('correct');if(n===i&&!ok)b.classList.add('wrong')});
 $('#explanation').innerHTML=`<b>${ok?'Correct':'Correct answer: '+q.options[q.answer]}</b><br>${q.why}`;
 $('#explanation').classList.remove('hidden');$('#nextBtn').classList.remove('hidden');beep(ok);save();
}
function finish(){
 clearInterval(state.timerId); if(!state.pool.length)return;
 const correct=state.answers.filter(a=>a.correct).length, total=state.pool.length, pct=Math.round(correct/total*100), elapsed=Math.max(1,Math.round((Date.now()-state.start)/1000));
 state.stats.best=Math.max(state.stats.best,pct);save();
 $('#resultPct').textContent=pct+'%';$('#resultRing').style.background=`conic-gradient(var(--teal) ${pct}%,rgba(255,255,255,.08) 0)`;
 $('#resultTitle').textContent=pct>=state.target?'Ready for the next challenge':'Keep building confidence';
 $('#resultText').textContent=pct>=state.target?`You reached your ${state.target}% practice target.`:`Review the explanations and repeat your weaker topics.`;
 $('#correctStat').textContent=correct;$('#wrongStat').textContent=total-correct;$('#timeStat').textContent=formatTime(elapsed);
 const wrong=state.answers.filter(a=>!a.correct).map(a=>({a,q:QUESTIONS.find(q=>q.id===a.id)}));
 $('#reviewList').innerHTML=wrong.length?'<h2>Review this session</h2>'+wrong.map(({a,q})=>`<article class="review-item card"><b>${q.q}</b><p>Your answer: ${q.options[a.selected]}</p><p class="answer">Correct: ${q.options[q.answer]}</p><p>${q.why}</p></article>`).join(''):'';
 show('results');
}
function formatTime(s){s=Math.max(0,s);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
$('#quickStart').onclick=()=>startQuiz(shuffle(QUESTIONS).slice(0,10),false,'QUICK PRACTICE');
$$('.mode').forEach(b=>b.onclick=()=>{
 const m=b.dataset.mode;
 if(m==='sets')showExamSets();
 if(m==='practice')startQuiz(shuffle(QUESTIONS).slice(0,10),false,'QUICK PRACTICE');
 if(m==='mock')show('setup');
 if(m==='category')show('categories');
 if(m==='mistakes')startQuiz(shuffle(QUESTIONS.filter(q=>state.stats.mistakes.includes(q.id))),false,'MISTAKE REVIEW');
});
$$('[data-view]').forEach(b=>b.onclick=()=>show(b.dataset.view));
$('#qCount').oninput=e=>$('#qCountOut').textContent=e.target.value;
$('#timeLimit').oninput=e=>$('#timeOut').textContent=e.target.value+' min';
$('#targetScore').oninput=e=>$('#targetOut').textContent=e.target.value+'%';
$('#startMock').onclick=()=>startQuiz(shuffle(QUESTIONS).slice(0,+45),true,'MOCK EXAM',30,80);
$('#nextBtn').onclick=()=>{state.index++;state.index>=state.pool.length?finish():renderQuestion()};
$('#quitQuiz').onclick=()=>{clearInterval(state.timerId);if(confirm('End this session?'))finish()};
$('#retryBtn').onclick=()=>startQuiz(shuffle(QUESTIONS).slice(0,10),false,'QUICK PRACTICE');
$('#bookmarkBtn').onclick=()=>{const id=state.pool[state.index].id,a=state.stats.bookmarks;a.includes(id)?state.stats.bookmarks=a.filter(x=>x!==id):a.push(id);save();renderQuestion()};
$('#soundBtn').onclick=()=>{state.sound=!state.sound;localStorage.setItem('rr_sound',state.sound?'on':'off');$('#soundBtn').textContent=state.sound?'🔊':'🔇'};
$('#soundBtn').textContent=state.sound?'🔊':'🔇';
buildCategories();updateDashboard();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');

function signSVG(t){
 if(t==='stop')return '<svg viewBox="0 0 200 200"><polygon points="60,18 140,18 182,60 182,140 140,182 60,182 18,140 18,60" fill="#e63946" stroke="white" stroke-width="8"/><text x="100" y="116" text-anchor="middle" fill="white" font-size="43" font-weight="900">STOP</text></svg>';
 if(t==='noentry')return '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="78" fill="#e63946" stroke="white" stroke-width="7"/><rect x="38" y="84" width="124" height="32" rx="4" fill="white"/></svg>';
 if(t==='giveway')return '<svg viewBox="0 0 200 200"><polygon points="100,180 18,35 182,35" fill="white" stroke="#e63946" stroke-width="13"/></svg>';
 if(t==='speed')return '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="78" fill="white" stroke="#e63946" stroke-width="12"/><text x="100" y="122" text-anchor="middle" fill="#111" font-size="64" font-weight="800">60</text></svg>';
 if(t==='parking')return '<svg viewBox="0 0 200 200"><rect x="20" y="20" width="160" height="160" rx="10" fill="#0877b9"/><text x="100" y="145" text-anchor="middle" fill="white" font-size="125" font-weight="800">P</text></svg>';
 if(t==='mandatory')return '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="78" fill="#0877b9" stroke="white" stroke-width="7"/><path d="M100 150V55m-28 28 28-28 28 28" fill="none" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 if(t==='slippery')return '<svg viewBox="0 0 200 200"><polygon points="100,15 187,170 13,170" fill="white" stroke="#e63946" stroke-width="12"/><text x="100" y="135" text-anchor="middle" font-size="70">〰</text></svg>';
 return '<svg viewBox="0 0 200 200"><polygon points="100,15 187,170 13,170" fill="white" stroke="#e63946" stroke-width="12"/><text x="100" y="135" text-anchor="middle" font-size="70">!</text></svg>';
}
const oldRenderQuestion=renderQuestion;
renderQuestion=function(){oldRenderQuestion();const q=state.pool[state.index];const old=document.querySelector('.sign-visual');if(old)old.remove();if(q.sign){const d=document.createElement('div');d.className='sign-visual';d.innerHTML=signSVG(q.sign);document.querySelector('#questionText').before(d)}};
function seededSet(n){const arr=[...QUESTIONS].sort((a,b)=>((a.id*17+n*31)%211)-((b.id*17+n*31)%211));const signs=arr.filter(q=>q.sign).slice(0,10),situ=arr.filter(q=>q.situational&&!q.sign).slice(0,10),gen=arr.filter(q=>!q.sign&&!q.situational).slice(0,25);return shuffle([...signs,...situ,...gen]);}
function showExamSets(){show('categories');document.querySelector('#categories .eyebrow').textContent='FULL EXAM SIMULATION';document.querySelector('#categories h1').textContent='Choose an exam set';document.querySelector('#categoryList').innerHTML=Array.from({length:8},(_,i)=>`<button class="category card examset" data-set="${i}"><span class="cat-icon">📋</span><span class="grow"><b>Mock Exam ${i+1}</b><small>45 questions • 30 minutes • 36 to pass</small></span><span>→</span></button>`).join('');document.querySelectorAll('.examset').forEach(b=>b.onclick=()=>startQuiz(seededSet(+b.dataset.set),true,`MOCK EXAM ${+b.dataset.set+1}`,30,80));}
