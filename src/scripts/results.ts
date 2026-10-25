// Shared client-side results list for every platform page. Pages compute the
// non-followers list and hand it to `setResults()`; hidden accounts, search,
// pagination, and rendering live here so behavior stays identical everywhere.
// Element ids come from `components/results/ResultsCard.astro`.

export type AccountStatus = "active" | "unavailable" | "unknown";

export type Account = {
  username: string;
  href: string;
  avatarUrl?: string;
  /** Result of a profile availability check, when one has run. */
  status?: AccountStatus;
};

type ResultsOptions = {
  /** localStorage key for hidden usernames; enables the Hide column. */
  hiddenKey?: string;
  /** Render the avatar column (must match `ResultsCard avatars`). */
  avatars?: boolean;
};

const MAX_PAGE_BUTTONS = 5;

const PAGE_BUTTON_CLASS =
  "w-8 h-8 border rounded-lg text-xs font-medium transition-all";
const PAGE_BUTTON_ACTIVE_CLASS =
  "border-zinc-800 dark:border-zinc-200 bg-black dark:bg-white text-white dark:text-black";
const PAGE_BUTTON_IDLE_CLASS =
  "border-zinc-300 dark:border-zinc-700 bg-white/40 dark:bg-black/10 backdrop-blur-sm text-black dark:text-white hover:border-zinc-800 dark:hover:border-zinc-200 hover:bg-white/60 dark:hover:bg-white/10";

// Unavailable accounts are dropped and active ones need no marker, so only
// accounts the check couldn't answer for get a badge.
const UNKNOWN_BADGE = {
  label: "?",
  title: "Couldn't check this profile; try again later",
  className: "text-gray-500 dark:text-gray-400 border-zinc-300 dark:border-zinc-700",
};

export function setError(message: string) {
  const el = document.getElementById("error-message");
  if (el) el.textContent = message;
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function cell(className: string, ...children: (Node | string)[]) {
  const td = document.createElement("td");
  td.className = className;
  td.append(...children);
  return td;
}

function profileLink(href: string, className: string, ...children: (Node | string)[]) {
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.className = className;
  a.append(...children);
  return a;
}

export function createResultsView({ hiddenKey, avatars = false }: ResultsOptions = {}) {
  const resultList = byId("resultList");
  const summary = byId("results-summary");
  const searchControls = byId("results-search-controls");
  const searchInput = byId<HTMLInputElement>("results-search");
  const paginationControls = byId("pagination-controls");
  const paginationInfo = byId("pagination-info");
  const pageNumbers = byId("page-numbers");
  const prevButton = byId<HTMLButtonElement>("prev-page");
  const nextButton = byId<HTMLButtonElement>("next-page");
  const itemsPerPageSelector = byId("items-per-page-selector");
  const itemsPerPageSelect = byId<HTMLSelectElement>("items-per-page");
  const resetHiddenButton = byId("reset-hidden");
  const hiddenCountEl = byId("hidden-count");

  const columnCount = 2 + (avatars ? 1 : 0) + (hiddenKey ? 1 : 0);

  let allAccounts: Account[] = [];
  let visibleAccounts: Account[] = [];
  let currentPage = 1;
  let itemsPerPage = Number(itemsPerPageSelect?.value) || 10;
  let searchQuery = "";

  function loadHidden(): Set<string> {
    if (!hiddenKey) return new Set();
    try {
      const parsed = JSON.parse(localStorage.getItem(hiddenKey) || "[]");
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((u) => typeof u === "string"));
      }
    } catch {}
    return new Set();
  }

  function saveHidden(hidden: Set<string>) {
    if (!hiddenKey) return;
    try {
      localStorage.setItem(hiddenKey, JSON.stringify(Array.from(hidden)));
    } catch {}
  }

  function applyHidden() {
    const hidden = loadHidden();
    visibleAccounts = allAccounts.filter(
      (account) => !hidden.has(account.username.toLowerCase())
    );
    const hiddenCount = allAccounts.length - visibleAccounts.length;
    if (hiddenCountEl) hiddenCountEl.textContent = String(hiddenCount);
    resetHiddenButton?.classList.toggle("hidden", hiddenCount === 0);
  }

  function searchMatches(): Account[] {
    const query = searchQuery.toLowerCase();
    if (!query) return visibleAccounts;
    return visibleAccounts.filter((account) =>
      account.username.toLowerCase().includes(query)
    );
  }

  function setControlsVisible(visible: boolean) {
    itemsPerPageSelector?.classList.toggle("hidden", !visible);
    paginationControls?.classList.toggle("hidden", !visible);
  }

  function messageRow(text: string) {
    const tr = document.createElement("tr");
    const td = cell(
      "px-6 py-8 text-center text-sm text-gray-600 dark:text-gray-400",
      text
    );
    td.colSpan = columnCount;
    tr.append(td);
    return tr;
  }

  function accountRow(account: Account, number: number) {
    const tr = document.createElement("tr");
    tr.className =
      "bg-white dark:bg-gray-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors";
    tr.append(
      cell("w-16 px-4 py-2 text-center text-gray-900 dark:text-gray-100", String(number))
    );

    if (avatars) {
      const img = document.createElement("img");
      img.src = account.avatarUrl ?? "";
      img.alt = `${account.username}'s avatar`;
      img.loading = "lazy";
      img.className = "w-8 h-8 rounded-full";
      tr.append(
        cell(
          "w-16 px-4 py-2",
          profileLink(account.href, "inline-flex items-center justify-center w-full", img)
        )
      );
    }

    const name = profileLink(
      account.href,
      "text-black dark:text-white hover:underline truncate",
      account.username
    );
    name.title = account.username;
    const nameCell = document.createElement("div");
    nameCell.className = "flex items-center gap-2 min-w-0";
    nameCell.append(name);
    if (account.status === "unknown") {
      const span = document.createElement("span");
      span.className = `shrink-0 border rounded px-1.5 py-0.5 text-[10px] font-medium ${UNKNOWN_BADGE.className}`;
      span.title = UNKNOWN_BADGE.title;
      span.textContent = UNKNOWN_BADGE.label;
      nameCell.append(span);
    }
    tr.append(cell("px-4 py-2 font-medium min-w-0", nameCell));

    if (hiddenKey) {
      const hide = document.createElement("button");
      hide.type = "button";
      hide.dataset.hideUsername = account.username;
      hide.title =
        "Hide this account (e.g. deactivated) — excluded from future checks";
      hide.className =
        "text-xs border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1 text-gray-600 dark:text-gray-400 hover:border-zinc-800 dark:hover:border-zinc-200 hover:text-black dark:hover:text-white transition-all";
      hide.textContent = "Hide";
      tr.append(cell("w-20 px-4 py-2 text-center", hide));
    }

    return tr;
  }

  function render() {
    const matches = searchMatches();
    const visible = visibleAccounts.length;
    const hiddenCount = allAccounts.length - visible;
    const hiddenSuffix = hiddenCount > 0 ? ` (${hiddenCount} hidden)` : "";
    const people = visible === 1 ? "person who doesn't" : "people who don't";

    if (summary) {
      summary.textContent =
        searchQuery && visible > 0
          ? `${matches.length} of ${visible} ${people} follow you back match "${searchQuery}"${hiddenSuffix}`
          : visible > 0
            ? `Found ${visible} ${people} follow you back${hiddenSuffix}`
            : hiddenCount > 0
              ? `No accounts to show — ${hiddenCount} hidden`
              : "Everyone you follow follows you back! 🎉";
    }

    searchControls?.classList.toggle("hidden", visible === 0);

    if (matches.length === 0) {
      setControlsVisible(false);
      resultList?.replaceChildren(
        messageRow(
          visible > 0
            ? `No usernames match "${searchQuery}".`
            : hiddenCount > 0
              ? "No accounts to show — all remaining accounts are hidden."
              : "Everyone you follow follows you back! 🎉"
        )
      );
      return;
    }

    setControlsVisible(true);
    renderPage(matches);
  }

  function renderPage(matches = searchMatches()) {
    const totalItems = matches.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    resultList?.replaceChildren(
      ...matches
        .slice(startIndex, endIndex)
        .map((account, i) => accountRow(account, startIndex + i + 1))
    );

    if (paginationInfo) {
      paginationInfo.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalItems}`;
    }
    if (prevButton) prevButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage === totalPages;

    renderPageNumbers(totalPages);
  }

  function renderPageNumbers(totalPages: number) {
    if (!pageNumbers) return;

    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + MAX_PAGE_BUTTONS - 1);
    startPage = Math.max(1, endPage - MAX_PAGE_BUTTONS + 1);

    const items: HTMLElement[] = [];
    const ellipsis = () => {
      const span = document.createElement("span");
      span.className = "px-2 text-xs text-gray-600 dark:text-gray-400";
      span.textContent = "...";
      return span;
    };

    if (startPage > 1) {
      items.push(pageButton(1));
      if (startPage > 2) items.push(ellipsis());
    }
    for (let page = startPage; page <= endPage; page++) {
      items.push(pageButton(page));
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) items.push(ellipsis());
      items.push(pageButton(totalPages));
    }

    pageNumbers.replaceChildren(...items);
  }

  function pageButton(page: number) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(page);
    button.className = `${PAGE_BUTTON_CLASS} ${
      page === currentPage ? PAGE_BUTTON_ACTIVE_CLASS : PAGE_BUTTON_IDLE_CLASS
    }`;
    if (page === currentPage) button.setAttribute("aria-current", "page");
    button.addEventListener("click", () => goToPage(page));
    return button;
  }

  function goToPage(page: number) {
    currentPage = page;
    renderPage();
  }

  function refresh() {
    applyHidden();
    render();
  }

  resultList?.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLElement>(
      "[data-hide-username]"
    );
    const username = button?.dataset.hideUsername;
    if (!username) return;
    const hidden = loadHidden();
    hidden.add(username.toLowerCase());
    saveHidden(hidden);
    refresh();
  });

  resetHiddenButton?.addEventListener("click", () => {
    saveHidden(new Set());
    refresh();
  });

  searchInput?.addEventListener("input", () => {
    searchQuery = searchInput.value.trim();
    currentPage = 1;
    render();
  });

  itemsPerPageSelect?.addEventListener("change", () => {
    itemsPerPage = Number(itemsPerPageSelect.value) || 10;
    currentPage = 1;
    renderPage();
  });

  prevButton?.addEventListener("click", () => goToPage(currentPage - 1));
  nextButton?.addEventListener("click", () => goToPage(currentPage + 1));

  function resetSearch() {
    currentPage = 1;
    searchQuery = "";
    if (searchInput) searchInput.value = "";
  }

  return {
    /** Replace the full (unfiltered) non-followers list and re-render. */
    setResults(accounts: Account[]) {
      allAccounts = accounts;
      resetSearch();
      refresh();
    },

    /** Accounts currently listed (not hidden), ignoring the search filter. */
    visible(): readonly Account[] {
      return visibleAccounts;
    },

    /**
     * Record check results by username, drop accounts whose profile is
     * unavailable, and re-render. Returns how many accounts were dropped.
     */
    setStatuses(statuses: ReadonlyMap<string, AccountStatus>): number {
      const before = allAccounts.length;
      allAccounts = allAccounts.filter((account) => {
        const status = statuses.get(account.username);
        if (status) account.status = status;
        return account.status !== "unavailable";
      });
      refresh();
      return before - allAccounts.length;
    },

    /** Add usernames to the hidden list (needs `hiddenKey`). */
    hide(usernames: Iterable<string>) {
      const hidden = loadHidden();
      for (const username of usernames) hidden.add(username.toLowerCase());
      saveHidden(hidden);
      refresh();
    },

    /** Drop current results and show `message` as the summary (e.g. while loading). */
    clear(message: string) {
      allAccounts = [];
      visibleAccounts = [];
      resetSearch();
      if (summary) summary.textContent = message;
      searchControls?.classList.add("hidden");
      resetHiddenButton?.classList.add("hidden");
      setControlsVisible(false);
      resultList?.replaceChildren();
    },
  };
}
