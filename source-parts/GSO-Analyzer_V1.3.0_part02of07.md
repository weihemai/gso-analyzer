            stream.Charset = "utf-8";
            stream.Open();
            stream.WriteText(String(content));
            stream.Position = 0;
            stream.SaveToFile(tmp, 2);
            stream.Close();

            try {
                if (fso.FileExists(path)) {
                    backupFile(path);
                    fso.DeleteFile(path, true);
                }
                fso.MoveFile(tmp, path);
            } catch (e) {
                if (fso.FileExists(tmp)) {
                    try { fso.DeleteFile(tmp, true); } catch (e2) {
                    }
                }
                throw e;
            }
        }

        function cleanJsonText(txt) {
            txt = String(txt);

            if (txt.length > 0 && txt.charCodeAt(0) === 65279) {
                txt = txt.substring(1);
            }

            txt = txt.replace(/^\s+/, "");

            return txt;
        }

        function previewText(txt) {
            txt = String(txt);
            txt = txt.replace(/\r/g, "\\r");
            txt = txt.replace(/\n/g, "\\n");

            if (txt.length > 140) {
                txt = txt.substring(0, 140) + "...";
            }

            return txt;
        }

        function parseJsonSafe(txt) {
            txt = cleanJsonText(txt);

            try {
                if (typeof JSON !== "undefined" && JSON.parse) {
                    return JSON.parse(txt);
                }
            } catch (e1) {
            }

            try {
                return eval("(" + txt + ")");
            } catch (e2) {
                throw new Error(
                    "JSON parse failed: " + e2.message +
                    " | Preview: " + previewText(txt)
                );
            }
        }

        function stringifyJson(obj) {
            if (typeof JSON !== "undefined" && JSON.stringify) {
                return JSON.stringify(obj, null, 2);
            }

            return simpleStringify(obj, 0);
        }

        function simpleStringify(value, level) {
            var i, k, parts, indent, nextIndent;

            if (value === null) {
                return "null";
            }

            if (typeof value === "string") {
                return "\"" +
                    value
                        .replace(/\\/g, "\\\\")
                        .replace(/"/g, "\\\"")
                        .replace(/\r/g, "\\r")
                        .replace(/\n/g, "\\n")
                        .replace(/\t/g, "\\t") +
                    "\"";
            }

            if (typeof value === "number" || typeof value === "boolean") {
                return String(value);
            }

            indent = repeatStr("  ", level);
            nextIndent = repeatStr("  ", level + 1);

            if (isArray(value)) {
                parts = [];

                for (i = 0; i < value.length; i++) {
                    parts.push(nextIndent + simpleStringify(value[i], level + 1));
                }

                return "[\n" + parts.join(",\n") + "\n" + indent + "]";
            }

            parts = [];

            for (k in value) {
                if (value.hasOwnProperty(k)) {
                    parts.push(
                        nextIndent +
                        "\"" + k.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\": " +
                        simpleStringify(value[k], level + 1)
                    );
                }
            }

            return "{\n" + parts.join(",\n") + "\n" + indent + "}";
        }

        function isArray(v) {
            return Object.prototype.toString.call(v) === "[object Array]";
        }

        function repeatStr(s, count) {
            var out = "";

            while (count > 0) {
                out += s;
                count--;
            }

            return out;
        }

        function trim(s) {
            return String(s).replace(/^[\s\u00a0\u200e\u200f]+|[\s\u00a0\u200e\u200f]+$/g, "");
        }

        function squash(s) {
            return trim(String(s).replace(/[\u00a0\u200e\u200f]/g, " ").replace(/\s+/g, " "));
        }

        function countKeys(obj) {
            var c = 0;
            var k;

            for (k in obj) {
                if (obj.hasOwnProperty(k)) {
                    c++;
                }
            }

            return c;
        }

        function normalizeTimeline(timeline) {
            var clean = {};
            var k;
            var value;

            if (!timeline || typeof timeline !== "object") {
                return clean;
            }

            for (k in timeline) {
                if (timeline.hasOwnProperty(k)) {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(k)) {
                        value = parseInt(timeline[k], 10);

                        if (!isNaN(value) && value >= 0) {
                            clean[k] = value;
                        }
                    }
                }
            }

            return clean;
        }

        function cloneTimeline(timeline) {
            var copy = {};
            var k;

            if (!timeline) {
                return copy;
            }

            for (k in timeline) {
                if (timeline.hasOwnProperty(k)) {
                    copy[k] = timeline[k];
                }
            }

            return copy;
        }

        function validStatus(s) {
            return STATUS_LABELS.hasOwnProperty(String(s).toLowerCase()) ? String(s).toLowerCase() : "";
        }

        function isoCountry(c) {
            var up = String(c || "").toUpperCase();

            if (COUNTRY_FULL_TO_ISO.hasOwnProperty(up)) {
                return COUNTRY_FULL_TO_ISO[up];
            }

            return up;
        }

        function normalizeNB(id, obj) {
            if (!obj) {
                obj = {};
            }

            var nb = {
                nb_shortname: squash(obj.nb_shortname || ""),
                nb_fullname: squash(obj.nb_fullname || ""),
                nb_country: isoCountry(String(obj.nb_country || "")),
                nb_scope_toys: !!obj.nb_scope_toys,
                nb_scope_lv: !!obj.nb_scope_lv,
                nb_scope_wer: !!obj.nb_scope_wer,
                nb_scope_sc: !!obj.nb_scope_sc,
                nb_scope_ga: !!obj.nb_scope_ga,
                nb_scope_mslv: !!obj.nb_scope_mslv,
                nb_number_gcts: parseInt(obj.nb_number_gcts, 10) || 0,
                nb_number_gcts_timeline: normalizeTimeline(obj.nb_number_gcts_timeline),
                nb_previous_names: isArray(obj.nb_previous_names) ? obj.nb_previous_names : [],
                nb_shortname_manual: !!obj.nb_shortname_manual
            };

            var k, st, key;

            for (k = 0; k < SCOPE_KEYS.length; k++) {
                key = SCOPE_KEYS[k];
                st = validStatus(obj["nb_status_" + key]);
                nb["nb_status_" + key] = st;

                if (nb["nb_scope_" + key] && !nb["nb_status_" + key]) {
                    nb["nb_status_" + key] = "notified";
                }
            }

            return nb;
        }

        function hasActiveScope(nb) {
            if (!nb) {
                return false;
            }

            for (var i = 0; i < SCOPE_KEYS.length; i++) {
                if (nb["nb_scope_" + SCOPE_KEYS[i]] && nb["nb_status_" + SCOPE_KEYS[i]] === "notified") {
                    return true;
                }
            }

            return false;
        }

        function deriveAggregateStatus(nb) {
            for (var p = 0; p < STATUS_ORDER.length; p++) {
                for (var i = 0; i < SCOPE_KEYS.length; i++) {
                    if (nb["nb_scope_" + SCOPE_KEYS[i]] && nb["nb_status_" + SCOPE_KEYS[i]] === STATUS_ORDER[p]) {
                        return STATUS_ORDER[p];
                    }
                }
            }

            return "";
        }

        function loadConfig() {
            try {
                if (fileExists(configFile)) {
                    var txt = readTextFile(configFile);
                    var obj = parseJsonSafe(txt);

                    if (typeof obj.step !== "undefined") {
                        var s = parseInt(obj.step, 10);
                        config.step = (!isNaN(s) && s > 0) ? s : 2000;
                    }

                    if (typeof obj.threshold !== "undefined") {
                        var t = parseInt(obj.threshold, 10);
                        config.threshold = (!isNaN(t) && t >= 0) ? t : 1;
                    }

                    if (typeof obj.verbose !== "undefined") {
                        config.verbose = !!obj.verbose;
                    }

                    if (typeof obj.cleanupDone !== "undefined") {
                        config.cleanupDone = !!obj.cleanupDone;
                    }

                    log("Loaded config.json", "ok");
                } else {
                    saveConfig();
                    log("config.json not found. Default config created.", "warn");
                }
            } catch (e) {
                log("Failed to load config.json: " + e.message, "err");
            }

            document.getElementById("cfgStep").value = config.step;
            document.getElementById("cfgThreshold").value = config.threshold;
            document.getElementById("cfgVerbose").checked = config.verbose;
        }

        function saveConfig() {
            try {
                writeTextFile(configFile, stringifyJson(config));
                log("Saved config.json", "ok");
            } catch (e) {
                log("Failed to save config.json: " + e.message, "err");
            }
        }

        function loadData() {
            try {
                if (!fileExists(dataFile)) {
                    log("data.json not found in app folder.", "warn");
                    NBs = {};
                    selectedId = "";
                    clearForm();
                    setSidebarEnabled(false);
                    return;
                }

                var txt = readTextFile(dataFile);
                var raw = parseJsonSafe(txt);
                var clean = {};

                for (var k in raw) {
                    if (raw.hasOwnProperty(k)) {
                        clean[k] = normalizeNB(k, raw[k]);
                    }
                }

                NBs = clean;

                log("Loaded data.json with " + countKeys(NBs) + " record(s) (schema v2).", "ok");

                selectedId = "";
                clearForm();
                setSidebarEnabled(false);
            } catch (e) {
                NBs = {};
                log("Failed to load data.json: " + e.message, "err");
            }
        }

        function saveData() {
            try {
                writeTextFile(dataFile, stringifyJson(NBs));
                updateStatus("Data saved");
                log("Saved data.json", "ok");
            } catch (e) {
                log("Failed to save data.json: " + e.message, "err");
                alert("Failed to save data.json: " + e.message);
            }
        }

        function isCorruptName(name) {
            var n = String(name || "");
            return trim(n) === "" || n.indexOf("********") >= 0;
        }

        function shortnameExists(name, excludeId) {
            for (var id in NBs) {
                if (NBs.hasOwnProperty(id) && id !== excludeId && NBs[id].nb_shortname === name) {
                    return true;
                }
            }

            return false;
        }

        function proposeShortnameCleanup() {
            var proposals = [];
            var ids = [];

            for (var id in NBs) {
                if (NBs.hasOwnProperty(id)) {
                    ids.push(id);
                }
            }

            ids.sort();

            for (var i = 0; i < ids.length; i++) {
                var nb = NBs[ids[i]];
                var cur = nb.nb_shortname;
                var fixed = cur;

                if (/-KSA$/i.test(cur)) {
                    fixed = cur.replace(/-KSA$/i, "-SA");
                } else if (/-UK$/i.test(cur)) {
                    fixed = cur.replace(/-UK$/i, "-GB");
                }

                if (fixed !== cur && fixed !== "" && !shortnameExists(fixed, ids[i])) {
                    proposals.push({ id: ids[i], from: cur, to: fixed });
                }
            }

            return proposals;
        }

        function maybeRunDataCleanup() {
            if (config.cleanupDone || countKeys(NBs) === 0) {
                return;
            }

            var proposals = proposeShortnameCleanup();
            var changedCountry = 0;
            var repairedNames = 0;
            var id, nb;

            for (id in NBs) {
                if (NBs.hasOwnProperty(id)) {
                    nb = NBs[id];

                    if (COUNTRY_FULL_TO_ISO.hasOwnProperty(String(nb.nb_country).toUpperCase())) {
                        changedCountry++;
                    }

                    if (isCorruptName(nb.nb_fullname)) {
                        repairedNames++;
                    }
                }
            }

            if (proposals.length === 0 && changedCountry === 0 && repairedNames === 0) {
                config.cleanupDone = true;
                saveConfig();
                return;
            }

            var msg = "One-time data cleanup:\n\n";

            if (proposals.length > 0) {
                msg += "Shortname country codes (KSA->SA, UK->GB):\n";

                for (var i2 = 0; i2 < proposals.length; i2++) {
                    msg += "  " + proposals[i2].id + ": " + proposals[i2].from + " -> " + proposals[i2].to + "\n";
                }

                msg += "\n";
            }

            if (changedCountry > 0) {
                msg += changedCountry + " country field(s) will be normalized to ISO 3166 codes (e.g. EGYPT -> EG).\n";
            }

            if (repairedNames > 0) {
                msg += repairedNames + " corrupted name(s) detected - these will be repaired by the first register sync.\n";
            }

            msg += "\nApply?";

            if (confirm(msg)) {
                for (var j = 0; j < proposals.length; j++) {
                    NBs[proposals[j].id].nb_shortname = proposals[j].to;
                    log("Cleanup: " + proposals[j].id + " shortname " + proposals[j].from + " -> " + proposals[j].to, "ok");
                }

                for (var id2 in NBs) {
                    if (NBs.hasOwnProperty(id2)) {
                        NBs[id2].nb_country = isoCountry(NBs[id2].nb_country);
                    }
                }

                saveData();
            } else {
                log("Data cleanup declined by user.", "warn");
            }

            config.cleanupDone = true;
            saveConfig();
        }

        function getList() {
            var list = [];
            var filterElem = document.getElementById("searchInput");
            var filter = "";
            var id, item, text;

            if (filterElem && typeof filterElem.value === "string") {
                filter = filterElem.value.toLowerCase();
            }

            for (id in NBs) {
                if (NBs.hasOwnProperty(id)) {
                    item = NBs[id];

                    text = (
                        id + " " +
                        item.nb_shortname + " " +
                        item.nb_fullname + " " +
                        item.nb_country
                    ).toLowerCase();

                    if (filter === "" || text.indexOf(filter) >= 0) {
                        list.push({
                            id: id,
                            nb_shortname: item.nb_shortname,
                            nb_fullname: item.nb_fullname,
                            nb_country: item.nb_country,
                            nb_status_agg: deriveAggregateStatus(item),
                            nb_active: hasActiveScope(item),
                            nb_number_gcts: item.nb_number_gcts
                        });
                    }
                }
            }

            list.sort(function(a, b) {
                var va, vb;

                if (sortKey === "nb_number_gcts") {
                    va = parseInt(a.nb_number_gcts, 10) || 0;
                    vb = parseInt(b.nb_number_gcts, 10) || 0;

                    return sortAsc ? (va - vb) : (vb - va);
                }

                if (sortKey === "nb_status_agg") {
                    va = STATUS_ORDER.indexOf(a.nb_status_agg) >= 0 ? STATUS_ORDER.indexOf(a.nb_status_agg) : 99;
                    vb = STATUS_ORDER.indexOf(b.nb_status_agg) >= 0 ? STATUS_ORDER.indexOf(b.nb_status_agg) : 99;

                    return sortAsc ? (va - vb) : (vb - va);
                }

                va = String(a[sortKey]).toLowerCase();
                vb = String(b[sortKey]).toLowerCase();

=== END OF PART 02 — CONTINUES IN NEXT PART (this marker MUST be the last line of this chunk) ===