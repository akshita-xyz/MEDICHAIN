const navItems = document.querySelectorAll(".nav-item[data-page]");
const pages = document.querySelectorAll(".page");
const breadcrumb = document.getElementById("breadcrumb");

function showPage(name) {
  pages.forEach(p => p.classList.remove("active-page"));

  const target = document.getElementById(`page-${name}`);
  if (target) target.classList.add("active-page");

  navItems.forEach(item =>
    item.classList.toggle("active", item.dataset.page === name)
  );

  const active = document.querySelector(
    `.nav-item[data-page="${name}"]`
  );

  breadcrumb.textContent = active
    ? active.textContent.replace(/[0-9]/g, "").trim()
    : name;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

navItems.forEach(item => {
  item.addEventListener("click", () => showPage(item.dataset.page));
});

document.querySelectorAll("[data-page-link]").forEach(btn => {
  btn.addEventListener("click", () => {
    showPage(btn.dataset.pageLink);
  });
});


// ================= QUICK ACTION MODAL =================

const modal = document.getElementById("quickModal");

document.getElementById("quickAction")?.addEventListener("click", () => {
  modal?.classList.remove("hidden");
});

document.querySelector(".modal-close")?.addEventListener("click", () => {
  modal?.classList.add("hidden");
});

modal?.addEventListener("click", e => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});



// ================= SETTINGS =================

document.querySelectorAll(".settings-nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".settings-nav button")
      .forEach(x => x.classList.remove("selected"));

    btn.classList.add("selected");
  });
});


// ================= INVENTORY V2 =================

const inventoryRows = document.querySelectorAll(".inventory-row");

const inventoryDrawer =
  document.getElementById("inventoryDrawer");

const inventoryDrawerBackdrop =
  document.getElementById("inventoryDrawerBackdrop");

const inventorySearch =
  document.getElementById("inventorySearch");

const inventoryStatus =
  document.getElementById("inventoryStatus");

const inventoryFacility =
  document.getElementById("inventoryFacility");

const inventoryExpiry =
  document.getElementById("inventoryExpiry");

const inventoryResultCount =
  document.getElementById("inventoryResultCount");

let selectedInventory = null;


function openInventoryDrawer(row) {

  selectedInventory = row;

  const d = row.dataset;

  document.getElementById("drawerMedicine").textContent =
    d.medicine;

  document.getElementById("drawerCategory").textContent =
    d.category;

  document.getElementById("drawerBatch").textContent =
    d.batch;

  document.getElementById("drawerQuantity").textContent =
    `${Number(d.quantity).toLocaleString()} units`;

  document.getElementById("drawerFacility").textContent =
    d.facility;

  document.getElementById("drawerExpiry").textContent =
    d.expiry;

  document.getElementById("drawerQrText").textContent =
    d.qr;

  const status =
    document.getElementById("drawerStatus");

  status.className =
    `drawer-status ${d.status}`;

  status.textContent =
    d.status === "healthy"
      ? "Healthy stock"
      : d.status === "warning"
        ? "Low stock — reorder recommended"
        : "Critical stock — action required";

  inventoryDrawer.classList.add("open");

  inventoryDrawerBackdrop.classList.remove("hidden");

  inventoryDrawer.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeInventoryDrawer() {

  inventoryDrawer.classList.remove("open");

  inventoryDrawerBackdrop.classList.add("hidden");

  inventoryDrawer.setAttribute(
    "aria-hidden",
    "true"
  );
}


inventoryRows.forEach(row => {

  row.addEventListener("click", () => {
    openInventoryDrawer(row);
  });

});


document
  .getElementById("drawerClose")
  ?.addEventListener(
    "click",
    closeInventoryDrawer
  );


document
  .getElementById("drawerCloseAction")
  ?.addEventListener(
    "click",
    closeInventoryDrawer
  );


inventoryDrawerBackdrop?.addEventListener(
  "click",
  closeInventoryDrawer
);


// ================= INVENTORY FILTERING =================

function filterInventory() {

  const q =
    (inventorySearch?.value || "")
      .trim()
      .toLowerCase();

  const status =
    inventoryStatus?.value || "all";

  const facility =
    inventoryFacility?.value || "all";

  const expiry =
    inventoryExpiry?.value || "all";

  let shown = 0;


  inventoryRows.forEach(row => {

    const d = row.dataset;

    const textMatch =
      [
        d.medicine,
        d.batch,
        d.facility,
        d.category
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);


    const statusMatch =
      status === "all" ||
      d.status === status;


    const facilityMatch =
      facility === "all" ||
      d.facility === facility;


    const expiryMatch =
      expiry === "all" ||
      (
        expiry === "soon" &&
        [
          "Sep 2026",
          "Nov 2026",
          "Dec 2026"
        ].includes(d.expiry)
      ) ||
      (
        expiry === "normal" &&
        ![
          "Sep 2026",
          "Nov 2026",
          "Dec 2026"
        ].includes(d.expiry)
      );


    const visible =
      textMatch &&
      statusMatch &&
      facilityMatch &&
      expiryMatch;


    row.style.display =
      visible ? "" : "none";


    if (visible) shown++;

  });


  if (inventoryResultCount) {

    inventoryResultCount.textContent =
      `${shown} medicine${shown === 1 ? "" : "s"} shown`;

  }
}


[
  inventorySearch,
  inventoryStatus,
  inventoryFacility,
  inventoryExpiry
].forEach(el => {

  el?.addEventListener(
    el.tagName === "INPUT"
      ? "input"
      : "change",
    filterInventory
  );

});


// ================= INVENTORY EXPORT =================

document
  .getElementById("inventoryExport")
  ?.addEventListener("click", () => {

    const visible =
      [...inventoryRows]
        .filter(
          r => r.style.display !== "none"
        )
        .map(r => ({

          Medicine:
            r.dataset.medicine,

          Batch:
            r.dataset.batch,

          Quantity:
            r.dataset.quantity,

          Facility:
            r.dataset.facility,

          Expiry:
            r.dataset.expiry,

          Status:
            r.dataset.status

        }));


    const csv = [

      Object.keys(
        visible[0] || {}
      ).join(","),

      ...visible.map(x =>
        Object.values(x)
          .map(v =>
            `"${String(v).replaceAll('"', '""')}"`
          )
          .join(",")
      )

    ].join("\n");


    const blob =
      new Blob(
        [csv],
        { type: "text/csv" }
      );


    const a =
      document.createElement("a");

    a.href =
      URL.createObjectURL(blob);

    a.download =
      "medichain-inventory.csv";

    a.click();

    URL.revokeObjectURL(a.href);

  });


// ================= QR =================

document
  .getElementById("generateQrBtn")
  ?.addEventListener("click", e => {

    e.currentTarget.textContent =
      "✓ QR ready";

    document.getElementById(
      "drawerQr"
    ).textContent = "▦";


    setTimeout(() => {

      e.currentTarget.textContent =
        "Generate QR";

    }, 1800);

  });


// ================= TRANSFER FLOW =================

const transferModal =
  document.getElementById("transferModal");


function openTransferModal() {

  if (!selectedInventory) return;

  document.getElementById(
    "transferMedicine"
  ).textContent =
    `${selectedInventory.dataset.medicine} · ${
      Number(
        selectedInventory.dataset.quantity
      ).toLocaleString()
    } units available`;

  transferModal?.classList.remove(
    "hidden"
  );
}


function closeTransferModal() {

  transferModal?.classList.add(
    "hidden"
  );

}


document
  .getElementById("drawerTransferBtn")
  ?.addEventListener(
    "click",
    openTransferModal
  );


document
  .getElementById("transferClose")
  ?.addEventListener(
    "click",
    closeTransferModal
  );


document
  .getElementById("transferCancel")
  ?.addEventListener(
    "click",
    closeTransferModal
  );


transferModal?.addEventListener(
  "click",
  e => {

    if (e.target === transferModal) {
      closeTransferModal();
    }

  }
);


document
  .getElementById("confirmTransfer")
  ?.addEventListener(
    "click",
    () => {

      if (!selectedInventory) return;


      const units =
        Number(
          document.getElementById(
            "transferUnits"
          ).value
        );


      const destination =
        document.getElementById(
          "transferDestination"
        ).value;


      const sourceQuantity =
        Number(
          selectedInventory.dataset.quantity
        );


      if (
        !Number.isFinite(units) ||
        units < 1
      ) {

        alert(
          "Enter a valid quantity."
        );

        return;

      }


      if (units > sourceQuantity) {

        alert(
          `Only ${sourceQuantity.toLocaleString()} units are available.`
        );

        return;

      }


      const newSourceQuantity =
        sourceQuantity - units;


      selectedInventory.dataset.quantity =
        newSourceQuantity;


      const sourceCells =
        selectedInventory.querySelectorAll(
          "td"
        );


      if (sourceCells[2]) {

        sourceCells[2].innerHTML =
          `<strong>${newSourceQuantity.toLocaleString()}</strong> units`;

      }


      const destinationRow =
        [...inventoryRows].find(row => {

          const facilityCell =
            row.querySelectorAll("td")[3];

          return (
            facilityCell &&
            facilityCell.textContent.trim() ===
              destination
          );

        });


      if (destinationRow) {

        const destinationQuantity =
          Number(
            destinationRow.dataset.quantity || 0
          );


        const newDestinationQuantity =
          destinationQuantity + units;


        destinationRow.dataset.quantity =
          newDestinationQuantity;


        const destinationCells =
          destinationRow.querySelectorAll(
            "td"
          );


        if (destinationCells[2]) {

          destinationCells[2].innerHTML =
            `<strong>${newDestinationQuantity.toLocaleString()}</strong> units`;

        }

      }


      closeTransferModal();

      closeInventoryDrawer();


      alert(
        `Transfer successful!\n\n` +
        `${units.toLocaleString()} units transferred to ${destination}.`
      );

    }
  );


// ================= ADD INVENTORY =================

document
  .getElementById("addInventoryBtn")
  ?.addEventListener(
    "click",
    () => {

      alert(
        "Add inventory form is ready to connect to the backend."
      );

    }
  );


// ================= SHIPMENT TRACKING =================

const shipmentCards =
  document.querySelectorAll(
    ".route-card[data-shipment-id]"
  );

const shipmentDrawer =
  document.getElementById(
    "shipmentDrawer"
  );

const shipmentDrawerBackdrop =
  document.getElementById(
    "shipmentDrawerBackdrop"
  );


const shipmentDrawerId =
  document.getElementById(
    "shipmentDrawerId"
  );

const shipmentDrawerStatus =
  document.getElementById(
    "shipmentDrawerStatus"
  );

const shipmentDrawerStatusBadge =
  document.getElementById(
    "shipmentDrawerStatusBadge"
  );


const shipmentOrigin =
  document.getElementById(
    "shipmentOrigin"
  );

const shipmentDestination =
  document.getElementById(
    "shipmentDestination"
  );

const shipmentProgress =
  document.getElementById(
    "shipmentProgress"
  );

const shipmentEta =
  document.getElementById(
    "shipmentEta"
  );


const shipmentProgressText =
  document.getElementById(
    "shipmentProgressText"
  );

const shipmentProgressBar =
  document.getElementById(
    "shipmentProgressBar"
  );


const shipmentRouteOrigin =
  document.getElementById(
    "shipmentRouteOrigin"
  );

const shipmentRouteDestination =
  document.getElementById(
    "shipmentRouteDestination"
  );


const shipmentTemperature =
  document.getElementById(
    "shipmentTemperature"
  );

const shipmentDriver =
  document.getElementById(
    "shipmentDriver"
  );

const shipmentVehicle =
  document.getElementById(
    "shipmentVehicle"
  );


function openShipmentDrawer(card) {

  if (!shipmentDrawer || !card) {
    return;
  }


  const data = card.dataset;


  shipmentDrawerId.textContent =
    data.shipmentId || "—";


  shipmentDrawerStatus.textContent =
    data.status || "—";


  if (shipmentDrawerStatusBadge) {

    shipmentDrawerStatusBadge.textContent =
      data.status || "—";

  }


  shipmentOrigin.textContent =
    data.origin || "—";


  shipmentDestination.textContent =
    data.destination || "—";


  const progress =
    parseInt(
      data.progress,
      10
    ) || 0;


  shipmentProgress.textContent =
    `${progress}%`;


  shipmentEta.textContent =
    data.eta || "—";


  if (shipmentProgressText) {

    shipmentProgressText.textContent =
      `${progress}% complete`;

  }


  if (shipmentProgressBar) {

    shipmentProgressBar.style.width =
      `${progress}%`;

  }


  if (shipmentRouteOrigin) {

    shipmentRouteOrigin.textContent =
      data.origin || "—";

  }


  if (shipmentRouteDestination) {

    shipmentRouteDestination.textContent =
      data.destination || "—";

  }


  shipmentTemperature.textContent =
    data.temperature || "—";


  shipmentDriver.textContent =
    data.driver || "—";


  shipmentVehicle.textContent =
    data.vehicle || "—";


  // IMPORTANT:
  // Remove hidden AND add open.
  shipmentDrawer.classList.remove(
    "hidden"
  );

  shipmentDrawer.classList.add(
    "open"
  );


  shipmentDrawer.setAttribute(
    "aria-hidden",
    "false"
  );


  shipmentDrawerBackdrop?.classList.remove(
    "hidden"
  );

}


function closeShipmentDrawer() {

  if (!shipmentDrawer) return;


  shipmentDrawer.classList.remove(
    "open"
  );

  shipmentDrawer.classList.add(
    "hidden"
  );


  shipmentDrawerBackdrop?.classList.add(
    "hidden"
  );


  shipmentDrawer.setAttribute(
    "aria-hidden",
    "true"
  );

}


shipmentCards.forEach(card => {

  card.addEventListener(
    "click",
    event => {

      event.preventDefault();

      openShipmentDrawer(card);

    }
  );

});


document
  .getElementById(
    "shipmentDrawerClose"
  )
  ?.addEventListener(
    "click",
    closeShipmentDrawer
  );


document
  .getElementById(
    "shipmentDrawerDone"
  )
  ?.addEventListener(
    "click",
    closeShipmentDrawer
  );


shipmentDrawerBackdrop?.addEventListener(
  "click",
  closeShipmentDrawer
);


document
  .getElementById(
    "shipmentAlertBtn"
  )
  ?.addEventListener(
    "click",
    () => {

      alert(
        "Shipment issue report is ready to connect to the backend."
      );

    }
  );


document
  .getElementById(
    "newShipmentBtn"
  )
  ?.addEventListener(
    "click",
    () => {

      alert(
        "New shipment creation is ready to connect to the backend."
      );

    }
  );


  // ============================================================
// FINAL FRONTEND PASS — QUICK ACTIONS + ORDERS
// ============================================================


// ================= QUICK ACTIONS =================

const quickModal = document.getElementById("quickModal");

function closeQuickModal() {
  quickModal?.classList.add("hidden");
}

document.getElementById("quickModalClose")?.addEventListener(
  "click",
  closeQuickModal
);

quickModal?.addEventListener("click", event => {
  if (event.target === quickModal) {
    closeQuickModal();
  }
});


// Add inventory
document.getElementById("quickAddInventory")?.addEventListener(
  "click",
  () => {
    closeQuickModal();

    showPage("inventory");

    setTimeout(() => {
      document.getElementById("addInventoryBtn")?.click();
    }, 100);
  }
);


// Create shipment
document.getElementById("quickCreateShipment")?.addEventListener(
  "click",
  () => {
    closeQuickModal();

    showPage("shipments");

    setTimeout(() => {
      document.getElementById("newShipmentBtn")?.click();
    }, 100);
  }
);


// Review alerts
document.getElementById("quickReviewAlerts")?.addEventListener(
  "click",
  () => {
    closeQuickModal();
    showPage("alerts");
  }
);


// ================= ORDERS =================

const orderModal = document.getElementById("orderModal");
const ordersTableBody = document.getElementById("ordersTableBody");
const pendingOrderCount = document.getElementById("pendingOrderCount");

function openOrderModal() {
  orderModal?.classList.remove("hidden");
}

function closeOrderModal() {
  orderModal?.classList.add("hidden");
}

document.getElementById("createOrderBtn")?.addEventListener(
  "click",
  openOrderModal
);

document.getElementById("orderModalClose")?.addEventListener(
  "click",
  closeOrderModal
);

document.getElementById("orderCancel")?.addEventListener(
  "click",
  closeOrderModal
);

orderModal?.addEventListener("click", event => {
  if (event.target === orderModal) {
    closeOrderModal();
  }
});


// Create new order
document.getElementById("confirmOrder")?.addEventListener(
  "click",
  () => {

    const medicine =
      document.getElementById("orderMedicine")?.value;

    const quantity =
      Number(document.getElementById("orderQuantity")?.value);

    const supplier =
      document.getElementById("orderSupplier")?.value;

    const facility =
      document.getElementById("orderFacility")?.value;


    // Validation
    if (!medicine || !Number.isFinite(quantity) || quantity < 1) {
      alert("Please enter a valid medicine quantity.");
      return;
    }


    // Generate frontend order number
    const orderNumber =
      `#ORD-${10500 + ordersTableBody.children.length}`;


    // Create table row
    const row = document.createElement("tr");

    row.className = "order-row";

    row.innerHTML = `
      <td><b>${orderNumber}</b></td>
      <td>${facility}</td>
      <td>${quantity}</td>
      <td>${supplier}</td>
      <td>Aug 29</td>
      <td>
        <span class="status warning">Pending</span>
      </td>
    `;


    // Put newest order at top
    ordersTableBody.prepend(row);


    // Update pending count
    if (pendingOrderCount) {
      pendingOrderCount.textContent =
        Number(pendingOrderCount.textContent) + 1;
    }


    closeOrderModal();


    alert(
      `Order created successfully.\n\n` +
      `${orderNumber}\n` +
      `${medicine} — ${quantity.toLocaleString()} units`
    );
  }
);


// ================= ORDER EXPORT =================

document.getElementById("exportOrdersBtn")?.addEventListener(
  "click",
  () => {

    const rows = [
      [
        "Order",
        "Requested by",
        "Items",
        "Supplier",
        "Date",
        "Status"
      ]
    ];


    document
      .querySelectorAll("#ordersTableBody tr")
      .forEach(row => {

        const cells = row.querySelectorAll("td");

        if (cells.length < 6) return;

        rows.push([
          cells[0].textContent.trim(),
          cells[1].textContent.trim(),
          cells[2].textContent.trim(),
          cells[3].textContent.trim(),
          cells[4].textContent.trim(),
          cells[5].textContent.trim()
        ]);

      });


    const csv = rows
      .map(row =>
        row
          .map(value =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");


    const blob = new Blob(
      [csv],
      { type: "text/csv;charset=utf-8;" }
    );


    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "medichain-orders.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  }
);


// ==================== ORDERS ====================

const orderRows = document.querySelectorAll(".order-row");

const orderDrawer = document.getElementById("orderDrawer");
const orderDrawerBackdrop = document.getElementById("orderDrawerBackdrop");

const orderDrawerId = document.getElementById("orderDrawerId");
const orderDrawerStatus = document.getElementById("orderDrawerStatus");
const orderDrawerStatusBadge = document.getElementById("orderDrawerStatusBadge");

const orderDrawerFacility = document.getElementById("orderDrawerFacility");
const orderDrawerItems = document.getElementById("orderDrawerItems");
const orderDrawerSupplier = document.getElementById("orderDrawerSupplier");
const orderDrawerDate = document.getElementById("orderDrawerDate");
const orderTimelineDate = document.getElementById("orderTimelineDate");

const orderDrawerClose = document.getElementById("orderDrawerClose");
const orderDrawerCloseAction = document.getElementById("orderDrawerCloseAction");
const orderApproveBtn = document.getElementById("orderApproveBtn");

function openOrderDrawer(row) {

    const data = row.dataset;

    orderDrawerId.textContent = `#${data.orderId}`;
    orderDrawerStatus.textContent = data.status;
    orderDrawerStatusBadge.textContent = data.status;

    orderDrawerFacility.textContent = data.facility;
    orderDrawerItems.textContent = data.items;
    orderDrawerSupplier.textContent = data.supplier;
    orderDrawerDate.textContent = data.date;
    orderTimelineDate.textContent = data.date;

    orderDrawer.classList.remove("hidden");
    orderDrawer.classList.add("open");

    orderDrawerBackdrop.classList.remove("hidden");
    orderDrawer.setAttribute("aria-hidden", "false");
}

function closeOrderDrawer() {

    orderDrawer.classList.remove("open");
    orderDrawer.classList.add("hidden");

    orderDrawerBackdrop.classList.add("hidden");
    orderDrawer.setAttribute("aria-hidden", "true");
}

orderRows.forEach(row => {

    row.addEventListener("click", () => {
        openOrderDrawer(row);
    });

});

orderDrawerClose?.addEventListener("click", closeOrderDrawer);

orderDrawerCloseAction?.addEventListener("click", closeOrderDrawer);

orderDrawerBackdrop?.addEventListener("click", closeOrderDrawer);

orderApproveBtn?.addEventListener("click", () => {

    orderDrawerStatus.textContent = "Approved";
    orderDrawerStatusBadge.textContent = "Approved";

    orderApproveBtn.textContent = "Approved";
    orderApproveBtn.disabled = true;

});


// ==================== CREATE ORDER ====================

const createOrderBtn = document.getElementById("createOrderBtn");

const createOrderModal = document.getElementById("createOrderModal");

const createOrderClose = document.getElementById("createOrderClose");
const createOrderCancel = document.getElementById("createOrderCancel");

const confirmCreateOrder = document.getElementById("confirmCreateOrder");

const orderMedicine = document.getElementById("orderMedicine");
const orderFacility = document.getElementById("orderFacility");
const orderSupplier = document.getElementById("orderSupplier");
const orderQuantity = document.getElementById("orderQuantity");
const orderPriority = document.getElementById("orderPriority");

function openCreateOrderModal() {

    createOrderModal.classList.remove("hidden");

}

function closeCreateOrderModal() {

    createOrderModal.classList.add("hidden");

}

createOrderBtn?.addEventListener("click", openCreateOrderModal);

createOrderClose?.addEventListener("click", closeCreateOrderModal);

createOrderCancel?.addEventListener("click", closeCreateOrderModal);

createOrderModal?.addEventListener("click", (event) => {

    if (event.target === createOrderModal) {
        closeCreateOrderModal();
    }

});

confirmCreateOrder?.addEventListener("click", () => {

    const medicine = orderMedicine.value;
    const facility = orderFacility.value;
    const supplier = orderSupplier.value;
    const quantity = orderQuantity.value;
    const priority = orderPriority.value;

    if (!quantity || Number(quantity) < 1) {

        alert("Please enter a valid quantity.");

        return;

    }

    const newOrderId =
        `ORD-${Math.floor(10500 + Math.random() * 500)}`;

    const today = "Aug 29";

    const newRow = document.createElement("tr");

    newRow.className = "order-row";

    newRow.dataset.orderId = newOrderId;
    newRow.dataset.facility = facility;
    newRow.dataset.items = quantity;
    newRow.dataset.supplier = supplier;
    newRow.dataset.date = today;
    newRow.dataset.status = "Pending";

    newRow.innerHTML = `
        <td><b>#${newOrderId}</b></td>
        <td>${facility}</td>
        <td>${quantity}</td>
        <td>${supplier}</td>
        <td>${today}</td>
        <td>
            <span class="status warning">
                Pending
            </span>
        </td>
    `;

    document
        .getElementById("ordersTableBody")
        .prepend(newRow);

    newRow.addEventListener("click", () => {

        openOrderDrawer(newRow);

    });

    closeCreateOrderModal();

    alert(`Order #${newOrderId} created successfully.`);

});