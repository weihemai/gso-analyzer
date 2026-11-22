                if (va < vb) {
                    return sortAsc ? -1 : 1;
                }

                if (va > vb) {
                    return sortAsc ? 1 : -1;
                }

                return 0;
            });

            return list;
        }

        function renderTable() {
            var tbody = document.getElementById("tableBody");

            if (!tbody) {
                log("renderTable: tableBody element not found.", "err");
                return;
            }

            var list = getList();
            var i, item, nb, tr, td, cls, k, chip, anyScope = false, activeCount = 0, shortB;

            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }

            for (i = 0; i < list.length; i++) {
                item = list[i];
                nb = NBs[item.id];

                tr = document.createElement("tr");
                cls = "";

                if (item.id === selectedId) {
                    cls = "selected";
                }

                if (updatedThisSession[item.id]) {
                    cls = cls ? (cls + " updated") : "updated";
                }

                if (!item.nb_active) {
                    cls = cls ? (cls + " muted") : "muted";
                }

                tr.className = cls;
                tr.onclick = makeSelectHandler(item.id);

                td = tr.insertCell(-1);
                td.style.width = "60px";
                td.appendChild(document.createTextNode(item.id));

                td = tr.insertCell(-1);
                td.style.width = "120px";

                shortB = document.createElement("b");
                shortB.appendChild(document.createTextNode(item.nb_shortname));
                td.appendChild(shortB);

                td = tr.insertCell(-1);
                td.appendChild(document.createTextNode(item.nb_fullname));

                td = tr.insertCell(-1);
                td.style.width = "45px";
                td.appendChild(document.createTextNode(item.nb_country));

                td = tr.insertCell(-1);
                td.style.width = "175px";

                for (k = 0; k < SCOPE_KEYS.length; k++) {
                    if (nb["nb_scope_" + SCOPE_KEYS[k]]) {
                        anyScope = true;

                        chip = document.createElement("span");
                        chip.className = "chip " + (nb["nb_status_" + SCOPE_KEYS[k]] || "notified");
                        chip.appendChild(document.createTextNode(SCOPE_LABELS[SCOPE_KEYS[k]]));
                        td.appendChild(chip);
                    }
                }

                if (!anyScope) {
                    td.appendChild(document.createTextNode("-"));
                }

                anyScope = false;

                td = tr.insertCell(-1);
                td.style.width = "95px";

                chip = document.createElement("span");
                chip.className = "chip " + (item.nb_status_agg || "none");
                chip.appendChild(document.createTextNode(item.nb_status_agg ? STATUS_LABELS[item.nb_status_agg] : "none"));
                td.appendChild(chip);

                if (item.nb_active) {
                    activeCount++;
                }

                td = tr.insertCell(-1);
                td.style.width = "85px";
                td.appendChild(document.createTextNode(String(item.nb_number_gcts)));

                tbody.appendChild(tr);
            }

            setText("recordCount", list.length + " record(s) | " + activeCount + " scannable");
            updateLayout();
        }

        function makeSelectHandler(id) {
            return function() {
                selectNB(id);
            };
        }

        function selectNB(id) {
            selectedId = id;

            loadSelectedToForm(id);
            setSidebarEnabled(true);
            renderTable();
        }

        function makeScopeHandler(key) {
            return function() {
                onScopeCheckbox(key);
            };
        }

        function onScopeCheckbox(key) {
            var cb = document.getElementById("fld" + key);
            var sel = document.getElementById("st" + key);

            if (!cb || !sel) {
                return;
            }

            if (cb.checked) {
                sel.disabled = false;

                if (!validStatus(sel.value)) {
                    sel.value = "notified";
                }
            } else {
                sel.disabled = true;
                sel.value = "";
            }
        }

        function attachEditorHandlers() {
            var i, key, cb;

            for (i = 0; i < SCOPE_KEYS.length; i++) {
                key = SCOPE_KEYS[i];
                cb = document.getElementById("fld" + key);

                if (cb) {
                    cb.onclick = makeScopeHandler(key);
                }
            }
        }

        function loadSelectedToForm(id) {
            var nb = NBs[id];

            if (!nb) {
                return;
            }

            document.getElementById("fldId").value = id;
            document.getElementById("fldShort").value = nb.nb_shortname;
            document.getElementById("fldFull").value = nb.nb_fullname;
            document.getElementById("fldCountry").value = nb.nb_country;

            var k, key, prev = "";

            for (k = 0; k < SCOPE_KEYS.length; k++) {
                key = SCOPE_KEYS[k];
                document.getElementById("fld" + key).checked = !!nb["nb_scope_" + key];
                document.getElementById("st" + key).value = nb["nb_status_" + key] || "";
                document.getElementById("st" + key).disabled = !nb["nb_scope_" + key];
            }

            document.getElementById("fldGcts").value = nb.nb_number_gcts;

            setText("selectedLabel", "Selected NB: " + id);

            for (k = 0; k < nb.nb_previous_names.length; k++) {
                var pn = nb.nb_previous_names[k];

                prev += (prev ? " | " : "") + (pn && pn.name ? pn.name : String(pn));
            }

            setText("prevNames", prev ? "Previous names: " + prev : "No previous names recorded.");

            renderTimeline(id);
        }

        function renderTimeline(id) {
            var tbody = document.getElementById("timelineBody");
            var info = document.getElementById("timelineInfo");
            var nb, timeline, dates;
            var i, tr, td, dateKey, currentValue, previousValue, difference;

            if (!tbody) {
                return;
            }

            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }

            if (!id || !NBs[id]) {
                if (info) {
                    info.innerText = "No NB selected.";
                }

                tr = document.createElement("tr");

                td = tr.insertCell(-1);
                td.colSpan = 3;
                td.className = "timelineEmpty";
                td.appendChild(document.createTextNode("No timeline data available."));

                tbody.appendChild(tr);
                return;
            }

            nb = NBs[id];
            timeline = nb.nb_number_gcts_timeline || {};
            dates = [];

            for (dateKey in timeline) {
                if (timeline.hasOwnProperty(dateKey)) {
                    dates.push(dateKey);
                }
            }

            dates.sort();
            dates.reverse();

            if (info) {
                if (dates.length === 0) {
                    info.innerText = "No historical snapshots stored.";
                } else {
                    info.innerText =
                        dates.length + " snapshot(s) | Latest: " +
                        dates[0] + " = " + timeline[dates[0]];
                }
            }

            if (dates.length === 0) {
                tr = document.createElement("tr");

                td = tr.insertCell(-1);
                td.colSpan = 3;
                td.className = "timelineEmpty";
                td.appendChild(document.createTextNode("No timeline data available."));

                tbody.appendChild(tr);
                return;
            }

            for (i = 0; i < dates.length; i++) {
                dateKey = dates[i];
                currentValue = parseInt(timeline[dateKey], 10) || 0;

                tr = document.createElement("tr");

                td = tr.insertCell(-1);
                td.style.width = "110px";
                td.appendChild(document.createTextNode(dateKey));

                td = tr.insertCell(-1);
                td.style.width = "75px";
                td.appendChild(document.createTextNode(String(currentValue)));

                td = tr.insertCell(-1);

                if (i < dates.length - 1) {
                    previousValue = parseInt(timeline[dates[i + 1]], 10) || 0;
                    difference = currentValue - previousValue;

                    if (difference > 0) {
                        td.className = "timelineDifferencePositive";
                        td.appendChild(
                            document.createTextNode("+" + difference)
                        );
                    } else if (difference < 0) {
                        td.className = "timelineDifferenceNegative";
                        td.appendChild(
                            document.createTextNode(String(difference))
                        );
                    } else {
                        td.className = "timelineDifferenceNeutral";
                        td.appendChild(document.createTextNode("0"));
                    }
                } else {
                    td.className = "timelineDifferenceNeutral";
                    td.appendChild(document.createTextNode("-"));
                }

                tbody.appendChild(tr);
            }
        }

        function clearForm() {
            document.getElementById("fldId").value = "";
            document.getElementById("fldShort").value = "";
            document.getElementById("fldFull").value = "";
            document.getElementById("fldCountry").value = "";

            var k, key;

            for (k = 0; k < SCOPE_KEYS.length; k++) {
                key = SCOPE_KEYS[k];
                document.getElementById("fld" + key).checked = false;
                document.getElementById("st" + key).value = "";
                document.getElementById("st" + key).disabled = true;
            }

            document.getElementById("fldGcts").value = "0";

            setText("selectedLabel", "Selected NB: none");
            setText("prevNames", "No previous names recorded.");

            renderTimeline("");
        }

        function setSidebarEnabled(enabled) {
            var idsInputs = [
                "fldId",
                "fldShort",
                "fldFull",
                "fldCountry",
                "fldtoys",
                "fldlv",
                "fldwer",
                "fldsc",
                "fldga",
                "fldmslv",
                "sttoys",
                "stlv",
                "stwer",
                "stsc",
                "stga",
                "stmslv",
                "fldGcts"
            ];

            var idsButtons = [
                "btnSave",
                "btnDeleteSide",
                "btnCancel"
            ];

            var i, el;

            for (i = 0; i < idsInputs.length; i++) {
                el = document.getElementById(idsInputs[i]);

                if (el) {
                    el.disabled = !enabled;
                }
            }

            for (i = 0; i < idsButtons.length; i++) {
                el = document.getElementById(idsButtons[i]);

                if (el) {
                    el.disabled = !enabled;
                }
            }
        }

        function saveSelected() {
            var oldId = selectedId;
            var newId = trim(document.getElementById("fldId").value);
            var oldNb, oldGcts, newGcts, nb, k, key;

            if (!oldId || !NBs[oldId]) {
                alert("No NB selected.");
                return;
            }

            if (!/^\d{4,6}$/.test(newId)) {
                alert("ID must be 4-6 digits (e.g. 0007).");
                return;
            }

            oldNb = NBs[oldId];

            var gctsRaw = trim(document.getElementById("fldGcts").value);
            var parsedGcts = parseInt(gctsRaw, 10);

            if (gctsRaw === "" || isNaN(parsedGcts) || parsedGcts < 0) {
                alert("GCTS max must be a non-negative number.");
                return;
            }

            newGcts = parsedGcts;
            oldGcts = parseInt(oldNb.nb_number_gcts, 10) || 0;

            var shortRaw = squash(document.getElementById("fldShort").value);

            if (shortRaw === "") {
                alert("Short name cannot be empty.");
                return;
            }

            nb = {
                nb_shortname: shortRaw,
                nb_fullname: squash(document.getElementById("fldFull").value),
                nb_country: isoCountry(document.getElementById("fldCountry").value),
                nb_number_gcts: newGcts,
                nb_number_gcts_timeline: cloneTimeline(oldNb.nb_number_gcts_timeline),
                nb_previous_names: oldNb.nb_previous_names || [],
                nb_shortname_manual: oldNb.nb_shortname_manual || (shortRaw !== oldNb.nb_shortname)
            };

            for (k = 0; k < SCOPE_KEYS.length; k++) {
                key = SCOPE_KEYS[k];
                var cb = document.getElementById("fld" + key);
                var sel = document.getElementById("st" + key);

                nb["nb_scope_" + key] = cb.checked;
                nb["nb_status_" + key] = cb.checked ? (validStatus(sel.value) || "notified") : "";
            }

            if (newGcts !== oldGcts) {
                addTimelineEntry(nb, getDateStamp(), newGcts);
                log(
                    "Timeline updated for " + oldId +
                    ": " + oldGcts + " => " + newGcts,
                    "ok"
                );
            }

            if (newId !== oldId) {
                if (NBs[newId]) {
                    alert("ID already exists: " + newId);
                    return;
                }

                delete NBs[oldId];
                NBs[newId] = nb;
                selectedId = newId;

                if (updatedThisSession[oldId]) {
                    updatedThisSession[newId] = true;
                    delete updatedThisSession[oldId];
                }

                log("NB ID changed from " + oldId + " to " + newId, "warn");
            } else {
                NBs[oldId] = nb;
            }

            saveData();
            renderTable();
            loadSelectedToForm(selectedId);
        }

        function cancelEdit() {
            selectedId = "";

            clearForm();
            setSidebarEnabled(false);
            renderTable();
        }

        function padId(n) {
            n = String(n);

            while (n.length < 4) {
                n = "0" + n;
            }

            return n;
        }

        function nextFreeId() {
            var maxId = 0;
            var k, n;

            for (k in NBs) {
                if (NBs.hasOwnProperty(k)) {
                    n = parseInt(k, 10);

                    if (!isNaN(n) && n > maxId) {
                        maxId = n;
                    }
                }
            }

            return padId(maxId + 1);
        }

        function addNewNB() {
            var id = nextFreeId();
            var k, key;

            NBs[id] = {
                nb_shortname: "NEW-" + id,
                nb_fullname: "",
                nb_country: "",
                nb_number_gcts: 0,
                nb_number_gcts_timeline: {},
                nb_previous_names: [],
                nb_shortname_manual: false
            };

            for (k = 0; k < SCOPE_KEYS.length; k++) {
                key = SCOPE_KEYS[k];
                NBs[id]["nb_scope_" + key] = false;
                NBs[id]["nb_status_" + key] = "";
            }

            selectedId = id;

            saveData();
            renderTable();
            loadSelectedToForm(id);
            setSidebarEnabled(true);

            log("Added new NB: " + id, "ok");
        }

        function deleteSelected() {
            if (!selectedId || !NBs[selectedId]) {
                alert("No NB selected.");
                return;
            }

            if (!confirm("Delete NB " + selectedId + " (" + NBs[selectedId].nb_shortname + ")?")) {
                return;
            }

            delete NBs[selectedId];
            delete updatedThisSession[selectedId];

            log("Deleted NB: " + selectedId, "warn");

            selectedId = "";

            saveData();
            renderTable();

=== END OF PART 03 — CONTINUES IN NEXT PART (this marker MUST be the last line of this chunk) ===