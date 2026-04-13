
# postMessage-API (v1, generisch + animiert)

## Host → Viewer (Befehle)
```json
{ "type": "animateCamera", "payload": { "position":{"x":0,"y":5,"z":10}, "target":{"x":0,"y":0,"z":0}, "durationMs":800 } }
{ "type": "focus",         "payload": { "selector":"teil_xyz", "padding":1.4, "durationMs":800 } }
{ "type": "setVisibility", "payload": { "selector":"teil_xyz" or ["teil_a","teil_b"] or "all", "visible": true } }
{ "type": "setOrbitEnabled","payload": { "enabled": true } }
{ "type": "setDebug",      "payload": { "bounds": true } }
```
> **Kompatibel zu älteren Namen:** `setCamera`, `focusNode`, `setVisible`, `enableOrbit`, `focusWheel`, `setWheelVisible` funktionieren weiter.

## Viewer → Host (Events)
```json
{ "type":"ready",   "payload":{"apiVersion":"1.0.0"} }
{ "type":"poi",     "payload":{"id":"teil_xyz","name":"MeshName"} }
{ "type":"camera",  "payload":{"position":{"x":..},"target":{"x":..}} }
{ "type":"loading", "payload":{"progress":0.0..1.0} }
{ "type":"error",   "payload":{"code":"...","message":"..."} }
```
