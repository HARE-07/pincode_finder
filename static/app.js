const quickLocations = [
  ["110001", "New Delhi"],
  ["400001", "Mumbai"],
  ["560001", "Bangalore"],
  ["600001", "Chennai"],
  ["700001", "Kolkata"],
  ["500001", "Hyderabad"],
  ["411001", "Pune"],
  ["380001", "Ahmedabad"],
  ["302001", "Jaipur"],
  ["226001", "Lucknow"]
];

const singleForm = document.querySelector("#singleForm");
const singleInput = document.querySelector("#singlePincode");
const singleResult = document.querySelector("#singleResult");
const bulkForm = document.querySelector("#bulkForm");
const bulkInput = document.querySelector("#bulkPincodes");
const bulkResult = document.querySelector("#bulkResult");
const mapCaption = document.querySelector("#mapCaption");
const mapMeta = document.querySelector("#mapMeta");

function showError(target, message) {
  target.classList.remove("hidden");
  target.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function locationCard(item) {
  return `
    <div class="location">
      <div class="full"><div class="data-label">Pincode</div><div class="data-value">${escapeHtml(item.pincode)}</div></div>
      <div><div class="data-label">City</div><div class="data-value">${escapeHtml(item.city)}</div></div>
      <div><div class="data-label">State</div><div class="data-value">${escapeHtml(item.state)}</div></div>
      <div class="full"><div class="data-label">District</div><div class="data-value">${escapeHtml(item.district)}</div></div>
    </div>`;
}

// ============================================================
// ONE persistent map, created exactly once. Every search flies
// this same map to the new coordinates instead of destroying and
// rebuilding it, so there's no flicker and no stuck/duplicate maps.
// ============================================================
const pinIcon = L.divIcon({
  className: "",
  html: `
    <div class="pin-marker" style="position:relative;">
      <div class="pin-pulse"></div>
      <svg viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.3 0 11.8 0 20.6 12 30 12 30s12-9.4 12-18.2C24 5.3 18.6 0 12 0z" fill="#0e7c86"/>
        <circle cx="12" cy="11.5" r="4.6" fill="white"/>
      </svg>
    </div>`,
  iconSize: [30, 38],
  iconAnchor: [15, 36],
  popupAnchor: [0, -34]
});

// Centered and zoomed to show the whole country by default, before any search.
const mainMap = L.map("mainMap", { scrollWheelZoom: true, zoomControl: true })
  .setView([22.9734, 78.6569], 4.6);

// Plain OpenStreetMap tiles: free, no API key required.
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(mainMap);

L.control.scale({ imperial: false }).addTo(mainMap);

// The pin marker itself is only added to the map once a search actually happens.
let singleMarker = L.marker([28.6139, 77.2090], { icon: pinIcon })
  .bindPopup("<strong>110001</strong><br>New Delhi");

let bulkLayer = null; // group of markers for a bulk search; cleared and rebuilt each time

function updateCaption(title, meta) {
  mapCaption.textContent = title;
  mapMeta.textContent = meta;
}

function flyToSingle(item) {
  // A bulk search may have added its own marker group; hide it while we're
  // showing a single-pincode result so the two views don't overlap.
  if (bulkLayer) {
    mainMap.removeLayer(bulkLayer);
    bulkLayer = null;
  }
  if (!mainMap.hasLayer(singleMarker)) singleMarker.addTo(mainMap);

  singleMarker.setLatLng([item.lat, item.lon]);
  singleMarker.setPopupContent(`<strong>${escapeHtml(item.pincode)}</strong><br>${escapeHtml(item.city)}`);
  mainMap.flyTo([item.lat, item.lon], 12, { duration: 1.1 });
  singleMarker.openPopup();
  updateCaption(item.city, item.pincode);
  document.querySelector(".map-section").scrollIntoView({ behavior: "smooth", block: "center" });
}

function flyToBulk(items) {
  mainMap.removeLayer(singleMarker);
  if (bulkLayer) mainMap.removeLayer(bulkLayer);
  if (!items.length) return;

  const markers = items.map(item =>
    L.marker([item.lat, item.lon], { icon: pinIcon })
      .bindPopup(`<strong>${escapeHtml(item.pincode)}</strong><br>${escapeHtml(item.city)}`)
  );
  bulkLayer = L.featureGroup(markers).addTo(mainMap);
  mainMap.flyToBounds(bulkLayer.getBounds().pad(0.25), { duration: 1.1, maxZoom: 12 });
  updateCaption(`${items.length} location${items.length > 1 ? "s" : ""} found`, `${items[0].pincode}${items.length > 1 ? " + more" : ""}`);
  document.querySelector(".map-section").scrollIntoView({ behavior: "smooth", block: "center" });
}

// ---- Single lookup ----
singleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const code = singleInput.value.trim();

  if (!/^\d{6}$/.test(code)) {
    showError(singleResult, "Please enter exactly 6 digits.");
    return;
  }

  const button = singleForm.querySelector("button");
  button.disabled = true;
  button.textContent = "Searching...";
  singleResult.classList.remove("hidden");
  singleResult.innerHTML = "";

  try {
    const response = await fetch(`/pincode/${encodeURIComponent(code)}`);
    const data = await response.json();

    if (!response.ok) {
      showError(singleResult, data.message || "Pincode not found.");
      return;
    }

    singleResult.innerHTML = locationCard(data);
    flyToSingle(data);
  } catch {
    showError(singleResult, "Could not connect to the FastAPI server.");
  } finally {
    button.disabled = false;
    button.textContent = "Find location";
  }
});

// ---- Bulk lookup ----
bulkForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const codes = bulkInput.value
    .split(/[\s,;]+/)
    .map(x => x.trim())
    .filter(Boolean);

  if (!codes.length) {
    showError(bulkResult, "Enter at least one pincode.");
    return;
  }

  if (codes.length > 20) {
    showError(bulkResult, "You can search a maximum of 20 pincodes at once.");
    return;
  }

  if (codes.some(code => !/^\d{6}$/.test(code))) {
    showError(bulkResult, "Every pincode must contain exactly 6 digits.");
    return;
  }

  const button = bulkForm.querySelector("button");
  button.disabled = true;
  button.textContent = "Searching...";
  bulkResult.classList.remove("hidden");

  try {
    const response = await fetch("/pincode/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pincode: codes })
    });

    const data = await response.json();

    if (!response.ok) {
      showError(bulkResult, data.detail?.[0]?.msg || data.message || "Bulk lookup failed.");
      return;
    }

    const rows = data.result.map(item => `
      <tr>
        <td><strong>${escapeHtml(item.pincode)}</strong></td>
        <td>${escapeHtml(item.city)}</td>
        <td>${escapeHtml(item.state)}</td>
        <td>${escapeHtml(item.district)}</td>
      </tr>`).join("");

    const missing = data.missing.length
      ? `<div class="missing">Not found: ${data.missing.map(escapeHtml).join(", ")}</div>`
      : "";

    bulkResult.innerHTML = `
      <div class="stats">
        <div class="stat"><strong>${data.found}</strong><span>Found</span></div>
        <div class="stat"><strong>${data.not_found}</strong><span>Not found</span></div>
      </div>
      ${data.result.length ? `
      <div style="overflow:auto">
        <table>
          <thead><tr><th>Pincode</th><th>City</th><th>State</th><th>District</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>` : ""}
      ${missing}`;

    if (data.result.length) flyToBulk(data.result);
  } catch {
    showError(bulkResult, "Could not connect to the FastAPI server.");
  } finally {
    button.disabled = false;
    button.textContent = "Search all";
  }
});

const quickGrid = document.querySelector("#quickGrid");
quickGrid.innerHTML = quickLocations.map(([code, city]) => `
  <button class="quick" type="button" data-code="${code}">
    <strong>${code}</strong>
    <span>${city}</span>
  </button>
`).join("");

quickGrid.addEventListener("click", event => {
  const button = event.target.closest(".quick");
  if (!button) return;
  singleInput.value = button.dataset.code;
  singleForm.requestSubmit();
});
