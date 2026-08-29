const navItems = document.querySelectorAll(".nav-item[data-page]");
const pages = document.querySelectorAll(".page");
const breadcrumb = document.getElementById("breadcrumb");

function showPage(name) {
  pages.forEach(p => p.classList.remove("active-page"));
  const target = document.getElementById(`page-${name}`);
  if (target) target.classList.add("active-page");

  navItems.forEach(item => item.classList.toggle("active", item.dataset.page === name));
  const active = document.querySelector(`.nav-item[data-page="${name}"]`);
  breadcrumb.textContent = active ? active.textContent.replace(/[0-9]/g, "").trim() : name;
  window.scrollTo({top: 0, behavior: "smooth"});
}

navItems.forEach(item => item.addEventListener("click", () => showPage(item.dataset.page)));

document.querySelectorAll("[data-page-link]").forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.pageLink));
});

const modal = document.getElementById("quickModal");
document.getElementById("quickAction")?.addEventListener("click", () => modal.classList.remove("hidden"));
document.querySelector(".modal-close")?.addEventListener("click", () => modal.classList.add("hidden"));
modal?.addEventListener("click", e => {
  if (e.target === modal) modal.classList.add("hidden");
});

document.querySelectorAll(".action-choice").forEach(choice => {
  choice.addEventListener("click", () => {
    modal.classList.add("hidden");
    const label = choice.querySelector("b").textContent;
    alert(`${label} is ready to be connected to the backend.`);
  });
});

document.querySelectorAll(".settings-nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".settings-nav button").forEach(x => x.classList.remove("selected"));
    btn.classList.add("selected");
  });
});


// ================= Inventory V2 interactions =================
const inventoryRows = document.querySelectorAll(".inventory-row");
const inventoryDrawer = document.getElementById("inventoryDrawer");
const inventoryDrawerBackdrop = document.getElementById("inventoryDrawerBackdrop");
const inventorySearch = document.getElementById("inventorySearch");
const inventoryStatus = document.getElementById("inventoryStatus");
const inventoryFacility = document.getElementById("inventoryFacility");
const inventoryExpiry = document.getElementById("inventoryExpiry");
const inventoryResultCount = document.getElementById("inventoryResultCount");

let selectedInventory = null;

function openInventoryDrawer(row) {
  selectedInventory = row;
  const d = row.dataset;
  document.getElementById("drawerMedicine").textContent = d.medicine;
  document.getElementById("drawerCategory").textContent = d.category;
  document.getElementById("drawerBatch").textContent = d.batch;
  document.getElementById("drawerQuantity").textContent = `${Number(d.quantity).toLocaleString()} units`;
  document.getElementById("drawerFacility").textContent = d.facility;
  document.getElementById("drawerExpiry").textContent = d.expiry;
  document.getElementById("drawerQrText").textContent = d.qr;
  const status = document.getElementById("drawerStatus");
  status.className = `drawer-status ${d.status}`;
  status.textContent = d.status === "healthy" ? "Healthy stock" : d.status === "warning" ? "Low stock — reorder recommended" : "Critical stock — action required";
  inventoryDrawer.classList.add("open");
  inventoryDrawerBackdrop.classList.remove("hidden");
  inventoryDrawer.setAttribute("aria-hidden", "false");
}

function closeInventoryDrawer() {
  inventoryDrawer.classList.remove("open");
  inventoryDrawerBackdrop.classList.add("hidden");
  inventoryDrawer.setAttribute("aria-hidden", "true");
}

inventoryRows.forEach(row => row.addEventListener("click", () => openInventoryDrawer(row)));
document.getElementById("drawerClose")?.addEventListener("click", closeInventoryDrawer);
document.getElementById("drawerCloseAction")?.addEventListener("click", closeInventoryDrawer);
inventoryDrawerBackdrop?.addEventListener("click", closeInventoryDrawer);

function filterInventory() {
  const q = (inventorySearch?.value || "").trim().toLowerCase();
  const status = inventoryStatus?.value || "all";
  const facility = inventoryFacility?.value || "all";
  const expiry = inventoryExpiry?.value || "all";
  let shown = 0;

  inventoryRows.forEach(row => {
    const d = row.dataset;
    const textMatch = [d.medicine, d.batch, d.facility, d.category].join(" ").toLowerCase().includes(q);
    const statusMatch = status === "all" || d.status === status;
    const facilityMatch = facility === "all" || d.facility === facility;
    const expiryMatch = expiry === "all" || (expiry === "soon" && ["Sep 2026", "Nov 2026", "Dec 2026"].includes(d.expiry)) || (expiry === "normal" && !["Sep 2026", "Nov 2026", "Dec 2026"].includes(d.expiry));
    const visible = textMatch && statusMatch && facilityMatch && expiryMatch;
    row.style.display = visible ? "" : "none";
    if (visible) shown++;
  });
  if (inventoryResultCount) inventoryResultCount.textContent = `${shown} medicine${shown === 1 ? "" : "s"} shown`;
}

[inventorySearch, inventoryStatus, inventoryFacility, inventoryExpiry].forEach(el => {
  el?.addEventListener(el.tagName === "INPUT" ? "input" : "change", filterInventory);
});

document.getElementById("inventoryExport")?.addEventListener("click", () => {
  const visible = [...inventoryRows].filter(r => r.style.display !== "none").map(r => ({
    Medicine: r.dataset.medicine, Batch: r.dataset.batch, Quantity: r.dataset.quantity,
    Facility: r.dataset.facility, Expiry: r.dataset.expiry, Status: r.dataset.status
  }));
  const csv = [
    Object.keys(visible[0] || {}).join(","),
    ...visible.map(x => Object.values(x).map(v => `"${String(v).replaceAll('"','""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "medichain-inventory.csv";
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById("generateQrBtn")?.addEventListener("click", e => {
  e.currentTarget.textContent = "✓ QR ready";
  document.getElementById("drawerQr").textContent = "▦";
  setTimeout(() => e.currentTarget.textContent = "Generate QR", 1800);
});

// Transfer flow
const transferModal = document.getElementById("transferModal");
function openTransferModal() {
  if (!selectedInventory) return;
  document.getElementById("transferMedicine").textContent =
    `${selectedInventory.dataset.medicine} · ${Number(selectedInventory.dataset.quantity).toLocaleString()} units available`;
  transferModal.classList.remove("hidden");
}
function closeTransferModal() { transferModal?.classList.add("hidden"); }

document.getElementById("drawerTransferBtn")?.addEventListener("click", openTransferModal);
document.getElementById("transferClose")?.addEventListener("click", closeTransferModal);
document.getElementById("transferCancel")?.addEventListener("click", closeTransferModal);
transferModal?.addEventListener("click", e => { if (e.target === transferModal) closeTransferModal(); });

document.getElementById("confirmTransfer")?.addEventListener("click", () => {
  const units = Number(document.getElementById("transferUnits").value);
  if (!units || units < 1) {
    alert("Enter a valid quantity.");
    return;
  }
  const destination = document.getElementById("transferDestination").value;
  closeTransferModal();
  closeInventoryDrawer();
  alert(`Transfer plan created: ${units} units → ${destination}.`);
});

document.getElementById("addInventoryBtn")?.addEventListener("click", () => {
  alert("Add inventory form is ready to connect to the backend.");
});
