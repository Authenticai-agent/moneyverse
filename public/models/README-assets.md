# MoneyVerse Hero Island — Asset README

## Files
- `hero-island.blend` — Blender 5.1 source file (scene, materials, lights, Hero_Camera)
- `public/models/hero-island.glb` — production web asset (Draco-compressed glTF binary)

## Loading in the web app
Place `hero-island.glb` at `public/models/hero-island.glb` and load with `/models/hero-island.glb`.

The GLB uses **Draco mesh compression**. In three.js attach a DRACOLoader:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
loader.load('/models/hero-island.glb', ({ scene }) => { /* ... */ });
```

(React Three Fiber's `useGLTF` handles Draco automatically via `useGLTF('/models/hero-island.glb', true)`.)

## Interactive landmark node names
Query these by name (`scene.getObjectByName(...)`) for hover/tap interactions:
Money_Tree, House, School, Library, Bakery, Lemonade_Stand, Savings_Vault,
Business_District, Financial_Observatory, Community_Garden, Park,
Island_Base, Roads, Pond, Bridge, Solar_Panels, Wind_Turbines, Clouds,
NPC_Group (children NPC_01–NPC_05), Money_Tree_Coins, Money_Tree_Glow.

## Suggested code-driven animations
The model is static by design. Animate in code:
- `Wind_Turbines` — slow rotation of blade sub-meshes or gentle whole-object sway
- `Clouds` — slow lateral drift
- `Money_Tree_Coins` — subtle bob + emissive pulse
- `Money_Tree_Glow` — soft opacity pulse
- Island — slow float (sin-wave Y offset) for the hero section

## Scene stats
- ~15,000 triangles, 25 meshes, 34 flat-color PBR materials (no texture images — palette-driven, minimal file size)
- File size: well under the 2 MB ideal target
- Lighting (Key_Light, Fill_Light, Rim_Light) and Hero_Camera live in the .blend only; light your web scene with warm key + soft ambient to match.

## Palette
Primary Purple #6B4EFF · Solar Yellow #FFD84D · Aqua Teal #5CE1E6 ·
Lavender Mist #D9CFFF · Emerald Green #5FD38D · Dark Base #1C1F2E · Light Base #F8F8FF
