// Shared client-side logic for the platform NotFollow pages
// (instagram/tiktok/x). Each page parses its own export format and hands the
// full non-followers list to `setResults()`; hidden-account state, pagination,
// rendering, and result search live here so behavior stays consistent.

export type Account = { username: string; href: string };

export function setError(msg: string) {
  const el = document.getElementById("error-message");
  if (el) el.textContent = msg || "";
}

/** Wire up [data-modal-toggle] / [data-modal-hide] buttons and backdrop clicks. */
export function initModals() {
  document.querySelectorAll("[data-modal-toggle]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const modalId = toggle.getAttribute("data-modal-target");
      if (modalId) document.getElementById(modalId)?.classList.toggle("hidden");
    });
  });

  document.querySelectorAll("[data-modal-hide]").forEach((hide) => {
    hide.addEventListener("click", () => {
      const modalId = hide.getAttribute("data-modal-hide");
      if (modalId) document.getElementById(modalId)?.classList.add("hidden");
    });
  });

  // Close modal on background click
  document.querySelectorAll('[id$="Modal"]').forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });
  });
}

/** Read each selected file as text whenever the input changes. */
export function onFileChange(
  inputId: string,
  handler: (content: string, file: File) => void
) {
  document.getElementById(inputId)?.addEventListener("change", (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (e) => handler((e.target?.result as string) || "", file);
      reader.readAsText(file);
    }
  });
}

export function createNotFollowPage(opts: { hiddenKey: string }) {
  const { hiddenKey } = opts;

  let allNonFollowers: Account[] = [];
  let currentNonFollowers: Account[] = [];
  let currentPage = 1;
  let itemsPerPage = 10;
  let searchQuery = "";

  function loadHidden(): Set<string> {
    try {
      const parsed = JSON.parse(localStorage.getItem(hiddenKey) || "[]");
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((u) => typeof u === "string"));
      }
    } catch {}
    return new Set();
  }

  function saveHidden(hidden: Set<string>) {
    try {
      localStorage.setItem(hiddenKey, JSON.stringify(Array.from(hidden)));
    } catch {}
  }

  function applyHidden() {
    const hidden = loadHidden();
    currentNonFollowers = allNonFollowers.filter(
      (f) => !hidden.has(f.username.toLowerCase())
    );
    const hiddenCount = allNonFollowers.length - currentNonFollowers.length;
    const resetBtn = document.getElementById("reset-hidden");
    const countEl = document.getElementById("hidden-count");
    if (countEl) countEl.textContent = String(hiddenCount);
    if (resetBtn) resetBtn.classList.toggle("hidden", hiddenCount === 0);
  }

  function getSearchMatches(): { account: Account; originalIndex: number }[] {
    const query = searchQuery.trim().toLowerCase();
    const matches: { account: Account; originalIndex: number }[] = [];

    currentNonFollowers.forEach((account, originalIndex) => {
      if (!query || account.username.toLowerCase().includes(query)) {
        matches.push({ account, originalIndex });
      }
    });

    return matches;
  }

  function refreshResults() {
    applyHidden();
    renderResults();
  }

  function renderResults() {

    const nonFollowers = currentNonFollowers;
    const matches = getSearchMatches();
    const hiddenCount = allNonFollowers.length - nonFollowers.length;
    const totalEl = document.getElementById("total-to-unfollow");
    if (totalEl) {
      const hiddenSuffix = hiddenCount > 0 ? ` (${hiddenCount} hidden)` : "";
      const query = searchQuery.trim();
      totalEl.textContent =
        query && nonFollowers.length > 0
          ? `${matches.length} of ${nonFollowers.length} people who don't follow you back match "${query}"${hiddenSuffix}`
          : nonFollowers.length > 0
            ? `Found ${nonFollowers.length} ${nonFollowers.length === 1 ? "person" : "people"} who don't follow you back${hiddenSuffix}`
            : hiddenCount > 0
              ? `No accounts to show — ${hiddenCount} hidden`
              : "Everyone you follow follows you back! 🎉";
    }

    const resultList = document.getElementById("resultList");
    const searchControls = document.getElementById("result-search-controls");
    const paginationControls = document.getElementById("pagination-controls");
    const itemsPerPageSelector = document.getElementById(
      "items-per-page-selector"
    );

    searchControls?.classList.toggle("hidden", nonFollowers.length === 0);
    if (!resultList) return;

    resultList.innerHTML = "";

    if (matches.length === 0) {
      paginationControls?.classList.add("hidden");
      itemsPerPageSelector?.classList.add("hidden");
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 3;
      cell.className =
        "px-6 py-8 text-center text-sm text-gray-600 dark:text-gray-400";
      cell.textContent =
        nonFollowers.length > 0
          ? `No usernames match "${searchQuery.trim()}".`
          : hiddenCount > 0
            ? "No accounts to show — all remaining accounts are hidden."
            : "Everyone you follow follows you back! 🎉";
      row.appendChild(cell);
      resultList.appendChild(row);
    } else {
      itemsPerPageSelector?.classList.remove("hidden");
      paginationControls?.classList.remove("hidden");
      renderPage(matches);
    }
  }

  function renderPage(matches = getSearchMatches()) {
    const resultList = document.getElementById("resultList");
    if (!resultList) return;

    const totalItems = matches.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageItems = matches.slice(startIndex, endIndex);
    resultList.innerHTML = "";
    pageItems.forEach(({ account: user, originalIndex }, pageIndex) => {
      const globalIndex = startIndex + pageIndex;
      const tr = document.createElement("tr");
      tr.className =
        "bg-white dark:bg-gray-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors";
      tr.innerHTML = `
        <td class="w-16 px-4 py-2 text-center text-gray-900 dark:text-gray-100">${globalIndex + 1}</td>
        <td class="px-4 py-2 font-medium min-w-0">
          <a href="${user.href}" target="_blank" rel="noopener noreferrer" class="block text-black dark:text-white hover:underline truncate" title="${user.username}">
            ${user.username}
          </a>
        </td>
        <td class="w-20 px-4 py-2 text-center">
          <button type="button" onclick="hideUser(${originalIndex})" title="Hide this account (e.g. deactivated) — excluded from future checks" class="text-xs border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1 text-gray-600 dark:text-gray-400 hover:border-zinc-800 dark:hover:border-zinc-200 hover:text-black dark:hover:text-white transition-all">
            Hide
          </button>
        </td>
      `;
      resultList.appendChild(tr);
    });

    const paginationInfo = document.getElementById("pagination-info");
    if (paginationInfo) {
      paginationInfo.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalItems}`;
    }

    const prevButton = document.getElementById(
      "prev-page"
    ) as HTMLButtonElement | null;
    const nextButton = document.getElementById(
      "next-page"
    ) as HTMLButtonElement | null;

    if (prevButton) prevButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage === totalPages;

    renderPageNumbers(totalPages);
  }

  function renderPageNumbers(totalPages: number) {
    const pageNumbersContainer = document.getElementById("page-numbers");
    if (!pageNumbersContainer) return;

    pageNumbersContainer.innerHTML = "";

    // Show max 5 page numbers at a time
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    const ellipsis = () => {
      const span = document.createElement("span");
      span.className = "px-2 text-xs text-gray-600 dark:text-gray-400";
      span.textContent = "...";
      return span;
    };

    if (startPage > 1) {
      pageNumbersContainer.appendChild(createPageButton(1));
      if (startPage > 2) pageNumbersContainer.appendChild(ellipsis());
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbersContainer.appendChild(createPageButton(i));
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbersContainer.appendChild(ellipsis());
      }
      pageNumbersContainer.appendChild(createPageButton(totalPages));
    }
  }

  function createPageButton(pageNum: number) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = pageNum.toString();
    button.onclick = () => {
      currentPage = pageNum;
      renderPage();
    };

    if (pageNum === currentPage) {
      button.className =
        "w-8 h-8 border border-zinc-800 dark:border-zinc-200 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium transition-all";
    } else {
      button.className =
        "w-8 h-8 border border-zinc-300 dark:border-zinc-700 bg-white/40 dark:bg-black/10 backdrop-blur-sm rounded-lg text-xs font-medium text-black dark:text-white hover:border-zinc-800 dark:hover:border-zinc-200 hover:bg-white/60 dark:hover:bg-white/10 transition-all";
    }

    return button;
  }

  const w = window as any;

  w.hideUser = (index: number) => {
    const user = currentNonFollowers[index];
    if (!user) return;
    const hidden = loadHidden();
    hidden.add(user.username.toLowerCase());
    saveHidden(hidden);
    refreshResults();
  };

  w.resetHidden = () => {
    saveHidden(new Set());
    refreshResults();
  };

  w.goToPage = (page: number) => {
    currentPage = page;
    renderPage();
  };

  w.previousPage = () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  };

  w.nextPage = () => {
    const totalPages = Math.ceil(getSearchMatches().length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderPage();
    }
  };

  w.changeItemsPerPage = () => {
    const select = document.getElementById(
      "itemsPerPage"
    ) as HTMLSelectElement | null;
    if (select) {
      itemsPerPage = parseInt(select.value);
      currentPage = 1;
      renderPage();
    }
  };
  w.filterResults = () => {
    const input = document.getElementById(
      "result-search"
    ) as HTMLInputElement | null;
    searchQuery = input?.value.trim() || "";
    currentPage = 1;
    renderResults();
  };


  return {
    /** Replace the full (unfiltered) non-followers list and re-render. */
    setResults(list: Account[]) {
      allNonFollowers = list;
      currentPage = 1;
      searchQuery = "";
      const input = document.getElementById(
        "result-search"
      ) as HTMLInputElement | null;
      if (input) input.value = "";
      refreshResults();
    },
  };
}
