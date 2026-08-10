// Combo Crafting — Amellwind (Foundry v12 / dnd5e 4.4 / MidiQOL + Item Macro)
// On Use: [postActiveEffects]ItemMacro
//
// Opens a persistent Monster Hunter-styled crafting panel:
//   1. Pick a tool you own (matched by inventory item name).
//   2. Browse that tool's Combo List recipes; craftable ones are highlighted,
//      recipes missing an ingredient are greyed out.
//   3. Choose an ability score and press Craft. The panel stays open so you can
//      keep crafting.
//
// Amellwind rules (see instrucctions.md § Combo List):
//   Crafting Check = 1d20 + ability mod + (proficiency bonus if proficient with
//   the tool) + Combo Book bonus (+1 per distinct Combo Book volume, max +5).
//   Success: both ingredients consumed, item crafted.
//   Fail by 5 or less: only 1 ingredient (crafter's choice) consumed.
//   Fail by 6 or more: both ingredients consumed.
//
// The recipe table is injected at build time by build-combo-craft-item.mjs.

/* @@COMBO_RECIPES@@ */

(async () => {
  // ── MidiQOL onUse gating ────────────────────────────────────────────────
  const macroPass = String(
    (typeof args !== "undefined" ? args?.[0]?.macroPass : "") ??
      (typeof workflow !== "undefined" ? workflow?.macroPass : "") ??
      "",
  ).toLowerCase();
  if (macroPass && !macroPass.includes("postactiveeffects")) return;

  const caller =
    (typeof actor !== "undefined" && actor) ||
    (typeof workflow !== "undefined" && workflow?.actor) ||
    (typeof item !== "undefined" && (item?.actor ?? item?.parent)) ||
    (typeof token !== "undefined" ? token?.actor : null);

  if (!caller) {
    ui.notifications.warn("Combo Crafting: your character could not be found.");
    return;
  }
  if (!caller.isOwner && !game.user.isGM) {
    ui.notifications.warn("Combo Crafting: you do not own this character.");
    return;
  }

  const RECIPES = Array.isArray(typeof COMBO_RECIPES !== "undefined" ? COMBO_RECIPES : null)
    ? COMBO_RECIPES
    : [];
  if (!RECIPES.length) {
    ui.notifications.error("Combo Crafting: recipe data is missing.");
    return;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  const norm = (s) =>
    String(s ?? "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const esc = (value) => {
    const s = String(value ?? "");
    if (globalThis.Handlebars?.Utils?.escapeExpression) return Handlebars.Utils.escapeExpression(s);
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  };

  const EMPTY_INGREDIENT = new Set(["", "-", "--", "—", "–", "n/a", "none"]);
  const recipeIngredients = (row) =>
    [row.item1, row.item2]
      .map((x) => String(x ?? "").trim())
      .filter((x) => x && !EMPTY_INGREDIENT.has(norm(x)));

  const recipeKey = (toolId, index) => `${toolId}::${index}`;

  // dnd5e 4.x tool-proficiency keys per Combo List tool id.
  const TOOL_KEY_MAP = {
    alchemist: "alchemist",
    brewer: "brewer",
    cook: "cook",
    glassblower: "glassblower",
    herbalism: "herb",
    poisoner: "pois",
    smith: "smith",
    tinker: "tinker",
    woodcarver: "woodcarver",
  };

  // Combo tools that are Artisan's Tools in dnd5e. Category proficiency
  // `system.tools.art` (e.g. Artificer / "all artisan's tools") applies to these.
  // Herbalism Kit + Poisoner's Kit are NOT artisan tools.
  const ARTISAN_COMBO_TOOLS = new Set([
    "alchemist",
    "brewer",
    "cook",
    "glassblower",
    "smith",
    "tinker",
    "woodcarver",
  ]);

  const toolProfValue = (actorDoc, key) => {
    if (!key) return 0;
    const t = actorDoc.system?.tools?.[key];
    if (!t) return 0;
    return Number(t.value ?? t.prof ?? 0) || 0;
  };

  /** Tasha's All-Purpose Tool (any plus variant) standing in as artisan tools. */
  const hasAllPurposeTool = (actorDoc) =>
    [...actorDoc.items].some((i) => /all[\s-]*purpose\s*tool/i.test(String(i.name ?? "")));

  const CATEGORY_COLORS = {
    HEALING: "#4ade80",
    BUFFS: "#60a5fa",
    COATINGS: "#c084fc",
    "DR AMMO": "#fb923c",
    "BOWGUN AMMO": "#fb923c",
    "LIGHT BOWGUN ONLY AMMO": "#facc15",
    "HEAVY BOWGUN ONLY AMMO": "#f87171",
    HORNS: "#2dd4bf",
    BOMBS: "#fbbf24",
    "BARREL BOMBS": "#f87171",
    TRAPS: "#22d3ee",
    LURES: "#38bdf8",
  };
  const categoryColor = (cat) => CATEGORY_COLORS[String(cat ?? "").toUpperCase()] ?? "#a8a29e";

  const signed = (n) => `${n >= 0 ? "+" : "−"} ${Math.abs(n)}`;

  const ownedQuantityMap = (actorDoc) => {
    const map = new Map();
    for (const it of actorDoc.items) {
      const qty = Number(it.system?.quantity);
      if (!Number.isFinite(qty)) continue;
      const key = norm(it.name);
      map.set(key, (map.get(key) ?? 0) + qty);
    }
    return map;
  };

  const ownedToolIds = (actorDoc) => {
    const names = new Set([...actorDoc.items].map((i) => norm(i.name)));
    const ids = new Set(RECIPES.filter((r) => names.has(norm(r.toolName))).map((r) => r.id));
    // All-Purpose Tool can transform into any artisan's tool → unlock those tabs.
    if (hasAllPurposeTool(actorDoc)) {
      for (const id of ARTISAN_COMBO_TOOLS) ids.add(id);
    }
    return ids;
  };

  const isProficientWithTool = (actorDoc, toolId) => {
    const toolName = RECIPES.find((r) => r.id === toolId)?.toolName;
    const toolItem = toolName
      ? actorDoc.items.find((i) => norm(i.name) === norm(toolName))
      : null;

    // Prefer dnd5e's resolved multiplier when available (honors baseItem + category).
    if (toolItem) {
      const mult = Number(toolItem.system?.proficiencyMultiplier);
      if (Number.isFinite(mult) && mult > 0) return true;
      if (Number(toolItem.system?.proficient ?? 0) > 0) return true;
      // Category on the item itself (type.value === "art").
      const itemCat = toolItem.system?.type?.value;
      const baseItem = toolItem.system?.type?.baseItem;
      if (itemCat && toolProfValue(actorDoc, itemCat) > 0) return true;
      if (baseItem && toolProfValue(actorDoc, baseItem) > 0) return true;
    }

    // Explicit per-tool entry on the actor (Character sheet Tools config).
    const key = TOOL_KEY_MAP[toolId];
    if (toolProfValue(actorDoc, key) > 0) return true;

    // Category Artisan's Tools — Artificer / “proficient with all artisan's tools”.
    if (ARTISAN_COMBO_TOOLS.has(toolId) && toolProfValue(actorDoc, "art") > 0) return true;

    // All-Purpose Tool grants proficiency with the artisan form it takes.
    if (ARTISAN_COMBO_TOOLS.has(toolId) && hasAllPurposeTool(actorDoc)) return true;

    return false;
  };

  const comboBookBonus = (actorDoc) => {
    const volumes = new Set();
    for (const it of actorDoc.items) {
      if (/combo\s*book/i.test(it.name)) volumes.add(norm(it.name));
    }
    return Math.min(5, volumes.size);
  };

  const resolveProductTemplate = async (actorDoc, name) => {
    const n = norm(name);
    const own = actorDoc.items.find(
      (i) => norm(i.name) === n && Number.isFinite(Number(i.system?.quantity)),
    );
    if (own) return { kind: "stack", item: own };

    const worldItem = game.items?.find((i) => norm(i.name) === n);
    if (worldItem) return { kind: "template", doc: worldItem };

    for (const pack of game.packs ?? []) {
      if (pack.metadata?.type !== "Item") continue;
      let index;
      try {
        index = await pack.getIndex();
      } catch (e) {
        continue;
      }
      const entry = index.find((e) => norm(e.name) === n);
      if (!entry) continue;
      try {
        const doc = await pack.getDocument(entry._id);
        if (doc) return { kind: "template", doc };
      } catch (e) {
        /* ignore unreadable pack entry */
      }
    }
    return null;
  };

  const rollQuantity = async (qtyStr) => {
    const s = String(qtyStr ?? "").trim();
    if (!s || EMPTY_INGREDIENT.has(norm(s))) return 1;
    if (/^\d+$/.test(s)) return Math.max(1, parseInt(s, 10));
    try {
      const r = await new Roll(s).evaluate();
      return Math.max(1, Number(r.total) || 1);
    } catch (e) {
      return 1;
    }
  };

  const grantProduct = async (actorDoc, resolution, qty) => {
    if (resolution.kind === "stack") {
      const current = Number(resolution.item.system?.quantity) || 0;
      await resolution.item.update({ "system.quantity": current + qty });
      return resolution.item.name;
    }
    const data = resolution.doc.toObject();
    delete data._id;
    data.folder = null;
    if (Number.isFinite(Number(data.system?.quantity))) {
      foundry.utils.setProperty(data, "system.quantity", qty);
    }
    const created = await actorDoc.createEmbeddedDocuments("Item", [data]);
    return created?.[0]?.name ?? data.name;
  };

  const consumeIngredient = async (actorDoc, name, count) => {
    let remaining = count;
    const stacks = actorDoc.items
      .filter((i) => norm(i.name) === norm(name) && Number.isFinite(Number(i.system?.quantity)))
      .sort((a, b) => Number(a.system.quantity) - Number(b.system.quantity));
    const updates = [];
    const deletes = [];
    for (const st of stacks) {
      if (remaining <= 0) break;
      const q = Number(st.system.quantity) || 0;
      if (q <= remaining) {
        deletes.push(st.id);
        remaining -= q;
      } else {
        updates.push({ _id: st.id, "system.quantity": q - remaining });
        remaining = 0;
      }
    }
    if (updates.length) await actorDoc.updateEmbeddedDocuments("Item", updates);
    if (deletes.length) await actorDoc.deleteEmbeddedDocuments("Item", deletes);
  };

  const chooseIngredientDialog = (ingredients) =>
    new Promise((resolve) => {
      let settled = false;
      const finish = (v) => {
        if (settled) return;
        settled = true;
        resolve(v);
      };
      const buttons = {};
      ingredients.forEach((ing, idx) => {
        buttons[`ing${idx}`] = {
          label: esc(ing),
          callback: () => finish(ing),
        };
      });
      new Dialog(
        {
          title: "Failed by 5 or less — lose one ingredient",
          content: `<p style="margin:6px 0 10px">Your crafting attempt failed narrowly. Choose which ingredient is wasted:</p>`,
          buttons,
          default: "ing0",
          close: () => finish(ingredients[0]),
        },
        { width: 380 },
      ).render(true);
    });

  const ABILITIES = [
    { id: "int", label: "Intelligence" },
    { id: "wis", label: "Wisdom" },
    { id: "str", label: "Strength" },
    { id: "dex", label: "Dexterity" },
    { id: "con", label: "Constitution" },
    { id: "cha", label: "Charisma" },
  ];

  // ── Application ──────────────────────────────────────────────────────────
  class ComboCraftingApp extends Application {
    constructor(actorDoc, recipes, options = {}) {
      super(options);
      this.actorDoc = actorDoc;
      this.recipes = recipes;
      const owned = ownedToolIds(actorDoc);
      // Multi-select: default to every owned tool selected (union of recipes).
      this.selectedToolIds = new Set([...owned]);
      this.selectedKey = null;
      this.selectedAbility = "int";
      this.searchQuery = "";
      this.toolsMenuOpen = false;
      this.lastResult = null;
      this.busy = false;
    }

    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: "combo-crafting-app",
        classes: ["combo-crafting-app"],
        title: "Combo Crafting",
        width: 880,
        height: 720,
        resizable: true,
        popOut: true,
      });
    }

    async _renderInner() {
      return $(this._buildHtml());
    }

    _availableTools() {
      const owned = ownedToolIds(this.actorDoc);
      return this.recipes.filter((t) => owned.has(t.id));
    }

    _visibleEntries(qtyMap) {
      const q = norm(this.searchQuery);
      const selected = this.selectedToolIds;
      const entries = [];
      for (const tool of this._availableTools()) {
        if (!selected.has(tool.id)) continue;
        tool.rows.forEach((row, index) => {
          if (q) {
            const hay = norm(
              [row.name, row.item1, row.item2, row.category, tool.toolName].join(" "),
            );
            if (!hay.includes(q)) return;
          }
          entries.push({ tool, row, index });
        });
      }
      return entries;
    }

    _buildHtml() {
      const actorDoc = this.actorDoc;
      const qtyMap = ownedQuantityMap(actorDoc);
      const books = comboBookBonus(actorDoc);
      const availableTools = this._availableTools();

      const styles = this._styles();

      const header = `
        <div class="cc-header">
          <div class="cc-title">
            <span class="cc-title-main">COMBO CRAFTING</span>
            <span class="cc-title-sub">${esc(actorDoc.name)}</span>
          </div>
          <div class="cc-books" title="Combo Book bonus (+1 per distinct volume, max +5)">
            <span class="cc-books-icon">📖</span>
            <span>Combo Books ${signed(books)}</span>
          </div>
        </div>`;

      if (!availableTools.length) {
        return `<div id="cc-root">${styles}${header}
          <div class="cc-empty">
            <p>This hunter owns no crafting tools.</p>
            <p class="cc-empty-sub">Add a tool (e.g. <em>Herbalism Kit</em>, <em>Alchemist's Supplies</em>) to the inventory to start crafting.</p>
          </div></div>`;
      }

      // Keep selection in sync if inventory changed (drop unowned tools).
      for (const id of [...this.selectedToolIds]) {
        if (!availableTools.some((t) => t.id === id)) this.selectedToolIds.delete(id);
      }
      if (!this.selectedToolIds.size) {
        for (const t of availableTools) this.selectedToolIds.add(t.id);
      }

      const selectedCount = this.selectedToolIds.size;
      const toolsLabel =
        selectedCount === availableTools.length
          ? `All tools (${availableTools.length})`
          : selectedCount === 0
            ? "No tools selected"
            : selectedCount === 1
              ? availableTools.find((t) => this.selectedToolIds.has(t.id))?.toolName ?? "1 tool"
              : `${selectedCount} tools selected`;

      const toolOptions = availableTools
        .map((t) => {
          const checked = this.selectedToolIds.has(t.id) ? "checked" : "";
          return `<label class="cc-tool-option">
            <input type="checkbox" data-role="tool-check" value="${esc(t.id)}" ${checked}/>
            <span class="cc-tool-option-name">${esc(t.toolName)}</span>
            <span class="cc-tool-option-count">${t.rows.length}</span>
          </label>`;
        })
        .join("");

      const filters = `
        <div class="cc-filters">
          <div class="cc-tools-combo ${this.toolsMenuOpen ? "is-open" : ""}">
            <button type="button" class="cc-tools-trigger" data-role="tools-toggle" aria-haspopup="listbox"
              aria-expanded="${this.toolsMenuOpen ? "true" : "false"}">
              <span class="cc-tools-trigger-label">${esc(toolsLabel)}</span>
              <span class="cc-tools-trigger-caret">▾</span>
            </button>
            <div class="cc-tools-menu" data-role="tools-menu" ${this.toolsMenuOpen ? "" : "hidden"}>
              <div class="cc-tools-menu-actions">
                <button type="button" data-role="tools-all">Select all</button>
                <button type="button" data-role="tools-none">Clear</button>
              </div>
              ${toolOptions}
            </div>
          </div>
          <div class="cc-search">
            <i class="fas fa-search cc-search-icon" aria-hidden="true"></i>
            <input type="search" class="cc-search-input" data-role="search"
              placeholder="Search recipe, ingredient or category…"
              value="${esc(this.searchQuery)}" autocomplete="off" />
            ${
              this.searchQuery
                ? `<button type="button" class="cc-search-clear" data-role="search-clear" title="Clear search">×</button>`
                : ""
            }
          </div>
        </div>`;

      const entries = this._visibleEntries(qtyMap);
      const cards = entries
        .map(({ tool, row, index }) => this._recipeCard(tool, row, index, qtyMap, availableTools.length > 1))
        .join("");

      const headLabel = this.searchQuery.trim()
        ? `Search results`
        : selectedCount === availableTools.length
          ? "All owned tools"
          : selectedCount === 1
            ? availableTools.find((t) => this.selectedToolIds.has(t.id))?.toolName ?? "Recipes"
            : `${selectedCount} tools`;

      const grid = `
        <div class="cc-grid-wrap">
          <div class="cc-tool-head">
            <span class="cc-tool-head-name">${esc(headLabel)}</span>
            <span class="cc-tool-head-count">${entries.length} recipe${entries.length === 1 ? "" : "s"}</span>
          </div>
          ${
            entries.length
              ? `<div class="cc-grid">${cards}</div>`
              : `<div class="cc-empty-soft">No recipes match the current tools / search.</div>`
          }
        </div>`;

      const abilityOptions = ABILITIES.map((a) => {
        const mod = Number(actorDoc.system?.abilities?.[a.id]?.mod ?? 0);
        return `<option value="${a.id}" ${a.id === this.selectedAbility ? "selected" : ""}>${esc(
          a.label,
        )} (${signed(mod)})</option>`;
      }).join("");

      const selectedRow = this._selectedRow();
      const profToolId = selectedRow?.__toolId
        ?? (this.selectedToolIds.size === 1 ? [...this.selectedToolIds][0] : null);
      const proficient = profToolId ? isProficientWithTool(actorDoc, profToolId) : false;
      const canCraft = Boolean(selectedRow) && this._isRecipeCraftable(selectedRow, qtyMap);

      const footer = `
        <div class="cc-footer">
          <div class="cc-footer-left">
            <label class="cc-ability-label">Ability</label>
            <select class="cc-ability" data-role="ability">${abilityOptions}</select>
            <span class="cc-prof ${proficient ? "is-on" : ""}">${
              !profToolId
                ? "Pick a recipe"
                : proficient
                  ? "Proficient (+PB)"
                  : "Not proficient"
            }</span>
          </div>
          <button type="button" class="cc-craft" data-role="craft" ${canCraft ? "" : "disabled"}>
            ${
              selectedRow
                ? `Craft ${esc(selectedRow.name)}`
                : "Select a recipe"
            }
          </button>
        </div>`;

      const banner = this.lastResult ? this._resultBanner() : "";

      return `<div id="cc-root">${styles}${header}${filters}${grid}${banner}${footer}</div>`;
    }

    _recipeCard(tool, row, index, qtyMap, showToolBadge) {
      const key = recipeKey(tool.id, index);
      const ingredients = recipeIngredients(row);
      const ingHtml = ingredients
        .map((ing) => {
          const have = qtyMap.get(norm(ing)) ?? 0;
          const ok = have >= 1;
          return `<div class="cc-ing ${ok ? "ok" : "missing"}">
              <span class="cc-ing-name">${esc(ing)}</span>
              <span class="cc-ing-count">${have}/1</span>
            </div>`;
        })
        .join("");

      const craftable = this._isRecipeCraftable(row, qtyMap);
      const selected = this.selectedKey === key;
      const cat = String(row.category ?? "").trim();
      const catBadge = cat
        ? `<span class="cc-cat" style="color:${categoryColor(cat)};border-color:${categoryColor(
            cat,
          )}55;background:${categoryColor(cat)}18">${esc(cat)}</span>`
        : "";
      const missing = ingredients.filter((ing) => (qtyMap.get(norm(ing)) ?? 0) < 1);
      const title = craftable
        ? ""
        : `title="Missing: ${esc(missing.join(", "))}"`;
      const toolBadge = showToolBadge
        ? `<span class="cc-tool-badge">${esc(tool.toolName)}</span>`
        : "";

      return `
        <div class="cc-card ${craftable ? "" : "is-disabled"} ${selected ? "is-selected" : ""}"
          data-key="${esc(key)}" data-craftable="${craftable ? "1" : "0"}" ${title}>
          <div class="cc-card-top">
            <span class="cc-card-name">${esc(row.name)}</span>
            ${catBadge}
          </div>
          ${toolBadge}
          <div class="cc-ings">${ingHtml}</div>
          <div class="cc-card-foot">
            <span class="cc-dc">DC ${esc(row.dc ?? "—")}</span>
            <span class="cc-qty">×${esc(row.quantity && row.quantity !== "--" ? row.quantity : "1")}</span>
          </div>
        </div>`;
    }

    _resultBanner() {
      const r = this.lastResult;
      const cls = r.success ? "success" : "fail";
      return `<div class="cc-banner ${cls}">
        <span class="cc-banner-icon">${r.success ? "✔" : "✖"}</span>
        <span class="cc-banner-text">${esc(r.text)}</span>
      </div>`;
    }

    _selectedRow() {
      if (!this.selectedKey) return null;
      const [toolId, idxStr] = this.selectedKey.split("::");
      const tool = this.recipes.find((t) => t.id === toolId);
      const row = tool?.rows?.[Number(idxStr)];
      return row ? { ...row, __toolId: toolId, __index: Number(idxStr) } : null;
    }

    _isRecipeCraftable(row, qtyMap) {
      const map = qtyMap ?? ownedQuantityMap(this.actorDoc);
      const ingredients = recipeIngredients(row);
      if (!ingredients.length) return false;
      return ingredients.every((ing) => (map.get(norm(ing)) ?? 0) >= 1);
    }

    activateListeners(html) {
      super.activateListeners(html);
      const root = html[0] ?? html;

      const closeToolsMenu = () => {
        this.toolsMenuOpen = false;
        root.querySelector(".cc-tools-combo")?.classList.remove("is-open");
        const menu = root.querySelector("[data-role='tools-menu']");
        if (menu) menu.hidden = true;
        const trig = root.querySelector("[data-role='tools-toggle']");
        if (trig) trig.setAttribute("aria-expanded", "false");
      };

      html.find("[data-role='tools-toggle']").on("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.toolsMenuOpen = !this.toolsMenuOpen;
        this.render(false);
      });

      html.find("[data-role='tool-check']").on("change", (ev) => {
        const id = ev.currentTarget.value;
        if (ev.currentTarget.checked) this.selectedToolIds.add(id);
        else this.selectedToolIds.delete(id);
        // Keep at least one tool selected if possible.
        if (!this.selectedToolIds.size) {
          const first = this._availableTools()[0];
          if (first) this.selectedToolIds.add(first.id);
        }
        this.selectedKey = null;
        this.render(false);
      });

      html.find("[data-role='tools-all']").on("click", (ev) => {
        ev.preventDefault();
        this.selectedToolIds = new Set(this._availableTools().map((t) => t.id));
        this.selectedKey = null;
        this.render(false);
      });

      html.find("[data-role='tools-none']").on("click", (ev) => {
        ev.preventDefault();
        // Clear all but leave one so the panel isn't empty.
        const first = this._availableTools()[0];
        this.selectedToolIds = new Set(first ? [first.id] : []);
        this.selectedKey = null;
        this.render(false);
      });

      html.find("[data-role='search']").on("input", (ev) => {
        this.searchQuery = ev.currentTarget.value ?? "";
        const caret = ev.currentTarget.selectionStart;
        this.render(false);
        // Restore focus + caret after re-render.
        requestAnimationFrame(() => {
          const input = document.querySelector("#combo-crafting-app [data-role='search']");
          if (!input) return;
          input.focus();
          try {
            const pos = Math.min(caret ?? this.searchQuery.length, input.value.length);
            input.setSelectionRange(pos, pos);
          } catch (e) {
            /* ignore */
          }
        });
      });

      html.find("[data-role='search-clear']").on("click", () => {
        this.searchQuery = "";
        this.render(false);
        requestAnimationFrame(() => {
          document.querySelector("#combo-crafting-app [data-role='search']")?.focus();
        });
      });

      html.find(".cc-card").on("click", (ev) => {
        const el = ev.currentTarget;
        if (el.dataset.craftable !== "1") return;
        this.selectedKey = el.dataset.key;
        this.toolsMenuOpen = false;
        this.render(false);
      });

      html.find("[data-role='ability']").on("change", (ev) => {
        this.selectedAbility = ev.currentTarget.value;
      });

      html.find("[data-role='craft']").on("click", () => this._onCraft());

      // Click outside closes the tools menu without full re-render churn.
      $(document)
        .off("click.comboCraftingTools")
        .on("click.comboCraftingTools", (ev) => {
          if (!this.toolsMenuOpen) return;
          if ($(ev.target).closest(".cc-tools-combo").length) return;
          closeToolsMenu();
        });
    }

    async close(options) {
      $(document).off("click.comboCraftingTools");
      return super.close(options);
    }

    async _onCraft() {
      if (this.busy) return;
      const row = this._selectedRow();
      if (!row) return;

      const actorDoc = this.actorDoc;
      const qtyMap = ownedQuantityMap(actorDoc);
      const ingredients = recipeIngredients(row);

      // Re-validate ingredients live.
      const missing = ingredients.filter((ing) => (qtyMap.get(norm(ing)) ?? 0) < 1);
      if (missing.length) {
        ui.notifications.warn(`Combo Crafting: missing ingredient(s): ${missing.join(", ")}.`);
        this.render(false);
        return;
      }

      this.busy = true;
      try {
        // Resolve the product template BEFORE rolling, so a failed lookup never
        // burns ingredients.
        const resolution = await resolveProductTemplate(actorDoc, row.name);
        if (!resolution) {
          ui.notifications.warn(
            `Combo Crafting: no item named "${row.name}" was found on this actor, in the world, or in any compendium. Import the Amellwind items first.`,
          );
          return;
        }

        const ability = this.selectedAbility;
        const abilityMod = Number(actorDoc.system?.abilities?.[ability]?.mod ?? 0);
        const proficient = isProficientWithTool(actorDoc, row.__toolId);
        const prof = proficient ? Number(actorDoc.system?.attributes?.prof ?? 0) : 0;
        const books = comboBookBonus(actorDoc);

        const parts = ["1d20", signed(abilityMod)];
        if (prof) parts.push(signed(prof));
        if (books) parts.push(signed(books));
        const formula = parts.join(" ").replace(/−/g, "-");

        const roll = await new Roll(formula).evaluate();
        const total = Number(roll.total) || 0;
        const dc = parseInt(row.dc, 10);
        const hasDC = Number.isFinite(dc);
        const success = !hasDC || total >= dc;
        const margin = hasDC ? dc - total : 0;

        const abilityLabel = CONFIG.DND5E?.abilities?.[ability]?.label ?? ability.toUpperCase();
        const toolName = this.recipes.find((t) => t.id === row.__toolId)?.toolName ?? "";

        let outcomeText = "";
        let consumed = [];
        let productName = null;
        let producedQty = 0;

        if (success) {
          for (const ing of ingredients) await consumeIngredient(actorDoc, ing, 1);
          consumed = [...ingredients];
          producedQty = await rollQuantity(row.quantity);
          productName = await grantProduct(actorDoc, resolution, producedQty);
          outcomeText = `Crafted ${producedQty}× ${productName}.`;
        } else if (margin <= 5) {
          let toLose = ingredients[0];
          if (ingredients.length >= 2) toLose = await chooseIngredientDialog(ingredients);
          await consumeIngredient(actorDoc, toLose, 1);
          consumed = [toLose];
          outcomeText = `Failed by ${margin}. Lost 1 ingredient (${toLose}).`;
        } else {
          for (const ing of ingredients) await consumeIngredient(actorDoc, ing, 1);
          consumed = [...ingredients];
          outcomeText = `Failed by ${margin}. Lost all ingredients (${ingredients.join(", ")}).`;
        }

        const flavorParts = [
          `<strong>Combo Crafting — ${esc(row.name)}</strong>`,
          `${esc(toolName)} · ${esc(abilityLabel)} check${proficient ? " (proficient)" : ""}${
            books ? ` · Combo Books +${books}` : ""
          }`,
          hasDC ? `DC ${dc}` : "no DC",
        ];
        await roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
          flavor: flavorParts.join(" — "),
        });

        const resultColor = success ? "#4ade80" : "#f87171";
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
          content: `<div style="border-left:3px solid ${resultColor};padding:4px 8px">
            <p style="margin:0"><strong>${esc(row.name)}</strong> — ${
              success ? "Success" : "Failure"
            } (rolled ${total}${hasDC ? ` vs DC ${dc}` : ""})</p>
            <p style="margin:2px 0 0;font-size:12px;color:#a8a29e">${esc(outcomeText)}</p>
          </div>`,
        });

        this.lastResult = {
          success,
          text: `${row.name}: ${outcomeText} (rolled ${total}${hasDC ? ` vs DC ${dc}` : ""})`,
          consumed,
        };
      } catch (err) {
        console.error("Combo Crafting error", err);
        ui.notifications.error("Combo Crafting: something went wrong (see console).");
      } finally {
        this.busy = false;
        this.render(false);
      }
    }

    _styles() {
      return `<style>
        #combo-crafting-app .window-content { padding: 0; background: #12100e; }
        #cc-root { display:flex; flex-direction:column; height:100%; color:#e7e2d6;
          font-family: "Signika","Trebuchet MS",sans-serif; overflow:hidden;
          background:
            radial-gradient(1200px 400px at 10% -10%, rgba(214,158,73,0.10), transparent 60%),
            radial-gradient(900px 500px at 110% 0%, rgba(120,80,40,0.14), transparent 55%),
            linear-gradient(180deg,#1a1712,#100e0b); }
        #cc-root .cc-header { display:flex; align-items:center; justify-content:space-between;
          padding:12px 16px; border-bottom:1px solid #4a3b23;
          background:linear-gradient(180deg,rgba(50,40,24,0.75),rgba(30,24,15,0.4)); }
        #cc-root .cc-title { display:flex; align-items:baseline; gap:12px; }
        #cc-root .cc-title-main { font-weight:800; letter-spacing:2px; font-size:20px; color:#f2c879;
          text-shadow:0 1px 0 #000,0 0 14px rgba(214,158,73,0.35); }
        #cc-root .cc-title-sub { font-size:13px; color:#cdbfa6; opacity:0.9; }
        #cc-root .cc-books { display:flex; align-items:center; gap:6px; font-size:12px;
          padding:5px 10px; border:1px solid #6b5324; border-radius:999px;
          background:rgba(214,158,73,0.10); color:#e9d3a0; }

        #cc-root .cc-filters { display:flex; gap:10px; align-items:stretch; padding:10px 14px;
          border-bottom:1px solid #34291a; background:rgba(0,0,0,0.25); }
        #cc-root .cc-tools-combo { position:relative; flex:0 1 280px; min-width:200px; }
        #cc-root .cc-tools-trigger { width:100%; display:flex; align-items:center; justify-content:space-between;
          gap:8px; padding:8px 12px; border-radius:8px; cursor:pointer; color:#f4ecd9;
          border:1px solid #6b5324; background:linear-gradient(180deg,#2a2113,#1c1710);
          font-size:13px; font-weight:600; text-align:left; }
        #cc-root .cc-tools-trigger:hover { border-color:#a97e35; }
        #cc-root .cc-tools-combo.is-open .cc-tools-trigger { border-color:#e0b25f;
          box-shadow:0 0 0 1px rgba(224,178,95,0.35); }
        #cc-root .cc-tools-trigger-label { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #cc-root .cc-tools-trigger-caret { color:#e0b25f; font-size:12px; }
        #cc-root .cc-tools-menu { position:absolute; z-index:20; top:calc(100% + 4px); left:0; right:0;
          max-height:280px; overflow-y:auto; padding:6px;
          border:1px solid #6b5324; border-radius:9px;
          background:#1a1510; box-shadow:0 10px 28px rgba(0,0,0,0.55); }
        #cc-root .cc-tools-menu-actions { display:flex; gap:6px; margin-bottom:6px; }
        #cc-root .cc-tools-menu-actions button { flex:1; padding:4px 8px; font-size:11px;
          border-radius:6px; border:1px solid #4a3b23; background:#2a2113; color:#d8cbb0; cursor:pointer; }
        #cc-root .cc-tools-menu-actions button:hover { border-color:#a97e35; color:#f2e6cc; }
        #cc-root .cc-tool-option { display:flex; align-items:center; gap:8px; padding:7px 8px;
          border-radius:6px; cursor:pointer; font-size:13px; color:#e7e2d6; }
        #cc-root .cc-tool-option:hover { background:rgba(224,178,95,0.10); }
        #cc-root .cc-tool-option input { accent-color:#e0b25f; }
        #cc-root .cc-tool-option-name { flex:1 1 auto; }
        #cc-root .cc-tool-option-count { font-size:11px; padding:1px 7px; border-radius:999px;
          background:rgba(0,0,0,0.35); color:#c9b58a; }

        #cc-root .cc-search { display:flex; align-items:center; gap:8px; flex:1 1 auto; min-width:180px;
          padding:0 10px; border-radius:8px; border:1px solid #6b5324; background:#1c1710; }
        #cc-root .cc-search:focus-within { border-color:#e0b25f;
          box-shadow:0 0 0 1px rgba(224,178,95,0.35); }
        #cc-root .cc-search-icon { flex:0 0 auto; width:14px; text-align:center; line-height:1;
          color:#9d8f74; font-size:12px; margin:0; pointer-events:none; }
        #cc-root .cc-search-input { flex:1 1 auto; min-width:0; width:auto; box-sizing:border-box;
          margin:0; padding:8px 0; border:none !important; outline:none !important;
          box-shadow:none !important; background:transparent; color:#f4ecd9; font-size:13px;
          height:auto; line-height:1.3; }
        #cc-root .cc-search-input::placeholder { color:#8a7d63; }
        #cc-root .cc-search-clear { flex:0 0 auto; border:none; background:transparent; color:#c9b58a;
          font-size:18px; line-height:1; cursor:pointer; padding:0 2px; margin:0; height:auto;
          box-shadow:none; }

        #cc-root .cc-grid-wrap { flex:1 1 auto; overflow-y:auto; padding:12px 14px; }
        #cc-root .cc-tool-head { display:flex; align-items:baseline; gap:10px; margin:0 2px 10px; }
        #cc-root .cc-tool-head-name { font-size:16px; font-weight:700; color:#f2c879; }
        #cc-root .cc-tool-head-count { font-size:12px; color:#9d8f74; }
        #cc-root .cc-empty-soft { padding:28px 12px; text-align:center; color:#9d8f74; font-size:13px; }
        #cc-root .cc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr));
          gap:10px; }
        #cc-root .cc-card { border:1px solid #4a3b23; border-radius:10px; padding:10px 11px;
          background:linear-gradient(180deg,#211a10,#171208); cursor:pointer;
          transition:transform .1s ease,border-color .1s ease,box-shadow .1s ease;
          display:flex; flex-direction:column; gap:8px; position:relative; }
        #cc-root .cc-card:hover { border-color:#a97e35; transform:translateY(-1px);
          box-shadow:0 4px 14px rgba(0,0,0,0.45); }
        #cc-root .cc-card.is-selected { border-color:#f2c879;
          box-shadow:0 0 0 1px #f2c879,0 6px 18px rgba(0,0,0,0.5); }
        #cc-root .cc-card.is-disabled { opacity:0.42; cursor:not-allowed; filter:grayscale(0.6); }
        #cc-root .cc-card.is-disabled:hover { transform:none; border-color:#4a3b23; box-shadow:none; }
        #cc-root .cc-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:6px; }
        #cc-root .cc-card-name { font-weight:700; font-size:14px; color:#f4ecd9; line-height:1.2; }
        #cc-root .cc-tool-badge { align-self:flex-start; font-size:10px; color:#c9b58a;
          padding:2px 7px; border-radius:999px; border:1px solid #4a3b23; background:rgba(0,0,0,0.25); }
        #cc-root .cc-cat { font-size:10px; font-weight:700; letter-spacing:0.4px; padding:2px 6px;
          border-radius:5px; border:1px solid; white-space:nowrap; }
        #cc-root .cc-ings { display:flex; flex-direction:column; gap:4px; }
        #cc-root .cc-ing { display:flex; align-items:center; justify-content:space-between;
          font-size:12px; padding:3px 7px; border-radius:6px; }
        #cc-root .cc-ing.ok { background:rgba(74,222,128,0.12); color:#bbf2c9; }
        #cc-root .cc-ing.missing { background:rgba(248,113,113,0.14); color:#f6c0c0; }
        #cc-root .cc-ing-count { font-variant-numeric:tabular-nums; font-weight:700; opacity:0.85; }
        #cc-root .cc-card-foot { display:flex; align-items:center; justify-content:space-between;
          margin-top:2px; padding-top:6px; border-top:1px dashed #3a2e1b; font-size:12px; }
        #cc-root .cc-dc { color:#e9c07a; font-weight:700; }
        #cc-root .cc-qty { color:#c9b58a; }
        #cc-root .cc-banner { display:flex; align-items:center; gap:10px; margin:0 14px 4px;
          padding:9px 12px; border-radius:8px; font-size:13px; }
        #cc-root .cc-banner.success { background:rgba(74,222,128,0.12); border:1px solid #2f6f45; color:#c6f4d3; }
        #cc-root .cc-banner.fail { background:rgba(248,113,113,0.12); border:1px solid #7a3535; color:#f6cccc; }
        #cc-root .cc-banner-icon { font-weight:900; }
        #cc-root .cc-footer { display:flex; align-items:center; justify-content:space-between; gap:12px;
          padding:12px 16px; border-top:1px solid #4a3b23;
          background:linear-gradient(180deg,rgba(30,24,15,0.4),rgba(50,40,24,0.75)); }
        #cc-root .cc-footer-left { display:flex; align-items:center; gap:10px; }
        #cc-root .cc-ability-label { font-size:12px; color:#c9b58a; text-transform:uppercase; letter-spacing:1px; }
        #cc-root .cc-ability { background:#1c1710; color:#f4ecd9; border:1px solid #6b5324;
          border-radius:7px; padding:6px 10px; font-size:13px; }
        #cc-root .cc-prof { font-size:11px; padding:3px 9px; border-radius:999px; border:1px solid #5a4a2c;
          color:#a99a7c; }
        #cc-root .cc-prof.is-on { color:#bbf2c9; border-color:#2f6f45; background:rgba(74,222,128,0.10); }
        #cc-root .cc-craft { padding:10px 22px; border-radius:9px; font-weight:800; font-size:14px;
          letter-spacing:0.5px; cursor:pointer; color:#1a1305; border:1px solid #f2c879;
          background:linear-gradient(180deg,#f7d489,#d99f3c);
          box-shadow:0 3px 10px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.4);
          text-shadow:0 1px 0 rgba(255,255,255,0.3); transition:filter .1s ease; }
        #cc-root .cc-craft:hover:not([disabled]) { filter:brightness(1.08); }
        #cc-root .cc-craft[disabled] { opacity:0.4; cursor:not-allowed; filter:grayscale(0.5); }
        #cc-root .cc-empty { flex:1; display:flex; flex-direction:column; align-items:center;
          justify-content:center; gap:8px; padding:40px; text-align:center; color:#cbbd9f; }
        #cc-root .cc-empty-sub { font-size:13px; color:#9d8f74; }
      </style>`;
    }
  }

  globalThis.__amellwindComboCraftingApp?.close?.();
  const app = new ComboCraftingApp(caller, RECIPES);
  globalThis.__amellwindComboCraftingApp = app;
  app.render(true);
})();
