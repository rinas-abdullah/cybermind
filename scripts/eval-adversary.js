// Reproducible evaluation of the Rasd adversary engine (no learners involved).
// Usage: node scripts/eval-adversary.js
// Runs 15,000 simulated defense sessions (fixed seed) against the adversary engine
// with three defender policies: informed (always deploys a real counter), mixed
// (50% counter, 50% random) and random. Reports attack-path diversity, defenses
// needed to contain, share of ineffective defenses and decision latency.
const path=process.argv[2]||require('path').join(__dirname,'..');
const engine=require(path+'/backend/services/adversaryEngine.js');
const src=require('fs').readFileSync(path+'/backend/services/adversaryEngine.js','utf8');
const DEF=engine.getDefenseCatalog().map(d=>d.id);
// deterministic PRNG so results are reproducible
let seed=20261119; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
const pick=a=>a[Math.floor(rnd()*a.length)];
// counters per move, read from engine internals via a probe session
function counters(moveId){ // which defenses neutralize this move, found by probing
  return DEF.filter(d=>{const s=engine.startSession('probe');const st=engine.sessions.get(s.sessionId);st.currentMoveId=moveId;st.attemptedMoveIds=new Set([moveId]);const r=engine.applyDefense(s.sessionId,d);engine.sessions.delete(s.sessionId);return r.neutralized;});
}
function run(policy,N){
  const paths=new Map(), movesSeen=new Set(), mitreSeen=new Set(), stepsArr=[], wasted=[], movesPerRun=[], stagesPerRun=[]; let contained=0, latency=0, calls=0, reactive=0;
  for(let i=0;i<N;i++){
    const s=engine.startSession('eval'); let m=s.move; const seq=[m.id]; const cats=new Set([m.category]); movesSeen.add(m.id); mitreSeen.add(m.mitre);
    let steps=0, w=0, done=false; const used=new Set();
    while(!done && steps<60){
      let d;
      if(policy==='random') d=pick(DEF);
      else if(policy==='informed'){ const c=counters(m.id).filter(x=>!used.has(x)); d=c.length?pick(c):pick(DEF); }
      else if(policy==='mixed'){ d = rnd()<0.5 ? pick(DEF) : (()=>{const c=counters(m.id);return pick(c);})(); }
      used.add(d);
      const t0=process.hrtime.bigint(); const r=engine.applyDefense(s.sessionId,d); latency+=Number(process.hrtime.bigint()-t0); calls++;
      steps++;
      if(!r.neutralized) w++;
      if(r.contained){done=true;contained++;break;}
      if(r.neutralized && r.move){ if(r.move.id!==m.id){ m=r.move; seq.push(m.id); cats.add(m.category); movesSeen.add(m.id); mitreSeen.add(m.mitre);} }
    }
    engine.sessions.delete(s.sessionId);
    const k=seq.join('>'); paths.set(k,(paths.get(k)||0)+1);
    stepsArr.push(steps); wasted.push(w/steps); movesPerRun.push(seq.length); stagesPerRun.push(cats.size);
  }
  const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
  return {policy,runs:N,containmentRate:contained/N,distinctAttackPaths:paths.size,distinctMovesSeen:movesSeen.size,mitreTechniquesSeen:[...mitreSeen].sort(),avgDefensesToContain:+avg(stepsArr).toFixed(2),avgIneffectiveDefenseShare:+avg(wasted).toFixed(3),avgAttackMovesPerRun:+avg(movesPerRun).toFixed(2),avgAttackStagesPerRun:+avg(stagesPerRun).toFixed(2),meanDecisionLatencyMicroseconds:+(latency/calls/1000).toFixed(1)};
}
const out={engineMoves:(src.match(/mitre: "T\d+"/g)||[]).length, defenses:DEF.length, results:[run('informed',5000),run('mixed',5000),run('random',5000)]};
console.log(JSON.stringify(out,null,1));
