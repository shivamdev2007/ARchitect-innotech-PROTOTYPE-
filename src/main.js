import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

// Load model-viewer automatically, so index.html does not need editing.
if (!customElements.get("model-viewer")) {
  const modelViewerScript = document.createElement("script");
  modelViewerScript.type = "module";
  modelViewerScript.src =
    "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
  document.head.appendChild(modelViewerScript);
}

// ==================== DASHBOARD ====================

document.querySelector("#app").innerHTML = `
  <header class="navbar">
    <div class="logo">⌂ <span>AIArchitect</span></div>
    <span class="status">● AI Design Studio</span>
    <button class="new-btn" type="button">+ New Design</button>
  </header>

  <main class="workspace">
    <aside class="panel plot-panel">
      <p class="eyebrow">PROJECT CONFIGURATION</p>
      <h2>Your Plot</h2>
      <p class="muted">Configure your concept home.</p>

      <label for="length">Plot length (feet)</label>
      <input id="length" type="number" value="40" min="10" max="1000">

      <label for="width">Plot width (feet)</label>
      <input id="width" type="number" value="30" min="10" max="1000">

      <label for="floors">Number of floors</label>
     <select id="floors">
  ${Array.from({ length: 10 }, (_, i) => {
    const floor = i + 1;
    return `<option value="${floor}" ${floor === 2 ? "selected" : ""}>
      ${floor === 1 ? "Ground floor only" : `${floor} floors`}
    </option>`;
  }).join("")}
</select>

      
      <label for="style">Architectural style</label>
      <select id="style">
        <option>Modern</option>
      
        <option>Contemporary</option>
        <option>Traditional Indian</option>
        <option>Minimalist</option>
        <option>Luxury</option>
        <option>Mediterranean</option>
        <option>Colonial</option>
        <option>Industrial</option>
        <option>Scandinavian</option>
        <option>Eco-friendly</option>
      </select>

      <label for="roof-style">Roof style</label>
      <select id="roof-style">
        <option value="flat">Flat roof</option>
        <option value="pitched">Pitched roof</option>
      </select>

      <p class="muted">Additional features</p>
      <label>
        <input id="balcony-option" type="checkbox">
        Add balcony
      </label>
      <label>
        <input id="parking-option" type="checkbox">
        Add parking
      </label>
      <label>
        <input id="garden-option" type="checkbox">
        Add garden
      </label>


      <label for="budget">Estimated budget (₹)</label>
      <input id="budget" type="number" min="0" placeholder="e.g. 3000000">

      <label for="plot-photo">Upload plot photograph</label>
      <input id="plot-photo" type="file" accept="image/*">
      <p id="photo-status" class="muted" role="status"></p>

      <button class="primary-btn" id="generate" type="button">
        Generate Design →
      </button>
      <p id="design-status" class="muted" role="status"></p>
    </aside>

    <section class="canvas-panel">
      <div class="canvas-heading">
        <div>
          <p class="eyebrow">YOUR DESIGN WORKSPACE</p>
          <h1>Visualize your future.</h1>
          <p class="muted">Your vision, one building at a time.</p>
        </div>
        <span class="preview-tag">3D PREVIEW</span>
      </div>

      <div class="house-preview">
        <div id="house-3d"></div>
      </div>

      <button class="primary-btn" id="export-glb" type="button">
        Download 3D Model (.glb)
      </button>
      <p id="export-status" class="muted" role="status"></p>

      <!-- ==================== AR VIEWER ==================== -->

      <div class="ar-section">
        <p class="eyebrow">IMMERSIVE EXPERIENCE</p>
        <h2>Explore Your Design in AR</h2>
        <p class="muted">
          Generate your house, then place your design in your surroundings.
        </p>

        <div class="ar-buttons">
          <button class="primary-btn" id="view-ar" type="button">
            View in Your Space (AR)
          </button>

          <button class="secondary-btn" id="load-glb" type="button">
            Load Existing GLB
          </button>
        </div>

        <input
          id="glb-file"
          type="file"
          accept=".glb,model/gltf-binary"
          hidden
        >

        <model-viewer
          id="ar-viewer"
          camera-controls
          auto-rotate
          ar
          ar-modes="webxr scene-viewer"
          ar-scale="auto"
          shadow-intensity="1"
          exposure="1"
          alt="AIArchitect generated house model">
        </model-viewer>

        <p id="ar-status" class="muted" role="status" aria-live="polite">
          Generate your house and click View in Your Space.
        </p>
      </div>

      <div class="bottom-info">
        <div>
          <span class="info-label">PLOT SIZE</span>
          <strong id="plot-size">40 × 30 ft</strong>
        </div>
        <div>
          <span class="info-label">FLOORS</span>
          <strong id="floor-count">2 floors</strong>
        </div>
        <div>
          <span class="info-label">STYLE</span>
          <strong id="style-name">Modern</strong>
        </div>
      </div>
    </section>

    <aside class="panel ai-panel">
      <p class="eyebrow">YOUR DESIGN PARTNER</p>

      <div class="ai-title">
        <div class="ai-avatar">✳</div>
        <div>
          <h2>AIArchitect</h2>
          <p class="muted">Your design assistant</p>
        </div>
      </div>

      <div class="chat-area" id="chat-area" aria-live="polite">
        <div class="message assistant-message">
          Hey! Describe your dream home and let's customize the concept.
        </div>
      </div>

      <p class="suggestion-label">TRY ASKING</p>
      <div class="suggestions">
        <button class="suggestion" type="button">Make it modern</button>
        <button class="suggestion" type="button">Add a balcony</button>
        <button class="suggestion" type="button">White exterior</button>
      </div>

      <form id="chat-form">
        <textarea id="prompt" rows="3"
          placeholder="Describe your dream home..."></textarea>
        <button class="primary-btn" type="submit">Send Prompt ↑</button>
      </form>

      <p class="disclaimer">
        Concept preview only. Not construction-ready plans.
        Chat uses demo commands, not a connected AI model.
      </p>
    </aside>
  </main>
`;

// ==================== ELEMENTS ====================

const $ = (selector) => document.querySelector(selector);

const lengthInput = $("#length");
const widthInput = $("#width");
const floorsInput = $("#floors");
const styleInput = $("#style");

const roofInput = $("#roof-style");
const balconyInput = $("#balcony-option");
const parkingInput = $("#parking-option");
const gardenInput = $("#garden-option");

const budgetInput = $("#budget");
const photoInput = $("#plot-photo");
const photoStatus = $("#photo-status");
const designStatus = $("#design-status");
const exportStatus = $("#export-status");
const exportButton = $("#export-glb");
const chatArea = $("#chat-area");
const promptInput = $("#prompt");
const container = $("#house-3d");

const arViewer = $("#ar-viewer");

arViewer.addEventListener("ar-status", (event) => {
  const status = event.detail.status;
  console.log("AR Status:", status);
  arStatus.textContent = `AR status: ${status}`;
});

arViewer.addEventListener("ar-tracking", (event) => {
  const status = event.detail.status;
  console.log("AR Tracking:", status);
  arStatus.textContent = `AR tracking: ${status}`;
});
const viewArButton = $("#view-ar");
const loadGlbButton = $("#load-glb");
const glbFileInput = $("#glb-file");
const arStatus = $("#ar-status");

let balconyEnabled = false;
let whiteExterior = false;

let parkingEnabled = false;
let gardenEnabled = false;

let currentArUrl = null;
let arBusy = false;

function updateSummary() {
  $("#plot-size").textContent =
    `${lengthInput.value || 0} × ${widthInput.value || 0} ft`;

  $("#floor-count").textContent =
    `${floorsInput.value} floor${floorsInput.value === "1" ? "" : "s"}`;

  $("#style-name").textContent = styleInput.value;
}

function validateInputs() {
  const length = Number(lengthInput.value);
  const width = Number(widthInput.value);

  if (
    lengthInput.value.trim() === "" ||
    widthInput.value.trim() === "" ||
    !Number.isFinite(length) ||
    !Number.isFinite(width) ||
    length < 10 ||
    width < 10 ||
    length > 1000 ||
    width > 1000
  ) {
    alert("Enter plot dimensions between 10 and 1000 feet.");
    return false;
  }

  return true;
}

// ==================== THREE.JS SCENE ====================

const scene = new THREE.Scene();
scene.background = new THREE.Color("#e8edf5");

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(10, 8, 12);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 2.5);
sunlight.position.set(8, 12, 10);
sunlight.castShadow = true;
scene.add(sunlight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: "#cbd5c1" }),
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.06;
ground.receiveShadow = true;
scene.add(ground);

const plotOutline = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 0.02, 1)),
  new THREE.LineBasicMaterial({ color: "#74856e" }),
);

plotOutline.position.y = -0.035;
scene.add(plotOutline);

const houseGroup = new THREE.Group();
houseGroup.name = "AIArchitect_House";
scene.add(houseGroup);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);
controls.minDistance = 2;
controls.maxDistance = 35;

function clearHouse() {
  const geometries = new Set();
  const materials = new Set();

  houseGroup.traverse((object) => {
    if (!object.isMesh) return;

    geometries.add(object.geometry);

    const list = Array.isArray(object.material)
      ? object.material
      : [object.material];

    list.forEach((material) => materials.add(material));
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());

  houseGroup.clear();
}

function addBox(name, size, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    material,
  );

  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  houseGroup.add(mesh);

  return mesh;
}

// ==================== HOUSE GENERATION ====================

function updateHouse() {
  const plotLength = Number(lengthInput.value) || 40;
  const plotWidth = Number(widthInput.value) || 30;
  const floorCount = Number(floorsInput.value) || 1;
  const selectedStyle = styleInput.value;

  clearHouse();

  const scale = 5 / Math.max(plotLength, plotWidth);
  const houseLength = plotLength * scale;
  const houseWidth = plotWidth * scale;
  const floorHeight = 1.5;
  const totalHeight = floorCount * floorHeight;

  
    const colors = {
  Modern: 0xe8e8e8,
  Contemporary: 0xd6dce2,
  "Traditional Indian": 0xd9b38c,
  Minimalist: 0xf5f5f0,
  Luxury: 0xd8c4a3,
  Mediterranean: 0xf0dfc2,
  Colonial: 0xe8dcc8,
  Industrial: 0x999999,
  Scandinavian: 0xece8df,
  "Eco-friendly": 0xc7d5b0,
 
};
  

 const wallMaterial = new THREE.MeshStandardMaterial({
  color: whiteExterior ? "#ffffff" : (colors[selectedStyle] ?? 0xe8e8e8),
  roughness: 0.85,
});
const roofMaterial = new THREE.MeshStandardMaterial({
  color:
    selectedStyle === "Japanese Home"
      ? "#454545"
      : selectedStyle === "Traditional Indian"
        ? "#8b3e2f"
        : selectedStyle === "Luxury"
          ? "#393d46"
          : "#70452d",
  roughness: 0.85,
});

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: "#75c9e8",
    metalness: 0.15,
    roughness: 0.25,
  });

  const trimMaterial = new THREE.MeshStandardMaterial({
    color: selectedStyle === "Minimalist" ? "#aab2bd" : "#b7a58e",
  });

  const doorMaterial = new THREE.MeshStandardMaterial({
    color: "#70452d",
  });
    const frameMaterial = new THREE.MeshStandardMaterial({
    color: selectedStyle === "Luxury" ? "#c5a46d" : "#f7f4ee",
    roughness: 0.55,
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: selectedStyle === "Traditional Indian"
      ? "#9b593d"
      : selectedStyle === "Luxury"
        ? "#353535"
        : "#a7aeb7",
    roughness: 0.7,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: "#7dc9e8",
    metalness: 0.25,
    roughness: 0.18,
  });

  for (let floor = 0; floor < floorCount; floor++) {
    const baseY = floor * floorHeight;
    const centerY = baseY + floorHeight / 2;
    
    // Decorative vertical facade panels on the front
    const facadePanelHeight = floorHeight * 0.82;
    const facadePanelWidth = 0.10;
    const facadePanelZ = houseWidth / 2 + 0.035;

    for (const panelX of [
      -houseLength * 0.42,
      houseLength * 0.42,
    ]) {
      addBox(
        `facade-panel-${floor}-${panelX}`,
        new THREE.Vector3(
          facadePanelWidth,
          facadePanelHeight,
          0.06
        ),
        new THREE.Vector3(
          panelX,
          centerY,
          facadePanelZ
        ),
        accentMaterial,
      );
    }


   // Build the floor as separate walls instead of one solid box.
// This creates an open interior for the future walkthrough.
const wallThickness = 0.12;
const halfLength = houseLength / 2;
const halfWidth = houseWidth / 2;

// Interior floor slab
addBox(
  `interior-floor-${floor + 1}`,
  new THREE.Vector3(houseLength, 0.08, houseWidth),
  new THREE.Vector3(0, baseY + 0.04, 0),
  trimMaterial,
);

// Front wall: left and right sections leave a central entrance gap.
const entranceWidth =
  floor === 0 ? Math.min(0.8, houseLength * 0.22) : 0.01;
const frontSideWidth = (houseLength - entranceWidth) / 2;

addBox(
  `front-wall-left-${floor + 1}`,
  new THREE.Vector3(frontSideWidth, floorHeight, wallThickness),
  new THREE.Vector3(
    -(entranceWidth + frontSideWidth) / 2,
    centerY,
    halfWidth - wallThickness / 2,
  ),
  wallMaterial,
);

addBox(
  `front-wall-right-${floor + 1}`,
  new THREE.Vector3(frontSideWidth, floorHeight, wallThickness),
  new THREE.Vector3(
    (entranceWidth + frontSideWidth) / 2,
    centerY,
    halfWidth - wallThickness / 2,
  ),
  wallMaterial,
);

// Back wall
addBox(
  `back-wall-${floor + 1}`,
  new THREE.Vector3(houseLength, floorHeight, wallThickness),
  new THREE.Vector3(0, centerY, -halfWidth + wallThickness / 2),
  wallMaterial,
);

// Left and right side walls
addBox(
  `left-wall-${floor + 1}`,
  new THREE.Vector3(wallThickness, floorHeight, houseWidth),
  new THREE.Vector3(-halfLength + wallThickness / 2, centerY, 0),
  wallMaterial,
);

addBox(
  `right-wall-${floor + 1}`,
  new THREE.Vector3(wallThickness, floorHeight, houseWidth),
  new THREE.Vector3(halfLength - wallThickness / 2, centerY, 0),
  wallMaterial,
);

    if (floor === 0) {
      const doorWidth = Math.min(0.5, houseLength * 0.22);
      const doorHeight = floorHeight * 0.78;

      addBox(
        "front-door",
        new THREE.Vector3(doorWidth, doorHeight, 0.07),
        new THREE.Vector3(0, doorHeight / 2, houseWidth / 2 + 0.04),
        doorMaterial,
      );
      
      // Door handle
      addBox(
        "door-handle",
        new THREE.Vector3(0.035, 0.12, 0.035),
        new THREE.Vector3(
          doorWidth * 0.30,
          doorHeight * 0.52,
          houseWidth / 2 + 0.095
        ),
        frameMaterial,
      );

      // Entrance step
      addBox(
        "entrance-step",
        new THREE.Vector3(doorWidth + 0.35, 0.10, 0.30),
        new THREE.Vector3(
          0,
          0.05,
          houseWidth / 2 + 0.18
        ),
        trimMaterial,
      );

      // Entrance canopy above the front door
      addBox(
        "entrance-canopy",
        new THREE.Vector3(1.0, 0.10, 0.45),
        new THREE.Vector3(
          0,
          doorHeight + 0.08,
          houseWidth / 2 + 0.22
        ),
        roofMaterial,
      );

      // Decorative panel above the entrance
      addBox(
        "entrance-accent",
        new THREE.Vector3(0.65, 0.16, 0.06),
        new THREE.Vector3(
          0,
          doorHeight + 0.22,
          houseWidth / 2 + 0.06
        ),
        accentMaterial,
      );

    }
    

    const windowWidth = Math.min(0.5, houseLength * 0.18);
    const windowHeight = 0.42;

    const windowX = Math.max(
      0,
      Math.min(houseLength * 0.28, houseLength / 2 - windowWidth / 2 - 0.08),
    );

   
for (const x of [-windowX, windowX]) {
  const windowY = centerY + 0.05;
  const windowZ = houseWidth / 2 + 0.07;
  const frameThickness = 0.07;

  // Outer window frame
  addBox(
    `window-frame-${floor}-${x}`,
    new THREE.Vector3(windowWidth + 0.14, windowHeight + 0.14, 0.09),
    new THREE.Vector3(x, windowY, windowZ - 0.025),
    frameMaterial
  );

  // Glass panel
  addBox(
    `window-glass-${floor}-${x}`,
    new THREE.Vector3(windowWidth, windowHeight, 0.035),
    new THREE.Vector3(x, windowY, windowZ + 0.035),
    glassMaterial
  );

  // Vertical crossbar
  addBox(
    `window-vbar-${floor}-${x}`,
    new THREE.Vector3(frameThickness, windowHeight, 0.045),
    new THREE.Vector3(x, windowY, windowZ + 0.065),
    accentMaterial
  );

  // Horizontal crossbar
  addBox(
    `window-hbar-${floor}-${x}`,
    new THREE.Vector3(windowWidth, frameThickness, 0.045),
    new THREE.Vector3(x, windowY, windowZ + 0.065),
    accentMaterial
  );
}


    if (floor > 0) {
      addBox(
        `floor-divider-${floor}`,
        new THREE.Vector3(houseLength + 0.08, 0.06, houseWidth + 0.08),
        new THREE.Vector3(0, baseY, 0),
        trimMaterial,
      );
    }

    if (balconyEnabled && floor > 0) {
      const balconyDepth = Math.min(0.65, houseWidth * 0.3);
      const balconyY = baseY + 0.12;

      addBox(
        `balcony-floor-${floor}`,
        new THREE.Vector3(houseLength * 0.65, 0.08, balconyDepth),
        new THREE.Vector3(0, balconyY, houseWidth / 2 + balconyDepth / 2),
        trimMaterial,
      );

      addBox(
        `balcony-railing-${floor}`,
        new THREE.Vector3(houseLength * 0.65, 0.35, 0.05),
        new THREE.Vector3(0, balconyY + 0.21, houseWidth / 2 + balconyDepth),
        windowMaterial,
      );
      
    }
  }

  if (selectedStyle === "Traditional Indian") {
    
      // Slim balcony railing supports
      const supportCount = 5;
      const railingWidth = houseLength * 0.65;
      const  railingZ = houseWidth / 2 + balconyDepth;

      for (let i = 0; i < supportCount; i++) {
        const supportX =
          -railingWidth / 2 +
          (railingWidth * i) / (supportCount - 1);

        addBox(
          `balcony-support-${floor}-${i}`,
          new THREE.Vector3(0.035, 0.35, 0.06),
          new THREE.Vector3(
            supportX,
            balconyY + 0.21,
            railingZ
          ),
          frameMaterial,
        );
      }

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(houseLength, houseWidth) * 0.75, 0.85, 4),
      roofMaterial,
    );

    roof.name = "traditional-roof";
    roof.geometry.rotateY(Math.PI / 4);
    roof.position.y = totalHeight + 0.4;

    roof.scale.set(
      houseLength / Math.max(houseLength, houseWidth),
      1,
      houseWidth / Math.max(houseLength, houseWidth),
    );

    roof.castShadow = true;
    houseGroup.add(roof);
  } else {
    addBox(
      "flat-roof",
      new THREE.Vector3(houseLength + 0.2, 0.12, houseWidth + 0.2),
      new THREE.Vector3(0, totalHeight + 0.06, 0),
      roofMaterial,
    );
    
    // Front roof-edge border
    addBox(
      "roof-front-border",
      new THREE.Vector3(houseLength + 0.2, 0.18, 0.10),
      new THREE.Vector3(
        0,
        totalHeight + 0.20,
        houseWidth / 2 + 0.10
      ),
      accentMaterial,
    );

    // Back roof-edge border
    addBox(
      "roof-back-border",
      new THREE.Vector3(houseLength + 0.2, 0.18, 0.10),
      new THREE.Vector3(
        0,
        totalHeight + 0.20,
        -houseWidth / 2 - 0.10
      ),
      accentMaterial,
    );

    // Left roof-edge border
    addBox(
      "roof-left-border",
      new THREE.Vector3(0.10, 0.18, houseWidth + 0.2),
      new THREE.Vector3(
        -houseLength / 2 - 0.10,
        totalHeight + 0.20,
        0
      ),
      accentMaterial,
    );

    // Right roof-edge border
    addBox(
      "roof-right-border",
      new THREE.Vector3(0.10, 0.18, houseWidth + 0.2),
      new THREE.Vector3(
        houseLength / 2 + 0.10,
        totalHeight + 0.20,
        0
      ),
      accentMaterial,
    );

  }
  // Optional parking pad
if (parkingEnabled) {
  const parkingPad = new THREE.Mesh(
    new THREE.BoxGeometry(
      houseLength * 0.45,
      0.04,
      Math.min(1.2, houseWidth * 0.3)
    ),
    new THREE.MeshStandardMaterial({ color: 0x777777 })
  );

  parkingPad.position.set(
    -houseLength * 0.25,
    -0.02,
    houseWidth / 2 + 0.8
  );

  parkingPad.name = "parking-pad";
  houseGroup.add(parkingPad);
}

// Optional garden patch
if (gardenEnabled) {
  const garden = new THREE.Mesh(
    new THREE.BoxGeometry(
      houseLength * 0.3,
      0.05,
      Math.min(1.2, houseWidth * 0.3)
    ),
    new THREE.MeshStandardMaterial({ color: 0x4f9b50 })
  );

  garden.position.set(
    houseLength * 0.3,
    -0.015,
    houseWidth / 2 + 0.8
  );

  garden.name = "garden";
  houseGroup.add(garden);
}

  plotOutline.scale.set(houseLength + 1.5, 1, houseWidth + 1.5);

  const maxDimension = Math.max(houseLength, houseWidth, totalHeight);

  controls.target.set(0, totalHeight / 2, 0);

  camera.position.set(
    maxDimension * 1.6 + 2,
    totalHeight + maxDimension * 0.9 + 2,
    maxDimension * 2 + 3,
  );

  camera.lookAt(controls.target);
  controls.update();

  updateSummary();
}

// ==================== RESIZING ====================

function resizeRenderer() {
  const box = container.getBoundingClientRect();

  if (!box.width || !box.height) return;

  camera.aspect = box.width / box.height;
  camera.updateProjectionMatrix();
  renderer.setSize(box.width, box.height);
}

const resizeObserver = new ResizeObserver(resizeRenderer);
resizeObserver.observe(container);
window.addEventListener("resize", resizeRenderer);

// ==================== GENERATE DESIGN ====================

[
  lengthInput,
  widthInput,
  floorsInput,
  styleInput,
  roofInput,
  balconyInput,
  parkingInput,
  gardenInput,
].forEach((input) => {
  input.addEventListener("input", updateSummary);

  input.addEventListener("change", () => {
    balconyEnabled = balconyInput.checked;
    parkingEnabled = parkingInput.checked;
    gardenEnabled = gardenInput.checked;

    updateSummary();
  });
});

$("#generate").addEventListener("click", () => {
  if (!validateInputs()) return;

  updateHouse();

  designStatus.textContent =
    "Concept model updated. Drag to rotate and scroll to zoom.";

  exportStatus.textContent = "";
  arStatus.textContent =
    "Design updated. Click View in Your Space to load the latest model.";
});

// ==================== GLB EXPORT HELPER ====================

function createHouseGlbBlob() {
  return new Promise((resolve, reject) => {
    if (!houseGroup.children.length) {
      reject(new Error("Generate a house design first."));
      return;
    }

    const exporter = new GLTFExporter();

    exporter.parse(
      houseGroup,
      (result) => {
        if (!(result instanceof ArrayBuffer)) {
          reject(new Error("The exporter did not return a binary GLB."));
          return;
        }

        resolve(new Blob([result], { type: "model/gltf-binary" }));
      },
      (error) => reject(error),
      {
        binary: true,
        onlyVisible: true,
      },
    );
  });
}

// ==================== AR MODEL LOADING ====================

function setArModel(blob) {
  if (currentArUrl) {
    URL.revokeObjectURL(currentArUrl);
  }

  currentArUrl = URL.createObjectURL(blob);
  arViewer.src = currentArUrl;
}

function waitForArModel() {
  if (arViewer.loaded) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Model loading timed out. Please try again."));
    }, 20000);

    function cleanup() {
      clearTimeout(timeout);
      arViewer.removeEventListener("load", onLoad);
      arViewer.removeEventListener("error", onError);
    }

    function onLoad() {
      cleanup();
      resolve();
    }

    function onError() {
      cleanup();
      reject(new Error("The 3D model could not be loaded."));
    }

    arViewer.addEventListener("load", onLoad);
    arViewer.addEventListener("error", onError);
  });
}

// ==================== VIEW IN AR BUTTON ====================

viewArButton.addEventListener("click", async () => {
  if (arBusy) return;

  arBusy = true;
  viewArButton.disabled = true;

  try {
    // If the model is already loaded, launch AR directly from this click.
    if (arViewer.loaded && arViewer.canActivateAR) {
      arStatus.textContent = "Opening AR...";

      try {
        await arViewer.activateAR();
      } catch (error) {
        console.error("Could not launch AR:", error);

        arStatus.textContent =
          "AR could not launch. Use the AR icon inside the 3D viewer, and check that you are using HTTPS and a supported Android browser.";
      }

      return;
    }

    // Export the latest generated house.
    arStatus.textContent = "Preparing your house model...";

    const blob = await createHouseGlbBlob();

    // Wait until the model-viewer library has loaded.
    if (!customElements.get("model-viewer")) {
      await customElements.whenDefined("model-viewer");
    }

    // Display the current house in the AR viewer.
    setArModel(blob);
    arStatus.textContent = "Loading your house into the 3D viewer...";

    await waitForArModel();

    arStatus.textContent =
      "Your house is ready! Tap the AR icon inside the viewer to place it in your space. If AR is unavailable, the 3D preview will still work.";
  } catch (error) {
    console.error("AIArchitect AR error:", error);

    arStatus.textContent =
      error.message ||
      "Could not prepare the AR model. Check the browser console.";
  } finally {
    arBusy = false;
    viewArButton.disabled = false;
  }
});

// ==================== LOAD EXISTING GLB ====================

loadGlbButton.addEventListener("click", () => {
  glbFileInput.click();
});

glbFileInput.addEventListener("change", async () => {
  const file = glbFileInput.files?.[0];

  if (!file) return;

  try {
    if (!customElements.get("model-viewer")) {
      await customElements.whenDefined("model-viewer");
    }

    setArModel(file);

    arStatus.textContent = "Loading selected GLB model...";

    await waitForArModel();

    arStatus.textContent =
      "GLB loaded successfully. Use the AR icon inside the viewer to enter AR.";
  } catch (error) {
    console.error("GLB loading error:", error);
    arStatus.textContent = error.message || "Could not load the GLB file.";
  } finally {
    glbFileInput.value = "";
  }
});

// ==================== GLB DOWNLOAD ====================

exportButton.addEventListener("click", async () => {
  exportButton.disabled = true;
  exportStatus.textContent = "Preparing your 3D model...";

  try {
    const blob = await createHouseGlbBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "aiarchitect-house.glb";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 5000);

    // Also update the embedded viewer with the exported design.
    setArModel(blob);

    exportStatus.textContent =
      "Export started! Your house model is also loading in the 3D/AR viewer.";

    arStatus.textContent = "Loading your exported house into the viewer...";

    try {
      await waitForArModel();

      arStatus.textContent =
        "House loaded! Use the AR icon inside the viewer to place it in your space.";
    } catch (viewerError) {
      console.warn("Viewer loading issue:", viewerError);
      arStatus.textContent =
        "The GLB download started. The viewer could not load this model; check the browser console.";
    }
  } catch (error) {
    console.error("AIArchitect GLB export error:", error);

    exportStatus.textContent = `Export failed: ${error?.message || "Unknown error"}. Check Console.`;
  } finally {
    exportButton.disabled = false;
  }
});

// ==================== NEW DESIGN ====================

$(".new-btn").addEventListener("click", () => {
  lengthInput.value = "40";
  widthInput.value = "30";
  floorsInput.value = "2";
  styleInput.value = "Modern";
  budgetInput.value = "";
  photoInput.value = "";

  photoStatus.textContent = "";
  designStatus.textContent = "";
  exportStatus.textContent = "";
  arStatus.textContent =
    "Generate your new design and click View in Your Space.";

  balconyEnabled = false;
  whiteExterior = false;

  chatArea.innerHTML = `
    <div class="message assistant-message">
      New design started! Tell me about your dream home.
    </div>
  `;

  updateHouse();
});

// ==================== CHAT ====================

function addMessage(text, className) {
  const message = document.createElement("div");
  message.className = `message ${className}`;
  message.textContent = text;

  chatArea.appendChild(message);
  chatArea.scrollTop = chatArea.scrollHeight;
}


async function sendPrompt(rawText) {
  const prompt = rawText.trim();
  if (!prompt) return;

  addMessage(prompt, "user-message");
  promptInput.value = "";

  const sendButton = document.querySelector(
    '#chat-form button[type="submit"]'
  );

  sendButton.disabled = true;
  addMessage("AI is designing your changes...", "assistant-message");

  try {
  const response = await fetch("/api/design", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    console.log("Gemini response:", data);
console.log("Changes received:", data.changes);

    if (!response.ok) {
      throw new Error(data.error || "AI request failed.");
    }

    const changes = data.changes || {};
    const applied = [];

    if (changes.style) {
      const validStyle = [...styleInput.options].some(
        option => option.value === changes.style
      );

      if (validStyle) {
        styleInput.value = changes.style;
        applied.push("style changed to " + changes.style);
      }
    }

    if (changes.floors != null) {
      const floors = String(changes.floors);

      if ([...floorsInput.options].some(option => option.value === floors)) {
        floorsInput.value = floors;
        applied.push("floors updated");
      }
    }

    if (typeof changes.balcony === "boolean") {
      balconyEnabled = changes.balcony;
      applied.push(changes.balcony ? "balcony added" : "balcony removed");
    }

    if (typeof changes.exteriorColor === "string") {
      if (/^#[0-9a-fA-F]{6}$/.test(changes.exteriorColor)) {
        whiteExterior =
          changes.exteriorColor.toLowerCase() === "#ffffff";
        applied.push("exterior color instruction received");
      }
    }

    if (applied.length > 0) {
      updateHouse();
      exportStatus.textContent = "";
    }

    addMessage(
      (data.message || "Design response received.") +
        (applied.length ? "\nApplied: " + applied.join(", ") : ""),
      "assistant-message"
    );
  } catch (error) {
    console.error("AIArchitect chat error:", error);

    addMessage(
      "Couldn't connect to Gemini: " + error.message,
      "assistant-message"
    );
  } finally {
    sendButton.disabled = false;
  }
}


$("#chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  sendPrompt(promptInput.value);
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    sendPrompt(button.textContent);
  });
});

// ==================== PHOTO INPUT ====================

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];

  if (!file) {
    photoStatus.textContent = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    photoInput.value = "";
    photoStatus.textContent = "Please choose an image file.";
    return;
  }

  photoStatus.textContent = `${file.name} selected. Automatic plot-image analysis is not connected yet.`;
});

// ==================== RENDER LOOP ====================

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

resizeRenderer();
updateHouse();
animate();
