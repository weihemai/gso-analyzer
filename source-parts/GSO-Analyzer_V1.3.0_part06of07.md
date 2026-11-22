                return;
            }

            var url = REG_LIST_URL + "?orderBy=number&page=1";
            var html = "";

            updateStatus("Fetching register page 1 for dump...");

            try {
                html = httpGet(url).text || "";
            } catch (e) {
                setText("diagStatus", "Fetch failed: " + e.message);
                log("Dump List HTML failed: " + e.message, "err");
                updateStatus("Dump failed");
                return;
            }

            try {
                writeTextFile(appFolder + "\\register_dump.html", html);
            } catch (e2) {
                log("Could not write register_dump.html: " + e2.message, "err");
            }

            var probe = { found: 0, pages: 0, entries: [] };

            try {
                probe = parseRegisterPage(html, null);
            } catch (e3) {
                probe = { found: 0, pages: 0, entries: [] };
            }

            setText("diagUrl", url);
            setText("diagStatus", html.length + " chars saved to register_dump.html");
            setText(
                "diagResult",
                "Parser result: " + probe.entries.length + " NB(s) found, " +
                (probe.found > 0 ? probe.found : "?") + " expected, " +
                probe.pages + " page(s) detected"
            );
            setText("diagHtml", html.substring(0, 8000));

            log(
                "Dump List HTML: parsed " + probe.entries.length + " of " +
                (probe.found > 0 ? probe.found : "?") + " expected NB(s).",
                "ok"
            );
            updateStatus("Dump List HTML complete");

            if (probe.found > 0 && probe.entries.length < probe.found && !config.verbose) {
                log("Parser may need calibration. Enable Verbose log and dump again for details.", "warn");
            }
        }

        function toggleDiagnostics() {
            var pane = document.getElementById("editPane");
            var diag = document.getElementById("diagPanel");

            if (pane && diag && diag.offsetTop != null) {
                pane.scrollTop = diag.offsetTop - 20;
            }
        }

        function runDiagnostic() {
            var nb = trim(document.getElementById("diagNb").value);
            var val = parseInt(document.getElementById("diagVal").value, 10) || 0;
            var res;

            if (nb === "") {
                alert("Enter an NB ID first.");
                return;
            }

            try {
                res = checkUrl(nb, val);

                setText("diagUrl", res.url);
                setText("diagStatus", "HTTP Status: " + res.status);
                setText("diagResult", res.exists ? "EXISTS" : "NOT FOUND");
                setText("diagHtml", (res.html || "").substring(0, 8000));

                log("Diagnostic completed for " + nb + "-" + val, "ok");
            } catch (e) {
                setText("diagResult", "ERROR: " + e.message);
                setText("diagStatus", "");
                setText("diagHtml", "");

                log("Diagnostic failed: " + e.message, "err");
            }
        }

        function updateLayout() {
            try {
                var mainList = document.getElementById("mainListContainer");
                var tableContainer = document.getElementById("tableContainer");
                var logSection = document.getElementById("logSection");
                var logBody = document.getElementById("logBody");
                var editPane = document.getElementById("editPane");

                if (!tableContainer || !logSection || !mainList) {
                    return;
                }

                var vh = document.documentElement.clientHeight || document.body.clientHeight || 800;
                var rectMain = mainList.getBoundingClientRect ? mainList.getBoundingClientRect() : null;
                var mainTop = rectMain ? rectMain.top : mainList.offsetTop;

                var availableHeight = vh - mainTop - 20;

                if (availableHeight < 420) {
                    availableHeight = 420;
                }

                mainList.style.height = availableHeight + "px";
                mainList.style.minHeight = "420px";

                var logVisible = true;

                if (logBody) {
                    var cls = logBody.className || "";

                    if (cls.indexOf("hidden") >= 0) {
                        logVisible = false;
                    }
                }

                if (logVisible) {
                    logSection.style.display = "block";
                    logSection.style.height = "220px";
                    tableContainer.style.bottom = "230px";
                } else {
                    logSection.style.height = "38px";
                    tableContainer.style.bottom = "48px";
                }

                var max20RowsHeight = 36 + (20 * 30);

                if (tableContainer.clientHeight > max20RowsHeight) {
                    tableContainer.style.height = max20RowsHeight + "px";
                } else {
                    tableContainer.style.height = "";
                }

                if (editPane) {
                    var rectPane = editPane.getBoundingClientRect ? editPane.getBoundingClientRect() : null;
                    var paneTop = rectPane ? rectPane.top : editPane.offsetTop;
                    var paneHeight = vh - paneTop - 10;

                    if (paneHeight < 200) {
                        paneHeight = 200;
                    }

                    editPane.style.height = paneHeight + "px";
                    editPane.style.overflowY = "auto";
                }
            } catch (e) {
            }
        }

        function toggleLog() {
            var body = document.getElementById("logBody");
            var link = document.getElementById("logToggleLink");

            if (!body) {
                return;
            }

            var cls = body.className || "";

            if (cls.indexOf("hidden") >= 0) {
                body.className = cls.replace("hidden", "").replace(/\s+/g, " ");

                if (link) {
                    link.innerText = "[Hide]";
                }
            } else {
                body.className = (cls + " hidden").replace(/\s+/g, " ");

                if (link) {
                    link.innerText = "[Show]";
                }
            }

            updateLayout();
        }
    </script>
</head>

<body onload="init()">

    <div class="header">
        <div class="title" id="appTitle">GSO Analyzer Pro</div>
        <div class="subtitle" id="appSubtitle">Initializing...</div>
    </div>

    <div class="toolbar">
        <button id="btnStart" onclick="startFullScan()">Start Scan</button>
        <button id="btnStop" onclick="stopScan()" disabled>Stop Scan</button>
        <button id="btnSync" onclick="startSync(true)">Sync Register</button>
        <button onclick="addNewNB()">Add NB</button>
        <button onclick="saveData()">Save Data</button>
        <button onclick="reloadAll()">Reload</button>
        <button onclick="exportCSV()">Export CSV</button>
        <button onclick="toggleDiagnostics()">Diagnostics</button>
        <button onclick="toggleLog()">Log</button>
    </div>

    <div class="section">
        <div class="sectionHeader">
            <span>NB List &amp; Editor</span>

            <span class="searchArea">
                Search:
                <input type="text" id="searchInput" onkeyup="renderTable()">
                <span id="recordCount" class="small"></span>
            </span>
        </div>

        <div class="sectionBody mainLayout">

            <div class="mainListContainer" id="mainListContainer">

                <div class="tableContainer" id="tableContainer">
                    <table>
                        <thead>
                            <tr>
                                <th style="width:60px" onclick="setSort('id')">ID</th>
                                <th style="width:120px" onclick="setSort('nb_shortname')">Short Name</th>
                                <th onclick="setSort('nb_fullname')">Full Name</th>
                                <th style="width:45px" onclick="setSort('nb_country')">Cty</th>
                                <th style="width:175px">Scopes</th>
                                <th style="width:95px" onclick="setSort('nb_status_agg')">Status</th>
                                <th style="width:85px" onclick="setSort('nb_number_gcts')">GCTS Max</th>
                            </tr>
                        </thead>
                        <tbody id="tableBody"></tbody>
                    </table>
                </div>

                <div class="section" id="logSection">
                    <div class="sectionHeader">
                        System Log

                        <span
                            id="logToggleLink"
                            style="float:right; cursor:pointer; margin-left:8px;"
                            onclick="toggleLog()"
                        >[Hide]</span>

                        <span
                            style="float:right; cursor:pointer;"
                            onclick="clearLog()"
                        >[Clear]</span>
                    </div>

                    <div class="sectionBody" id="logBody">
                        <div id="logOutput" class="logBox"></div>
                    </div>
                </div>
            </div>

            <div class="editPane" id="editPane">

                <div class="sidebarSectionHeader">Selected Record</div>

                <div
                    id="selectedLabel"
                    class="small"
                    style="margin-bottom:6px;"
                >Selected NB: none</div>

                <div class="fieldRow">
                    <span class="fieldLabel">ID</span>
                    <span class="fieldInput">
                        <input type="text" id="fldId" disabled>
                    </span>
                </div>

                <div class="fieldRow">
                    <span class="fieldLabel">Short Name</span>
                    <span class="fieldInput">
                        <input type="text" id="fldShort" disabled>
                    </span>
                </div>

                <div class="fieldRow">
                    <span class="fieldLabel">Full Name</span>
                    <span class="fieldInput">
                        <input type="text" id="fldFull" disabled>
                    </span>
                </div>

                <div class="fieldRow">
                    <span class="fieldLabel">Country (ISO)</span>
                    <span class="fieldInput">
                        <input type="text" id="fldCountry" disabled>
                    </span>
                </div>

                <div class="fieldRow">
                    <span class="fieldLabel">Scopes</span>

                    <span class="fieldInput">
                        <div class="scopeRow">
                            <label><input type="checkbox" id="fldtoys" disabled> TOYS</label>
                            <select id="sttoys" class="statusSelect" disabled>
                                <option value="">-</option>
                                <option value="notified">Notified</option>
                                <option value="suspended">Suspended</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                        <div class="scopeRow">
                            <label><input type="checkbox" id="fldlv" disabled> LV</label>
                            <select id="stlv" class="statusSelect" disabled>
                                <option value="">-</option>
                                <option value="notified">Notified</option>
                                <option value="suspended">Suspended</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                        <div class="scopeRow">
                            <label><input type="checkbox" id="fldwer" disabled> WER</label>
                            <select id="stwer" class="statusSelect" disabled>
                                <option value="">-</option>
                                <option value="notified">Notified</option>
                                <option value="suspended">Suspended</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                        <div class="scopeRow">
                            <label><input type="checkbox" id="fldsc" disabled> MS-SC</label>
                            <select id="stsc" class="statusSelect" disabled>
                                <option value="">-</option>
                                <option value="notified">Notified</option>
                                <option value="suspended">Suspended</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                        <div class="scopeRow">
                            <label><input type="checkbox" id="fldga" disabled> MS-GA</label>
                            <select id="stga" class="statusSelect" disabled>
                                <option value="">-</option>
                                <option value="notified">Notified</option>
                                <option value="suspended">Suspended</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                        <div class="scopeRow">
                            <label><input type="checkbox" id="fldmslv" disabled> MS-LV</label>
                            <select id="stmslv" class="statusSelect" disabled>
                                <option value="">-</option>
                                <option value="notified">Notified</option>
                                <option value="suspended">Suspended</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                    </span>
                </div>

                <div class="fieldRow">
                    <span class="fieldLabel">GCTS Max</span>
                    <span class="fieldInput">
                        <input type="text" id="fldGcts" disabled>
                    </span>
                </div>

                <div class="fieldRow">
                    <span class="fieldLabel">&nbsp;</span>

                    <span class="fieldInput">
                        <button id="btnSave" onclick="saveSelected()" disabled>Save</button>
                        <button id="btnDeleteSide" onclick="deleteSelected()" disabled>Delete</button>
                        <button id="btnCancel" onclick="cancelEdit()" disabled>Cancel</button>
                    </span>
                </div>

                <div id="prevNames" class="small" style="margin-bottom:6px;">No previous names recorded.</div>

                <div class="sidebarDivider"></div>

                <div class="sidebarSectionHeader">GCTS Timeline</div>

                <div id="timelineInfo" class="small timelineInfo">
                    No NB selected.
                </div>

                <div class="timelineContainer">
                    <table class="timelineTable">
                        <thead>
                            <tr>
                                <th style="width:110px">Date</th>
                                <th style="width:75px">GCTS Max</th>
                                <th>Difference</th>
                            </tr>
                        </thead>

                        <tbody id="timelineBody">
                            <tr>
                                <td colspan="3" class="timelineEmpty">
                                    No timeline data available.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="sidebarDivider"></div>

=== END OF PART 06 — CONTINUES IN NEXT PART (this marker MUST be the last line of this chunk) ===