
/**
 * <x-3d-viewer>
 * Einfache Web Component als Wrapper für die iFrame-App.
 * Nutzung:
 *   <x-3d-viewer src="./viewer/index.html" model="./assets/bridge.glb" theme="light" lang="de" aspect="16/9"></x-3d-viewer>
 *
 * Du kannst danach per JS Methoden aufrufen:
 *   const el = document.querySelector('x-3d-viewer');
 *   el.focusNode('pfeiler_L'); el.setVisible('tragwerk', true);
 *
 * Events (bubbles):
 *   el.addEventListener('ready', (e)=>...);
 *   el.addEventListener('poi',   (e)=>...);
 */
class X3DViewer extends HTMLElement {
  static get observedAttributes() { return ['src','model','theme','lang','aspect']; }

  constructor(){
    super();
    this.attachShadow({mode:'open'});
    this._apiVersion = null;
    this._origin = '';

    const style = document.createElement('style');
    style.textContent = `
      :host{ display:block; }
      .wrap{ position:relative; width:100%; }
      .ratio::before{ content:""; display:block; padding-top:56.25%; }
      .frame{ position:absolute; inset:0; width:100%; height:100%; border:0; }
    `;
    this._wrap = document.createElement('div'); this._wrap.className = 'wrap ratio';
    this._iframe = document.createElement('iframe'); this._iframe.className = 'frame';
    this._iframe.setAttribute('loading','lazy');
    this._iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-pointer-lock allow-popups');
    this._iframe.setAttribute('allow','xr-spatial-tracking; fullscreen');
    this._wrap.appendChild(this._iframe);
    this.shadowRoot.append(style, this._wrap);

    this._onMessage = (ev)=>{
      if (this._origin && ev.origin !== this._origin) return;
      const data = ev.data || {};
      if (data.source !== 'viewer') return;
      if (data.type === 'ready') this._apiVersion = data.payload?.apiVersion || null;
      this.dispatchEvent(new CustomEvent(data.type, { detail: data.payload, bubbles:true }));
    };
  }

  connectedCallback(){
    window.addEventListener('message', this._onMessage);
    this._applySrc();
    if (this.hasAttribute('aspect')) this._setAspect(this.getAttribute('aspect'));
  }
  disconnectedCallback(){ window.removeEventListener('message', this._onMessage); }

  attributeChangedCallback(name, oldVal, newVal){
    if (oldVal === newVal) return;
    if (name === 'aspect') return this._setAspect(newVal);
    if (['src','model','theme','lang'].includes(name)) this._applySrc();
  }

  _setAspect(val){
    let ratio = 9/16;
    if (val?.includes('/')) {
      const [w,h] = val.split('/').map(Number);
      if (w>0 && h>0) ratio = h/w;
    } else {
      const f = parseFloat(val); if (!isNaN(f) && f>0) ratio = f;
    }
    this._wrap.querySelector('.ratio').style.paddingTop = (ratio*100)+'%';
  }

  _applySrc(){
    const base = this.getAttribute('src') || './viewer/index.html';
    const u = new URL(base, location.href);
    if (this.hasAttribute('model')) u.searchParams.set('model', this.getAttribute('model'));
    if (this.hasAttribute('theme')) u.searchParams.set('theme', this.getAttribute('theme'));
    if (this.hasAttribute('lang'))  u.searchParams.set('lang', this.getAttribute('lang'));
    this._origin = u.origin;
    this._iframe.src = u.toString();
  }

  _send(type, payload){ this._iframe?.contentWindow?.postMessage({type, payload}, this._origin || '*'); }
  // Neue generische API
  animateCamera(position, target, durationMs=800){ this._send('animateCamera', { position, target, durationMs }); }
  focus(selector, padding=1.3, durationMs=800){ this._send('focus', { selector, padding, durationMs }); }
  setVisibility(selector, visible=true){ this._send('setVisibility', { selector, visible }); }
  setOrbitEnabled(enabled){ this._send('setOrbitEnabled', { enabled }); }
  // Legacy (weiter verfügbar)
  setCamera(position, target, durationMs){ this._send('setCamera', { position, target, durationMs }); }
  setVisible(selector, visible=true){ this._send('setVisible', { selector, visible }); }
  enableOrbit(enabled){ this._send('enableOrbit', { enabled }); }
  focusNode(selector, padding=1.3){ this._send('focusNode', { selector, padding }); }
  playClip(name){ this._send('playClip', { name }); }

  get apiVersion(){ return this._apiVersion; }
}
customElements.define('x-3d-viewer', X3DViewer);
