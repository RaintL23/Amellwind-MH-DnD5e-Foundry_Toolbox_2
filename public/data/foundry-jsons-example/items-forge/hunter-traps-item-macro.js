// Hunter traps — Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [postActiveEffects]ItemMacro
//
// Activities:
//   set-trap      — spend 1 from the stack, stamp the 10-ft square template
//   retrieve-trap — pick up an unused trap of yours within 5 ft
//
// Canvas trigger / expiry / camouflage live on scripts/hunter-traps.js

(async () => {
  const macroPass = String(
    (typeof args !== "undefined" ? args?.[0]?.macroPass : "") ??
      (typeof workflow !== "undefined" ? workflow?.macroPass : "") ??
      "",
  ).toLowerCase();
  if (macroPass && !macroPass.includes("postactiveeffects")) return;

  const api = globalThis.__amellwindHunterTraps;
  if (!api?.armPlacedTemplate) {
    ui.notifications.warn(
      "Hunter Traps: module script is not armed. Enable Amellwind MH (RaintDM) and reload.",
    );
    return;
  }
  api.ensureHooks?.();

  const actorDoc =
    (typeof actor !== "undefined" && actor)
    || (typeof workflow !== "undefined" && workflow?.actor)
    || (typeof item !== "undefined" && (item?.actor ?? item?.parent))
    || (typeof token !== "undefined" ? token?.actor : null);

  if (!actorDoc) {
    ui.notifications.warn("Hunter Traps: actor not found.");
    return;
  }

  const rolled =
    (typeof rolledActivity !== "undefined" && rolledActivity)
    || workflow?.activity
    || (typeof args !== "undefined" ? args?.[0]?.activity : null);

  const actId = String(
    rolled?.identifier
    ?? rolled?.midiProperties?.identifier
    ?? workflow?.activity?.identifier
    ?? "",
  ).toLowerCase();
  const actName = String(rolled?.name ?? workflow?.activity?.name ?? "").toLowerCase();

  const isRetrieve =
    actId === "retrieve-trap" || actName.includes("retrieve");
  const isSet =
    actId === "set-trap" || actName.includes("set trap") || (!isRetrieve && actName.includes("set"));

  const tokenDoc =
    (typeof token !== "undefined" && token)
    || canvas.tokens?.controlled?.[0]
    || actorDoc.getActiveTokens?.()?.[0]
    || null;

  if (isRetrieve) {
    await api.retrieveTraps({ actor: actorDoc, token: tokenDoc, item });
    if (workflow) workflow.aborted = true;
    return;
  }

  if (!isSet) return;

  const qty = Math.max(0, Number(item?.system?.quantity ?? 0));
  if (qty < 1) {
    ui.notifications.warn("Hunter Traps: none left in this stack.");
    if (workflow) workflow.aborted = true;
    return;
  }

  const cfg = foundry.utils.getProperty(item, "flags.world.hunterTrap") ?? {};
  if (!cfg.trapKey || cfg.trapKey === "tool") {
    ui.notifications.warn("Hunter Traps: Trap Tool is a crafting component — it cannot be set.");
    if (workflow) workflow.aborted = true;
    return;
  }

  const resolveTemplate = () => {
    const fromWorkflow =
      workflow?.template
      ?? workflow?.templateDocument
      ?? (workflow?.templateId && canvas.scene?.templates?.get(workflow.templateId));
    if (fromWorkflow) return fromWorkflow;
    const uuid = workflow?.templateUuid ?? args?.[0]?.templateUuid;
    if (uuid) {
      const parsed = fromUuidSync?.(uuid);
      if (parsed) return parsed;
    }
    const mine = (canvas.scene?.templates ?? [])
      .filter((tpl) => tpl.user === game.user.id)
      .sort((a, b) => Number(b._stats?.modifiedTime ?? 0) - Number(a._stats?.modifiedTime ?? 0));
    return mine[0] ?? null;
  };

  let template = resolveTemplate();
  if (!template) {
    ui.notifications.warn("Hunter Traps: place the 10-foot square on the map, then try Set Trap again.");
    if (workflow) workflow.aborted = true;
    return;
  }

  const origin = tokenDoc?.center ?? tokenDoc?.getCenterPoint?.() ?? null;
  if (origin) {
    const center = template.object?.center ?? { x: template.x, y: template.y };
    const dist = canvas.grid?.measureDistance
      ? Number(canvas.grid.measureDistance(origin, center))
      : Infinity;
    if (Number.isFinite(dist) && dist > 5.5) {
      await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [template.id]).catch(() => null);
      ui.notifications.warn("Hunter Traps: you must set the trap in an unoccupied space within 5 feet.");
      if (workflow) workflow.aborted = true;
      return;
    }
  }

  await api.armPlacedTemplate(template, {
    trapKey: cfg.trapKey,
    family: cfg.family,
    isPlus: Boolean(cfg.isPlus),
    name: item.name,
    img: item.img,
    saveAbility: cfg.saveAbility,
    saveDc: cfg.saveDc,
    sizeMode: cfg.sizeMode,
    durationMode: cfg.durationMode,
    lightning: cfg.lightning || null,
    ownerActorId: actorDoc.id,
    ownerTokenId: tokenDoc?.id ?? tokenDoc?.document?.id ?? null,
    itemUuid: item.uuid,
  });

  await item.update({ "system.quantity": qty - 1 });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content:
      '<div class="dnd5e2"><p><strong>'
      + (item.name ?? "Hunter Trap")
      + "</strong> is set and camouflaged (DC 15 Perception within 10 ft, or Truesight). It lasts 1 hour, until it triggers, or until retrieved unused.</p></div>",
  });
})();
