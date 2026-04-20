let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "app-toast-container";
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = "info", duration = 3000) {
  const container = getToastContainer();
  const toast = document.createElement("div");
  toast.className = `app-toast app-toast-${type}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;

  container.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("app-toast-hide");
    window.setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
      if (container.childElementCount === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
        toastContainer = null;
      }
    }, 250);
  }, duration);
}
