/* Nyx AR · componentes visuales (Editorial TRAMA)
   - nyx-toon: sombreado tipo ilustración (cel shading) + contorno negro + ojos que brillan
   - nyx-sigilo: estrella-sigilo morada girando bajo Nyx
   - nyx-chispas: destellos cian flotando alrededor */

// Rampa de 3 tonos para el cel shading
function rampaToon(){
  const d=new Uint8Array([120,120,120,255, 190,190,190,255, 255,255,255,255]);
  const t=new THREE.DataTexture(d,3,1,THREE.RGBAFormat);
  t.minFilter=t.magFilter=THREE.NearestFilter; t.generateMipmaps=false; t.needsUpdate=true; return t;
}

AFRAME.registerComponent('nyx-toon',{
  init(){
    this.el.addEventListener('model-loaded',()=>{
      const rampa=rampaToon();
      this.el.getObject3D('mesh').traverse(o=>{
        if(!o.isMesh) return;
        const src=o.material, nombre=(src&&src.name)||'';
        let m;
        if(nombre==='NyxContorno'){
          m=new THREE.MeshBasicMaterial({color:'#0b0612',side:THREE.FrontSide}); // contorno original del modelo (malla invertida)
        }else if(nombre==='NyxOjos'){
          m=new THREE.MeshBasicMaterial({color:'#ff3df5'}); // brillo propio
        }else if(nombre.indexOf('NyxPlata')===0){
          m=new THREE.MeshToonMaterial({color:'#d9d9e4',gradientMap:rampa});
        }else{
          // cuerpo y alas: textura pintada a mano + sombreado por tonos
          m=new THREE.MeshToonMaterial({map:src.map||null,color:src.map?'#ffffff':src.color,gradientMap:rampa,
            side:nombre.indexOf('NyxAlas')===0?THREE.DoubleSide:THREE.FrontSide});
          m.emissive=new THREE.Color(nombre.indexOf('NyxAlas')===0?'#240a5c':'#120530');
          if(src.map){m.emissiveMap=src.map;}
        }
        o.material=m;
      });
    });
  }
});
function texturaCanvas(dibujar,tam){
  const c=document.createElement('canvas'); c.width=c.height=tam||512; dibujar(c.getContext('2d'),c.width);
  const t=new THREE.CanvasTexture(c); t.needsUpdate=true; return t;
}

AFRAME.registerComponent('nyx-sigilo',{
  init(){
    const tex=texturaCanvas((g,s)=>{
      const c=s/2; g.translate(c,c);
      const grad=g.createRadialGradient(0,0,s*.05,0,0,s*.5); grad.addColorStop(0,'rgba(140,60,255,.55)'); grad.addColorStop(1,'rgba(89,15,188,0)');
      g.fillStyle=grad; g.beginPath(); g.arc(0,0,s*.5,0,Math.PI*2); g.fill();
      g.strokeStyle='rgba(0,225,255,.95)'; g.lineWidth=s*.012; g.beginPath(); g.arc(0,0,s*.27,0,Math.PI*2); g.stroke();
      g.strokeStyle='rgba(0,225,255,.5)'; g.lineWidth=s*.006; g.beginPath(); g.arc(0,0,s*.36,0,Math.PI*2); g.stroke();
      g.fillStyle='rgba(170,110,255,.55)'; g.beginPath();
      const R=s*.4, r=s*.05;
      for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2, rr=i%2?r:R; g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);} g.closePath(); g.fill();
    });
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    this.el.setObject3D('mesh',m);
  },
  tick(t){ const m=this.el.getObject3D('mesh'); if(m) m.rotation.z=t/4000; }
});

AFRAME.registerComponent('nyx-chispas',{
  schema:{n:{default:14},radio:{default:0.55},alto:{default:1}},
  init(){
    const tex=texturaCanvas((g,s)=>{
      const c=s/2; g.translate(c,c); g.fillStyle='#fff'; g.shadowColor='#00E1FF'; g.shadowBlur=s*.12;
      g.beginPath(); g.moveTo(0,-c*.9); g.quadraticCurveTo(c*.08,-c*.08,c*.9,0); g.quadraticCurveTo(c*.08,c*.08,0,c*.9); g.quadraticCurveTo(-c*.08,c*.08,-c*.9,0); g.quadraticCurveTo(-c*.08,-c*.08,0,-c*.9); g.fill();
    },128);
    this.chispas=[];
    for(let i=0;i<this.data.n;i++){
      const mat=new THREE.SpriteMaterial({map:tex,color:i%3?'#00E1FF':'#ffffff',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
      const sp=new THREE.Sprite(mat); const s=0.04+Math.random()*0.06; sp.scale.set(s,s,s);
      sp.userData={a:Math.random()*Math.PI*2,v:0.2+Math.random()*0.5,h:Math.random()*this.data.alto,f:Math.random()*6,s};
      this.el.object3D.add(sp); this.chispas.push(sp);
    }
  },
  tick(t){
    const R=this.data.radio, A=this.data.alto;
    this.chispas.forEach(sp=>{const u=sp.userData; const a=u.a+t/1000*u.v*0.6;
      sp.position.set(Math.cos(a)*R*(0.7+0.3*Math.sin(u.f)), (u.h+t/1000*u.v*0.15)%A, Math.sin(a)*R*0.5);
      const k=0.5+0.5*Math.sin(t/300*u.v+u.f); sp.material.opacity=k; sp.scale.setScalar(u.s*(0.6+0.6*k));});
  }
});
