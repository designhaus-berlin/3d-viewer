
# 3D Viewer – Dokumentation

Iframe-basierter 3D-Viewer auf Basis von Three.js. Wird in eine Host-Seite eingebettet
und vollständig per `postMessage`-API gesteuert.

> **Kein 3D-Modell nötig zum Starten:** Ohne `?model=...` erscheint ein Demo-Modell
> (eine kleine Brücke), an der du alle API-Funktionen sofort ausprobieren kannst.

---

## Inhaltsverzeichnis

1. [Einbettung (iframe)](#einbettung)
2. [URL-Parameter](#url-parameter)
3. [API: Host → Viewer](#api-host--viewer)
   - [animateCamera](#animatecamera)
   - [focus](#focus)
   - [setVisibility](#setvisibility)
   - [setOrbitEnabled](#setorbitenabled)
   - [setAnimationEnabled](#setanimationenabled)
   - [setHover](#sethover)
4. [Events: Viewer → Host](#events-viewer--host)
5. [Selektor-Syntax](#selektor-syntax)
6. [Debug-GUI](#debug-gui)
7. [Blender: viewerPivot setzen](#blender-viewerpivot)

---

## Einbettung

```html
<iframe
  id="viewer"
  src="/viewer/index.html?model=../assets/mein-modell.glb&theme=dark"
  allow="xr-spatial-tracking; fullscreen"
  sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
  referrerpolicy="no-referrer">
</iframe>
```

### Nachrichten senden

```js
const iframe = document.getElementById('viewer');

function send(type, payload) {
  iframe.contentWindow.postMessage({ type, payload }, '*');
  // In Produktion statt '*' den konkreten Origin angeben:
  // iframe.contentWindow.postMessage({ type, payload }, 'https://meine-domain.de');
}
```

---

## URL-Parameter

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|---------|--------------|
| `model` | String | – | Pfad zur `.glb`-Datei. Ohne Angabe: Demo-Modell (Brücke). |
| `theme` | `dark` / `light` | `dark` | Hintergrundfarbe |
| `lang` | String | `de` | Sprache (für zukünftige Erweiterungen) |
| `gui` | `1` | – | Debug-GUI einblenden |
| `anim` | `0` / `1` | auto | Animationen erzwingen an (`1`) oder aus (`0`). Standard: `prefers-reduced-motion` |
| `arcLift` | Float | `0.4` | Bogenhöhe pro Radiant Winkelunterschied (0 = flach, 1 = steil) |
| `arcMax` | Float | `1.0` | Maximale Bogenhöhe in Radiant (1.0 ≈ 57°) |
| `arcSafe` | Float | `0.0` | BoundingSphere-Faktor als Mindestabstand (0 = aus, 0.85 = kompaktes Modell) |
| `canvasHover` | `0` / `1` | `1` | Canvas-Hover deaktivieren (`0`) — sinnvoll wenn der Host das Highlight per `setHover` steuert |
| `camPos` | `x,y,z` | – | Start-Kameraposition |
| `camTar` | `x,y,z` | – | Start-Kamera-Target |
| `fov` | Number | `50` | Kamera-FOV in Grad |
| `camMinY` | Number | – | Minimale Kamerahöhe (world-space Y). Kamera kann nicht tiefer gehen. |
| `camMaxY` | Number | – | Maximale Kamerahöhe (world-space Y). Kamera kann nicht höher steigen. |

**Beispiele:**

```
?model=../assets/car.glb&gui=1
?model=../assets/bridge.glb&arcLift=0.3&arcMax=0.8
?model=../assets/car.glb&anim=0
?camPos=0,5,15&camTar=0,2,0&fov=45
```

---

## API: Host → Viewer

Alle Befehle werden per `send(type, payload)` gesendet.

---

### `animateCamera`

Kamerafahrt mit **Bogenschwung** zu exakten Koordinaten — fährt nicht durch das Modell.
Ideal für feste Ansichten, deren Koordinaten aus der Debug-GUI kopiert wurden.

```js
send('animateCamera', {
  position:   { x: 0.37, y: 3.45, z: 15.96 },
  target:     { x: 0.26, y: 2.73, z: 0.00 },
  durationMs: 1200   // optional, Standard: 800
});
```

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `position` | ja | Ziel-Kameraposition |
| `target` | nein | Blickpunkt (Standard: aktuelles Target bleibt) |
| `durationMs` | nein | Animationsdauer in ms |

> **Tipp:** Debug-GUI öffnen (`?gui=1`), Kamera manuell einstellen, dann
> **Actions → 🔲 Copy Button JS** klicken → fertiges JS-Snippet im Clipboard.

---

### `focus`

Schwenkt die Kamera mit einem **Bogenschwung** auf ein 3D-Element.
Die Kamera fährt außen am Modell entlang — kein Durchfahren durch Geometrie.

**Variante 1 – Automatisch (padding-basiert)**

Abstand wird anhand der Bounding-Box des Objekts und des `padding`-Faktors
automatisch berechnet. Kameraperspektive zeigt immer von außen auf das Objekt.

```js
send('focus', {
  selector:   'wheel1',  // Objekt-Name, ID, Tag oder Alias (siehe Selektor-Syntax)
  padding:    1.6,       // Abstandsfaktor — größer = weiter weg (Standard: 1.3)
  durationMs: 1000
});
```

**Variante 2 – Exakte Kameraposition**

```js
send('focus', {
  selector:   'wheel1',
  position:   { x: 2.1, y: 3.5, z: 8.4 },  // exakte Kameraposition
  durationMs: 1000
  // target = automatisch Objekt-Mittelpunkt
});
```

**Variante 3 – Position + Target vollständig manuell**

```js
send('focus', {
  selector:   'wheel1',
  position:   { x: 2.1, y: 3.5, z:  8.4 },
  target:     { x: -1.2, y: 0.3, z: 0.0 },
  durationMs: 1000
});
```

**Sonderselektor `'all'`** – fokussiert das gesamte Modell:

```js
send('focus', { selector: 'all', padding: 1.35, durationMs: 1200 });
```

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `selector` | ja | Zielobjekt (siehe [Selektor-Syntax](#selektor-syntax)) |
| `padding` | nein | Abstandsfaktor. Wird ignoriert wenn `position` angegeben. |
| `position` | nein | Exakte Kameraposition. Überschreibt padding-Berechnung. |
| `target` | nein | Exakter Blickpunkt. Standard: Mittelpunkt des Zielobjekts. |
| `durationMs` | nein | Animationsdauer in ms |

---

### `setVisibility`

Blendet Objekte ein oder aus.

```js
// Einzelnes Objekt ausblenden
send('setVisibility', { selector: 'wheel1', visible: false });

// Alle einblenden
send('setVisibility', { selector: 'all', visible: true });

// Mehrere auf einmal
['wheel1','wheel2','wheel3','wheel4'].forEach(w =>
  send('setVisibility', { selector: w, visible: false })
);
```

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `selector` | ja | Selektor oder `'all'` |
| `visible` | nein | `true` / `false` (Standard: `true`) |

---

### `setOrbitEnabled`

Aktiviert oder deaktiviert die Orbit-Steuerung (Maus/Touch-Rotation/Zoom).

```js
send('setOrbitEnabled', { enabled: false });  // Orbit sperren
send('setOrbitEnabled', { enabled: true });   // Orbit freigeben
```

---

### `setAnimationEnabled`

Schaltet Kamera-Animationen ein oder aus (Barrierefreiheit).
Bei `false` springen alle Kamerafahrten sofort ans Ziel — ohne Übergang.

```js
send('setAnimationEnabled', { enabled: false });
send('setAnimationEnabled', { enabled: true });
```

> **Automatisches Verhalten:** Der Viewer liest beim Start `prefers-reduced-motion`
> des Betriebssystems aus. Nutzer mit aktiviertem Reduzierungsmodus bekommen
> keine Animationen. Überschreibbar per `?anim=0` / `?anim=1`.

---

### `setHover`

Hebt ein 3D-Element visuell hervor (blauer Emissive-Glow) — ausgelöst vom Host,
z.B. beim Mouseover über einen Button. Betrifft alle Meshes des Objekts.

```js
// Element hervorheben
send('setHover', { selector: 'wheel1' });

// Highlight entfernen
send('setHover', { selector: null });
```

**Empfohlenes Muster — automatische Verdrahtung per `data-selector`:**

```html
<!-- data-selector auf den Buttons setzen -->
<button data-selector="wheel1">Vorne links</button>
<button data-selector="wheel2">Vorne rechts</button>
<button data-selector="Pfeiler_L">Pfeiler links</button>
```

```js
// Einmalig nach dem DOM-Load ausführen
document.querySelectorAll('[data-selector]').forEach(btn => {
  btn.addEventListener('mouseenter', () =>
    send('setHover', { selector: btn.dataset.selector }));
  btn.addEventListener('mouseleave', () =>
    send('setHover', { selector: null }));
});
```

Alle zukünftigen Buttons mit `data-selector` werden automatisch eingebunden —
kein weiterer JS-Code nötig.

---

### `setOrbitConstraints`

Begrenzt die Orbit-Kontrolle des Benutzers — ideal für Element-spezifische Ansichten,
bei denen nur ein bestimmter Winkel- und Zoombereich erlaubt sein soll.

```js
// Winkelbeschränkungen setzen (Winkel in Grad)
send('setOrbitConstraints', {
  azimuthMin: -30,    // horizontale Grenze links  (Azimut)
  azimuthMax:  30,    // horizontale Grenze rechts (Azimut)
  polarMin:    60,    // vertikale Grenze oben     (Polwinkel von oben)
  polarMax:   100,    // vertikale Grenze unten    (Polwinkel von oben)
  distanceMin: 10,    // minimaler Kameraabstand
  distanceMax: 150,   // maximaler Kameraabstand
});

// Alle Beschränkungen entfernen
send('setOrbitConstraints', { reset: true });
```

> **Tipp:** Azimut- und Polarwinkel beziehen sich auf absolute Weltkoordinaten.
> Der `host-example`-Code berechnet sie automatisch aus `data-cam-pos` / `data-cam-tar`
> und der angegebenen Freiheit in Grad (`data-orbit-h`, `data-orbit-v`).

**Accordion-Integration (host-example):** Pro Accordion-Item lassen sich folgende
`data-*`-Attribute setzen — kein JS-Editieren nötig:

```html
<div class="db-accordion-item"
     data-selector="Gebäude"
     data-cam-pos="12.3,45.6,78.9"   <!-- aus Debug-GUI: 🔗 Copy as URL -->
     data-cam-tar="0.0,5.0,0.0"      <!-- optional; Standard: Objekt-Mitte -->
     data-orbit-h="30"               <!-- ±30° horizontale Freiheit -->
     data-orbit-v="20"               <!-- ±20° vertikale Freiheit -->
     data-zoom-min="10"              <!-- min. Kameraabstand -->
     data-zoom-max="150">            <!-- max. Kameraabstand -->
```

| Attribut | Beschreibung |
|----------|-------------|
| `data-cam-pos` | Exakte Kameraposition `x,y,z` (aus Debug-GUI **🔗 Copy as URL**) |
| `data-cam-tar` | Blickpunkt `x,y,z` (optional) |
| `data-orbit-h` | Horizontale Orbit-Freiheit in Grad (±, Azimut) |
| `data-orbit-v` | Vertikale Orbit-Freiheit in Grad (±, Polar) |
| `data-zoom-min` | Minimaler Kameraabstand |
| `data-zoom-max` | Maximaler Kameraabstand |
| `data-padding` | Zoom-Faktor für automatische Positionierung (wenn kein `data-cam-pos`) |

---

## Events: Viewer → Host

Der Viewer sendet Nachrichten zurück. Alle haben `source: 'viewer'`.

```js
window.addEventListener('message', (ev) => {
  const d = ev.data || {};
  if (d.source !== 'viewer') return;

  switch (d.type) {

    case 'ready':
      // Viewer ist bereit — jetzt können Befehle gesendet werden
      // d.payload = { apiVersion: '1.0.0' }
      break;

    case 'loading':
      // Ladefortschritt des Modells
      // d.payload = { progress: 0.0 – 1.0 }
      console.log(Math.round(d.payload.progress * 100) + '%');
      break;

    case 'poi':
      // Benutzer hat ein Objekt im 3D-Viewer angeklickt
      // d.payload = { id: 'wheel1', name: 'Rad_VL' }
      // Beispiel: Kamera direkt auf das angeklickte Element schwenken
      send('focus', { selector: d.payload.id, padding: 1.5, durationMs: 900 });
      break;

    case 'aliases':
      // Rad-Erkennung abgeschlossen — Mapping von Alias → Objekt-Name
      // d.payload = { mapped: { wheel1: 'Rad_VL', wheel2: 'Rad_VR', ... },
      //               candidates: ['Rad_VL', 'Rad_VR', ...] }
      break;

    case 'camera':
      // Kameraposition nach animateCamera
      // d.payload = { position: {x,y,z}, target: {x,y,z} }
      break;

    case 'error':
      // d.payload = { code: 'MODEL_LOAD', message: '...' }
      break;
  }
});
```

---

## Selektor-Syntax

`selector` akzeptiert folgende Typen (in dieser Auflösungsreihenfolge):

| Typ | Beispiel | Beschreibung |
|-----|---------|--------------|
| **Alias** | `'wheel1'` – `'wheel4'` | Automatisch erkannte Räder |
| **Objekt-Name** | `'Rad_VL'` | `object.name` aus Blender/GLTF |
| **userData.id** | `'pfeiler_links'` | Custom Property `id` im Blender-Objekt |
| **userData.tag** | `'pfeiler'` | Custom Property `tag` im Blender-Objekt |
| **`'all'`** | `'all'` | Gesamtes Modell (nur bei `focus` + `setVisibility`) |

### Rad-Aliases (wheel1–4)

Der Viewer erkennt beim Laden automatisch bis zu 4 Räder anhand von Namens-Mustern
(`wheel`, `tire`, `rim`, `felge`, `rad`, `reifen`) und ordnet sie den vier Ecken zu:

```
wheel1 = vorne links    wheel2 = vorne rechts
wheel3 = hinten links   wheel4 = hinten rechts
```

Das Mapping wird per `aliases`-Event zurückgemeldet. Bei der Konsole prüfen ob die
Erkennung korrekt ist.

### Custom Properties in Blender setzen

Im Blender-Objekt unter **Object Properties → Custom Properties** eintragen:

```
id  = "pfeiler_links"    ← für genaue Adressierung per ID
tag = "pfeiler"          ← für Gruppen (alle Objekte mit diesem Tag)
```

Beim GLTF-Export **„Custom Properties"** aktivieren (ist standardmäßig an).

---

## Debug-GUI

Per `?gui=1` einblenden. Ideal zum Erarbeiten von Kamerawinkeln für Buttons.

| Folder | Inhalt |
|--------|--------|
| **Camera** | Kameraposition + Target live ablesen, manuell setzen, FOV anpassen |
| **Controls & Debug** | Orbit an/aus, Damping, Bounding-Boxes, Animationen an/aus |
| **Actions** | Kamera-Shortcuts (siehe unten) |
| **Arc Camera** | Bogenschwung-Parameter live tunen |

### Actions

| Button | Funktion |
|--------|---------|
| 📋 Copy camera JSON | Aktuelle Kamera als JSON → Clipboard (für `animateCamera`) |
| 🔗 Copy as URL | Aktuelle Kamera als URL-Parameter → Clipboard |
| ↺ Reset camera | Kamera auf Gesamtmodell zurücksetzen |
| 🔲 Copy Button JS | **Fertiges `addEventListener`-Snippet** → Clipboard. Nur `VIEW_ID` ersetzen und in die Host-Seite einfügen. |

### Arc Camera – Preset-Werte nach Modelltyp

| Modell | liftFactor | liftMax | safeRadius |
|--------|-----------|---------|------------|
| Auto (Standard) | 0.4 | 1.0 | 0.0 |
| Brücke | 0.3 | 0.8 | 0.0 |
| Tunnel (Außen) | 0.2 | 0.5 | 0.0 |
| Sehr kompaktes Objekt | 0.4 | 1.0 | 0.85 |

---

## Blender: viewerPivot

Standardmäßig berechnet der Viewer den Drehpunkt für Bogenschwünge aus der
Bounding-Box-Mitte des Modells. Für asymmetrische Modelle kann ein eigener
Pivot gesetzt werden:

1. Root-Objekt auswählen → **Object Properties → Custom Properties → Add**
2. Key: `viewerPivot`, Type: Python Array, Value: `[x, y, z]`
3. GLTF-Export: **„Custom Properties"** aktivieren

Der Viewer liest `root.userData.viewerPivot` aus und verwendet es als
Bogenmittelpunkt für alle `focus`-Fahrten.

---

## Vollständiges Beispiel

Siehe [`host-example/index.html`](host-example/index.html) für eine lauffähige
Integration mit allen API-Funktionen.
