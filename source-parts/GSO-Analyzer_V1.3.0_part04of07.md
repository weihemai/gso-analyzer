            clearForm();
            setSidebarEnabled(false);
        }

        function setSort(k) {
            if (sortKey === k) {
                sortAsc = !sortAsc;
            } else {
                sortKey = k;
                sortAsc = true;
            }

            renderTable();
        }

        function applySettings() {
            var s = parseInt(document.getElementById("cfgStep").value, 10);
            var t = parseInt(document.getElementById("cfgThreshold").value, 10);

            if (isNaN(s) || s < 100 || s > 1000000) {
                alert("Big Step must be between 100 and 1,000,000.");
                return;
            }

            if (isNaN(t) || t < 0 || t > 10000) {
                alert("Threshold must be between 0 and 10,000.");
                return;
            }

            config.step = s;
            config.threshold = t;
            config.verbose = document.getElementById("cfgVerbose").checked;

            saveConfig();
            updateStatus("Settings applied");
        }

        function exportCSV() {
            try {
                var path = appFolder + "\\GSO_Data_" + getDateStamp() + ".csv";
                var csv = "ID,ShortName,FullName,Country,Toys,StatusToys,LV,StatusLV,WER,StatusWER,MS-SC,StatusSC,MS-GA,StatusGA,MS-LV,StatusMSLV,OverallStatus,GCTS_Max\r\n";
                var k, n, agg, row, i, c;

                for (k in NBs) {
                    if (NBs.hasOwnProperty(k)) {
                        n = NBs[k];
                        agg = deriveAggregateStatus(n);
                        row = [
                            k,
                            n.nb_shortname,
                            n.nb_fullname,
                            n.nb_country
                        ];

                        for (i = 0; i < SCOPE_KEYS.length; i++) {
                            row.push(n["nb_scope_" + SCOPE_KEYS[i]] ? "true" : "false");
                            row.push(n["nb_status_" + SCOPE_KEYS[i]] || "");
                        }

                        row.push(agg ? STATUS_LABELS[agg] : "");
                        row.push(String(n.nb_number_gcts));

                        for (c = 0; c < row.length; c++) {
                            row[c] = csvCell(row[c]);
                        }

                        csv += row.join(",") + "\r\n";
                    }
                }

                writeTextFile(path, csv);

                log("CSV exported: " + path, "ok");
                alert("CSV exported:\n" + path);
            } catch (e) {
                log("CSV export failed: " + e.message, "err");
                alert("CSV export failed: " + e.message);
            }
        }

        function csvCell(s) {
            s = String(s);
            s = s.replace(/"/g, "\"\"");

            return "\"" + s + "\"";
        }

        function getDateStamp() {
            var d = new Date();

            return d.getFullYear() + "-" +
                pad(d.getMonth() + 1) + "-" +
                pad(d.getDate());
        }

        function reloadAll() {
            if (isScanning || isSyncing) {
                alert("Stop scan/sync first.");
                return;
            }

            loadConfig();
            loadData();
            maybeRunDataCleanup();
            renderTable();

            updatedThisSession = {};

            updateStatus("Reloaded from disk");
        }

        function setBusyUI(scanning, syncing) {
            document.getElementById("btnStart").disabled = scanning;
            document.getElementById("btnStop").disabled = !scanning;
            document.getElementById("btnSync").disabled = syncing || scanning;
        }

        function httpGet(url) {
            var xhr = null;

            try {
                xhr = new ActiveXObject("MSXML2.ServerXMLHTTP.6.0");
                xhr.setTimeouts(5000, 5000, 10000, 30000);
            } catch (e1) {
                xhr = new ActiveXObject("MSXML2.XMLHTTP");
            }

            xhr.open("GET", url, false);
            xhr.setRequestHeader("Cache-Control", "no-cache, max-age=0");
            xhr.setRequestHeader("Pragma", "no-cache");
            xhr.send();

            return {
                status: xhr.status,
                text: xhr.responseText
            };
        }

        function checkUrl(nb, val) {
            var url = "https://www.gso.org.sa/nb/coc/" + nb + "-" + val;
            var res = httpGet(url);

            if (res.status !== 200) {
                throw new Error("HTTP " + res.status);
            }

            var text = res.text || "";
            var exists = (text.indexOf("Invalid GCTS No") === -1);

            if (config.verbose) {
                log(
                    nb + "-" + val + ": " +
                    (exists ? "FOUND" : "NOT FOUND") +
                    " [HTTP " + res.status + "]",
                    exists ? "ok" : "info"
                );
            }

            return {
                exists: exists,
                html: text,
                url: url,
                status: res.status
            };
        }

        function addTimelineEntry(nb, dateKey, gctsValue) {
            if (!nb) {
                return;
            }

            if (!nb.nb_number_gcts_timeline) {
                nb.nb_number_gcts_timeline = {};
            }

            gctsValue = parseInt(gctsValue, 10);

            if (isNaN(gctsValue) || gctsValue < 0) {
                gctsValue = 0;
            }

            nb.nb_number_gcts_timeline[dateKey] = gctsValue;
        }

        function updateNbGctsWithTimeline(nb, gctsValue) {
            gctsValue = parseInt(gctsValue, 10);

            if (isNaN(gctsValue) || gctsValue < 0) {
                gctsValue = 0;
            }

            nb.nb_number_gcts = gctsValue;
            addTimelineEntry(nb, getDateStamp(), gctsValue);
        }

        function startFullScan() {
            var ids = [];
            var skipped = [];
            var k, nb;

            if (isScanning || isSyncing) {
                return;
            }

            for (k in NBs) {
                if (NBs.hasOwnProperty(k)) {
                    nb = NBs[k];

                    if (hasActiveScope(nb)) {
                        ids.push(k);
                    } else {
                        skipped.push(k);
                    }
                }
            }

            if (ids.length === 0) {
                alert("No NB with an active (notified) scope to scan.");
                return;
            }

            if (skipped.length > 0) {
                log("Skipping " + skipped.length + " NB(s) without active (notified) scopes: " + skipped.join(", "), "warn");
            }

            ids.sort();
            updatedThisSession = {};

            isScanning = true;
            shouldStop = false;
            scanIds = ids;
            scanIndex = 0;
            currentScan = null;

            setBusyUI(true, false);

            log("Scan started for " + ids.length + " NB(s).", "ok");
            updateStatus("Scanning...");

            setTimeout(scanTick, 10);
        }

        function stopScan() {
            if (!isScanning) {
                return;
            }

            shouldStop = true;
            log("Stop requested.", "warn");
        }

        function scanTick() {
            if (!isScanning) {
                return;
            }

            if (shouldStop) {
                finishScan("Stopped by user");
                return;
            }

            if (currentScan === null) {
                while (scanIndex < scanIds.length && !NBs[scanIds[scanIndex]]) {
                    scanIndex++;
                }

                if (scanIndex >= scanIds.length) {
                    finishScan("Scan finished");
                    return;
                }

                var sid = scanIds[scanIndex];
                var snb = NBs[sid];
                var sStart = parseInt(snb.nb_number_gcts, 10) || 0;
                var sStep = parseInt(config.step, 10) || 2000;

                currentScan = {
                    id: sid,
                    min: sStart,
                    max: sStart + sStep,
                    startMin: sStart,
                    startCeil: sStart + sStep,
                    extensions: 0,
                    probedTop: false,
                    retries: 0
                };

                log(
                    "Scanning NB " + sid +
                    " from " + currentScan.min +
                    " to " + currentScan.max,
                    "info"
                );
            }

            var s = currentScan;
            var nb = NBs[s.id];

            if (!nb) {
                log("NB " + s.id + " removed during scan. Skipping.", "warn");
                currentScan = null;
                scanIndex++;
                setTimeout(scanTick, 10);
                return;
            }

            if ((s.max - s.min) <= parseInt(config.threshold, 10)) {
                if (s.min > s.startMin && !s.probedTop && s.extensions < 10) {
                    s.probedTop = true;

                    try {
                        var probe = checkUrl(s.id, s.min + 1);

                        if (probe.exists) {
                            s.extensions++;
                            s.min = s.min + 1;
                            s.startCeil = s.min;
                            s.max = s.min + (parseInt(config.step, 10) || 2000);
                            s.probedTop = false;

                            log(
                                "Upper boundary reached for " + s.id +
                                " - extending scan to " + s.max,
                                "warn"
                            );
                        }
                    } catch (pe) {
                        log("Boundary probe failed for " + s.id + "-" + (s.min + 1) + ": " + pe.message, "warn");
                    }

                    setTimeout(scanTick, 10);
                    return;
                }

                if (nb.nb_number_gcts !== s.min) {
                    updateNbGctsWithTimeline(nb, s.min);

                    updatedThisSession[s.id] = true;

                    log(
                        "Updated " + s.id +
                        " => " + s.min +
                        " and added timeline entry for " + getDateStamp(),
                        "ok"
                    );

                    saveData();
                } else {
                    log("No change for " + s.id + " (" + s.min + ")", "info");
                }

                renderTable();

                if (selectedId === s.id) {
                    loadSelectedToForm(s.id);
                }

                currentScan = null;
                scanIndex++;

                setTimeout(scanTick, 10);

                return;
            }

            var mid = s.min + Math.floor((s.max - s.min) / 2);
            var res;

            try {
                res = checkUrl(s.id, mid);

                if (res.exists) {
                    s.min = mid;
                } else {
                    s.max = mid;
                }

                s.retries = 0;
            } catch (e) {
                s.retries++;

                if (s.retries < 3) {
                    log("HTTP error for " + s.id + "-" + mid + ", retry " + s.retries + "/3: " + e.message, "warn");

                    setTimeout(scanTick, 2000 * s.retries);
                    return;
                }

                log("HTTP error for " + s.id + "-" + mid + " after 3 retries - skipping NB: " + e.message, "err");

                currentScan = null;
                scanIndex++;

                setTimeout(scanTick, 10);

                return;
            }

            updateStatus(
                "Scanning " + s.id +
                " | range " + s.min +
                "..." + s.max +
                " | item " + (scanIndex + 1) +
                "/" + scanIds.length
            );

            setTimeout(scanTick, 10);
        }

        function finishScan(msg) {
            isScanning = false;
            shouldStop = false;
            currentScan = null;

            setBusyUI(false, isSyncing);

            updateStatus(msg);
            log(msg, "ok");

            saveData();
        }

        function decodeEntities(s) {
            s = String(s);

            s = s.replace(/&nbsp;/gi, " ");
            s = s.replace(/&amp;/gi, "&");
            s = s.replace(/&quot;/gi, "\"");
            s = s.replace(/&#0?39;|&apos;|&rsquo;|&lsquo;/gi, "'");
            s = s.replace(/&lt;/gi, "<");
            s = s.replace(/&gt;/gi, ">");
            s = s.replace(/&mdash;/gi, "\u2014");
            s = s.replace(/&ndash;/gi, "\u2013");

            return s;
        }

        function htmlToLines(html) {
            var t = String(html);

            t = t.replace(/<script[\s\S]*?<\/script>/gi, " ");
            t = t.replace(/<style[\s\S]*?<\/style>/gi, " ");
            t = t.replace(/<[^>]*>/g, "\n");
            t = decodeEntities(t);

            var rawLines = t.split(/\r?\n/);
            var lines = [];
            var i, ln;

            for (i = 0; i < rawLines.length; i++) {
                ln = squash(rawLines[i]);

                if (ln) {
                    lines.push(ln);
                }
            }

            return lines;
        }

        function statusFromText(text) {
            var up = squash(String(text || "")).toUpperCase();

            if (STATUS_WORDS.hasOwnProperty(up)) {
                return STATUS_WORDS[up];
            }

            return "";
        }

        function scopeFromCardLine(line) {
            var up = String(line || "").toUpperCase();
            var i, lbl, rest;

            for (i = 0; i < REG_SCOPE_MAP.length; i++) {
                lbl = REG_SCOPE_MAP[i].label.toUpperCase();

                if (up === lbl) {
                    return { key: REG_SCOPE_MAP[i].key, status: "" };
                }

                if (up.indexOf(lbl) === 0) {
                    rest = trim(up.substring(lbl.length)).replace(/^[-\u2010\u2012\u2013\u2014:\s]+/, "");

                    if (rest !== "") {
                        return { key: REG_SCOPE_MAP[i].key, status: statusFromText(rest) || "unknown:" + rest.toLowerCase() };
                    }
                }
            }

            return null;
        }

        function parseRegisterPage(html, target) {
            var lines = htmlToLines(html);
            var out = {
                found: 0,
                pages: 0,
                entries: []
            };

            var foundRe = /Found\s+(\d+)\s+Results/i;
            var pagesRe = /for\s+(\d+)\s+Pages/i;
            var nameNbRe = /[-\u2013\u2014]\s*NB[\u2010\u2011-]\s?(\d{4,6})\s*$/;
            var nbOnlyRe = /^NB[\u2010\u2011-]\s?(\d{4,6})$/;

            var marks = [];
            var i, m;

            for (i = 0; i < lines.length; i++) {
                m = foundRe.exec(lines[i]);

                if (m) {
                    out.found = parseInt(m[1], 10) || 0;
                }

                m = pagesRe.exec(lines[i]);

                if (m) {
                    out.pages = parseInt(m[1], 10) || 0;
                }

                if (nameNbRe.test(lines[i]) || nbOnlyRe.test(lines[i])) {
                    marks.push(i);
                }
            }

            for (i = 0; i < marks.length; i++) {
                var idx = marks[i];
                var id = "";
                var fullname = "";
                var cardEnd = (i + 1 < marks.length) ? marks[i + 1] : lines.length;

                m = nameNbRe.exec(lines[idx]);

                if (m) {
                    id = m[1];
                    fullname = trim(lines[idx].substring(0, m.index)).replace(/^\d+[\.\)]\s+/, "");
                } else {
                    m = nbOnlyRe.exec(lines[idx]);

                    if (m) {
                        id = m[1];

                        if (idx > 0 && (i === 0 || idx - 1 > marks[i - 1])) {
                            fullname = lines[idx - 1];
                        }
                    }
                }

                if (!id) {
                    continue;
                }

                var entry = {
                    id: id,
                    fullname: fullname,
                    country: "",
                    scopes: {},
                    assumedStatus: false
                };

                var k;

                for (k = 0; k < SCOPE_KEYS.length; k++) {
                    entry.scopes[SCOPE_KEYS[k]] = { active: false, status: "" };
                }

                var j, line, sc, cardStatus = "";

                for (j = idx + 1; j < cardEnd; j++) {
                    line = lines[j];

=== END OF PART 04 — CONTINUES IN NEXT PART (this marker MUST be the last line of this chunk) ===