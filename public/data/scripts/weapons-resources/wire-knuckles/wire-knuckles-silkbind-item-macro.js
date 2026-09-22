// Wire Knuckles — Silkbind Item Macro (MidiQOL 12.4 / Foundry v12 / dnd5e 4.4)
// On Use: [postActiveEffects]ItemMacro
//
// Silkbind Tether — radius template + Tethered metadata + grant Snap Tether feat
// Silkbind Grapple — require Tethered (Grappled AE is activity-linked)
// Snap Tether (weapon) — hunter release: clear tether zone + effect (no save)

const NS = "wireKnuckles";
const FLAG = `flags.world.${NS}`;

const macroPass = String(
  args?.[0]?.macroPass
  ?? workflow?.macroPass
  ?? "",
).toLowerCase();

const rolled = (typeof rolledActivity !== "undefined" && rolledActivity)
  ? rolledActivity
  : (workflow?.activity ?? args?.[0]?.activity ?? null);

const actName = String(rolled?.name ?? workflow?.activity?.name ?? "").toLowerCase();
const actId = String(
  rolled?.identifier
  ?? rolled?.midiProperties?.identifier
  ?? workflow?.activity?.identifier
  ?? "",
).toLowerCase();

const isTether =
  actId === "silkbind-tether"
  || actName === "silkbind tether"
  || actName.startsWith("silkbind upgrade");
const isGrapple =
  actId === "silkbind-grapple"
  || actName === "silkbind grapple";
const isRelease =
  actId === "snap-tether"
  || actId === "snap-silkbind"
  || actName === "snap tether"
  || actName === "snap silkbind";

if (!isTether && !isGrapple && !isRelease) return;
if (macroPass && !macroPass.includes("postactiveeffects")) return;

const actorDoc = actor
  ?? workflow?.actor
  ?? item?.actor
  ?? item?.parent
  ?? (typeof token !== "undefined" ? token?.actor : null);

if (!actorDoc) {
  ui.notifications.warn("Wire Knuckles: actor not found.");
  return;
}

const cfg = foundry.utils.getProperty(item, FLAG) ?? {};
const tetherRadius = Math.max(5, Number(cfg.tetherRadius ?? 15) || 15);
const dcBonus = Math.max(0, Number(cfg.dcBonus ?? 0) || 0);

const silkbindDc = (sourceActor) => {
  const pb = Number(sourceActor?.system?.attributes?.prof ?? 0) || 0;
  const str = Number(sourceActor?.system?.abilities?.str?.mod ?? 0) || 0;
  const dex = Number(sourceActor?.system?.abilities?.dex?.mod ?? 0) || 0;
  return 8 + pb + Math.max(str, dex) + dcBonus;
};

const workflowTargets = () => {
  const fromWf = Array.from(workflow?.targets ?? []);
  if (fromWf.length) return fromWf;
  return Array.from(game.user?.targets ?? []);
};

const isTetheredEffect = (ef) => {
  if (!ef || ef.disabled) return false;
  if (foundry.utils.getProperty(ef, `${FLAG}.isTethered`) === true) return true;
  return /^tethered$/i.test(String(ef.name ?? ""));
};

const findTethered = (targetActor) =>
  [...(targetActor?.effects ?? [])].find((ef) => isTetheredEffect(ef)) ?? null;

const ensureCleanupHook = () => {
  if (globalThis.__amellwindWireKnucklesHooks) return;
  globalThis.__amellwindWireKnucklesHooks = true;

  Hooks.on("deleteActiveEffect", async (ef) => {
    try {
      if (foundry.utils.getProperty(ef, `${FLAG}.isTethered`) !== true) return;
      const templateId = foundry.utils.getProperty(ef, `${FLAG}.templateId`);
      const snapItemUuid = foundry.utils.getProperty(ef, `${FLAG}.snapItemUuid`);
      if (templateId && canvas.scene) {
        const tpl = canvas.scene.templates?.get(templateId);
        if (tpl) await tpl.delete();
      }
      if (snapItemUuid) {
        const snapItem = await fromUuid(snapItemUuid);
        if (snapItem) await snapItem.delete();
      }
    } catch (err) {
      console.warn("Wire Knuckles | tether cleanup failed", err);
    }
  });
};

const placeTetherTemplate = async (tokenDoc, radiusFt) => {
  const scene = canvas.scene;
  if (!scene || !tokenDoc) return null;
  const center = tokenDoc.center
    ?? tokenDoc.getCenterPoint?.()
    ?? {
      x: tokenDoc.x + (tokenDoc.width * (canvas.grid?.size ?? 100)) / 2,
      y: tokenDoc.y + (tokenDoc.height * (canvas.grid?.size ?? 100)) / 2,
    };

  // Remove prior tether templates from this weapon/origin.
  const prior = (scene.templates ?? []).filter(
    (tpl) =>
      foundry.utils.getProperty(tpl, `${FLAG}.isTetherZone`) === true
      && foundry.utils.getProperty(tpl, `${FLAG}.weaponUuid`) === item.uuid,
  );
  if (prior.length) {
    await scene.deleteEmbeddedDocuments(
      "MeasuredTemplate",
      prior.map((t) => t.id),
    );
  }

  const [doc] = await scene.createEmbeddedDocuments("MeasuredTemplate", [
    {
      t: "circle",
      user: game.user.id,
      x: center.x,
      y: center.y,
      direction: 0,
      distance: radiusFt,
      angle: 0,
      width: 0,
      borderColor: "#6ec6ff",
      fillColor: "#1a4a6e",
      hidden: false,
      flags: {
        world: {
          [NS]: {
            isTetherZone: true,
            weaponUuid: item.uuid,
            originUuid: actorDoc.uuid,
            radius: radiusFt,
          },
        },
      },
    },
  ]);
  return doc;
};

const SNAP_TETHER_MACRO = `// Snap Tether (granted by Silkbind) — postSave cleanup
const pass = String(args?.[0]?.macroPass ?? workflow?.macroPass ?? "").toLowerCase();
if (pass && !pass.includes("postsave")) return;

const failed = new Set(
  [...(workflow?.failedSaves ?? [])].map((t) => t.id ?? t.document?.id),
);
const saved = [...(workflow?.saves ?? workflow?.targets ?? [])].filter((t) => {
  const id = t.id ?? t.document?.id;
  return id && !failed.has(id);
});

// Save activity targeting self: success = workflow.saves has the actor / no failedSaves
const actorDoc = actor ?? workflow?.actor ?? item?.actor ?? item?.parent;
if (!actorDoc) return;

const selfToken = actorDoc.getActiveTokens?.()?.[0];
const selfId = selfToken?.id;
const succeeded =
  (selfId && saved.some((t) => (t.id ?? t.document?.id) === selfId))
  || (workflow?.saveResults?.length && !failed.size)
  || (Array.from(workflow?.saves ?? []).length > 0 && failed.size === 0);

if (!succeeded && failed.size) return;

const tetherEf = [...(actorDoc.effects ?? [])].find((ef) =>
  foundry.utils.getProperty(ef, "flags.world.wireKnuckles.isTethered") === true
  || /^tethered$/i.test(String(ef.name ?? "")),
);
if (!tetherEf) {
  if (item) await item.delete();
  return;
}
await tetherEf.delete();
`;

const grantSnapTetherFeat = async (targetActor, meta) => {
  // Drop prior snap feats from this weapon.
  const stale = targetActor.items.filter(
    (i) =>
      foundry.utils.getProperty(i, `${FLAG}.isSnapTether`) === true
      && foundry.utils.getProperty(i, `${FLAG}.weaponUuid`) === item.uuid,
  );
  if (stale.length) {
    await targetActor.deleteEmbeddedDocuments(
      "Item",
      stale.map((i) => i.id),
    );
  }

  const snapActId = foundry.utils.randomID?.(16)
    ?? Math.random().toString(36).slice(2, 18);
  const [created] = await targetActor.createEmbeddedDocuments("Item", [
    {
      name: "Snap Tether",
      type: "feat",
      img: "icons/magic/control/debuff-chains-purple.webp",
      system: {
        description: {
          value:
            "<p>At the start of your turn (or as allowed by the GM), attempt a Strength saving throw against the silkbinder's Silkbind DC. On a success, the ironsilk snaps: the Tethered effect and tether zone end.</p>",
        },
        activities: {
          [snapActId]: {
            _id: snapActId,
            type: "save",
            sort: 0,
            name: "Snap Tether",
            img: "icons/magic/control/debuff-chains-purple.webp",
            activation: {
              type: "special",
              value: null,
              condition: "While you are Tethered (typically at the start of your turn)",
              override: false,
            },
            consumption: {
              scaling: { allowed: false, max: "" },
              spellSlot: false,
              targets: [],
            },
            description: {
              chatFlavor:
                `STR save vs Silkbind DC ${meta.dc}. On a success, remove Tethered and the tether zone.`,
            },
            duration: {
              value: "",
              units: "inst",
              concentration: false,
              override: false,
            },
            effects: [],
            range: { units: "self", special: "", override: false },
            target: {
              template: {
                count: "",
                contiguous: false,
                type: "",
                size: "",
                width: "",
                height: "",
                units: "ft",
              },
              affects: {
                count: "",
                type: "self",
                choice: false,
                special: "",
              },
              prompt: false,
              override: false,
            },
            uses: { spent: 0, max: "", recovery: [] },
            midiProperties: {
              ignoreTraits: [],
              triggeredActivityId: "none",
              triggeredActivityConditionText: "",
              triggeredActivityTargets: "targets",
              triggeredActivityRollAs: "self",
              autoConsume: false,
              forceConsumeDialog: "default",
              forceRollDialog: "default",
              forceDamageDialog: "default",
              confirmTargets: "default",
              autoTargetType: "any",
              autoTargetAction: "default",
              automationOnly: false,
              otherActivityCompatible: true,
              identifier: "snap-tether",
              displayActivityName: true,
              rollMode: "default",
              chooseEffects: false,
              toggleEffect: false,
              ignoreFullCover: false,
              removeChatButtons: "default",
              magicEffect: false,
              magicDamage: false,
              noConcentrationCheck: false,
              autoCEEffects: "default",
            },
            damage: { parts: [], onSave: "none" },
            save: {
              ability: ["str"],
              dc: { calculation: "", formula: String(meta.dc) },
            },
            useConditionText: "",
            useConditionReason: "",
            effectConditionText: "",
            otherActivityId: "none",
          },
        },
      },
      flags: {
        world: {
          [NS]: {
            isSnapTether: true,
            weaponUuid: item.uuid,
            originUuid: actorDoc.uuid,
            tetherEffectId: meta.effectId,
          },
        },
        "midi-qol": {
          onUseMacroName: "[postSave]ItemMacro",
          onUseMacroParts: {
            items: [{ macroName: "ItemMacro", option: "postSave" }],
          },
        },
        itemacro: {
          macro: {
            name: "Snap Tether",
            type: "script",
            scope: "global",
            command: SNAP_TETHER_MACRO,
            img: "icons/svg/dice-target.svg",
          },
        },
      },
    },
  ]);
  return created;
};

const clearTetherOnActor = async (targetActor) => {
  const ef = findTethered(targetActor);
  if (ef) {
    await ef.delete();
    return;
  }
  // Effect already gone — still try orphan template cleanup via weapon uuid.
  const scene = canvas.scene;
  if (!scene) return;
  const prior = (scene.templates ?? []).filter(
    (tpl) =>
      foundry.utils.getProperty(tpl, `${FLAG}.isTetherZone`) === true
      && foundry.utils.getProperty(tpl, `${FLAG}.weaponUuid`) === item.uuid,
  );
  if (prior.length) {
    await scene.deleteEmbeddedDocuments(
      "MeasuredTemplate",
      prior.map((t) => t.id),
    );
  }
};

ensureCleanupHook();

if (isTether) {
  const dc = silkbindDc(actorDoc);
  for (const t of workflowTargets()) {
    const targetActor = t.actor;
    const tokenDoc = t.document ?? t;
    if (!targetActor) continue;

    const tpl = await placeTetherTemplate(tokenDoc, tetherRadius);
    const ef = findTethered(targetActor);
    if (!ef) {
      ui.notifications.warn(
        "Wire Knuckles: Tethered effect missing on target — place template only.",
      );
    }

    const snap = ef
      ? await grantSnapTetherFeat(targetActor, { dc, effectId: ef.id })
      : null;

    if (ef) {
      await ef.update({
        description:
          `Tethered by ironsilk. Cannot move more than ${tetherRadius} feet away from the embed point. Use your <strong>Snap Tether</strong> feat (STR save DC ${dc}) to snap the silk.`,
        flags: {
          ...(ef.flags ?? {}),
          world: {
            ...((ef.flags?.world) ?? {}),
            [NS]: {
              isTethered: true,
              templateId: tpl?.id ?? null,
              weaponUuid: item.uuid,
              originUuid: actorDoc.uuid,
              snapItemUuid: snap?.uuid ?? null,
              dc,
              radius: tetherRadius,
            },
          },
        },
      });
    }
  }
  return;
}

if (isGrapple) {
  for (const t of workflowTargets()) {
    const targetActor = t.actor;
    if (!targetActor) continue;
    if (!findTethered(targetActor)) {
      ui.notifications.warn(
        `Silkbind Grapple: ${targetActor.name} is not Tethered.`,
      );
    }
  }
  return;
}

if (isRelease) {
  for (const t of workflowTargets()) {
    const targetActor = t.actor;
    if (!targetActor) continue;
    await clearTetherOnActor(targetActor);
  }
}
