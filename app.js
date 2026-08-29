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
