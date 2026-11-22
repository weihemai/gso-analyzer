                    if (!entry.country && COUNTRY_FULL_TO_ISO.hasOwnProperty(line.toUpperCase())) {
                        entry.country = COUNTRY_FULL_TO_ISO[line.toUpperCase()];
                        continue;
                    }

                    if (cardStatus === "") {
                        cardStatus = statusFromText(line.replace(/^Status[\s:]*/i, ""));
                    }

                    sc = scopeFromCardLine(line);

                    if (sc && !entry.scopes[sc.key].active) {
                        entry.scopes[sc.key].active = true;
                        entry.scopes[sc.key].status = sc.status;
                    }
                }

                for (k = 0; k < SCOPE_KEYS.length; k++) {
                    if (entry.scopes[SCOPE_KEYS[k]].active && !entry.scopes[SCOPE_KEYS[k]].status) {
                        entry.scopes[SCOPE_KEYS[k]].status = cardStatus;
                    }
                }

                if (!cardStatus) {
                    var hasInline = false;

                    for (k = 0; k < SCOPE_KEYS.length; k++) {
                        if (entry.scopes[SCOPE_KEYS[k]].status) {
                            hasInline = true;
                        }
                    }

                    if (!hasInline) {
                        entry.assumedStatus = true;

                        for (k = 0; k < SCOPE_KEYS.length; k++) {
                            if (entry.scopes[SCOPE_KEYS[k]].active) {
                                entry.scopes[SCOPE_KEYS[k]].status = "notified";
                            }
                        }
                    }
                }

                if (config.verbose && entry.assumedStatus && i === 0) {
                    log("Register: no card-level status found in HTML - assuming 'notified'. Use 'Dump List HTML' to calibrate.", "warn");
                }

                out.entries.push(entry);
            }

            if (target) {
                var n, e;

                for (n = 0; n < out.entries.length; n++) {
                    e = out.entries[n];

                    if (target[e.id]) {
                        syncStateDups++;
                        log("Register anomaly: duplicate NB " + e.id + " ('" + e.fullname + "') - keeping first occurrence.", "warn");
                    } else {
                        target[e.id] = e;
                    }
                }
            }

            return out;
        }

        var syncStateDups = 0;

        function resetSyncDups() {
            syncStateDups = 0;
        }

        function startSync(manual) {
            if (isSyncing || isScanning) {
                if (manual) {
                    alert("Scan in progress - stop it first.");
                }

                return;
            }

            isSyncing = true;
            resetSyncDups();
            setBusyUI(false, true);

            syncState = {
                manual: manual,
                page: 1,
                pagesTotal: 0,
                found: 0,
                reg: {},
                retries: 0
            };

            log(manual ? "Register sync started (manual)." : "Startup register check started...", "info");
            updateStatus("Register sync: fetching page 1...");

            setTimeout(syncTick, 10);
        }

        function syncTick() {
            if (!isSyncing || !syncState) {
                return;
            }

            var url = REG_LIST_URL + "?orderBy=number&page=" + syncState.page;
            var parsed;

            try {
                var res = httpGet(url);

                if (res.status !== 200) {
                    throw new Error("HTTP " + res.status);
                }

                parsed = parseRegisterPage(res.text || "", syncState.reg);

                if (parsed.pages > 0) {
                    syncState.pagesTotal = parsed.pages;
                }

                if (parsed.found > 0) {
                    syncState.found = parsed.found;
                }

                syncState.retries = 0;
            } catch (err) {
                syncState.retries++;

                if (syncState.retries < 3) {
                    log("Register fetch failed (page " + syncState.page + "), retry " + syncState.retries + "/3: " + err.message, "warn");

                    setTimeout(syncTick, 2000 * syncState.retries);
                    return;
                }

                log("Register check aborted (page " + syncState.page + "): " + err.message, "err");
                finishSync("Register sync failed");
                return;
            }

            updateStatus("Register sync: page " + syncState.page + "/" + (syncState.pagesTotal || "?") + " | " + countKeys(syncState.reg) + " NB(s)");

            if (syncState.pagesTotal > 0 && syncState.page < syncState.pagesTotal) {
                syncState.page++;
                setTimeout(syncTick, 300);
                return;
            }

            applySync();
        }

        function normName(s) {
            return squash(String(s || "")).toUpperCase().replace(/&/g, "AND").replace(/[^A-Z0-9]+/g, " ").replace(/\s+/g, " ").replace(/^ | $/g, "");
        }

        function cityFromName(fullname) {
            var up = String(fullname || "").toUpperCase();
            var k;

            for (k in CITY_ABBREV) {
                if (CITY_ABBREV.hasOwnProperty(k) && up.indexOf(k) >= 0) {
                    return CITY_ABBREV[k];
                }
            }

            return "";
        }

        function generateShortname(fullname, countryIso, id) {
            var token = "";
            var m = String(fullname || "").match(/\(([A-Za-z0-9&\-\.]{2,12})\)/);

            if (m) {
                token = m[1];
            }

            if (!token) {
                var up = String(fullname || "").toUpperCase();
                var i;

                for (i = 0; i < groupKeysSorted.length; i++) {
                    if (up.indexOf(groupKeysSorted[i]) === 0) {
                        token = GROUP_DICT[groupKeysSorted[i]];
                        break;
                    }
                }
            }

            if (!token) {
                token = squash(String(fullname || "").split(/[\s(\/,\-]/)[0]).replace(/[^A-Za-z0-9]/g, "").toUpperCase();

                if (token.length > 10) {
                    token = token.substring(0, 10);
                }

                if (token === "") {
                    token = "NB";
                }
            }

            var suffix = countryIso || "XX";

            if (shortnameExists(token + "-" + suffix, "")) {
                var city = cityFromName(fullname);

                if (city && !shortnameExists(token + "-" + city, "")) {
                    suffix = city;
                } else {
                    suffix = String(parseInt(id, 10) || id);
                }
            }

            return token + "-" + suffix;
        }

        function buildNBFromRegister(r) {
            var nb = {
                nb_shortname: generateShortname(r.fullname, r.country, r.id),
                nb_fullname: r.fullname,
                nb_country: r.country,
                nb_number_gcts: 0,
                nb_number_gcts_timeline: {},
                nb_previous_names: [],
                nb_shortname_manual: false
            };

            var k, key;

            for (k = 0; k < SCOPE_KEYS.length; k++) {
                key = SCOPE_KEYS[k];
                nb["nb_scope_" + key] = !!r.scopes[key].active;
                nb["nb_status_" + key] = r.scopes[key].active ? (r.scopes[key].status || "notified") : "";
            }

            return nb;
        }

        function scopeListText(r) {
            var parts = [];
            var k;

            for (k = 0; k < SCOPE_KEYS.length; k++) {
                if (r.scopes[SCOPE_KEYS[k]].active) {
                    parts.push(SCOPE_LABELS[SCOPE_KEYS[k]]);
                }
            }

            return parts.length ? parts.join("+") : "none";
        }

        function applySync() {
            if (!syncState) {
                finishSync("Register sync finished");
                return;
            }

            var reg = syncState.reg;
            var collected = countKeys(reg);

            if (syncState.found > 0 && collected < syncState.found) {
                log(
                    "Warning: collected " + collected + " of " + syncState.found +
                    " NB(s) from register - results may be incomplete (page shifted between requests).",
                    "warn"
                );
            }

            if (syncStateDups > 0) {
                log("Register anomalies: " + syncStateDups + " duplicate NB number(s) skipped.", "warn");
            }

            var newOnes = [];
            var scopeChanges = [];
            var nameChanges = [];
            var missing = [];
            var id, r, nb, k, i, key;

            for (id in reg) {
                if (!reg.hasOwnProperty(id)) {
                    continue;
                }

                r = reg[id];
                nb = NBs[id];

                if (!nb) {
                    newOnes.push(r);
                    continue;
                }

                var changes = [];

                for (k = 0; k < SCOPE_KEYS.length; k++) {
                    key = SCOPE_KEYS[k];
                    var active = !!r.scopes[key].active;
                    var st = active ? (r.scopes[key].status || "notified") : "";

                    if (nb["nb_scope_" + key] !== active) {
                        changes.push({ key: key, type: "scope", from: nb["nb_scope_" + key], to: active, status: st });
                    } else if (active && nb["nb_status_" + key] !== st) {
                        changes.push({ key: key, type: "status", from: nb["nb_status_" + key], to: st });
                    }
                }

                if (changes.length > 0) {
                    scopeChanges.push({ r: r, changes: changes });
                }

                if (normName(nb.nb_fullname) !== normName(r.fullname) && !isCorruptName(nb.nb_fullname)) {
                    nameChanges.push({ r: r });
                }
            }

            for (id in NBs) {
                if (NBs.hasOwnProperty(id) && !reg[id]) {
                    missing.push(id);
                }
            }

            newOnes.sort(function(a, b) {
                return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
            });
            nameChanges.sort(function(a, b) {
                return a.r.id < b.r.id ? -1 : 1;
            });
            missing.sort();

            log(
                "Register diff: " + newOnes.length + " new | " +
                scopeChanges.length + " record(s) with scope/status change(s) | " +
                nameChanges.length + " name change(s) | " +
                missing.length + " not in register",
                "info"
            );

            var appliedScopeChanges = 0;
            var appliedNew = 0;
            var appliedNames = 0;

            for (i = 0; i < scopeChanges.length; i++) {
                var scRec = scopeChanges[i];
                var target = NBs[scRec.r.id];
                var j;

                for (j = 0; j < scRec.changes.length; j++) {
                    var ch = scRec.changes[j];

                    target["nb_scope_" + ch.key] = ch.to;
                    target["nb_status_" + ch.key] = ch.to ? ch.status : "";
                    appliedScopeChanges++;

                    log(
                        "Auto-update " + scRec.r.id + " (" + target.nb_shortname + "): " +
                        SCOPE_LABELS[ch.key] + " " + ch.type + " " +
                        (ch.type === "scope"
                            ? (ch.to ? "added (" + ch.status + ")" : "removed")
                            : ch.from + " -> " + ch.to),
                        "ok"
                    );
                }

                updatedThisSession[scRec.r.id] = true;
            }

            if (countKeys(NBs) === 0 && newOnes.length > 0) {
                if (confirm(
                    "No NB data loaded (empty or missing/broken data.json).\n\n" +
                    "The GSO register lists " + newOnes.length + " NB(s).\n\n" +
                    "Pull the complete listing and build the local database from scratch?"
                )) {
                    for (i = 0; i < newOnes.length; i++) {
                        NBs[newOnes[i].id] = buildNBFromRegister(newOnes[i]);
                        updatedThisSession[newOnes[i].id] = true;
                        appliedNew++;

                        log(
                            "Built NB " + newOnes[i].id + " '" + newOnes[i].fullname +
                            "' (" + newOnes[i].country + ") scopes: " + scopeListText(newOnes[i]),
                            "ok"
                        );
                    }
                } else {
                    log("Full rebuild declined.", "warn");
                }
            } else if (newOnes.length > 0) {
                for (i = 0; i < newOnes.length; i++) {
                    r = newOnes[i];
                    var proposed = generateShortname(r.fullname, r.country, r.id);

                    if (confirm(
                        "New NB found in register - add it?\n\n" +
                        "NB " + r.id + ": " + r.fullname + "\n" +
                        "Country: " + r.country + "\n" +
                        "Scopes: " + scopeListText(r) + "\n" +
                        "Proposed shortname: " + proposed + "\n\n" +
                        "(You can adjust the shortname in the editor afterwards; " +
                        "manual edits are never overwritten by sync.)"
                    )) {
                        NBs[r.id] = buildNBFromRegister(r);
                        updatedThisSession[r.id] = true;
                        appliedNew++;

                        log(
                            "Added NB " + r.id + " '" + r.fullname +
                            "' (" + r.country + ") scopes: " + scopeListText(r),
                            "ok"
                        );
                    } else {
                        log("Skipped new NB " + r.id + " '" + r.fullname + "' (declined).", "warn");
                    }
                }
            }

            for (i = 0; i < nameChanges.length; i++) {
                var nc = nameChanges[i];
                var localNb = NBs[nc.r.id];
                var corrupt = isCorruptName(localNb.nb_fullname);

                if (corrupt || confirm(
                    "Name change detected for NB " + nc.r.id + ":\n\n" +
                    "Old: " + localNb.nb_fullname + "\n" +
                    "New: " + nc.r.fullname + "\n\n" +
                    "Accept the new name? (the previous name will be stored)"
                )) {
                    var oldName = localNb.nb_fullname;

                    localNb.nb_previous_names.push({
                        name: oldName,
                        changed: getDateStamp()
                    });

                    localNb.nb_fullname = nc.r.fullname;
                    appliedNames++;

                    log(
                        "Name updated " + nc.r.id + ": '" + oldName + "' -> '" + nc.r.fullname + "'" +
                        (corrupt ? " (auto-repaired corrupted name)" : ""),
                        "ok"
                    );
                } else {
                    log("Kept local name for NB " + nc.r.id + " (declined).", "warn");
                }
            }

            for (i = 0; i < missing.length; i++) {
                var missingNb = NBs[missing[i]];

                log(
                    "Not in register (check manually, nothing changed): " + missing[i] +
                    " (" + missingNb.nb_shortname + ")",
                    "warn"
                );
            }

            var totalChanges = appliedNew + appliedScopeChanges + appliedNames;

            if (totalChanges > 0) {
                backupDatedDataFile();
                saveData();
            }

            renderTable();

            if (selectedId && NBs[selectedId]) {
                loadSelectedToForm(selectedId);
            }

            finishSync(
                "Register sync finished: +" + appliedNew + " new, " +
                appliedScopeChanges + " scope/status update(s), " +
                appliedNames + " name update(s)"
            );
        }

        function finishSync(msg) {
            isSyncing = false;
            syncState = null;

            setBusyUI(isScanning, false);

            updateStatus(msg);
            log(msg, msg.indexOf("failed") >= 0 ? "err" : "ok");
        }

        function dumpListHtml() {
            if (isScanning || isSyncing) {
                alert("Wait for the current scan or sync to finish first.");

=== END OF PART 05 — CONTINUES IN NEXT PART (this marker MUST be the last line of this chunk) ===